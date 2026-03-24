import { NextRequest, NextResponse } from "next/server";

// frankfurter.app — completely free, no API key, backed by ECB data
// NPR is not in ECB, so we use USD as bridge: NPR→USD→others
// 1 USD ≈ 133 NPR (update periodically or use another free service for NPR)

const NPR_PER_USD = 133; // approximate, update manually if needed

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const amount = parseFloat(searchParams.get("amount") || "1000");

    // Get USD, EUR, INR, GBP, CNY, AUD rates relative to each other
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=EUR,INR,GBP,CNY,AUD,JPY,SGD",
      { next: { revalidate: 3600 } }, // cache 1 hour
    );

    if (!res.ok) {
      // Fallback hardcoded rates if API fails
      return NextResponse.json({
        success: true,
        data: {
          npr: amount,
          usd: parseFloat((amount / 133).toFixed(2)),
          eur: parseFloat((amount / 145).toFixed(2)),
          inr: parseFloat((amount / 1.6).toFixed(2)),
          gbp: parseFloat((amount / 168).toFixed(2)),
          cny: parseFloat((amount / 18.5).toFixed(2)),
          aud: parseFloat((amount / 87).toFixed(2)),
          jpy: parseFloat((amount / 0.88).toFixed(2)),
          source: "fallback",
        },
      });
    }

    const fx = await res.json();
    const rates = fx.rates;

    // Convert NPR → USD first, then USD → target currency
    const amountInUSD = amount / NPR_PER_USD;

    return NextResponse.json({
      success: true,
      data: {
        npr: amount,
        usd: parseFloat(amountInUSD.toFixed(2)),
        eur: parseFloat((amountInUSD * rates.EUR).toFixed(2)),
        inr: parseFloat((amountInUSD * rates.INR).toFixed(2)),
        gbp: parseFloat((amountInUSD * rates.GBP).toFixed(2)),
        cny: parseFloat((amountInUSD * rates.CNY).toFixed(2)),
        aud: parseFloat((amountInUSD * rates.AUD).toFixed(2)),
        jpy: parseFloat((amountInUSD * rates.JPY).toFixed(2)),
        source: "live",
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[CURRENCY]", error);
    return NextResponse.json(
      { success: false, error: "Currency service unavailable" },
      { status: 500 },
    );
  }
}
