import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clampLimit } from "@/lib/validate";

// GET /api/reports/procurement — all stock-in (StockBatch) records for the procurement report tab
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = clampLimit(searchParams.get("limit"), 200, 500);

    // Optional month/year filter (e.g. ?month=5&year=2026)
    const month = searchParams.get("month") ? Number(searchParams.get("month")) : null;
    const year  = searchParams.get("year")  ? Number(searchParams.get("year"))  : null;

    let dateFilter: { gte?: Date; lt?: Date } | undefined;
    if (month && year) {
      const start = new Date(year, month - 1, 1);          // 1st of month
      const end   = new Date(year, month, 1);              // 1st of next month
      dateFilter = { gte: start, lt: end };
    }

    const batches = await prisma.stockBatch.findMany({
      where: dateFilter ? { receivedDate: dateFilter } : undefined,
      include: {
        item: { include: { category: true } },
      },
      orderBy: { receivedDate: "desc" },
      take: limit,
    });

    const result = batches.map((b, i) => ({
      no: i + 1,
      tgl: b.receivedDate.toISOString().split("T")[0],
      batchId: b.id,
      itemId: b.itemId,
      nama: b.item.name,
      unit: b.item.unit,
      category: b.item.category.name,
      qty: b.initialQuantity,
      price: b.price ?? 0,
      total: b.initialQuantity * Number(b.price ?? 0),
    }));

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
