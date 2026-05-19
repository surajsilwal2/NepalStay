import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // Fetch all vendors with their hotel info
    const vendors = await prisma.user.findMany({
      where: { role: "VENDOR" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        hotel: {
          select: {
            id: true,
            name: true,
            status: true,
            city: true,
            starRating: true,
            propertyType: true,
            _count: { select: { rooms: true, bookings: true } },
          },
        },
      },
    });

    // Aggregate confirmed revenue per hotel in one query
    const hotelIds = vendors.flatMap(v => (v.hotel ? [v.hotel.id] : []));
    const revenues =
      hotelIds.length > 0
        ? await prisma.booking.groupBy({
            by: ["hotelId"],
            where: {
              hotelId: { in: hotelIds },
              status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
            },
            _sum: { totalPrice: true },
          })
        : [];

    const revenueMap = Object.fromEntries(
      revenues.map(r => [r.hotelId, r._sum.totalPrice ?? 0])
    );

    const data = vendors.map(v => ({
      id: v.id,
      name: v.name,
      email: v.email,
      phone: v.phone,
      isActive: v.isActive,
      createdAt: v.createdAt,
      hotel: v.hotel
        ? {
            id: v.hotel.id,
            name: v.hotel.name,
            status: v.hotel.status,
            city: v.hotel.city,
            starRating: v.hotel.starRating,
            propertyType: v.hotel.propertyType,
            rooms: v.hotel._count.rooms,
            bookings: v.hotel._count.bookings,
            revenue: revenueMap[v.hotel.id] ?? 0,
          }
        : null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[ADMIN_VENDORS_GET]", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
