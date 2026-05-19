import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/fnmis — manually report a foreign guest to Tourist Police
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN","STAFF","VENDOR"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }
    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ success: false, error: "bookingId required" }, { status: 400 });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, room: true, hotel: true },
    });
    if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    if (!booking.user?.passportNumber) {
      return NextResponse.json({ success: false, error: "No passport number on record" }, { status: 400 });
    }

    // Authorization check: ensure user can report this booking
    const user = session.user as any;
    if (user.role === "VENDOR") {
      const hotel = await prisma.hotel.findUnique({ where: { vendorId: user.id } });
      if (!hotel || hotel.id !== booking.hotelId) {
        return NextResponse.json({ success: false, error: "Not authorized to report this booking" }, { status: 403 });
      }
    } else if (user.role === "STAFF") {
      const staff = await prisma.user.findUnique({ where: { id: user.id } });
      if (!staff?.staffHotelId || staff.staffHotelId !== booking.hotelId) {
        return NextResponse.json({ success: false, error: "Not authorized to report this booking" }, { status: 403 });
      }
    }
    // ADMIN can report any booking

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        fnmisReported:   true,
        fnmisReportedAt: new Date(),
        fnmisOverdue:    false,
        fnmisAutoReported: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `FNMIS report submitted for ${booking.user.name} (${booking.user.passportNumber}).`,
    });
  } catch (error) {
    console.error("[FNMIS_POST]", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}

// GET /api/fnmis — list unreported/overdue foreign guest bookings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN","STAFF","VENDOR"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const user = session.user as any;
    let hotelFilter: any = {};

    // Authorization: vendors and staff only see their hotel's bookings
    if (user.role === "VENDOR") {
      const hotel = await prisma.hotel.findUnique({ where: { vendorId: user.id } });
      if (hotel) hotelFilter = { hotelId: hotel.id };
    } else if (user.role === "STAFF") {
      const staffUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (staffUser?.staffHotelId) hotelFilter = { hotelId: staffUser.staffHotelId };
    }
    // ADMIN sees all bookings

    const now = new Date();
    const bookings = await prisma.booking.findMany({
      where: {
        user: { passportNumber: { not: null } },
        status: { in: ["CONFIRMED","CHECKED_IN","CHECKED_OUT"] },
        ...hotelFilter,
      },
      orderBy: { fnmisDeadline: "asc" },
      include: {
        user:  { select: { name: true, email: true, passportNumber: true } },
        hotel: { select: { name: true, city: true } },
        room:  { select: { name: true } },
      },
    });

    // Flag overdue in memory (cheaper than updating every record in GET)
    const enriched = bookings.map(b => ({
      ...b,
      isOverdue: !b.fnmisReported && b.fnmisDeadline && b.fnmisDeadline < now,
      hoursLeft: b.fnmisDeadline
        ? Math.max(0, Math.round((b.fnmisDeadline.getTime() - now.getTime()) / 3600000))
        : null,
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("[FNMIS_GET]", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
