import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/itinerary
 * Generates a multi-city Nepal itinerary with hotel suggestions.
 *
 * Kombai UI will call: POST /api/itinerary
 * Body: {
 *   startDate: string (ISO),
 *   totalNights: number,
 *   cities: string[],        // e.g. ["Kathmandu", "Pokhara", "Chitwan"]
 *   budget: "budget" | "mid" | "luxury",
 *   purpose: "trekking" | "tourism" | "pilgrimage" | "honeymoon" | "family"
 * }
 * Returns: { stops: ItineraryStop[], totalEstimatedCost: number }
 */

// Recommended nights per city based on purpose
const RECOMMENDED_NIGHTS: Record<string, Record<string, number>> = {
  trekking: {
    Kathmandu: 2,
    Pokhara: 3,
    Chitwan: 2,
    Nagarkot: 1,
    Lumbini: 1,
    Namche: 2,
    Bandipur: 1,
  },
  tourism: {
    Kathmandu: 3,
    Pokhara: 2,
    Chitwan: 2,
    Nagarkot: 1,
    Lumbini: 2,
    Namche: 1,
    Bandipur: 1,
  },
  pilgrimage: {
    Kathmandu: 3,
    Pokhara: 1,
    Chitwan: 1,
    Nagarkot: 1,
    Lumbini: 3,
    Namche: 1,
    Bandipur: 1,
  },
  honeymoon: {
    Kathmandu: 2,
    Pokhara: 4,
    Chitwan: 2,
    Nagarkot: 2,
    Lumbini: 1,
    Namche: 1,
    Bandipur: 1,
  },
  family: {
    Kathmandu: 3,
    Pokhara: 3,
    Chitwan: 3,
    Nagarkot: 1,
    Lumbini: 2,
    Namche: 1,
    Bandipur: 1,
  },
};

// Budget price ranges in NPR per night
const BUDGET_RANGES = {
  budget: { min: 0, max: 3000 },
  mid: { min: 3000, max: 8000 },
  luxury: { min: 8000, max: 99999 },
};

// City-to-city travel info (hours)
const TRAVEL_TIME: Record<string, Record<string, string>> = {
  Kathmandu: {
    Pokhara: "5-6 hours by road · 30 min by flight",
    Chitwan: "4-5 hours by road",
    Nagarkot: "1.5 hours by road",
    Lumbini: "8-9 hours by road",
    Bandipur: "5-6 hours by road",
  },
  Pokhara: {
    Kathmandu: "5-6 hours by road · 30 min by flight",
    Chitwan: "4-5 hours by road",
    Lumbini: "5-6 hours by road",
    Bandipur: "2-3 hours by road",
  },
  Chitwan: {
    Kathmandu: "4-5 hours by road",
    Pokhara: "4-5 hours by road",
    Lumbini: "3-4 hours by road",
  },
};

// Key highlights per city
const CITY_HIGHLIGHTS: Record<string, string[]> = {
  Kathmandu: [
    "Pashupatinath Temple",
    "Boudhanath Stupa",
    "Swayambhunath (Monkey Temple)",
    "Durbar Square",
    "Thamel nightlife",
  ],
  Pokhara: [
    "Phewa Lake boat ride",
    "Sarangkot sunrise",
    "World Peace Pagoda",
    "Davis Falls",
    "Paragliding",
  ],
  Chitwan: [
    "Jungle safari (jeep/elephant)",
    "Rapti River canoe ride",
    "Tharu cultural show",
    "Elephant breeding center",
  ],
  Nagarkot: [
    "Himalayan panorama sunrise",
    "Mt. Everest on clear days",
    "Hiking trails",
    "Bhaktapur day trip",
  ],
  Lumbini: [
    "Maya Devi Temple (birthplace of Buddha)",
    "Sacred Garden",
    "International monasteries",
    "Ashoka Pillar",
  ],
  Namche: [
    "Sagarmatha National Park",
    "Tengboche Monastery",
    "Khumbu acclimatization",
    "Sherpa Museum",
  ],
  Bandipur: [
    "Medieval Newari town",
    "Thani Mai Temple",
    "Valley views",
    "Cave exploration",
  ],
};

export async function POST(req: NextRequest) {
  try {
    const {
      startDate,
      totalNights,
      cities,
      budget = "mid",
      purpose = "tourism",
    } = await req.json();

    if (!startDate || !totalNights || !cities?.length) {
      return NextResponse.json(
        {
          success: false,
          error: "startDate, totalNights, and cities are required",
        },
        { status: 400 },
      );
    }

    const priceRange =
      BUDGET_RANGES[budget as keyof typeof BUDGET_RANGES] || BUDGET_RANGES.mid;

    // Distribute nights across cities
    const recommendedNights =
      RECOMMENDED_NIGHTS[purpose] || RECOMMENDED_NIGHTS.tourism;
    const rawNights = cities.map(
      (city: string) => recommendedNights[city] ?? 2,
    );
    const rawTotal = rawNights.reduce((s: number, n: number) => s + n, 0);
    const scale = totalNights / rawTotal;

    // Scale nights proportionally to match totalNights exactly
    const distributedNights = rawNights.map((n: number, i: number) => {
      const scaled = Math.max(1, Math.round(n * scale));
      return i === cities.length - 1
        ? totalNights -
            rawNights
              .slice(0, -1)
              .map((n2: number, j: number) =>
                Math.max(1, Math.round(n2 * scale)),
              )
              .reduce((s: number, x: number) => s + x, 0)
        : scaled;
    });

    // Build each stop
    const stops = await Promise.all(
      cities.map(async (city: string, index: number) => {
        const nights = Math.max(1, distributedNights[index]);

        // Calculate check-in date
        const checkInDate = new Date(startDate);
        checkInDate.setDate(
          checkInDate.getDate() +
            distributedNights
              .slice(0, index)
              .reduce((s: number, n: number) => s + n, 0),
        );
        const checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkOutDate.getDate() + nights);

        // Find best matching hotels for this city + budget
        const hotels = await prisma.hotel.findMany({
          where: {
            status: "APPROVED",
            city: { contains: city, mode: "insensitive" },
            rooms: {
              some: {
                isActive: true,
                pricePerNight: {
                  gte: priceRange.min,
                  lte: priceRange.max,
                },
              },
            },
          },
          include: {
            rooms: {
              where: {
                isActive: true,
                pricePerNight: { gte: priceRange.min, lte: priceRange.max },
              },
              orderBy: { pricePerNight: "asc" },
              take: 1,
            },
            reviews: { select: { overallScore: true } },
          },
          orderBy: [{ starRating: "desc" }],
          take: 3,
        });

        const suggestedHotels = hotels.map((h) => ({
          id: h.id,
          slug: h.slug,
          name: h.name,
          city: h.city,
          starRating: h.starRating,
          images: h.images,
          minPrice: h.rooms[0]?.pricePerNight ?? 0,
          avgReview:
            h.reviews.length > 0
              ? Math.round(
                  (h.reviews.reduce((s, r) => s + r.overallScore, 0) /
                    h.reviews.length) *
                    10,
                ) / 10
              : null,
          amenities: h.amenities.slice(0, 3),
        }));

        // Estimated cost for this stop
        const estimatedPricePerNight =
          suggestedHotels[0]?.minPrice ??
          (budget === "budget" ? 1500 : budget === "luxury" ? 10000 : 4500);

        // Travel info from previous city
        const prevCity = index > 0 ? cities[index - 1] : null;
        const travelInfo = prevCity
          ? TRAVEL_TIME[prevCity]?.[city] ||
            TRAVEL_TIME[city]?.[prevCity] ||
            "Check local transport"
          : null;

        return {
          city,
          nights,
          checkIn: checkInDate.toISOString().split("T")[0],
          checkOut: checkOutDate.toISOString().split("T")[0],
          suggestedHotels,
          highlights: CITY_HIGHLIGHTS[city] || [],
          travelFromPrevious: travelInfo,
          estimatedCostPerNight: estimatedPricePerNight,
          estimatedStopTotal: estimatedPricePerNight * nights,
        };
      }),
    );

    const totalEstimatedCost = stops.reduce(
      (s, stop) => s + stop.estimatedStopTotal,
      0,
    );

    return NextResponse.json({
      success: true,
      data: {
        stops,
        totalNights,
        totalCities: cities.length,
        budget,
        purpose,
        startDate,
        endDate: new Date(
          new Date(startDate).getTime() + totalNights * 86400000,
        )
          .toISOString()
          .split("T")[0],
        totalEstimatedCost,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[ITINERARY]", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate itinerary" },
      { status: 500 },
    );
  }
}
