import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard/stats
export async function GET() {
  try {
    // All items with stock
    const items = await prisma.item.findMany({
      include: {
        category: true,
        stockBatches: { where: { currentQuantity: { gt: 0 } } },
      },
    });

    let totalATK = 0;
    let totalForm = 0;

    for (const item of items) {
      const stock = item.stockBatches.reduce((s, b) => s + b.currentQuantity, 0);
      if (item.category.name === "ATK") totalATK += stock;
      else totalForm += stock;
    }

    // Pending requests count
    const pendingRequests = await prisma.request.count({
      where: { status: "PENDING" },
    });

    // In-transit (SHIPPED but not DELIVERED)
    const inTransit = await prisma.distribution.count({
      where: { status: "SHIPPED" },
    });

    // Low stock items
    const lowStockItems = items.filter((item) => {
      const stock = item.stockBatches.reduce((s, b) => s + b.currentQuantity, 0);
      return stock <= item.minStock && stock > 0;
    }).length;

    // Out of stock
    const outOfStockItems = items.filter((item) => {
      return item.stockBatches.length === 0 ||
        item.stockBatches.reduce((s, b) => s + b.currentQuantity, 0) === 0;
    }).length;

    return NextResponse.json({
      totalATK,
      totalForm,
      pendingRequests,
      inTransit,
      lowStockItems,
      outOfStockItems,
      totalItems: items.length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
