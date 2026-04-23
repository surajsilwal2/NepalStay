import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/booking";

export const dynamic = "force-dynamic";

// POST /api/admin/invoice — issue invoice for cash payment bookings
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "bookingId required" },
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

    // Already has invoice — return existing
    if (booking.invoiceNumber) {
      return NextResponse.json({
        success: true,
        data: { invoiceNumber: booking.invoiceNumber },
        message: "Invoice already exists",
      });
    }

    // Only issue for confirmed/checked-in/checked-out bookings
    if (!["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"].includes(booking.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot issue invoice for a booking with status ${booking.status}`,
        },
        { status: 400 },
      );
    }

    const invoiceNumber = generateInvoiceNumber(bookingId, booking.totalPrice);

    const isOnlinePayment =
      !!booking.khaltiPidx ||
      !!booking.stripeSessionId ||
      booking.paymentMethod !== "CASH";
    if (isOnlinePayment) {
      return NextResponse.json(
        {
          success: false,
          error: "Use the provider-specific invoice recovery flow for online payments",
        },
        { status: 400 },
      );
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        invoiceNumber,
        invoiceIssuedAt: new Date(),
        paymentStatus: "PAID",
        paymentMethod: booking.paymentMethod,
        paidAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { invoiceNumber, bookingId },
      message: `Invoice ${invoiceNumber} issued for cash payment`,
    });
  } catch (error) {
    console.error("[ADMIN_INVOICE]", error);
    return NextResponse.json(
      { success: false, error: "Failed to issue invoice" },
      { status: 500 },
    );
  }
}
