import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Stripe from "stripe";
import { generateInvoiceNumber } from "@/lib/booking";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { sessionId, bookingId } = await req.json();

    if (!sessionId || !bookingId) {
      return NextResponse.json(
        { success: false, error: "sessionId and bookingId are required" },
        { status: 400 },
      );
    }

    // ── Idempotency check ───────────────────────────────────────────────────
    // If booking is already paid, return existing invoice — do not call Stripe again
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    if (booking.paidAt && booking.invoiceNumber) {
      return NextResponse.json({
        success: true,
        data: {
          invoiceNumber: booking.invoiceNumber,
          alreadyVerified: true,
        },
        message: `Already confirmed. Invoice ${booking.invoiceNumber}.`,
      });
    }

    // ── Verify with Stripe ──────────────────────────────────────────────────
    let stripeSession: Stripe.Checkout.Session;
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Could not retrieve session from Stripe. Please check your bookings.",
        },
        { status: 502 },
      );
    }

    // Payment must be completed on Stripe side
    if (stripeSession.payment_status !== "paid") {
      return NextResponse.json(
        {
          success: false,
          error: `Payment not completed. Status from Stripe: ${stripeSession.payment_status}`,
        },
        { status: 400 },
      );
    }

    // Metadata bookingId must match — prevents one user verifying another's payment
    if (stripeSession.metadata?.bookingId !== bookingId) {
      return NextResponse.json(
        { success: false, error: "Booking ID does not match payment session." },
        { status: 400 },
      );
    }

    // ── Update booking — single source of truth ─────────────────────────────
    const invoiceNumber = generateInvoiceNumber(bookingId, booking.totalPrice);

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        paymentStatus: "PAID",
        paymentMethod: "STRIPE",
        invoiceNumber,
        invoiceIssuedAt: new Date(),
        paidAt: new Date(),
        stripeSessionId: sessionId,
      },
    });

    // After prisma.booking.update, add:
    const { calcPointsEarned, getTierByPoints } =
      await import("@/lib/loyalty");

    const user = await prisma.user.findUnique({
      where: { id: booking.userId },
      select: { loyaltyPoints: true, loyaltyTier: true },
    });

    if (user) {
      const currentTier = user.loyaltyTier as any;
      const pointsEarned = calcPointsEarned(booking.totalPrice, currentTier);
      const newPoints = user.loyaltyPoints + pointsEarned;
      const newTier = getTierByPoints(newPoints);

      await prisma.user.update({
        where: { id: booking.userId },
        data: { loyaltyPoints: newPoints, loyaltyTier: newTier },
      });

      await prisma.booking.update({
        where: { id: bookingId },
        data: { pointsEarned },
      });
    }
    
    return NextResponse.json({
      success: true,
      data: { invoiceNumber },
      message: `Payment confirmed. Invoice ${invoiceNumber} issued.`,
    });
  } catch (error) {
    console.error("[STRIPE_VERIFY]", error);
    return NextResponse.json(
      { success: false, error: "Verification failed. Please contact support." },
      { status: 500 },
    );
  }
}
