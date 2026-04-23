import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Login required" }, { status: 401 });

    const { hotelId } = await req.json();
    if (!hotelId) return NextResponse.json({ success: false, error: "hotelId required" }, { status: 400 });

    const userId   = (session.user as any).id;
    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_hotelId: { userId, hotelId } },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, data: { wishlisted: false } });
    }

    await prisma.wishlistItem.create({ data: { userId, hotelId } });
    return NextResponse.json({ success: true, data: { wishlisted: true } });
  } catch (error) {
    console.error("[WISHLIST_POST]", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Login required" }, { status: 401 });

    const userId = (session.user as any).id;
    const items  = await prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        hotel: {
          include: {
            rooms:   { where: { isActive: true }, select: { pricePerNight: true }, orderBy: { pricePerNight: "asc" }, take: 1 },
            reviews: { select: { overallScore: true } },
            _count:  { select: { reviews: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = items.map((item) => ({
      ...item,
      hotel: {
        ...item.hotel,
        minPrice:    item.hotel.rooms[0]?.pricePerNight ?? 0,
        avgReview:   item.hotel.reviews.length > 0
          ? item.hotel.reviews.reduce((s, r) => s + r.overallScore, 0) / item.hotel.reviews.length
          : null,
        reviewCount: item.hotel._count.reviews,
      },
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("[WISHLIST_GET]", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
