import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json(
        { success: false, error: "Login required" },
        { status: 401 },
      );

    const { bookingId } = await req.json();
    if (!bookingId)
      return NextResponse.json(
        { success: false, error: "bookingId required" },
        { status: 400 },
      );

    if (!process.env.KHALTI_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: "KHALTI_SECRET_KEY not configured" },
        { status: 500 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        room: { select: { name: true, type: true } },
        hotel: { select: { name: true } },
      },
    });

    if (!booking)
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 },
      );
    if (booking.userId !== (session.user as any).id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }
    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking cannot be paid in its current state",
        },
        { status: 400 },
      );
    }

    // ── ADD THIS BLOCK ──────────────────────────────────────────────────────────
    // Prevent double payment — booking already paid via Stripe or any other method
    if (booking.paidAt) {
      return NextResponse.json(
        {
          success: false,
          error: `This booking is already paid via ${booking.paymentMethod ?? "card"}. Invoice: ${booking.invoiceNumber}`,
        },
        { status: 409 },
      );
    }
    //

    const appUrl = process.env.NEXTAUTH_URL || "https://nepal-stay.vercel.app";
    const amountPaisa = Math.round(booking.totalPrice * 100);
    // NEW — explicit env variable controls which URL to use
    const khaltiBase =
      process.env.NODE_ENV === "production"
        ? "https://khalti.com"
        : "https://a.khalti.com";

    const payload = {
      return_url: `${appUrl}/payment/success?bookingId=${booking.id}`,
      website_url: appUrl,
      amount: amountPaisa,
      purchase_order_id: booking.id,
      purchase_order_name: `${booking.hotel.name} — ${booking.room.name}`,
      customer_info: {
        name: booking.user.name,
        email: booking.user.email,
        phone: booking.user.phone || "9800000000",
      },
      amount_breakdown: [{ label: booking.room.name, amount: amountPaisa }],
      product_details: [
        {
          identity: booking.roomId,
          name: booking.room.name,
          total_price: amountPaisa,
          quantity: 1,
          unit_price: amountPaisa,
        },
      ],
    };

    const kRes = await fetch(`${khaltiBase}/api/v2/epayment/initiate/`, {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!kRes.ok) {
      const err = await kRes.text();
      console.error("[KHALTI_INITIATE]", kRes.status, err);
      return NextResponse.json(
        { success: false, error: `Khalti error (${kRes.status}): ${err}` },
        { status: 502 },
      );
    }

    const kData = await kRes.json();
    return NextResponse.json({
      success: true,
      data: {
        pidx: kData.pidx,
        payment_url: kData.payment_url,
        bookingId,
        amount: booking.totalPrice,
      },
    });
  } catch (error) {
    console.error("[KHALTI_POST]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
