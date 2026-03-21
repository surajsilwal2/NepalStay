import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const now        = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd   = endOfMonth(now);
    const lastStart  = startOfMonth(subMonths(now, 1));
    const lastEnd    = endOfMonth(subMonths(now, 1));

    const [
      totalHotels, pendingHotels, approvedHotels,
      totalUsers, totalBookings, pendingBookings,
      revenueThis, revenueLast,
      pendingRefunds, fnmisPending,
      roomCounts,
    ] = await Promise.all([
      prisma.hotel.count(),
      prisma.hotel.count({ where: { status: "PENDING" } }),
      prisma.hotel.count({ where: { status: "APPROVED" } }),
      prisma.user.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.aggregate({
        where: { status: { in: ["CONFIRMED","CHECKED_IN","CHECKED_OUT"] }, createdAt: { gte: monthStart, lte: monthEnd } },
        _sum: { totalPrice: true },
      }),
      prisma.booking.aggregate({
        where: { status: { in: ["CONFIRMED","CHECKED_IN","CHECKED_OUT"] }, createdAt: { gte: lastStart, lte: lastEnd } },
        _sum: { totalPrice: true },
      }),
      prisma.booking.count({ where: { refundStatus: "PENDING" } }),
      prisma.booking.count({ where: { fnmisOverdue: true, fnmisReported: false } }),
      prisma.room.groupBy({ by: ["status"], _count: true }),
    ]);

    const thisRev = revenueThis._sum.totalPrice ?? 0;
    const lastRev = revenueLast._sum.totalPrice ?? 0;
    const rooms   = Object.fromEntries(roomCounts.map(r => [r.status, r._count]));

    return NextResponse.json({
      success: true,
      data: {
        totalHotels, pendingHotels, approvedHotels,
        totalUsers, totalBookings, pendingBookings,
        revenueThisMonth: thisRev,
        revenueLastMonth: lastRev,
        revenueGrowth: lastRev > 0 ? Math.round(((thisRev - lastRev) / lastRev) * 1000) / 10 : 0,
        pendingRefunds, fnmisPending,
        rooms,
      },
    });
  } catch (error) {
    console.error("[ADMIN_STATS]", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
