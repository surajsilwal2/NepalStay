import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const hotels = await prisma.hotel.findMany({
      where: status ? { status: status as any } : {},
      orderBy: { createdAt: "desc" },
      include: {
        vendor: { select: { name: true, email: true, phone: true } },
        _count: { select: { rooms: true, bookings: true, reviews: true } },
      },
    });
    return NextResponse.json({ success: true, data: hotels });
  } catch (error) {
    console.error("[ADMIN_HOTELS_GET]", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
