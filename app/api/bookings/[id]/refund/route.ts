import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getCancellationPolicy, generateCreditNoteNumber } from "@/lib/booking";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user    = session.user as any;
    const { reason } = await req.json().catch(() => ({}));

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        user:  { select: { id: true, name: true, email: true } },
        hotel: { select: { name: true } },
        room:  { select: { name: true, status: true } },
      },
    });

    if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });

    if (user.role === "CUSTOMER" && booking.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      return NextResponse.json({ success: false, error: `Cannot refund a booking with status ${booking.status}` }, { status: 400 });
    }

    if (booking.refundStatus !== "NONE" && booking.refundStatus !== null) {
      return NextResponse.json({ success: false, error: "Refund already processed" }, { status: 409 });
    }

    // Unpaid bookings — cancel with no refund
    if (!booking.paidAt) {
      await prisma.$transaction([
        prisma.booking.update({
          where: { id: params.id },
          data: { status: "CANCELLED", refundStatus: "NOT_ELIGIBLE", refundAmount: 0, refundPercent: 0 },
        }),
        prisma.room.update({ where: { id: booking.roomId }, data: { status: "AVAILABLE" } }),
      ]);
      return NextResponse.json({
        success: true,
        refund: { eligible: false, reason: "Booking was not paid — cancelled with no charge." },
      });
    }

    const policy   = getCancellationPolicy(booking.checkIn);
    const refundAmt = Math.round(booking.totalPrice * policy.percent / 100);

    const creditNoteNumber = generateCreditNoteNumber(booking.invoiceNumber!);
    const now = new Date();

    // Attempt Khalti refund if applicable
    let khaltiRefundStatus: "SUCCESS" | "PENDING" | "SKIPPED" = "SKIPPED";
  
    if (booking.khaltiTransactionId && policy.percent > 0) {
      try {
        const isTest  = process.env.KHALTI_SECRET_KEY?.startsWith("test_");
        const baseUrl = isTest ? "https://a.khalti.com" : "https://khalti.com";
        const kRes    = await fetch(`${baseUrl}/api/merchant-transaction/${booking.khaltiTransactionId}/refund/`, {
          method: "POST",
          headers: { "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const kData = await kRes.json();
        if (kRes.ok && kData.detail?.includes("successful")) {
          khaltiRefundStatus = "SUCCESS";
        } else {
          khaltiRefundStatus = "PENDING";
          console.error("[KHALTI_REFUND]", kData);
        }
      } catch (err) {
        khaltiRefundStatus = "PENDING";
        console.error("[KHALTI_REFUND]", err);
      }
    } else if (booking.khaltiTransactionId && policy.percent === 0) {
      khaltiRefundStatus = "SKIPPED"; // no refund applicable
    }

    const refundStatus = khaltiRefundStatus === "SUCCESS" ? "COMPLETED" : "PENDING";

    await prisma.$transaction([
      prisma.creditNote.create({
        data: {
          creditNoteNumber,
          bookingId:          booking.id,
          originalInvoice:    booking.invoiceNumber!,
          guestName:          booking.user.name,
          guestEmail:         booking.user.email,
          hotelName:          booking.hotel.name,
          roomName:           booking.room.name,
          originalAmount:     booking.totalPrice,
          refundAmount:       refundAmt,
          refundPercent:      policy.percent,
          reason:             reason ?? "Guest cancellation",
          cancellationPolicy: policy.description,
          issuedAt:           now,
          issuedBy:           user.id,
          notes: khaltiRefundStatus === "PENDING"
            ? "Khalti refund pending — admin to complete manually"
            : undefined,
        },
      }),
      prisma.booking.update({
        where: { id: params.id },
        data: {
          status:         "CANCELLED",
          creditNoteRef:  creditNoteNumber,
          refundStatus,
          refundAmount:   refundAmt,
          refundPercent:  policy.percent,
          refundedAt:     refundStatus === "COMPLETED" ? now : undefined,
        },
      }),
      prisma.room.update({ where: { id: booking.roomId }, data: { status: "AVAILABLE" } }),
    ]);

    return NextResponse.json({
      success: true,
      refund: {
        creditNoteNumber,
        refundAmount:             refundAmt,
        refundPercent:            policy.percent,
        refundStatus,
        policy:                   policy.description,
        manualProcessingRequired: refundStatus === "PENDING",
      },
      message: refundStatus === "COMPLETED"
        ? `Refund of NPR ${refundAmt.toLocaleString()} processed. Credit note ${creditNoteNumber} issued.`
        : `Credit note ${creditNoteNumber} issued. Refund will be processed within 3–5 business days.`,
    });
  } catch (error) {
    console.error("[REFUND_POST]", error);
    return NextResponse.json({ success: false, error: "Failed to process refund" }, { status: 500 });
  }
}
