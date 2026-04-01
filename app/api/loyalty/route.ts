import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Tier thresholds
export const TIERS = {
  BRONZE: {
    min: 0,
    label: "Bronze",
    color: "#CD7F32",
    perks: "1 point per NPR 100",
  },
  SILVER: {
    min: 500,
    label: "Silver",
    color: "#C0C0C0",
    perks: "1.5x points + priority support",
  },
  GOLD: {
    min: 2000,
    label: "Gold",
    color: "#FFD700",
    perks: "2x points + free room upgrade request",
  },
  PLATINUM: {
    min: 5000,
    label: "Platinum",
    color: "#E5E4E2",
    perks: "3x points + complimentary breakfast",
  },
};

export function getTier(points: number): keyof typeof TIERS {
  if (points >= TIERS.PLATINUM.min) return "PLATINUM";
  if (points >= TIERS.GOLD.min) return "GOLD";
  if (points >= TIERS.SILVER.min) return "SILVER";
  return "BRONZE";
}

export function getMultiplier(tier: keyof typeof TIERS): number {
  const map = { BRONZE: 1, SILVER: 1.5, GOLD: 2, PLATINUM: 3 };
  return map[tier];
}

export function calcPointsEarned(
  amountNPR: number,
  tier: keyof typeof TIERS,
): number {
  // 1 point per NPR 100, multiplied by tier bonus
  return Math.floor((amountNPR / 100) * getMultiplier(tier));
}

// 1 point = NPR 0.5 discount
export function calcDiscount(pointsToRedeem: number): number {
  return pointsToRedeem * 0.5;
}

// GET — get current user's loyalty info
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { loyaltyPoints: true, loyaltyTier: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const tier = getTier(user.loyaltyPoints);
    const tierInfo = TIERS[tier];
    const nextTier =
      tier === "PLATINUM"
        ? null
        : tier === "GOLD"
          ? TIERS.PLATINUM
          : tier === "SILVER"
            ? TIERS.GOLD
            : TIERS.SILVER;

    const nextTierPoints = nextTier ? nextTier.min - user.loyaltyPoints : 0;

    const progressPct = nextTier
      ? Math.min(
          100,
          ((user.loyaltyPoints - tierInfo.min) /
            (nextTier.min - tierInfo.min)) *
            100,
        )
      : 100;

    return NextResponse.json({
      success: true,
      data: {
        points: user.loyaltyPoints,
        tier,
        tierInfo,
        nextTier: nextTier
          ? { ...nextTier, pointsNeeded: nextTierPoints }
          : null,
        progressPct: Math.round(progressPct),
        discountValue: calcDiscount(user.loyaltyPoints),
        multiplier: getMultiplier(tier),
      },
    });
  } catch (error) {
    console.error("[LOYALTY_GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed" },
      { status: 500 },
    );
  }
}
