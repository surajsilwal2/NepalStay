import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/complaints
// - Customer: their own complaints
// - Vendor:   complaints about their hotel
// - Admin:    all complaints (filter by ?status=OPEN|INVESTIGATING|RESOLVED|DISMISSED)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const actor = session.user as any;
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    let where: any = {};

    if (actor.role === "CUSTOMER") {
      where.customerId = actor.id;
    } else if (actor.role === "VENDOR") {
      const hotel = await prisma.hotel.findUnique({ where: { vendorId: actor.id } });
      if (!hotel) return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 });
      where.hotelId = hotel.id;
    } else if (actor.role === "ADMIN") {
      if (statusFilter) where.status = statusFilter;
    } else {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, email: true } },
        hotel:    { select: { name: true, city: true } },
      },
    });

    return NextResponse.json({ success: true, data: complaints });
  } catch (error) {
    console.error("[COMPLAINTS_GET]", error);
    return NextResponse.json({ success: false, error: "Failed to load complaints" }, { status: 500 });
  }
}

// POST /api/complaints — customer submits a complaint
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "CUSTOMER") {
      return NextResponse.json({ success: false, error: "Only customers can submit complaints" }, { status: 403 });
    }

    const { hotelId, bookingId, title, body } = await req.json();
    if (!hotelId || !title?.trim() || !body?.trim()) {
      return NextResponse.json({ success: false, error: "hotelId, title and body are required" }, { status: 400 });
    }

    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 });

    const customerId = (session.user as any).id;

    // If bookingId provided, verify it belongs to this customer and hotel
    if (bookingId) {
      const booking = await prisma.booking.findFirst({
        where: { id: bookingId, userId: customerId, hotelId },
      });
      if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    const complaint = await prisma.complaint.create({
      data: {
        customerId,
        hotelId,
        bookingId: bookingId ?? null,
        title: title.trim(),
        body: body.trim(),
      },
      include: {
        hotel: { select: { name: true, city: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: complaint,
      message: "Complaint submitted. Our team will review it shortly.",
    });
  } catch (error) {
    console.error("[COMPLAINTS_POST]", error);
    return NextResponse.json({ success: false, error: "Failed to submit complaint" }, { status: 500 });
  }
}
