import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/availability?roomId=xxx&months=3
// Returns booked date ranges for a room so the calendar can show them
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");
    const months = parseInt(searchParams.get("months") || "3");

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "roomId required" },
        { status: 400 },
      );
    }

    const now = new Date();
    const maxDate = new Date(now);
    maxDate.setMonth(maxDate.getMonth() + months);

    const bookings = await prisma.booking.findMany({
      where: {
        roomId,
        status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
        checkIn: { lte: maxDate },
        checkOut: { gte: now },
      },
      select: { checkIn: true, checkOut: true, status: true },
    });

    // Build a set of booked dates for easy frontend rendering
    const bookedDates: string[] = [];
    bookings.forEach((b) => {
      const current = new Date(b.checkIn);
      const end = new Date(b.checkOut);
      while (current < end) {
        bookedDates.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        roomId,
        bookedDates: [...new Set(bookedDates)], // deduplicate
        totalBookings: bookings.length,
        nextAvailable:
          bookedDates.length > 0
            ? (() => {
                const sorted = [...bookedDates].sort();
                const lastDate = new Date(sorted[sorted.length - 1]);
                lastDate.setDate(lastDate.getDate() + 1);
                return lastDate.toISOString().split("T")[0];
              })()
            : now.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("[AVAILABILITY]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch availability" },
      { status: 500 },
    );
  }
}
