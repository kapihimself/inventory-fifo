import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, getSessionRole } from "@/lib/auth";
import { checkClosingPeriod } from "@/lib/closing";
import { generateNomorPengadaan } from "@/lib/docNumber";
import { isValidId } from "@/lib/validate";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawLimit = parseInt(searchParams.get("limit") ?? "100", 10);
  const limit = Math.min(Math.max(rawLimit, 1), 500);

  const procurements = await prisma.procurement.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(procurements);
}

export async function POST(req: NextRequest) {
  const roleError = requireRole(req, ["ADMIN_PUSAT", "STAFF_LOGISTIK"]);
  if (roleError) return roleError;

  const closingError = await checkClosingPeriod();
  if (closingError) return closingError;

  let body: {
    vendor: string;
    items: { itemId: string; nama: string; qty: number; price: number; unit: string }[];
    includePPN?: boolean;
    keterangan?: string;
    suratIzinUrl?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body request tidak valid." }, { status: 400 });
  }

  const { vendor, items, includePPN = false, keterangan, suratIzinUrl } = body;

  if (!vendor || typeof vendor !== "string" || vendor.trim() === "") {
    return NextResponse.json({ error: "Nama vendor wajib diisi." }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Daftar item pengadaan tidak boleh kosong." },
      { status: 400 }
    );
  }
  for (const item of items) {
    if (!isValidId(item.itemId)) {
      return NextResponse.json({ error: "ID barang tidak valid." }, { status: 400 });
    }
    if (!Number.isInteger(item.qty) || item.qty <= 0) {
      return NextResponse.json(
        { error: "Jumlah barang harus berupa bilangan bulat positif." },
        { status: 400 }
      );
    }
    if (typeof item.price !== "number" || item.price < 0) {
      return NextResponse.json({ error: "Harga satuan tidak valid." }, { status: 400 });
    }
  }

  const createdBy = getSessionRole(req);

  try {
    const procurement = await prisma.$transaction(async (tx) => {
      // Validate all itemIds exist
      for (const item of items) {
        const found = await tx.item.findUnique({ where: { id: item.itemId } });
        if (!found) {
          throw new Error(`Barang dengan ID ${item.itemId} tidak ditemukan.`);
        }
      }

      const nomorPengadaan = await generateNomorPengadaan(tx);

      const newProcurement = await tx.procurement.create({
        data: {
          nomorPengadaan,
          vendor: vendor.trim(),
          items,
          includePPN,
          keterangan: keterangan?.trim() ?? null,
          suratIzinUrl: suratIzinUrl ?? null,
          createdBy,
        },
      });

      // Auto-restock: create a StockBatch for each item
      for (const item of items) {
        await tx.stockBatch.create({
          data: {
            itemId: item.itemId,
            initialQuantity: item.qty,
            currentQuantity: item.qty,
            price: item.price,
            receivedDate: new Date(),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          action: "PROCUREMENT_CREATE",
          entity: "Procurement",
          entityId: newProcurement.id,
          newData: {
            nomorPengadaan,
            vendor: vendor.trim(),
            itemCount: items.length,
            includePPN,
          },
        },
      });

      return newProcurement;
    });

    return NextResponse.json(procurement, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
