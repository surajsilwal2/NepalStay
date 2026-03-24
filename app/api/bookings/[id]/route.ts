import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getCancellationPolicy, generateCreditNoteNumber } from "@/lib/booking";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        user:  { select: { name: true, email: true, phone: true, avatar: true } },
        hotel: { select: { name: true, slug: true, city: true, address: true, images: true, contactPhone: true, contactEmail: true } },
        room:  { select: { name: true, type: true, floor: true, pricePerNight: true } },
      },
    });

    if (!booking) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const user = session.user as any;
    if (user.role === "CUSTOMER" && booking.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error("[BOOKING_GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch booking" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { status } = await req.json();
    const user       = session.user as any;

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { room: true, hotel: true, user: true },
    });
    if (!booking) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    // Customers can only cancel their own unpaid bookings
    if (user.role === "CUSTOMER") {
      if (booking.userId !== user.id) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
      if (status !== "CANCELLED") {
        return NextResponse.json({ success: false, error: "Customers can only cancel bookings" }, { status: 403 });
      }
      if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
        return NextResponse.json({ success: false, error: "Cannot cancel this booking" }, { status: 400 });
      }
      // Paid booking must go through /refund route
      if (booking.paidAt && booking.invoiceNumber) {
        return NextResponse.json({
          success: false,
          error: "This booking was paid. Use the Cancel & Refund button to process your refund.",
          redirectTo: `/api/bookings/${params.id}/refund`,
        }, { status: 400 });
      }
      // Unpaid — cancel directly
      await prisma.booking.update({
        where: { id: params.id },
        data:  { status: "CANCELLED", refundStatus: "NOT_ELIGIBLE" },
      });
      return NextResponse.json({ success: true, data: { id: params.id, status: "CANCELLED" } });
    }

    // Staff/Vendor/Admin status transitions
    const allowed: Record<string, string[]> = {
      PENDING:     ["CONFIRMED", "CANCELLED"],
      CONFIRMED:   ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
      CHECKED_IN:  ["CHECKED_OUT"],
      CHECKED_OUT: [],
    };
    if (!allowed[booking.status]?.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Cannot transition from ${booking.status} to ${status}` },
        { status: 400 }
      );
    }

    const updateData: any = { status };

    // When checking out, free the room
    if (status === "CHECKED_OUT") {
      await prisma.room.update({ where: { id: booking.roomId }, data: { status: "CLEANING" } });
    }
    // When confirming, mark room as occupied if checking in today
    if (status === "CHECKED_IN") {
      await prisma.room.update({ where: { id: booking.roomId }, data: { status: "OCCUPIED" } });
    }

    const updated = await prisma.booking.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[BOOKING_PATCH]", error);
    return NextResponse.json({ success: false, error: "Failed to update booking" }, { status: 500 });
  }
}
