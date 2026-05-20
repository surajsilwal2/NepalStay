import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

import {
  generateCreditNoteNumber,
  getCancellationPolicy,
} from "@/lib/booking";

export const dynamic = "force-dynamic";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY missing");
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const user = session.user as any;

    const { id } = await context.params;

    const body = await req.json().catch(() => ({}));

    const reason =
      body.reason?.trim() || "Guest cancellation";

    const booking = await prisma.booking.findUnique({
      where: {
        id,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        hotel: {
          select: {
            id: true,
            name: true,
            vendorId: true,
          },
        },

        room: {
          select: {
            id: true,
            name: true,
          },
        },

        creditNote: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking not found",
        },
        { status: 404 }
      );
    }

    // =========================================================
    // BLOCK ADMIN / STAFF
    // =========================================================

    if (
      user.role === "ADMIN" ||
      user.role === "STAFF"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only customers and vendors can process refunds.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // CUSTOMER CANCELLATION
    // =========================================================

    if (user.role === "CUSTOMER") {
      if (booking.userId !== user.id) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You can only cancel your own booking.",
          },
          { status: 403 }
        );
      }

      if (
        booking.status !== "PENDING" &&
        booking.status !== "CONFIRMED"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Only pending or confirmed bookings can be cancelled.",
          },
          { status: 400 }
        );
      }

      const policy = getCancellationPolicy(
        booking.checkIn
      );

      const refundAmount = Math.round(
        booking.totalPrice *
          (policy.percent / 100)
      );

      await prisma.$transaction([
        prisma.booking.update({
          where: {
            id: booking.id,
          },

          data: {
            status: "CANCELLED",

            refundStatus:
              refundAmount > 0
                ? "PENDING"
                : "NOT_ELIGIBLE",

            refundAmount,

            refundPercent: policy.percent,
          },
        }),

        prisma.room.update({
          where: {
            id: booking.roomId,
          },

          data: {
            status: "AVAILABLE",
          },
        }),
      ]);

      return NextResponse.json({
        success: true,

        refund: {
          refundAmount,
          refundPercent: policy.percent,

          refundStatus:
            refundAmount > 0
              ? "PENDING"
              : "NOT_ELIGIBLE",

          policy: policy.description,
        },

        message:
          refundAmount > 0
            ? "Booking cancelled. Vendor refund pending."
            : "Booking cancelled. No refund applicable.",
      });
    }

    // =========================================================
    // VENDOR REFUND
    // =========================================================

    if (user.role === "VENDOR") {
      if (booking.hotel.vendorId !== user.id) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You can only refund your own hotel bookings.",
          },
          { status: 403 }
        );
      }

      if (booking.status !== "CANCELLED") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Only cancelled bookings can be refunded.",
          },
          { status: 400 }
        );
      }

      // =========================================================
      // IDEMPOTENT
      // =========================================================

      if (
        booking.refundStatus === "COMPLETED"
      ) {
        return NextResponse.json({
          success: true,

          refund: {
            creditNoteNumber:
              booking.creditNoteRef,

            refundAmount:
              booking.refundAmount ?? 0,

            refundPercent:
              booking.refundPercent ?? 0,

            refundStatus: "COMPLETED",

            policy: `${booking.refundPercent ?? 0}% refund policy`,

            manualProcessingRequired: false,
          },

          message:
            "Refund already completed.",
        });
      }

      const refundAmount =
        booking.refundAmount ?? 0;

      const refundPercent =
        booking.refundPercent ?? 0;

      // =========================================================
      // NO REFUND ELIGIBLE
      // =========================================================

      if (refundAmount <= 0) {
        await prisma.booking.update({
          where: {
            id: booking.id,
          },

          data: {
            refundStatus: "NOT_ELIGIBLE",
          },
        });

        return NextResponse.json({
          success: true,

          refund: {
            creditNoteNumber: "N/A",
            refundAmount: 0,
            refundPercent: 0,
            refundStatus: "NOT_ELIGIBLE",
            policy: "No refund applicable",
            manualProcessingRequired: false,
          },
        });
      }

      // =========================================================
      // PAYMENT PROVIDER REFUND
      // =========================================================

      let providerRefundSuccess = false;

      // =========================================================
      // STRIPE REFUND
      // =========================================================

      if (
        booking.paymentMethod === "STRIPE"
      ) {
        try {
          let paymentIntentId: string | undefined;

          // ================== USE STORED PAYMENT INTENT ==================
          if (booking.stripePaymentIntentId) {
            paymentIntentId =
              booking.stripePaymentIntentId;

            console.log(
              "[STRIPE_REFUND] Using stored paymentIntentId:",
              paymentIntentId
            );
          } else if (booking.stripeSessionId) {
            // ================== FALLBACK: FETCH FROM SESSION ==================
            console.log(
              "[STRIPE_REFUND] Fallback: Fetching from session",
              booking.stripeSessionId
            );

            const stripe = getStripe();

            const checkoutSession =
              await stripe.checkout.sessions.retrieve(
                booking.stripeSessionId
              );

            paymentIntentId =
              typeof checkoutSession.payment_intent ===
              "string"
                ? checkoutSession.payment_intent
                : checkoutSession.payment_intent?.id;
          }

          if (!paymentIntentId) {
            throw new Error(
              "Stripe payment intent missing — not stored and could not retrieve from session"
            );
          }

          const stripe = getStripe();

          const refund =
            await stripe.refunds.create({
              payment_intent:
                paymentIntentId,

              amount: Math.round(
                refundAmount * 100
              ),
            });

          console.log(
            "[STRIPE_REFUND] Success. Refund ID:",
            refund.id
          );

          providerRefundSuccess = true;
        } catch (err) {
          console.error(
            "[STRIPE_REFUND] Failed:",
            err
          );
        }
      }

      // =========================================================
      // KHALTI REFUND
      // =========================================================

      if (
        booking.paymentMethod === "KHALTI"
      ) {
        try {
          if (!booking.khaltiTransactionId) {
            throw new Error(
              "Missing Khalti transaction ID"
            );
          }

          const isTest =
            process.env.KHALTI_SECRET_KEY?.startsWith(
              "test_"
            );

          const baseUrl = isTest
            ? "https://a.khalti.com"
            : "https://khalti.com";

          const response = await fetch(
            `${baseUrl}/api/merchant-transaction/${booking.khaltiTransactionId}/refund/`,
            {
              method: "POST",

              headers: {
                Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({}),
            }
          );

          providerRefundSuccess =
            response.ok;

          if (!response.ok) {
            const err =
              await response.text();

            console.error(
              "[KHALTI_REFUND]",
              err
            );
          }
        } catch (err) {
          console.error(
            "[KHALTI_REFUND]",
            err
          );
        }
      }

      // =========================================================
      // CASH REFUND
      // =========================================================

      if (
        booking.paymentMethod === "CASH"
      ) {
        providerRefundSuccess = true;
      }

      // =========================================================
      // CREDIT NOTE
      // =========================================================

      const creditNoteNumber =
        booking.creditNote?.creditNoteNumber ||
        generateCreditNoteNumber(
          booking.invoiceNumber ||
            booking.id
        );

      const now = new Date();

      await prisma.$transaction(async (tx) => {
        if (!booking.creditNote) {
          await tx.creditNote.create({
            data: {
              creditNoteNumber,

              bookingId: booking.id,

              originalInvoice:
                booking.invoiceNumber ||
                "N/A",

              guestName:
                booking.user.name,

              guestEmail:
                booking.user.email,

              hotelName:
                booking.hotel.name,

              roomName:
                booking.room.name,

              originalAmount:
                booking.totalPrice,

              refundAmount,

              refundPercent,

              reason,

              cancellationPolicy:
                `${refundPercent}% refund policy`,

              issuedAt: now,

              issuedBy: user.id,
            },
          });
        }

        await tx.booking.update({
          where: {
            id: booking.id,
          },

          data: {
            refundStatus:
              providerRefundSuccess
                ? "COMPLETED"
                : "PENDING",

            refundedAt:
              providerRefundSuccess
                ? now
                : null,

            paymentStatus:
              refundAmount >=
              booking.totalPrice
                ? "REFUNDED"
                : "PARTIALLY_REFUNDED",

            creditNoteRef:
              creditNoteNumber,
          },
        });
      });

      return NextResponse.json({
        success: true,

        refund: {
          creditNoteNumber,

          refundAmount,

          refundPercent,

          refundStatus:
            providerRefundSuccess
              ? "COMPLETED"
              : "PENDING",

          policy: `${refundPercent}% refund policy`,

          manualProcessingRequired:
            !providerRefundSuccess,
        },

        message:
          providerRefundSuccess
            ? `Refund completed successfully.`
            : "Refund pending provider confirmation.",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid role",
      },
      { status: 403 }
    );
  } catch (error) {
    console.error(
      "[BOOKING_REFUND_POST]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to process refund",
      },
      { status: 500 }
    );
  }
}