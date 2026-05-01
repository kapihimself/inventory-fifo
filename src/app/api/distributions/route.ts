import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clampLimit } from "@/lib/validate";

// GET /api/distributions — list distributions with details
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // clampLimit ensures callers cannot pass ?limit=999999 and cause a DoS
    const limit = clampLimit(searchParams.get("limit"), 50, 100);

    const distributions = await prisma.distribution.findMany({
      take: limit,
      include: {
        request: { include: { branch: true } },
        items: {
          include: {
            stockBatch: { include: { item: true } },
            requestItem: true,
          },
        },
        receipt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const result = distributions.map((d) => ({
      id: d.id,
      suratJalanNumber: d.suratJalanNumber,
      status: d.status,
      createdAt: d.createdAt,
      branch: d.request.branch.name,
      requestId: d.requestId,
      itemCount: d.items.length,
      items: d.items.map((di) => ({
        nama: di.stockBatch.item.name,
        unit: di.stockBatch.item.unit,
        qty: di.quantity,
        harga: di.stockBatch.price ? Number(di.stockBatch.price) : 0,
      })),
    }));

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
