import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Stripe from "stripe";
import { generateInvoiceNumber } from "@/lib/booking";

// Same version as initiation route
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
        { success: false, error: "sessionId and bookingId required" },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    // Idempotency — already verified
    if (booking.paidAt && booking.invoiceNumber) {
      return NextResponse.json({
        success: true,
        data: { invoiceNumber: booking.invoiceNumber, alreadyVerified: true },
        message: `Already verified. Invoice ${booking.invoiceNumber}.`,
      });
    }

    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (stripeSession.payment_status !== "paid") {
      return NextResponse.json(
        {
          success: false,
          error: `Payment not completed. Stripe status: ${stripeSession.payment_status}`,
        },
        { status: 400 },
      );
    }

    // Confirm the bookingId in metadata matches — prevents spoofing
    if (stripeSession.metadata?.bookingId !== bookingId) {
      return NextResponse.json(
        { success: false, error: "Booking ID mismatch" },
        { status: 400 },
      );
    }

    const invoiceNumber = generateInvoiceNumber(bookingId, booking.totalPrice);

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        paymentStatus: "PAID",
        paymentMethod: "STRIPE", // ← now valid after enum fix
        invoiceNumber,
        invoiceIssuedAt: new Date(),
        paidAt: new Date(),
        stripeSessionId: sessionId,
      },
    });

    return NextResponse.json({
      success: true,
      data: { invoiceNumber },
      message: `Payment verified. Invoice ${invoiceNumber} issued.`,
    });
  } catch (error) {
    console.error("[STRIPE_VERIFY]", error);
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 },
    );
  }
}
