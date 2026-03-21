import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE"]),
  notes:  z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["STAFF", "ADMIN", "VENDOR"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    const [room] = await prisma.$transaction([
      prisma.room.update({ where: { id: params.id }, data: { status: parsed.data.status } }),
      prisma.roomStatusLog.create({
        data: { roomId: params.id, updatedBy: userId, status: parsed.data.status, notes: parsed.data.notes },
      }),
    ]);

    return NextResponse.json({ success: true, data: room });
  } catch (error) {
    console.error("[ROOM_STATUS_PATCH]", error);
    return NextResponse.json({ success: false, error: "Failed to update room status" }, { status: 500 });
  }
}
