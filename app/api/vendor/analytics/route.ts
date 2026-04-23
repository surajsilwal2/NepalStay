import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Uses headers/session — force dynamic
export const dynamic = 'force-dynamic';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  eachMonthOfInterval,
  startOfDay,
  eachDayOfInterval,
  subDays,
} from "date-fns";

/**
 * GET /api/vendor/analytics
 * Returns rich analytics data for the vendor dashboard.
 *
 * Kombai UI will use these data shapes:
 * - revenueByMonth[]    → Line chart (12 months)
 * - bookingsByDay[]     → Bar chart (last 30 days)
 * - roomPerformance[]   → Bar chart (revenue per room type)
 * - occupancyRate[]     → Gauge or number (current month %)
 * - guestNationality[]  → Pie chart (Nepali vs foreign)
 * - paymentMethods[]    → Donut chart (Khalti/Stripe/Cash)
 * - bookingStatus[]     → Status breakdown
 * - topReviewScores     → Spider/radar chart (5 dimensions)
 * - peakDays[]          → Heatmap data (bookings by day of week)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["VENDOR", "ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const hotel = await prisma.hotel.findUnique({
      where: { vendorId: (session.user as any).id },
      include: {
        rooms: {
          where: { isActive: true },
          select: { id: true, name: true, type: true },
        },
      },
    });

    if (!hotel) {
      return NextResponse.json({ success: false, data: null });
    }

    const now = new Date();
    const since = subMonths(now, 11); // 12 months of data

    // All confirmed bookings for this hotel
    const bookings = await prisma.booking.findMany({
      where: {
        hotelId: hotel.id,
        status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
        createdAt: { gte: startOfMonth(since) },
      },
      include: {
        room: { select: { name: true, type: true } },
      },
    });

    // ── 1. Revenue by Month (last 12 months) ──────────────────────────────
    const months = eachMonthOfInterval({
      start: startOfMonth(since),
      end: startOfMonth(now),
    });

    const revenueByMonth = months.map((month) => {
      const monthBookings = bookings.filter((b) => {
        const d = new Date(b.createdAt);
        return d >= startOfMonth(month) && d <= endOfMonth(month);
      });
      return {
        month: format(month, "MMM yy"),
        revenue: Math.round(
          monthBookings.reduce((s, b) => s + b.totalPrice, 0),
        ),
        bookings: monthBookings.length,
      };
    });

    // ── 2. Bookings by Day (last 30 days) ─────────────────────────────────
    const last30 = subDays(now, 29);
    const days = eachDayOfInterval({
      start: startOfDay(last30),
      end: startOfDay(now),
    });
    const bookingsByDay = days.map((day) => {
      const dayBookings = bookings.filter((b) => {
        const d = new Date(b.createdAt);
        return format(d, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
      });
      return {
        date: format(day, "MMM d"),
        bookings: dayBookings.length,
        revenue: Math.round(dayBookings.reduce((s, b) => s + b.totalPrice, 0)),
      };
    });

    // ── 3. Room Performance ───────────────────────────────────────────────
    const roomMap = new Map<
      string,
      {
        name: string;
        type: string;
        revenue: number;
        bookings: number;
        nights: number;
      }
    >();

    bookings.forEach((b) => {
      const key = b.room?.type || "Unknown";
      const label = b.room?.name || b.room?.type || "Unknown";
      const entry = roomMap.get(key) || {
        name: label,
        type: key,
        revenue: 0,
        bookings: 0,
        nights: 0,
      };
      entry.revenue += b.totalPrice;
      entry.bookings += 1;
      entry.nights += b.nights;
      roomMap.set(key, entry);
    });

    const roomPerformance = Array.from(roomMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .map((r) => ({
        ...r,
        revenue: Math.round(r.revenue),
        avgNights:
          r.nights > 0 ? Math.round((r.nights / r.bookings) * 10) / 10 : 0,
      }));

    // ── 4. Occupancy Rate (current month) ────────────────────────────────
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const daysInMonth = thisMonthEnd.getDate();
    const totalRoomNights = hotel.rooms.length * daysInMonth;

    const thisMonthBookings = await prisma.booking.findMany({
      where: {
        hotelId: hotel.id,
        status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
        checkIn: { lte: thisMonthEnd },
        checkOut: { gte: thisMonthStart },
      },
      select: { checkIn: true, checkOut: true, nights: true },
    });

    const bookedRoomNights = thisMonthBookings.reduce(
      (s, b) => s + b.nights,
      0,
    );
    const occupancyRate =
      totalRoomNights > 0
        ? Math.round((bookedRoomNights / totalRoomNights) * 100)
        : 0;

    // ── 5. Guest Nationality (Nepali vs Foreign) ──────────────────────────
    const nepaliCount = bookings.filter(
      (b) => !b.guestNationality || b.guestNationality === "Nepali",
    ).length;
    const foreignCount = bookings.length - nepaliCount;

    // Breakdown of top nationalities
    const nationalityMap = new Map<string, number>();
    bookings.forEach((b) => {
      const nat = b.guestNationality || "Nepali";
      nationalityMap.set(nat, (nationalityMap.get(nat) || 0) + 1);
    });
    const guestNationality = Array.from(nationalityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([nationality, count]) => ({
        nationality,
        count,
        pct: Math.round((count / bookings.length) * 100),
      }));

    // ── 6. Payment Methods ────────────────────────────────────────────────
    const paymentMap = new Map<string, number>();
    bookings.forEach((b) => {
      const method = b.paymentMethod || "CASH";
      paymentMap.set(method, (paymentMap.get(method) || 0) + 1);
    });
    const paymentMethods = Array.from(paymentMap.entries()).map(
      ([method, count]) => ({
        method,
        count,
        pct: Math.round((count / bookings.length) * 100),
      }),
    );

    // ── 7. Booking Status Breakdown ───────────────────────────────────────
    const allBookings = await prisma.booking.findMany({
      where: { hotelId: hotel.id },
      select: { status: true },
    });
    const statusMap = new Map<string, number>();
    allBookings.forEach((b) =>
      statusMap.set(b.status, (statusMap.get(b.status) || 0) + 1),
    );
    const bookingStatus = Array.from(statusMap.entries()).map(
      ([status, count]) => ({ status, count }),
    );

    // ── 8. Review Scores (5 dimensions) ───────────────────────────────────
    const reviews = await prisma.review.findMany({
      where: { hotelId: hotel.id },
      select: {
        cleanlinessScore: true,
        staffScore: true,
        locationScore: true,
        valueScore: true,
        facilitiesScore: true,
        overallScore: true,
      },
    });

    const avg = (arr: number[]) =>
      arr.length > 0
        ? Math.round((arr.reduce((s, n) => s + n, 0) / arr.length) * 10) / 10
        : 0;

    const topReviewScores =
      reviews.length > 0
        ? {
            cleanliness: avg(reviews.map((r) => r.cleanlinessScore)),
            staff: avg(reviews.map((r) => r.staffScore)),
            location: avg(reviews.map((r) => r.locationScore)),
            value: avg(reviews.map((r) => r.valueScore)),
            facilities: avg(reviews.map((r) => r.facilitiesScore)),
            overall: avg(reviews.map((r) => r.overallScore)),
            totalReviews: reviews.length,
          }
        : null;

    // ── 9. Peak Days of Week ──────────────────────────────────────────────
    const dayOfWeekMap = new Array(7).fill(0);
    bookings.forEach((b) => {
      const dow = new Date(b.createdAt).getDay(); // 0=Sun, 6=Sat
      dayOfWeekMap[dow]++;
    });
    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const peakDays = dayOfWeekMap.map((count, i) => ({
      day: DAY_NAMES[i],
      count,
      isPeak: count === Math.max(...dayOfWeekMap),
    }));

    // ── 10. Summary KPIs ──────────────────────────────────────────────────
    const totalRevenue = Math.round(
      bookings.reduce((s, b) => s + b.totalPrice, 0),
    );
    const thisMonthRevenue = Math.round(
      bookings
        .filter((b) => new Date(b.createdAt) >= thisMonthStart)
        .reduce((s, b) => s + b.totalPrice, 0),
    );
    const lastMonthRevenue = Math.round(
      bookings
        .filter((b) => {
          const d = new Date(b.createdAt);
          return (
            d >= startOfMonth(subMonths(now, 1)) &&
            d <= endOfMonth(subMonths(now, 1))
          );
        })
        .reduce((s, b) => s + b.totalPrice, 0),
    );
    const revenueGrowth =
      lastMonthRevenue > 0
        ? Math.round(
            ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100,
          )
        : 0;

    const avgBookingValue =
      bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0;

    const avgNightsPerBooking =
      bookings.length > 0
        ? Math.round(
            (bookings.reduce((s, b) => s + b.nights, 0) / bookings.length) * 10,
          ) / 10
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        hotel: {
          id: hotel.id,
          name: hotel.name,
          city: hotel.city,
          starRating: hotel.starRating,
          totalRooms: hotel.rooms.length,
        },

        // KPI summary — shown as stat cards
        kpi: {
          totalRevenue,
          thisMonthRevenue,
          lastMonthRevenue,
          revenueGrowth,
          totalBookings: bookings.length,
          occupancyRate,
          avgBookingValue,
          avgNightsPerBooking,
          nepaliGuests: nepaliCount,
          foreignGuests: foreignCount,
          totalReviews: reviews.length,
          overallRating: topReviewScores?.overall ?? null,
        },

        // Chart data
        revenueByMonth, // Line chart
        bookingsByDay, // Bar chart (last 30 days)
        roomPerformance, // Horizontal bar chart
        guestNationality, // Pie chart
        paymentMethods, // Donut chart
        bookingStatus, // Status breakdown
        topReviewScores, // Radar/spider chart
        peakDays, // Bar chart (day of week)

        generatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("[ANALYTICS]", error);
    return NextResponse.json(
      { success: false, error: "Failed to load analytics" },
      { status: 500 },
    );
  }
}
