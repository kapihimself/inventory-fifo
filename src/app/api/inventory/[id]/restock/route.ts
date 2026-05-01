import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidId, badRequest } from "@/lib/validate";
import { requireRole } from "@/lib/auth";
import { checkClosingPeriod } from "@/lib/closing";

// POST /api/inventory/[id]/restock — add a new stock batch
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleError = requireRole(req, ["ADMIN_PUSAT", "STAFF_LOGISTIK"]);
  if (roleError) return roleError;
  const closingError = await checkClosingPeriod();
  if (closingError) return closingError;
  const { id } = await params;
  if (!isValidId(id)) return badRequest("ID barang tidak valid");
  try {
    const body = await req.json();
    const { quantity, price, receivedDate } = body;

    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: "Jumlah stok harus lebih dari 0" }, { status: 400 });
    }

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Barang tidak ditemukan" }, { status: 404 });
    }

    const batch = await prisma.stockBatch.create({
      data: {
        itemId: id,
        initialQuantity: quantity,
        currentQuantity: quantity,
        price: price ?? null,
        receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "RESTOCK",
        entity: "StockBatch",
        entityId: batch.id,
        newData: { itemId: id, quantity, price },
      },
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
