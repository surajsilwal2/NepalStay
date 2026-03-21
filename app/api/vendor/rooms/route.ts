import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const roomSchema = z.object({
  name:          z.string().min(2),
  type:          z.enum(["SINGLE","DOUBLE","TWIN","DELUXE","SUITE","PENTHOUSE","DORMITORY"]),
  pricePerNight: z.number().positive(),
  capacity:      z.number().int().min(1).max(20),
  floor:         z.number().int().min(0),
  totalRooms:    z.number().int().min(1).default(1),
  description:   z.string().optional(),
  amenities:     z.array(z.string()).default([]),
  images:        z.array(z.string()).default([]),
});

async function getVendorHotel(vendorId: string) {
  return prisma.hotel.findUnique({ where: { vendorId } });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["VENDOR","ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }
    const hotel = await getVendorHotel((session.user as any).id);
    if (!hotel) return NextResponse.json({ success: true, data: [] });

    const rooms = await prisma.room.findMany({
      where: { hotelId: hotel.id },
      orderBy: [{ floor: "asc" }, { name: "asc" }],
      include: { _count: { select: { bookings: true } } },
    });
    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    console.error("[VENDOR_ROOMS_GET]", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "VENDOR") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }
    const hotel = await getVendorHotel((session.user as any).id);
    if (!hotel) return NextResponse.json({ success: false, error: "Create a hotel first" }, { status: 400 });
    if (hotel.status !== "APPROVED") {
      return NextResponse.json({ success: false, error: "Your hotel must be approved before adding rooms" }, { status: 400 });
    }

    const body   = await req.json();
    const parsed = roomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }
    const room = await prisma.room.create({ data: { ...parsed.data, hotelId: hotel.id } });
    return NextResponse.json({ success: true, data: room }, { status: 201 });
  } catch (error) {
    console.error("[VENDOR_ROOMS_POST]", error);
    return NextResponse.json({ success: false, error: "Failed to create room" }, { status: 500 });
  }
}
