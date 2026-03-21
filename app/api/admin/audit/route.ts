import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { adToBS, formatBSShort, getNepalisFiscalYear } from "@/lib/nepali-date";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to   = searchParams.get("to");

    const fromDate = from ? new Date(from) : new Date(new Date().setDate(1)); // start of month
    const toDate   = to   ? new Date(to)   : new Date();
    toDate.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        invoiceIssuedAt: { gte: fromDate, lte: toDate },
        invoiceNumber:   { not: null },
      },
      orderBy: { invoiceIssuedAt: "asc" },
      include: {
        user:  { select: { name: true, email: true } },
        hotel: { select: { name: true, city: true } },
        room:  { select: { name: true, type: true } },
      },
    });

    const creditNotes = await prisma.creditNote.findMany({
      where: { issuedAt: { gte: fromDate, lte: toDate } },
      orderBy: { issuedAt: "asc" },
    });

    const grossRevenue = bookings.reduce((s, b) => s + b.totalPrice, 0);
    const totalRefunds = creditNotes.reduce((s, c) => s + c.refundAmount, 0);
    const netRevenue   = grossRevenue - totalRefunds;

    const invoicesWithBS = bookings.map(b => ({
      ...b,
      invoiceDateBS: b.invoiceIssuedAt ? formatBSShort(adToBS(b.invoiceIssuedAt)) : null,
      checkInBS:     formatBSShort(adToBS(b.checkIn)),
      checkOutBS:    formatBSShort(adToBS(b.checkOut)),
    }));

    return NextResponse.json({
      success: true,
      period: {
        from:    fromDate.toISOString(),
        to:      toDate.toISOString(),
        fromBS:  formatBSShort(adToBS(fromDate)),
        toBS:    formatBSShort(adToBS(toDate)),
        fiscalYear: getNepalisFiscalYear(fromDate),
      },
      summary: {
        grossRevenue, totalRefunds, netRevenue,
        invoiceCount:  bookings.length,
        refundCount:   creditNotes.length,
      },
      invoices:    invoicesWithBS,
      creditNotes,
    });
  } catch (error) {
    console.error("[AUDIT_GET]", error);
    return NextResponse.json({ success: false, error: "Failed to generate audit report" }, { status: 500 });
  }
}
