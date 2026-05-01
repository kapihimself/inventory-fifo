import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidId, badRequest } from "@/lib/validate";
import { requireRole } from "@/lib/auth";

// PUT /api/inventory/[id] — update item metadata
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleError = requireRole(req, ["ADMIN_PUSAT", "STAFF_LOGISTIK"]);
  if (roleError) return roleError;
  const { id } = await params;
  if (!isValidId(id)) return badRequest("ID barang tidak valid");
  try {
    const body = await req.json();
    const { name, minStock, unit } = body;

    const item = await prisma.item.update({
      where: { id },
      data: { name, minStock, unit },
    });

    return NextResponse.json(item);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/inventory/[id] — delete only if item has no stock history
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleError = requireRole(req, ["ADMIN_PUSAT", "STAFF_LOGISTIK"]);
  if (roleError) return roleError;
  const { id } = await params;
  if (!isValidId(id)) return badRequest("ID barang tidak valid");
  try {
    const batches = await prisma.stockBatch.count({ where: { itemId: id } });
    if (batches > 0) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus barang yang sudah memiliki riwayat stok. Hubungi Admin." },
        { status: 400 }
      );
    }

    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
