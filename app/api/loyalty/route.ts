import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Uses session data at runtime — force dynamic
export const dynamic = 'force-dynamic';
import { 
  TIERS, 
  getTierByPoints, 
  getMultiplier, 
  calcDiscount 
} from "@/lib/loyalty";

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

    const tier = getTierByPoints(user.loyaltyPoints);
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
