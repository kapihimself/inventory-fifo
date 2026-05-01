import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { checkClosingPeriod } from "@/lib/closing";

// GET /api/inventory — list all items with current stock totals
export async function GET() {
  try {
    const items = await prisma.item.findMany({
      include: {
        category: true,
        stockBatches: { orderBy: { receivedDate: "desc" } },
      },
      orderBy: { name: "asc" },
    });

    const result = items.map((item) => {
      const totalStock = item.stockBatches.reduce(
        (sum, b) => sum + b.currentQuantity,
        0
      );
      const lastBatch = item.stockBatches[0];
      return {
        id: item.id,
        name: item.name,
        category: item.category.name,
        unit: item.unit,
        minStock: item.minStock,
        totalStock,
        lastReceivedDate: lastBatch?.receivedDate ?? null,
        lastPrice: lastBatch?.price ?? null,
        status:
          totalStock === 0
            ? "Habis"
            : totalStock <= item.minStock
            ? "Hampir Habis"
            : "Tersedia",
      };
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/inventory — create new item with optional initial stock
export async function POST(req: NextRequest) {
  const roleError = requireRole(req, ["ADMIN_PUSAT", "STAFF_LOGISTIK"]);
  if (roleError) return roleError;
  const closingError = await checkClosingPeriod();
  if (closingError) return closingError;

  try {
    const body = await req.json();
    const { name, categoryName, unit, minStock, initialQty, price } = body;

    if (!name || !categoryName || !unit) {
      return NextResponse.json(
        { error: "name, categoryName, unit wajib diisi" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let category = await tx.category.findUnique({
        where: { name: categoryName },
      });
      if (!category) {
        category = await tx.category.create({ data: { name: categoryName } });
      }

      const item = await tx.item.create({
        data: {
          name,
          categoryId: category.id,
          unit,
          minStock: minStock ?? 0,
        },
      });

      if (initialQty && initialQty > 0) {
        await tx.stockBatch.create({
          data: {
            itemId: item.id,
            initialQuantity: initialQty,
            currentQuantity: initialQty,
            price: price ?? null,
            receivedDate: new Date(),
          },
        });
      }

      return item;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
