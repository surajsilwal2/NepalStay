import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

function initStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Login required" }, { status: 401 });

    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ success: false, error: "bookingId required" }, { status: 400 });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        hotel: { select: { name: true } },
        room: { select: { name: true } },
        user: { select: { email: true, name: true } },
      },
    });

    if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    if (booking.userId !== (session.user as any).id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    if (booking.paymentStatus === "PAID") return NextResponse.json({ success: false, error: "Booking is already paid" }, { status: 409 });

    if (!["PENDING", "CONFIRMED"].includes(booking.status)) return NextResponse.json({ success: false, error: "Booking cannot be paid in its current state" }, { status: 400 });

    if (booking.paidAt) return NextResponse.json({ success: false, error: `This booking is already paid via ${booking.paymentMethod ?? "Khalti"}. Invoice: ${booking.invoiceNumber}` }, { status: 409 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://nepal-stay.vercel.app";
    const amountInCents = Math.max(50, Math.round((booking.totalPrice / 133) * 100));

    let stripe: Stripe;
    try {
      stripe = initStripe();
    } catch (err: any) {
      console.error("[STRIPE_INIT]", err?.message || err);
      return NextResponse.json({ success: false, error: "STRIPE_SECRET_KEY not configured" }, { status: 500 });
    }

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: booking.user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${booking.hotel.name} — ${booking.room.name}`,
              description: `${booking.nights} night stay · NPR ${booking.totalPrice.toLocaleString()}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/payment/stripe/success?bookingId=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/hotels`,
      metadata: { bookingId },
    });

    return NextResponse.json({ success: true, data: { url: stripeSession.url, sessionId: stripeSession.id } });
  } catch (error: any) {
    console.error("[STRIPE_POST] type:", error?.type);
    console.error("[STRIPE_POST] message:", error?.message);
    console.error("[STRIPE_POST] code:", error?.code);
    console.error("[STRIPE_POST] statusCode:", error?.statusCode);
    const msg = error?.message || "Payment initiation failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
