import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== SIMULASI SKENARIO FIFO & LAPORAN ===");

  // 1. Buat Barang Dummy
  const category = await prisma.category.findFirst();
  if (!category) throw new Error("Kategori tidak ditemukan");
  
  const item = await prisma.item.create({
    data: {
      name: "Pulpen Test FIFO (Simulasi)",
      unit: "Pcs",
      minStock: 5,
      categoryId: category.id,
    }
  });

  console.log(`\n1. [PENGADAAN] Admin membeli total 15 pulpen di waktu berbeda:`);
  
  // 2. Buat Pengadaan / StockBatch (1 April: 10pcs @ 12.000)
  const batch1 = await prisma.stockBatch.create({
    data: {
      itemId: item.id,
      initialQuantity: 10,
      currentQuantity: 10,
      price: 12000,
      receivedDate: new Date("2026-04-01T10:00:00Z")
    }
  });
  console.log(`   -> Batch 1 (1 April): 10 pcs x Rp 12.000`);

  // 3. Buat Pengadaan / StockBatch (5 April: 5pcs @ 10.000)
  const batch2 = await prisma.stockBatch.create({
    data: {
      itemId: item.id,
      initialQuantity: 5,
      currentQuantity: 5,
      price: 10000,
      receivedDate: new Date("2026-04-05T10:00:00Z")
    }
  });
  console.log(`   -> Batch 2 (5 April): 5 pcs x Rp 10.000`);

  // 4. Cek Laporan Pengadaan (Apakah tergabung atau pisah?)
  console.log(`\n2. [LAPORAN PENGADAAN] Tampilan di Laporan Bulanan Admin:`);
  const laporanPengadaan = await prisma.stockBatch.findMany({
    where: { itemId: item.id },
    orderBy: { receivedDate: 'asc' }
  });
  
  laporanPengadaan.forEach(b => {
    const tgl = b.receivedDate.toISOString().split('T')[0];
    const total = b.initialQuantity * Number(b.price || 0);
    console.log(`   - Tgl: ${tgl} | Barang: ${item.name} | Qty: ${b.initialQuantity} | Harga: Rp ${b.price} | Total: Rp ${total}`);
  });

  // 5. Permintaan dari Karyawan (Pesan 12 pcs)
  console.log(`\n3. [PERMINTAAN] Pegawai / Cabang membuat permintaan 12 pcs pulpen`);
  const branch = await prisma.branch.findFirst();
  if (!branch) throw new Error("Cabang tidak ditemukan");

  const request = await prisma.request.create({
    data: {
      branchId: branch.id,
      nomorPermintaan: "/KP-ART/MB-ATK/2026/SIM-001",
      status: "PENDING",
      items: {
        create: {
          itemId: item.id,
          quantityRequested: 12,
        }
      }
    },
    include: { items: true }
  });

  // 6. Distribusi oleh Gudang menggunakan logika FIFO
  console.log(`\n4. [DISTRIBUSI GUDANG] Gudang memenuhi permintaan 12 pcs.`);
  const reqItem = request.items[0];
  let qtyToFulfill = 12;

  const distribution = await prisma.distribution.create({
    data: {
      requestId: request.id,
      suratJalanNumber: "SJ-SIMULASI-001",
      status: "SHIPPED",
    }
  });

  // Logika FIFO sama persis dengan /api/distribution/route.ts
  const availableBatches = await prisma.stockBatch.findMany({
    where: { itemId: item.id, currentQuantity: { gt: 0 } },
    orderBy: { receivedDate: "asc" }, // ASC = Oldest first (FIFO)
  });

  console.log(`   Sistem mencari stok dengan metode FIFO (Oldest first):`);
  for (const batch of availableBatches) {
    if (qtyToFulfill <= 0) break;
    const deduct = Math.min(qtyToFulfill, batch.currentQuantity);
    
    await prisma.stockBatch.update({
      where: { id: batch.id },
      data: { currentQuantity: batch.currentQuantity - deduct },
    });

    await prisma.distributionItem.create({
      data: {
        distributionId: distribution.id,
        stockBatchId: batch.id,
        requestItemId: reqItem.id,
        quantity: deduct,
      },
    });

    const tglBatch = batch.receivedDate.toISOString().split('T')[0];
    console.log(`   -> Mengambil ${deduct} pcs dari Batch tanggal ${tglBatch} (Harga Rp ${batch.price})`);
    qtyToFulfill -= deduct;
  }

  // 7. Cek Sisa Stok Setelah Distribusi
  console.log(`\n5. [HASIL AKHIR STOK GUDANG]`);
  const finalBatches = await prisma.stockBatch.findMany({
    where: { itemId: item.id },
    orderBy: { receivedDate: "asc" }
  });

  finalBatches.forEach(b => {
    const tgl = b.receivedDate.toISOString().split('T')[0];
    console.log(`   - Batch Tgl ${tgl} | Sisa Stok Saat Ini: ${b.currentQuantity} pcs`);
  });

  // Cleanup data simulasi (agar database tidak kotor)
  await prisma.distributionItem.deleteMany({ where: { distributionId: distribution.id } });
  await prisma.distribution.delete({ where: { id: distribution.id } });
  await prisma.requestItem.deleteMany({ where: { requestId: request.id } });
  await prisma.request.delete({ where: { id: request.id } });
  await prisma.stockBatch.deleteMany({ where: { itemId: item.id } });
  await prisma.item.delete({ where: { id: item.id } });
  
  console.log(`\n=== SIMULASI SELESAI (Data dummy telah dibersihkan) ===`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
