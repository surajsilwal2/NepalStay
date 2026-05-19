import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { success: false, error: "User management has been disabled" },
    { status: 403 }
  );
}
