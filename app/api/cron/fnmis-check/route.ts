import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/fnmis-check
 * Run hourly via cron (Vercel cron, uptime robot, etc.)
 * Marks foreign-guest bookings as overdue when 24h deadline passes.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const overdueResult = await prisma.booking.updateMany({
      where: {
        user: { nationality: "FOREIGN", passportNumber: { not: null } },
        fnmisReported: false,
        fnmisOverdue: false,
        fnmisDeadline: { lt: now },
        status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
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
