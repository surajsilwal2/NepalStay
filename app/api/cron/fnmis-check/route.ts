import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/cron/fnmis-check
 * Call this route every hour via a cron service (e.g. Vercel cron, uptime robot).
 * It marks overdue foreign-guest bookings and optionally auto-flags them.
 */
export async function GET(req: NextRequest) {
  // Simple secret check to prevent public access
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Mark overdue — deadline passed and not reported
    const overdueResult = await prisma.booking.updateMany({
      where: {
        passportNumber: { not: null },
        fnmisReported:  false,
        fnmisOverdue:   false,
        fnmisDeadline:  { lt: now },
        status: { in: ["CONFIRMED","CHECKED_IN","CHECKED_OUT"] },
      },
      data: { fnmisOverdue: true },
    });

    return NextResponse.json({
      success: true,
      overdueMarked: overdueResult.count,
      checkedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[CRON_FNMIS]", error);
    return NextResponse.json({ success: false, error: "Cron failed" }, { status: 500 });
  }
}
