import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  bookingId:        z.string(),
  cleanlinessScore: z.number().int().min(1).max(5),
  staffScore:       z.number().int().min(1).max(5),
  locationScore:    z.number().int().min(1).max(5),
  valueScore:       z.number().int().min(1).max(5),
  facilitiesScore:  z.number().int().min(1).max(5),
  title:            z.string().max(120).optional(),
  body:             z.string().min(10, "Review must be at least 10 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Login required" }, { status: 401 });

    const body   = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { bookingId, cleanlinessScore, staffScore, locationScore, valueScore, facilitiesScore, title, body: reviewBody } = parsed.data;
    const userId = (session.user as any).id;

    // Only verified guests who have checked out can review
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    if (booking.userId !== userId) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    if (booking.status !== "CHECKED_OUT") {
      return NextResponse.json({ success: false, error: "You can only review after completing your stay" }, { status: 400 });
    }

    // One review per booking
    const existing = await prisma.review.findUnique({ where: { bookingId } });
    if (existing) {
      return NextResponse.json({ success: false, error: "You have already reviewed this stay" }, { status: 409 });
    }

    const overallScore = (cleanlinessScore + staffScore + locationScore + valueScore + facilitiesScore) / 5;

    const review = await prisma.review.create({
      data: {
        userId, hotelId: booking.hotelId, bookingId,
        overallScore: Math.round(overallScore * 10) / 10,
        cleanlinessScore, staffScore, locationScore, valueScore, facilitiesScore,
        title, body: reviewBody,
      },
    });

    return NextResponse.json({ success: true, data: review, message: "Review submitted! Thank you." }, { status: 201 });
  } catch (error) {
    console.error("[REVIEW_POST]", error);
    return NextResponse.json({ success: false, error: "Failed to submit review" }, { status: 500 });
  }
}
