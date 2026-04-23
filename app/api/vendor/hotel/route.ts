import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const hotelSchema = z.object({
  name:         z.string().min(3),
  description:  z.string().min(20),
  city:         z.string().min(2),
  address:      z.string().min(5),
  latitude:     z.number().optional(),
  longitude:    z.number().optional(),
  starRating:   z.number().int().min(1).max(5).default(3),
  propertyType: z.string().default("Hotel"),
  amenities:    z.array(z.string()).default([]),
  images:       z.array(z.string()).default([]),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  website:      z.string().optional(),
  policies:     z.object({
    checkIn:      z.string().optional(),
    checkOut:     z.string().optional(),
    cancellation: z.string().optional(),
  }).optional(),
});

// GET — get vendor's own hotel
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["VENDOR", "ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }
    const hotel = await prisma.hotel.findUnique({
      where: { vendorId: (session.user as any).id },
      include: {
        rooms:   { orderBy: [{ floor: "asc" }, { name: "asc" }] },
        reviews: {
            select: {
              id: true, overallScore: true, cleanlinessScore: true,
              staffScore: true, locationScore: true, valueScore: true,
              facilitiesScore: true, title: true, body: true,
              isVisible: true, createdAt: true,
              user: { select: { name: true, avatar: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        staff:   { select: { id: true, name: true, email: true, phone: true } },
        _count:  { select: { bookings: true, reviews: true } },
      },
    });
    return NextResponse.json({ success: true, data: hotel });
  } catch (error) {
    console.error("[VENDOR_HOTEL_GET]", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}

// POST — create hotel listing (pending admin approval)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "VENDOR") {
      return NextResponse.json({ success: false, error: "Vendor account required" }, { status: 403 });
    }
    const existing = await prisma.hotel.findUnique({ where: { vendorId: (session.user as any).id } });
    if (existing) {
      return NextResponse.json({ success: false, error: "You already have a hotel listing" }, { status: 409 });
    }
    const body   = await req.json();
    const parsed = hotelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }
    const baseSlug = parsed.data.name
      .toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-")
      + "-" + parsed.data.city.toLowerCase().replace(/\s+/g, "-");

    // Ensure slug uniqueness with a short random suffix
    const slugSuffix = Math.random().toString(36).slice(2, 6);
    const slug = `${baseSlug}-${slugSuffix}`;

    const hotel = await prisma.hotel.create({
      data: { ...parsed.data, vendorId: (session.user as any).id, slug, status: "PENDING" },
    });
    return NextResponse.json({ success: true, data: hotel, message: "Hotel submitted for admin approval." }, { status: 201 });
  } catch (error) {
    console.error("[VENDOR_HOTEL_POST]", error);
    return NextResponse.json({ success: false, error: "Failed to create hotel" }, { status: 500 });
  }
}

// PUT — update hotel listing
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["VENDOR", "ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }
    const body   = await req.json();
    const parsed = hotelSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }
    const hotel = await prisma.hotel.findUnique({ where: { vendorId: (session.user as any).id } });
    if (!hotel) return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 });

    const updated = await prisma.hotel.update({
      where: { id: hotel.id },
      data: parsed.data,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[VENDOR_HOTEL_PUT]", error);
    return NextResponse.json({ success: false, error: "Failed to update hotel" }, { status: 500 });
  }
}
