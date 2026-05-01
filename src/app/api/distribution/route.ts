import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { checkClosingPeriod } from "@/lib/closing";

// POST /api/distribution — process a distribution (FIFO stock deduction)
export async function POST(req: NextRequest) {
  const roleError = requireRole(req, ["ADMIN_PUSAT", "STAFF_LOGISTIK"]);
  if (roleError) return roleError;
  const closingError = await checkClosingPeriod();
  if (closingError) return closingError;

  try {
    const body = await req.json();
    const { requestId, items } = body;
    // items: [{ itemId, quantity }]

    if (!requestId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "requestId dan items wajib diisi" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.request.findUnique({
        where: { id: requestId },
        include: { items: true, branch: true },
      });

      if (!request) throw new Error("Permintaan tidak ditemukan");
      if (request.status === "CANCELLED") throw new Error("Permintaan sudah dibatalkan");
      if (request.status === "COMPLETED") throw new Error("Permintaan sudah selesai diproses");

      // Generate Surat Jalan number
      const dateStr = new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");
      const count = await tx.distribution.count();
      const sjNumber = `SJ-${dateStr}-${String(count + 1).padStart(3, "0")}`;

      const distribution = await tx.distribution.create({
        data: {
          requestId,
          suratJalanNumber: sjNumber,
          status: "SHIPPED",
        },
      });

      for (const { itemId, quantity } of items) {
        if (!quantity || quantity <= 0) continue;

        // Get FIFO batches
        const batches = await tx.stockBatch.findMany({
          where: { itemId, currentQuantity: { gt: 0 } },
          orderBy: { receivedDate: "asc" },
        });

        const totalAvailable = batches.reduce((s, b) => s + b.currentQuantity, 0);
        if (totalAvailable < quantity) {
          throw new Error(
            `Stok tidak mencukupi untuk item ${itemId}. Tersedia: ${totalAvailable}, Diminta: ${quantity}`
          );
        }

        // Find the RequestItem
        const requestItem = request.items.find((ri) => ri.itemId === itemId);
        if (!requestItem) throw new Error(`Item ${itemId} tidak ada dalam permintaan ini`);

        let remaining = quantity;
        for (const batch of batches) {
          if (remaining <= 0) break;
          const deduct = Math.min(remaining, batch.currentQuantity);

          await tx.stockBatch.update({
            where: { id: batch.id },
            data: { currentQuantity: batch.currentQuantity - deduct },
          });

          await tx.distributionItem.create({
            data: {
              distributionId: distribution.id,
              stockBatchId: batch.id,
              requestItemId: requestItem.id,
              quantity: deduct,
            },
          });

          remaining -= deduct;
        }

        // Update requestItem fulfilled quantity
        const newFulfilled = requestItem.quantityFulfilled + quantity;
        await tx.requestItem.update({
          where: { id: requestItem.id },
          data: { quantityFulfilled: newFulfilled },
        });
      }

      // Refresh request items to determine new status
      const updatedItems = await tx.requestItem.findMany({
        where: { requestId },
      });

      const allComplete = updatedItems.every(
        (ri) => ri.quantityFulfilled >= ri.quantityRequested
      );
      const anyFulfilled = updatedItems.some((ri) => ri.quantityFulfilled > 0);

      await tx.request.update({
        where: { id: requestId },
        data: { status: allComplete ? "COMPLETED" : anyFulfilled ? "PARTIAL" : "PENDING" },
      });

      await tx.auditLog.create({
        data: {
          action: "DISTRIBUTE",
          entity: "Distribution",
          entityId: distribution.id,
          newData: { sjNumber, requestId, itemCount: items.length },
        },
      });

      return distribution;
    });

    return NextResponse.json({ message: "Distribusi berhasil", distribution: result });
  } catch (e: any) {
    console.error("Distribution Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
