import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { addDays } from "date-fns";

// GET /api/admin/overbooking
// Returns hotels at high occupancy risk in the next 30 days
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "VENDOR"].includes((session.user as any).role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const user = session.user as any;
    const now = new Date();
    const in30 = addDays(now, 30);

    // Get vendor's hotel if vendor role
    let hotelFilter: any = {};
    if (user.role === "VENDOR") {
      const hotel = await prisma.hotel.findUnique({
        where: { vendorId: user.id },
        select: { id: true },
      });
      if (hotel) hotelFilter = { id: hotel.id };
      else return NextResponse.json({ success: true, data: [] });
    }

    const hotels = await prisma.hotel.findMany({
      where: { status: "APPROVED", ...hotelFilter },
      include: {
        rooms: {
          where: { isActive: true },
          include: {
            bookings: {
              where: {
                status: { in: ["CONFIRMED", "PENDING"] },
                checkIn: { lte: in30 },
                checkOut: { gte: now },
              },
              select: { checkIn: true, checkOut: true },
            },
          },
        },
      },
    });

    const alerts = hotels.map((hotel) => {
      let totalRoomNights = 0;
      let bookedRoomNights = 0;
      const peakDates: string[] = [];

      // Check each day in the next 30 days
      for (let i = 0; i < 30; i++) {
        const date = addDays(now, i);
        const dateStr = date.toISOString().split("T")[0];
        let bookedRoomsOnDay = 0;
        const totalRooms = hotel.rooms.length;

        hotel.rooms.forEach((room) => {
          const isBooked = room.bookings.some((b) => {
            const ci = new Date(b.checkIn);
            const co = new Date(b.checkOut);
            return date >= ci && date < co;
          });
          if (isBooked) bookedRoomsOnDay++;
        });

        totalRoomNights += totalRooms;
        bookedRoomNights += bookedRoomsOnDay;

        // Flag days above 80% occupancy
        const pct = totalRooms > 0 ? (bookedRoomsOnDay / totalRooms) * 100 : 0;
        if (pct >= 80) peakDates.push(dateStr);
      }

      const occupancyPct =
        totalRoomNights > 0
          ? Math.round((bookedRoomNights / totalRoomNights) * 100)
          : 0;

      return {
        hotelId: hotel.id,
        hotelName: hotel.name,
        city: hotel.city,
        totalRooms: hotel.rooms.length,
        occupancyPct,
        riskLevel:
          occupancyPct >= 80 ? "HIGH" : occupancyPct >= 60 ? "MEDIUM" : "LOW",
        peakDates: peakDates.slice(0, 5), // show first 5 peak dates
        recommendation:
          occupancyPct >= 80
            ? "Consider raising prices or closing new bookings for peak dates"
            : occupancyPct >= 60
              ? "Good occupancy — monitor for the next 2 weeks"
              : "Low occupancy — consider promotions to attract bookings",
      };
    });

    // Sort by risk — highest first
    alerts.sort((a, b) => b.occupancyPct - a.occupancyPct);

    return NextResponse.json({ success: true, data: alerts });
  } catch (error) {
    console.error("[OVERBOOKING]", error);
    return NextResponse.json(
      { success: false, error: "Failed" },
      { status: 500 },
    );
  }
}
