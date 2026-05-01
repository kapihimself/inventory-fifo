import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidId, badRequest } from "@/lib/validate";

// GET /api/inventory/[id]/history — full transaction history for one item
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidId(id)) return badRequest("ID barang tidak valid");

  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        category: true,
        stockBatches: {
          include: {
            distributionItems: {
              include: {
                distribution: {
                  include: {
                    request: { include: { branch: true } },
                  },
                },
              },
            },
          },
          orderBy: { receivedDate: "asc" },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Barang tidak ditemukan" }, { status: 404 });
    }

    // Build unified timeline: MASUK (purchase) + KELUAR (distribution)
    const timeline: {
      type: "MASUK" | "KELUAR";
      date: Date;
      qty: number;
      price: number | null;
      batchId: string;
      batchInitial: number;
      description: string;
      suratJalan?: string;
      branch?: string;
      runningStock?: number;
    }[] = [];

    for (const batch of item.stockBatches) {
      timeline.push({
        type: "MASUK",
        date: batch.receivedDate,
        qty: batch.initialQuantity,
        price: batch.price ? Number(batch.price) : null,
        batchId: batch.id,
        batchInitial: batch.initialQuantity,
        description: "Penerimaan Stok",
      });

      for (const di of batch.distributionItems) {
        timeline.push({
          type: "KELUAR",
          date: di.distribution.createdAt,
          qty: di.quantity,
          price: batch.price ? Number(batch.price) : null,
          batchId: batch.id,
          batchInitial: batch.initialQuantity,
          description: `Distribusi ke ${di.distribution.request.branch.name}`,
          suratJalan: di.distribution.suratJalanNumber,
          branch: di.distribution.request.branch.name,
        });
      }
    }

    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    const withRunning = timeline.map((t) => {
      if (t.type === "MASUK") running += t.qty;
      else running -= t.qty;
      return { ...t, runningStock: running };
    });

    const batches = item.stockBatches.map((b) => ({
      id: b.id,
      receivedDate: b.receivedDate,
      initialQuantity: b.initialQuantity,
      currentQuantity: b.currentQuantity,
      price: b.price ? Number(b.price) : null,
      used: b.initialQuantity - b.currentQuantity,
    }));

    const totalStock = item.stockBatches.reduce((s, b) => s + b.currentQuantity, 0);

    return NextResponse.json({
      item: {
        id: item.id,
        name: item.name,
        category: item.category.name,
        unit: item.unit,
        minStock: item.minStock,
        totalStock,
      },
      batches,
      timeline: withRunning,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
