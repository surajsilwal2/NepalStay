import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/staff/rooms — rooms for staff's assigned hotel ONLY
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "STAFF") {
      return NextResponse.json({ success: false, error: "Unauthorized - Staff access only" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const hotelId = user.staffHotelId;
    if (!hotelId) {
      return NextResponse.json({ success: false, error: "No hotel assigned to your account" }, { status: 400 });
    }

    const rooms = await prisma.room.findMany({
      where: {
        isActive: true,
        hotelId: hotelId, // Strict filter - only this hotel
      },
      orderBy: [{ floor: "asc" }, { name: "asc" }],
      include: { hotel: { select: { name: true } } },
    });

    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    console.error("[STAFF_ROOMS_GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch rooms" }, { status: 500 });
  }
}
