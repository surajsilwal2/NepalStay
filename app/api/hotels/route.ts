import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/hotels
 * Public endpoint — returns APPROVED hotels with optional filters.
 * ?city=Pokhara&minPrice=1000&maxPrice=8000&stars=4&type=Resort&amenities=WiFi,Pool&q=himalayan
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city      = searchParams.get("city") ?? "";
    const q         = searchParams.get("q")    ?? "";
    const stars     = searchParams.get("stars");
    const type      = searchParams.get("type") ?? "";
    const minPrice  = searchParams.get("minPrice");
    const maxPrice  = searchParams.get("maxPrice");
    const amenities = searchParams.get("amenities")?.split(",").filter(Boolean) ?? [];
    const page      = parseInt(searchParams.get("page") ?? "1");
    const limit     = parseInt(searchParams.get("limit") ?? "12");

    const where: any = {
      status: "APPROVED",
      ...(city  && { city: { contains: city, mode: "insensitive" } }),
      ...(stars  && { starRating: parseInt(stars) }),
      ...(type   && { propertyType: { contains: type, mode: "insensitive" } }),
      ...(q      && {
        OR: [
          { name:        { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { city:        { contains: q, mode: "insensitive" } },
          { address:     { contains: q, mode: "insensitive" } },
        ],
      }),
      ...(amenities.length > 0 && { amenities: { hasSome: amenities } }),
    };

    // Price filter requires looking at rooms
    if (minPrice || maxPrice) {
      where.rooms = {
        some: {
          isActive: true,
          ...(minPrice && { pricePerNight: { gte: parseFloat(minPrice) } }),
          ...(maxPrice && { pricePerNight: { lte: parseFloat(maxPrice) } }),
        },
      };
    }

    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ starRating: "desc" }, { createdAt: "desc" }],
        include: {
          rooms: {
            where: { isActive: true },
            select: { pricePerNight: true, type: true, capacity: true },
            orderBy: { pricePerNight: "asc" },
          },
          reviews: { select: { overallScore: true } },
          _count:  { select: { reviews: true, wishlist: true } },
        },
      }),
      prisma.hotel.count({ where }),
    ]);

    // Enrich each hotel with computed fields
    const enriched = hotels.map((h) => ({
      ...h,
      minPrice:    h.rooms[0]?.pricePerNight ?? 0,
      avgReview:   h.reviews.length > 0
        ? h.reviews.reduce((s, r) => s + r.overallScore, 0) / h.reviews.length
        : null,
      reviewCount: h._count.reviews,
    }));

    return NextResponse.json({
      success: true,
      data: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[HOTELS_GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch hotels" }, { status: 500 });
  }
}
