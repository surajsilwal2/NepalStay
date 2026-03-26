import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * PUBLIC REST API — /api/public/hotels
 *
 * Third-party apps (trekking agencies, airlines, travel portals) can use this
 * to query NepalStay hotel data.
 *
 * Authentication: API key in header: X-API-Key: your_key_here
 * (In production, store API keys in DB and validate against them)
 *
 * Endpoints:
 * GET /api/public/hotels              → list all approved hotels
 * GET /api/public/hotels?city=Pokhara → filter by city
 * GET /api/public/hotels?available=true&checkIn=2025-10-01&checkOut=2025-10-05 → availability check
 *
 * Add to .env:
 * PUBLIC_API_KEY="nepalstay_pub_your_random_key"
 */

// Simple API key validation
// In production: store keys in DB, track usage, rate limit per key
function validateApiKey(req: NextRequest): boolean {
  const key =
    req.headers.get("x-api-key") || req.nextUrl.searchParams.get("api_key");

  if (!process.env.PUBLIC_API_KEY) {
    // No key configured — allow all (dev mode)
    return true;
  }
  return key === process.env.PUBLIC_API_KEY;
}

export async function GET(req: NextRequest) {
  try {
    if (!validateApiKey(req)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid or missing API key. Contact NepalStay at api@nepalstay.com",
          code: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const type = searchParams.get("type");
    const minStars = searchParams.get("minStars");
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const available = searchParams.get("available") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const page = parseInt(searchParams.get("page") || "1");
    const format = searchParams.get("format") || "standard"; // standard | minimal

    const where: any = { status: "APPROVED" };
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (type) where.propertyType = { contains: type, mode: "insensitive" };
    if (minStars) where.starRating = { gte: parseInt(minStars) };

    // Availability filter
    if (available && checkIn && checkOut) {
      where.rooms = {
        some: {
          isActive: true,
          status: "AVAILABLE",
          bookings: {
            none: {
              status: { in: ["CONFIRMED", "PENDING", "CHECKED_IN"] },
              checkIn: { lt: new Date(checkOut) },
              checkOut: { gt: new Date(checkIn) },
            },
          },
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
            select: {
              id: true,
              name: true,
              type: true,
              pricePerNight: true,
              capacity: true,
            },
            orderBy: { pricePerNight: "asc" },
          },
          reviews: { select: { overallScore: true } },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.hotel.count({ where }),
    ]);

    // Shape response based on format
    const data = hotels.map((h) => {
      const minPrice = h.rooms[0]?.pricePerNight ?? 0;
      const avgReview =
        h.reviews.length > 0
          ? Math.round(
              (h.reviews.reduce((s, r) => s + r.overallScore, 0) /
                h.reviews.length) *
                10,
            ) / 10
          : null;

      if (format === "minimal") {
        return {
          id: h.id,
          slug: h.slug,
          name: h.name,
          city: h.city,
          starRating: h.starRating,
          minPrice,
          avgReview,
          bookingUrl: `${process.env.NEXTAUTH_URL || "https://nepalstay.com"}/hotels/${h.slug}`,
        };
      }

      return {
        id: h.id,
        slug: h.slug,
        name: h.name,
        description: h.description,
        city: h.city,
        address: h.address,
        latitude: h.latitude,
        longitude: h.longitude,
        starRating: h.starRating,
        propertyType: h.propertyType,
        amenities: h.amenities,
        images: h.images,
        contactPhone: h.contactPhone,
        contactEmail: h.contactEmail,
        minPrice,
        avgReview,
        reviewCount: h._count.reviews,
        rooms: h.rooms,
        bookingUrl: `${process.env.NEXTAUTH_URL || "https://nepalstay.com"}/hotels/${h.slug}`,
        policies: h.policies,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page < Math.ceil(total / limit),
        },
        meta: {
          version: "v1",
          provider: "NepalStay API",
          docs: "https://nepalstay.com/api-docs",
          contact: "api@nepalstay.com",
          generatedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*", // Allow any app to use this
          "Access-Control-Allow-Methods": "GET",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    console.error("[PUBLIC_API]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    },
  });
}
