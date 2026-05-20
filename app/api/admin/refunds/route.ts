import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// This endpoint is for ADMIN to view refund reports/analytics only
// NOT for processing refunds - only vendors process refunds
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const actor = session?.user as any;
    
    // Only ADMIN can view refund reports
    if (!session || actor?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Only admins can view refund reports" }, { status: 403 });
    }

    // Get refund statistics for monitoring
    const refunds = await prisma.booking.findMany({
      where: { status: "CANCELLED" },
      select: {
        id: true,
        invoiceNumber: true,
        totalPrice: true,
        refundAmount: true,
        refundPercent: true,
        refundStatus: true,
        refundedAt: true,
        user: { select: { name: true, email: true } },
        hotel: { select: { name: true } },
      },
      orderBy: { refundedAt: "desc" },
      take: 100,
    });

    const stats = {
      totalCancellations: await prisma.booking.count({ where: { status: "CANCELLED" } }),
      completedRefunds: await prisma.booking.count({ where: { status: "CANCELLED", refundStatus: "COMPLETED" } }),
      pendingRefunds: await prisma.booking.count({ where: { status: "CANCELLED", refundStatus: "PENDING" } }),
    };

    return NextResponse.json({
      success: true,
      data: { refunds, stats },
    });
  } catch (error) {
    console.error("[ADMIN_REFUNDS_GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

