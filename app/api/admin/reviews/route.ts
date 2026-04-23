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
    const { searchParams } = new URL(req.url);
    const visible = searchParams.get("visible");

    const reviews = await prisma.review.findMany({
      where: visible !== null ? { isVisible: visible === "true" } : {},
      orderBy: { createdAt: "desc" },
      include: {
        user:  { select: { name: true, email: true } },
        hotel: { select: { name: true, city: true, slug: true } },
      },
    });
    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    console.error("[ADMIN_REVIEWS_GET]", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}

// PATCH /api/admin/reviews — toggle visibility of a review
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }
    const { id, isVisible } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });

    const review = await prisma.review.update({
      where: { id },
      data:  { isVisible },
    });
    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error("[ADMIN_REVIEWS_PATCH]", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
