import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { success: false, error: "Review management has been disabled" },
    { status: 403 }
  );
}

export async function PATCH(req: NextRequest) {
  return NextResponse.json(
    { success: false, error: "Review management has been disabled" },
    { status: 403 }
  );
}
