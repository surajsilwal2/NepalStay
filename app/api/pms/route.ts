import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { addDays, format } from "date-fns";

// Uses session and dynamic hotel data — force dynamic
export const dynamic = 'force-dynamic';

/**
 * GET /api/pms
 * Returns full PMS (Property Management System) room grid data.
 * Kombai will build a visual room map using this data.
 *
 * Returns:
 * - rooms[]             → each room with current status + today's guest
 * - timeline[]          → next 7 days booking occupancy per room
 * - floorMap{}          → rooms grouped by floor
 * - todayArrivals[]     → guests checking in today
 * - todayDepartures[]   → guests checking out today
 * - currentOccupancy    → % rooms occupied right now
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      !["VENDOR", "STAFF", "ADMIN"].includes((session.user as any).role)
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const user = session.user as any;
    let hotelId: string | null = null;

    if (user.role === "VENDOR") {
      const hotel = await prisma.hotel.findUnique({
        where: { vendorId: user.id },
        select: { id: true },
      });
      hotelId = hotel?.id || null;
    } else if (user.role === "STAFF") {
      const u = await prisma.user.findUnique({
        where: { id: user.id },
        select: { staffHotelId: true },
      });
      hotelId = u?.staffHotelId || null;
    }

    if (!hotelId && user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No hotel assigned" },
        { status: 400 },
      );
    }

    const where = hotelId ? { hotelId } : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7 = addDays(today, 7);

    // All rooms with active bookings
    const rooms = await prisma.room.findMany({
      where: { ...where, isActive: true },
      orderBy: [{ floor: "asc" }, { name: "asc" }],
      include: {
        hotel: { select: { name: true } },
        bookings: {
          where: {
            status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING"] },
            checkIn: { lte: in7 },
            checkOut: { gte: today },
          },
          include: {
            user: { select: { name: true, phone: true, avatar: true } },
          },
          orderBy: { checkIn: "asc" },
        },
        roomStatusLogs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true, createdAt: true },
        },
      },
    });

    // Today arrivals
    const todayStr = format(today, "yyyy-MM-dd");
    const todayArrivals = rooms.flatMap((r) =>
      r.bookings
        .filter((b) => format(new Date(b.checkIn), "yyyy-MM-dd") === todayStr)
        .map((b) => ({
          bookingId: b.id,
          guestName: b.user?.name,
          guestPhone: b.user?.phone,
          guestAvatar: b.user?.avatar,
          roomName: r.name,
          roomType: r.type,
          roomFloor: r.floor,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          nights: b.nights,
          status: b.status,
          totalPrice: b.totalPrice,
          invoiceNumber: b.invoiceNumber,
        })),
    );

    // Today departures
    const todayDepartures = rooms.flatMap((r) =>
      r.bookings
        .filter((b) => format(new Date(b.checkOut), "yyyy-MM-dd") === todayStr)
        .map((b) => ({
          bookingId: b.id,
          guestName: b.user?.name,
          roomName: r.name,
          checkOut: b.checkOut,
          status: b.status,
        })),
    );

    // 7-day timeline per room (for Gantt view)
    const timeline = rooms.map((r) => ({
      roomId: r.id,
      roomName: r.name,
      roomType: r.type,
      floor: r.floor,
      days: Array.from({ length: 7 }, (_, i) => {
        const date = addDays(today, i);
        const dateStr = format(date, "yyyy-MM-dd");
        const booking = r.bookings.find((b) => {
          const ci = new Date(b.checkIn);
          const co = new Date(b.checkOut);
          return date >= ci && date < co;
        });
        return {
          date: dateStr,
          day: format(date, "EEE"),
          isToday: i === 0,
          booking: booking
            ? {
                id: booking.id,
                guestName: booking.user?.name,
                status: booking.status,
                isCheckIn:
                  format(new Date(booking.checkIn), "yyyy-MM-dd") === dateStr,
                isCheckOut:
                  format(new Date(booking.checkOut), "yyyy-MM-dd") === dateStr,
              }
            : null,
        };
      }),
    }));

    // Group by floor
    const floorGroups: Record<number, typeof rooms> = {};
    rooms.forEach((r) => {
      if (!floorGroups[r.floor]) floorGroups[r.floor] = [];
      floorGroups[r.floor].push(r);
    });

    // Current occupancy
    const occupied = rooms.filter((r) => r.status === "OCCUPIED").length;
    const currentOccupancy =
      rooms.length > 0 ? Math.round((occupied / rooms.length) * 100) : 0;

    // Status counts
    const statusCounts = rooms.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return NextResponse.json({
      success: true,
      data: {
        rooms: rooms.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          status: r.status,
          floor: r.floor,
          capacity: r.capacity,
          pricePerNight: r.pricePerNight,
          hotelName: r.hotel.name,
          currentGuest:
            r.bookings.find((b) => b.status === "CHECKED_IN")?.user?.name ||
            null,
          nextGuest:
            r.bookings.find((b) => b.status === "CONFIRMED")?.user?.name ||
            null,
          lastStatusChange: r.roomStatusLogs[0]?.createdAt || null,
          upcomingBookings: r.bookings.length,
        })),
        timeline,
        floorMap: Object.entries(floorGroups)
          .map(([floor, floorRooms]) => ({
            floor: parseInt(floor),
            rooms: floorRooms.map((r) => ({
              id: r.id,
              name: r.name,
              type: r.type,
              status: r.status,
            })),
          }))
          .sort((a, b) => a.floor - b.floor),
        todayArrivals,
        todayDepartures,
        currentOccupancy,
        statusCounts,
        totalRooms: rooms.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[PMS]", error);
    return NextResponse.json(
      { success: false, error: "Failed to load PMS data" },
      { status: 500 },
    );
  }
}
