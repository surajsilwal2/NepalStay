import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/booking";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );

    const { pidx, bookingId } = await req.json();
    if (!pidx || !bookingId) {
      return NextResponse.json(
        { success: false, error: "pidx and bookingId are required" },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking)
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 },
      );

    // Idempotency — already verified
    if (booking.paidAt && booking.invoiceNumber) {
      return NextResponse.json({
        success: true,
        data: {
          invoiceNumber: booking.invoiceNumber,
          paidAmount: booking.totalPrice,
          alreadyVerified: true,
        },
        message: `Already verified. Invoice ${booking.invoiceNumber}.`,
      });
    }

    // NEW
    const khaltiBase =
      process.env.NODE_ENV === "production"
        ? "https://khalti.com"
        : "https://a.khalti.com";

    const vRes = await fetch(`${khaltiBase}/api/v2/epayment/lookup/`, {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pidx }),
    });

    if (!vRes.ok) {
      const err = await vRes.text();
      console.error("[KHALTI_VERIFY]", vRes.status, err);
      return NextResponse.json(
        {
          success: false,
          error: `Khalti verification failed (${vRes.status})`,
        },
        { status: 502 },
      );
    }

    const vData = await vRes.json();
    if (vData.status !== "Completed") {
      return NextResponse.json(
        {
          success: false,
          error: `Payment not completed. Status: ${vData.status}`,
        },
        { status: 400 },
      );
    }

    const paidNPR = vData.total_amount / 100;
    if (Math.abs(paidNPR - booking.totalPrice) > 1) {
      return NextResponse.json(
        { success: false, error: "Amount mismatch — payment not applied" },
        { status: 400 },
      );
    }

    const invoiceNumber = generateInvoiceNumber(bookingId, booking.totalPrice);

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        paymentStatus: "PAID",
        paymentMethod: "KHALTI",
        invoiceNumber,
        invoiceIssuedAt: new Date(),
        paidAt: new Date(),
        khaltiPidx: pidx,
        khaltiTransactionId: vData.transaction_id ?? null,
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
      data: {
        invoiceNumber,
        paidAmount: paidNPR,
        transactionId: vData.transaction_id,
      },
      message: `Payment verified! Invoice ${invoiceNumber} issued.`,
    });
  } catch (error) {
    console.error("[KHALTI_VERIFY]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
