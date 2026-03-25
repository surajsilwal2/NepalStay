import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["VENDOR","ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const hotel = await prisma.hotel.findUnique({
      where: { vendorId: (session.user as any).id },
      select: { id: true, status: true },
    });
    if (!hotel) return NextResponse.json({ success: true, data: null });

    const now        = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd   = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd   = endOfMonth(subMonths(now, 1));

    const [
      totalBookings, pendingBookings, activeGuests,
      revenueThisMonth, revenueLastMonth,
      totalReviews, refundsThisMonth, rooms,
    ] = await Promise.all([
      prisma.booking.count({ where: { hotelId: hotel.id } }),
      prisma.booking.count({ where: { hotelId: hotel.id, status: "PENDING" } }),
      prisma.booking.count({ where: { hotelId: hotel.id, status: "CHECKED_IN" } }),
      prisma.booking.aggregate({
        where: { hotelId: hotel.id, status: { in: ["CONFIRMED","CHECKED_IN","CHECKED_OUT"] }, createdAt: { gte: monthStart, lte: monthEnd } },
        _sum: { totalPrice: true },
      }),
      prisma.booking.aggregate({
        where: { hotelId: hotel.id, status: { in: ["CONFIRMED","CHECKED_IN","CHECKED_OUT"] }, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
        _sum: { totalPrice: true },
      }),
      prisma.review.count({ where: { hotelId: hotel.id } }),
      prisma.creditNote.aggregate({
        where: { booking: { hotelId: hotel.id }, issuedAt: { gte: monthStart, lte: monthEnd } },
        _sum: { refundAmount: true },
      }),
      prisma.room.findMany({
        where: { hotelId: hotel.id, isActive: true },
        select: { status: true },
      }),
    ]);

    const thisMonthRev = revenueThisMonth._sum.totalPrice ?? 0;
    const lastMonthRev = revenueLastMonth._sum.totalPrice ?? 0;
    const revenueGrowth = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0;
    const refundsAmt = refundsThisMonth._sum.refundAmount ?? 0;
    const netRevenue = thisMonthRev - refundsAmt;

    const roomCounts = rooms.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1; return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        hotelStatus: hotel.status,
        totalBookings, pendingBookings, activeGuests,
        revenueThisMonth: thisMonthRev,
        refundsThisMonth: refundsAmt,
        netRevenueThisMonth: netRevenue,
        revenueLastMonth: lastMonthRev,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        totalReviews,
        rooms: { total: rooms.length, ...roomCounts },
      },
    });
  } catch (error) {
    console.error("[VENDOR_STATS]", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
