import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "STAFF"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { bookingId, notes } = await req.json();
    if (!bookingId) return NextResponse.json({ success: false, error: "bookingId required" }, { status: 400 });

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    if (booking.refundStatus !== "PENDING") {
      return NextResponse.json(
        { success: false, error: `Cannot complete — current refund status is ${booking.refundStatus}` },
        { status: 400 }
      );
    }

    const now = new Date();
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data:  { refundStatus: "COMPLETED", refundedAt: now },
      }),
      ...(booking.creditNoteRef
        ? [prisma.creditNote.updateMany({
            where: { creditNoteNumber: booking.creditNoteRef },
            data:  { notes: notes ?? "Refund manually completed by admin" },
          })]
        : []),
    ]);

    return NextResponse.json({
      success: true,
      message: `Refund of NPR ${booking.refundAmount?.toLocaleString() ?? "?"} marked as completed.`,
      data: { bookingId, refundStatus: "COMPLETED", refundedAt: now },
    });
  } catch (error) {
    console.error("[ADMIN_REFUNDS_PATCH]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
