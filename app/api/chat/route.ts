import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/chat
 * AI chatbot that understands natural language queries about hotels.
 * Uses Claude API (Anthropic) — already available in the project.
 * No extra API key needed beyond ANTHROPIC_API_KEY.
 *
 * Kombai UI will call: POST /api/chat
 * Body: { message: string, history: Array<{role, content}> }
 * Returns: { reply: string, hotels?: Hotel[], action?: string }
 */

// Keywords that suggest the user wants hotel recommendations
const SEARCH_KEYWORDS = [
  "hotel",
  "stay",
  "book",
  "room",
  "night",
  "accommodation",
  "guesthouse",
  "resort",
  "lodge",
  "hostel",
  "sleep",
  "kathmandu",
  "pokhara",
  "chitwan",
  "nagarkot",
  "lumbini",
  "cheap",
  "budget",
  "luxury",
  "affordable",
  "expensive",
  "trek",
  "trekking",
  "everest",
  "annapurna",
  "family",
  "honeymoon",
  "couple",
  "solo",
  "backpacker",
];

// Extract search intent from message
function extractSearchParams(message: string): {
  city?: string;
  maxPrice?: number;
  minStars?: number;
  propertyType?: string;
  keywords: string;
} {
  const lower = message.toLowerCase();

  const cities = [
    "kathmandu",
    "pokhara",
    "chitwan",
    "nagarkot",
    "lumbini",
    "namche",
    "bandipur",
  ];
  const city = cities.find((c) => lower.includes(c));

  // Price extraction: "under 3000", "below 5000", "less than 2000"
  const priceMatch = lower.match(
    /(?:under|below|less than|max|upto|up to)\s*(?:npr\s*)?(\d+)/,
  );
  const maxPrice = priceMatch ? parseInt(priceMatch[1]) : undefined;

  // Star extraction: "4 star", "5 star", "luxury"
  const starMatch = lower.match(/(\d)\s*star/);
  const minStars = starMatch
    ? parseInt(starMatch[1])
    : lower.includes("luxury")
      ? 4
      : lower.includes("budget")
        ? 1
        : undefined;

  // Property type
  const propertyType = lower.includes("resort")
    ? "Resort"
    : lower.includes("guesthouse")
      ? "Guesthouse"
      : lower.includes("hostel")
        ? "Hostel"
        : lower.includes("lodge")
          ? "Lodge"
          : lower.includes("boutique")
            ? "Boutique Hotel"
            : undefined;

  return {
    city: city ? city.charAt(0).toUpperCase() + city.slice(1) : undefined,
    maxPrice,
    minStars,
    propertyType,
    keywords: message,
  };
}

async function searchHotels(params: ReturnType<typeof extractSearchParams>) {
  const where: any = { status: "APPROVED" };

  if (params.city) where.city = { contains: params.city, mode: "insensitive" };
  if (params.minStars) where.starRating = { gte: params.minStars };
  if (params.propertyType)
    where.propertyType = { contains: params.propertyType, mode: "insensitive" };

  if (params.maxPrice) {
    where.rooms = {
      some: { isActive: true, pricePerNight: { lte: params.maxPrice } },
    };
  }

  const hotels = await prisma.hotel.findMany({
    where,
    take: 4,
    orderBy: [{ starRating: "desc" }],
    include: {
      rooms: {
        where: { isActive: true },
        orderBy: { pricePerNight: "asc" },
        take: 1,
      },
      reviews: { select: { overallScore: true } },
    },
  });

  return hotels.map((h) => ({
    id: h.id,
    slug: h.slug,
    name: h.name,
    city: h.city,
    starRating: h.starRating,
    propertyType: h.propertyType,
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
    amenities: h.amenities.slice(0, 4),
  }));
}

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: "Message required" },
        { status: 400 },
      );
    }

    // Check if Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("[CHAT_API] ANTHROPIC_API_KEY is not set in server environment");
      return NextResponse.json(
        {
          success: false,
          error:
            "Anthropic API key is not configured on the server. Please set ANTHROPIC_API_KEY and restart the server.",
        },
        { status: 500 },
      );
    }

    // Check if user is asking about hotels — fetch relevant hotels first
    const isHotelQuery = SEARCH_KEYWORDS.some((kw) =>
      message.toLowerCase().includes(kw),
    );
    let hotels: any[] = [];
    let hotelContext = "";

    if (isHotelQuery) {
      const params = extractSearchParams(message);
      hotels = await searchHotels(params);

      if (hotels.length > 0) {
        hotelContext = `\n\nRelevant hotels found in our database:\n${hotels
          .map(
            (h) =>
              `- ${h.name} (${h.city}, ${h.starRating}★ ${h.propertyType}) — from NPR ${h.minPrice.toLocaleString()}/night${h.avgReview ? `, rated ${h.avgReview}/5` : ""}`,
          )
          .join("\n")}`;
      }
    }

    // Build system prompt
    const systemPrompt = `You are NepalStay's friendly AI travel assistant. You help travellers find and book hotels across Nepal.

Your personality:
- Warm, knowledgeable, and enthusiastic about Nepal's tourism
- You know Nepal well — its cities, trekking routes, festivals, best times to visit
- You always respond in English (or match the user's language if they write in Nepali)
- Keep responses concise and helpful — 2-4 sentences max unless explaining something complex

What you can help with:
- Hotel recommendations based on budget, city, type, purpose of trip
- Nepal travel tips (best time to visit, trekking seasons, festivals like Dashain/Tihar)
- Booking guidance (how Khalti payment works, BS calendar, FNMIS for foreign tourists)
- Price information and comparisons

What you cannot do:
- Make actual bookings (users must book through the website)
- Access real-time prices (show the database prices as approximate)

Nepal context you know:
- Peak trekking seasons: March-May (spring) and October-November (autumn)
- Dashain and Tihar festivals are in October — hotels fill up fast
- Khalti is Nepal's main digital payment — international tourists can use Stripe/card
- Nepal uses Bikram Sambat (BS) calendar which is ~57 years ahead of AD
- FNMIS: Hotels must report foreign guests within 24 hours to Tourist Police
${hotelContext}

If you found hotels above, mention them naturally in your response. Be specific about prices.
If no hotels were found, suggest the user refine their search or try different filters.`;

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // Fast and cheap for chat
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          // Include conversation history (last 6 messages for context)
          ...history.slice(-6).map((h: any) => ({
            role: h.role,
            content: h.content,
          })),
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[CHAT_API]", response.status, err);
      return NextResponse.json(
        {
          success: false,
          error:
            "AI backend returned an error while generating the response. Try again later.",
        },
        { status: 502 },
      );
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? null;

    if (!reply) {
      console.error("[CHAT_API] no reply in Anthropic response", data);
      return NextResponse.json(
        { success: false, error: "AI did not return a valid reply." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      reply,
      hotels, // Frontend shows hotel cards when present
      hasHotels: hotels.length > 0,
    });
  } catch (error) {
    console.error("[CHAT]", error);
    return NextResponse.json({
      success: true,
      reply: "Something went wrong. Please try again.",
      hotels: [],
    });
  }
}
