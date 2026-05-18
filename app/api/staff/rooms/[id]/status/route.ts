import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

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
    const userRole = (session.user as any).role;

    // ✅ SECURITY: Verify room exists and get hotel info
    const room = await prisma.room.findUnique({
      where: { id: params.id },
      include: { hotel: true },
    });

    if (!room) {
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
    }

    // ✅ SECURITY: For STAFF users, verify they are assigned to this hotel
    if (userRole === "STAFF") {
      const staffUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { staffHotelId: true },
      });

      if (!staffUser || staffUser.staffHotelId !== room.hotelId) {
        return NextResponse.json(
          { success: false, error: "You can only update rooms in your assigned hotel" },
          { status: 403 }
        );
      }
    }

    // ✅ SECURITY: For VENDOR users, verify they own this hotel
    if (userRole === "VENDOR") {
      if (room.hotel.vendorId !== userId) {
        return NextResponse.json(
          { success: false, error: "You can only update rooms in your own hotel" },
          { status: 403 }
        );
      }
    }

    // ✅ Proceed with update
    const [updatedRoom] = await prisma.$transaction([
      prisma.room.update({ where: { id: params.id }, data: { status: parsed.data.status } }),
      prisma.roomStatusLog.create({
        data: { roomId: params.id, updatedBy: userId, status: parsed.data.status, notes: parsed.data.notes },
      }),
    ]);

    return NextResponse.json({ success: true, data: updatedRoom });
  } catch (error) {
    console.error("[ROOM_STATUS_PATCH]", error);
    return NextResponse.json({ success: false, error: "Failed to update room status" }, { status: 500 });
  }
}
