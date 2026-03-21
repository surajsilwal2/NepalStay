import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { calculateTotalPrice, calculateNights } from "@/lib/booking";
import { differenceInCalendarDays, addDays } from "date-fns";

const schema = z.object({
  hotelId:          z.string(),
  roomId:           z.string(),
  checkIn:          z.string().datetime(),
  checkOut:         z.string().datetime(),
  adults:           z.number().int().min(1).default(1),
  children:         z.number().int().min(0).default(0),
  notes:            z.string().nullish(),
  guestNationality: z.string().nullish(),
  passportNumber:   z.string().nullish(),
  purposeOfVisit:   z.string().nullish(),
}).refine((d) => new Date(d.checkOut) > new Date(d.checkIn), {
  message: "Check-out must be after check-in",
  path: ["checkOut"],
});

// GET — customer sees own bookings; admin/vendor sees filtered
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user   = session.user as any;
    const { searchParams } = new URL(req.url);
    const status  = searchParams.get("status");
    const hotelId = searchParams.get("hotelId");
    const limit   = parseInt(searchParams.get("limit") ?? "50");
    const page    = parseInt(searchParams.get("page") ?? "1");

    const where: any = {};
    if (user.role === "CUSTOMER") where.userId = user.id;
    else if (user.role === "VENDOR") {
      // Vendor sees bookings for their hotel only
      const hotel = await prisma.hotel.findUnique({ where: { vendorId: user.id } });
      if (hotel) where.hotelId = hotel.id;
    } else if (user.role === "STAFF") {
      const staffUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (staffUser?.staffHotelId) where.hotelId = staffUser.staffHotelId;
    }
    if (status) where.status = status;
    if (hotelId && ["ADMIN"].includes(user.role)) where.hotelId = hotelId;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user:  { select: { id: true, name: true, email: true, phone: true } },
          hotel: { select: { id: true, name: true, slug: true, city: true } },
          room:  { select: { id: true, name: true, type: true, floor: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: bookings, total });
  } catch (error) {
    console.error("[BOOKINGS_GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch bookings" }, { status: 500 });
  }
}

// POST — create booking with serializable transaction to prevent double-booking
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Login required" }, { status: 401 });

    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { hotelId, roomId, checkIn, checkOut, adults, children, notes,
            guestNationality, passportNumber, purposeOfVisit } = parsed.data;

    const checkInDate  = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const userId       = (session.user as any).id;

    if (checkInDate < new Date()) {
      return NextResponse.json({ success: false, error: "Check-in date cannot be in the past" }, { status: 400 });
    }

    // Verify hotel is approved and room is available
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId, status: "APPROVED" },
    });
    if (!hotel) {
      return NextResponse.json({ success: false, error: "Hotel not found or not accepting bookings" }, { status: 404 });
    }

    const room = await prisma.room.findFirst({
      where: { id: roomId, hotelId, isActive: true, status: "AVAILABLE" },
    });
    if (!room) {
      return NextResponse.json({ success: false, error: "This room is not available for booking. Please choose another room." }, { status: 409 });
    }
    if (adults + children > room.capacity) {
      return NextResponse.json(
        { success: false, error: `Max capacity for this room is ${room.capacity} guests` },
        { status: 400 }
      );
    }

    const totalPrice = calculateTotalPrice(room.pricePerNight, checkInDate, checkOutDate);
    const nights     = calculateNights(checkInDate, checkOutDate);

    // FNMIS deadline: 24 hours after check-in
    const isForeign     = guestNationality && guestNationality !== "Nepali";
    const fnmisDeadline = isForeign ? addDays(checkInDate, 1) : null;

    let booking;
    try {
      booking = await prisma.$transaction(async (tx) => {
        // Conflict check inside transaction — prevents race condition
        // Count how many bookings already overlap for this room
        // If the room has totalRooms > 1 (e.g. 4 identical units), allow up to totalRooms concurrent bookings
        const overlappingCount = await tx.booking.count({
          where: {
            roomId,
            status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
            AND: [{ checkIn: { lt: checkOutDate } }, { checkOut: { gt: checkInDate } }],
          },
        });
        if (overlappingCount >= room.totalRooms) {
          throw new Error(`CONFLICT:All ${room.totalRooms} unit(s) of this room are booked for those dates. Please choose different dates.`);
        }
        return tx.booking.create({
          data: {
            userId, hotelId, roomId,
            checkIn: checkInDate, checkOut: checkOutDate,
            nights, adults, children: children ?? 0,
            notes: notes ?? undefined,
            totalPrice,
            status:     "PENDING",
            paymentStatus: "UNPAID",
            guestNationality: guestNationality ?? "Nepali",
            passportNumber:   passportNumber ?? undefined,
            purposeOfVisit:   purposeOfVisit ?? undefined,
            fnmisDeadline:    fnmisDeadline ?? undefined,
          },
          include: {
            room:  { select: { name: true, type: true, floor: true } },
            hotel: { select: { name: true, city: true } },
            user:  { select: { name: true, email: true } },
          },
        });
      }, { isolationLevel: "Serializable" });
    } catch (txErr: any) {
      if (txErr.message?.startsWith("CONFLICT:")) {
        return NextResponse.json({ success: false, error: txErr.message.replace("CONFLICT:", "") }, { status: 409 });
      }
      throw txErr;
    }

    return NextResponse.json(
      { success: true, data: booking, message: "Booking submitted! Awaiting confirmation." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[BOOKINGS_POST]", error);
    return NextResponse.json({ success: false, error: "Failed to create booking" }, { status: 500 });
  }
}
