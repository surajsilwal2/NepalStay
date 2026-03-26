import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  sendSMS,
  bookingConfirmedSMS,
  bookingCancelledSMS,
  checkInReminderSMS,
  paymentReceivedSMS,
  vendorNewBookingSMS,
} from "@/lib/sms";
import { format } from "date-fns";

/**
 * POST /api/sms
 * Triggers SMS for a booking event.
 * Called automatically from verify routes, or manually by admin.
 *
 * Body: { bookingId: string, event: "CONFIRMED" | "CANCELLED" | "REMINDER" | "PAYMENT" }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { bookingId, event } = await req.json();
    if (!bookingId || !event) {
      return NextResponse.json(
        { success: false, error: "bookingId and event required" },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { name: true, phone: true } },
        hotel: {
          select: {
            name: true,
            contactPhone: true,
            vendor: { select: { phone: true } },
          },
        },
        room: { select: { name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    const results: any[] = [];
    const guestPhone = booking.user.phone;
    const vendorPhone = booking.hotel.vendor?.phone;
    const checkInStr = format(new Date(booking.checkIn), "MMM d, yyyy");
    const checkOutStr = format(new Date(booking.checkOut), "MMM d, yyyy");

    switch (event) {
      case "CONFIRMED": {
        // SMS to guest
        if (guestPhone) {
          const msg = bookingConfirmedSMS({
            guestName: booking.user.name,
            hotelName: booking.hotel.name,
            checkIn: checkInStr,
            checkOut: checkOutStr,
            invoiceNumber: booking.invoiceNumber || "Pending",
            totalPrice: booking.totalPrice,
          });
          const result = await sendSMS(guestPhone, msg);
          results.push({ to: "guest", ...result });
        }

        // SMS to vendor
        if (vendorPhone) {
          const msg = vendorNewBookingSMS({
            hotelName: booking.hotel.name,
            guestName: booking.user.name,
            checkIn: checkInStr,
            nights: booking.nights,
            roomName: booking.room.name,
            totalPrice: booking.totalPrice,
          });
          const result = await sendSMS(vendorPhone, msg);
          results.push({ to: "vendor", ...result });
        }
        break;
      }

      case "PAYMENT": {
        if (guestPhone && booking.invoiceNumber) {
          const msg = paymentReceivedSMS({
            guestName: booking.user.name,
            invoiceNumber: booking.invoiceNumber,
            amount: booking.totalPrice,
            method: booking.paymentMethod || "Khalti",
          });
          const result = await sendSMS(guestPhone, msg);
          results.push({ to: "guest", ...result });
        }
        break;
      }

      case "CANCELLED": {
        if (guestPhone) {
          const msg = bookingCancelledSMS({
            guestName: booking.user.name,
            hotelName: booking.hotel.name,
            checkIn: checkInStr,
            refundAmount: booking.refundAmount ?? 0,
            creditNote: booking.creditNoteRef ?? undefined,
          });
          const result = await sendSMS(guestPhone, msg);
          results.push({ to: "guest", ...result });
        }
        break;
      }

      case "REMINDER": {
        // Check-in reminder — typically sent day before
        if (guestPhone) {
          const msg = checkInReminderSMS({
            guestName: booking.user.name,
            hotelName: booking.hotel.name,
            checkIn: checkInStr,
            checkInTime: "14:00",
            phone: booking.hotel.contactPhone || "+977-XXXXXXXXX",
          });
          const result = await sendSMS(guestPhone, msg);
          results.push({ to: "guest", ...result });
        }
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown event: ${event}` },
          { status: 400 },
        );
    }

    const allSuccess = results.every((r) => r.success);
    return NextResponse.json({
      success: true,
      data: {
        event,
        bookingId,
        results,
        allSuccess,
        note:
          results.length === 0
            ? "No phone numbers found — SMS not sent"
            : undefined,
      },
    });
  } catch (error) {
    console.error("[SMS_POST]", error);
    return NextResponse.json(
      { success: false, error: "SMS service failed" },
      { status: 500 },
    );
  }
}
