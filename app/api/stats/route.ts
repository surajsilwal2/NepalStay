import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Public endpoint — no auth needed
// Returns platform-wide tourism statistics for the public dashboard
export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalHotels,
      totalBookings,
      totalGuests,
      monthBookings,
      lastMonthBookings,
      cityStats,
      typeStats,
      foreignGuestCount,
      topHotels,
    ] = await Promise.all([
      prisma.hotel.count({ where: { status: "APPROVED" } }),
      prisma.booking.count({
        where: { status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] } },
      }),
      prisma.booking.aggregate({
        where: { status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] } },
        _sum: { adults: true, children: true },
      }),
      prisma.booking.count({
        where: {
          createdAt: { gte: monthStart },
          status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
        },
      }),
      prisma.booking.count({
        where: {
          createdAt: { gte: lastMonth, lte: lastMonthEnd },
          status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
        },
      }),

      // Bookings by city
      prisma.hotel.groupBy({
        by: ["city"],
        where: { status: "APPROVED" },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),

      // Hotels by property type
      prisma.hotel.groupBy({
        by: ["propertyType"],
        where: { status: "APPROVED" },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),

      // Foreign guest count (FNMIS)
      prisma.booking.count({
        where: {
          passportNumber: { not: null },
          guestNationality: { not: "Nepali" },
          status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
        },
      }),

      // Top 5 hotels by booking count
      prisma.hotel.findMany({
        where: { status: "APPROVED" },
        orderBy: { bookings: { _count: "desc" } },
        take: 5,
        select: {
          id: true,
          name: true,
          city: true,
          starRating: true,
          images: true,
          slug: true,
          _count: { select: { bookings: true, reviews: true } },
        },
      }),
    ]);

    const bookingGrowth =
      lastMonthBookings > 0
        ? Math.round(
            ((monthBookings - lastMonthBookings) / lastMonthBookings) * 100,
          )
        : 0;

    const totalVisitors =
      (totalGuests._sum.adults ?? 0) + (totalGuests._sum.children ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalHotels,
          totalBookings,
          totalVisitors,
          monthBookings,
          bookingGrowth,
          foreignGuests: foreignGuestCount,
        },
        byCity: cityStats.map((c) => ({ city: c.city, hotels: c._count.id })),
        byType: typeStats.map((t) => ({
          type: t.propertyType,
          count: t._count.id,
        })),
        topHotels: topHotels.map((h) => ({
          id: h.id,
          name: h.name,
          city: h.city,
          starRating: h.starRating,
          images: h.images,
          slug: h.slug,
          bookingCount: h._count.bookings,
          reviewCount: h._count.reviews,
        })),
        generatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("[STATS]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
