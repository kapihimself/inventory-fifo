/**
 * Seed: Bank Sumut Inventory System
 * Data realistis per 30 April 2026
 * - 6 cabang Bank Sumut Sumatera Utara
 * - 28 item ATK + Form perbankan
 * - Riwayat pembelian stok (multiple batches) sejak Jan 2026
 * - Riwayat distribusi ke cabang (Jan–Apr 2026)
 */

import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Bank Sumut Inventory...");

  // ─── 1. BRANCHES ──────────────────────────────────────────
  const branches = await Promise.all([
    upsertBranch("Kantor Pusat Medan", "Jl. Imam Bonjol No.18, Medan"),
    upsertBranch("Cabang Medan Utama", "Jl. Pemuda No.12, Medan"),
    upsertBranch("Cabang Binjai", "Jl. Jend. Sudirman No.5, Binjai"),
    upsertBranch("Cabang Tebing Tinggi", "Jl. Sudirman No.22, Tebing Tinggi"),
    upsertBranch("Cabang Pematang Siantar", "Jl. Merdeka No.9, Pematang Siantar"),
    upsertBranch("Cabang Rantau Prapat", "Jl. Ahmad Yani No.15, Rantau Prapat"),
  ]);

  const [kp, medanUtama, binjai, tebingTinggi, siantar, rantauPrapat] = branches;

  // ─── 2. USERS ─────────────────────────────────────────────
  await Promise.all([
    upsertUser("admin@banksumut.co.id", "Ahmad Chairul", Role.ADMIN_PUSAT, kp.id),
    upsertUser("logistik@banksumut.co.id", "Budi Santoso", Role.STAFF_LOGISTIK, kp.id),
    upsertUser("manager.kp@banksumut.co.id", "Siti Rahayu", Role.MANAGER, kp.id),
    upsertUser("cabang.medan@banksumut.co.id", "Rizky Pratama", Role.KARYAWAN_UMUM, medanUtama.id),
    upsertUser("cabang.binjai@banksumut.co.id", "Nurul Hidayah", Role.KARYAWAN_UMUM, binjai.id),
    upsertUser("cabang.siantar@banksumut.co.id", "Fadlan Harahap", Role.KARYAWAN_UMUM, siantar.id),
  ]);

  // ─── 3. CATEGORIES ────────────────────────────────────────
  const atk = await upsertCategory("ATK");
  const form = await upsertCategory("Form");

  // ─── 4. ITEMS + STOCK BATCHES ─────────────────────────────
  // Format: { name, categoryId, unit, minStock, batches: [{qty, price, date}] }
  // Harga pasar aktual 2026 untuk kebutuhan bank
  const itemDefs = [
    // === ATK Kertas & Cetak ===
    {
      name: "Kertas A4 80gr Sinar Dunia",
      categoryId: atk.id, unit: "Rim", minStock: 50,
      batches: [
        { qty: 100, price: 52000, date: "2026-01-08" },
        { qty: 150, price: 54000, date: "2026-02-15" },
        { qty: 100, price: 55000, date: "2026-04-03" },
      ],
    },
    {
      name: "Kertas F4 80gr Sinar Dunia",
      categoryId: atk.id, unit: "Rim", minStock: 30,
      batches: [
        { qty: 80, price: 60000, date: "2026-01-08" },
        { qty: 80, price: 62000, date: "2026-03-10" },
      ],
    },
    {
      name: "Kertas NCR A4 (Karbon 3-ply)",
      categoryId: atk.id, unit: "Rim", minStock: 20,
      batches: [
        { qty: 50, price: 95000, date: "2026-01-20" },
        { qty: 40, price: 98000, date: "2026-03-25" },
      ],
    },
    // === ATK Tulis ===
    {
      name: "Pulpen Pilot Balliner 0.7 Biru",
      categoryId: atk.id, unit: "Lusin", minStock: 10,
      batches: [
        { qty: 30, price: 42000, date: "2026-01-10" },
        { qty: 20, price: 44000, date: "2026-03-01" },
      ],
    },
    {
      name: "Pulpen Pilot Balliner 0.7 Hitam",
      categoryId: atk.id, unit: "Lusin", minStock: 8,
      batches: [
        { qty: 20, price: 42000, date: "2026-01-10" },
        { qty: 15, price: 44000, date: "2026-03-01" },
      ],
    },
    {
      name: "Spidol Permanent Snowman (Hitam)",
      categoryId: atk.id, unit: "Lusin", minStock: 5,
      batches: [
        { qty: 12, price: 48000, date: "2026-01-15" },
        { qty: 12, price: 50000, date: "2026-04-01" },
      ],
    },
    {
      name: "Spidol Whiteboard Snowman (Merah/Biru/Hitam)",
      categoryId: atk.id, unit: "Lusin", minStock: 4,
      batches: [
        { qty: 10, price: 72000, date: "2026-02-01" },
        { qty: 8, price: 75000, date: "2026-04-05" },
      ],
    },
    // === ATK Pengarsipan ===
    {
      name: "Map Ordner A4 (Biru)",
      categoryId: atk.id, unit: "Pcs", minStock: 20,
      batches: [
        { qty: 60, price: 28000, date: "2026-01-12" },
        { qty: 60, price: 30000, date: "2026-03-15" },
      ],
    },
    {
      name: "Amplop Coklat Besar A4",
      categoryId: atk.id, unit: "Pack", minStock: 15,
      batches: [
        { qty: 50, price: 28000, date: "2026-01-18" },
        { qty: 40, price: 30000, date: "2026-03-20" },
      ],
    },
    {
      name: "Amplop Putih Kecil No.90",
      categoryId: atk.id, unit: "Kotak", minStock: 10,
      batches: [
        { qty: 30, price: 22000, date: "2026-01-18" },
        { qty: 25, price: 23000, date: "2026-04-01" },
      ],
    },
    {
      name: "Staples Joyko No.10",
      categoryId: atk.id, unit: "Pcs", minStock: 10,
      batches: [
        { qty: 40, price: 22000, date: "2026-01-10" },
        { qty: 30, price: 23500, date: "2026-03-10" },
      ],
    },
    {
      name: "Isi Staples Joyko No.10",
      categoryId: atk.id, unit: "Kotak", minStock: 20,
      batches: [
        { qty: 100, price: 3000, date: "2026-01-10" },
        { qty: 80, price: 3200, date: "2026-03-10" },
      ],
    },
    {
      name: "Binder Clip Joyko No.155 (41mm)",
      categoryId: atk.id, unit: "Kotak", minStock: 15,
      batches: [
        { qty: 60, price: 9500, date: "2026-01-12" },
        { qty: 50, price: 10000, date: "2026-03-12" },
      ],
    },
    {
      name: "Paper Clip Joyko No.3",
      categoryId: atk.id, unit: "Kotak", minStock: 20,
      batches: [
        { qty: 80, price: 5500, date: "2026-01-12" },
        { qty: 60, price: 5800, date: "2026-03-12" },
      ],
    },
    // === ATK Stempel & Administrasi ===
    {
      name: "Bantalan Stempel (Biru)",
      categoryId: atk.id, unit: "Pcs", minStock: 8,
      batches: [
        { qty: 30, price: 18000, date: "2026-01-20" },
        { qty: 20, price: 19000, date: "2026-03-20" },
      ],
    },
    {
      name: "Tinta Stempel Shiny (Biru)",
      categoryId: atk.id, unit: "Botol", minStock: 10,
      batches: [
        { qty: 40, price: 14000, date: "2026-01-20" },
        { qty: 30, price: 15000, date: "2026-03-20" },
      ],
    },
    {
      name: "Materai 10.000",
      categoryId: atk.id, unit: "Lembar", minStock: 200,
      batches: [
        { qty: 1000, price: 10000, date: "2026-01-05" },
        { qty: 1000, price: 10000, date: "2026-02-03" },
        { qty: 1000, price: 10000, date: "2026-03-04" },
        { qty: 1000, price: 10000, date: "2026-04-01" },
      ],
    },
    // === ATK Perangkat Keras ===
    {
      name: "Toner HP LaserJet 85A (CE285A)",
      categoryId: atk.id, unit: "Pcs", minStock: 4,
      batches: [
        { qty: 12, price: 875000, date: "2026-01-08" },
        { qty: 8, price: 890000, date: "2026-03-05" },
      ],
    },
    {
      name: "Toner HP LaserJet 12A (Q2612A)",
      categoryId: atk.id, unit: "Pcs", minStock: 3,
      batches: [
        { qty: 8, price: 750000, date: "2026-01-08" },
        { qty: 6, price: 760000, date: "2026-03-05" },
      ],
    },
    {
      name: "Kalkulator Casio 12 Digit FX-350",
      categoryId: atk.id, unit: "Pcs", minStock: 3,
      batches: [
        { qty: 10, price: 235000, date: "2026-01-15" },
        { qty: 5, price: 245000, date: "2026-03-20" },
      ],
    },
    {
      name: "Gunting Besar Joyko",
      categoryId: atk.id, unit: "Pcs", minStock: 5,
      batches: [
        { qty: 20, price: 25000, date: "2026-01-15" },
        { qty: 15, price: 26000, date: "2026-03-15" },
      ],
    },
    {
      name: "Cutter Joyko L-500",
      categoryId: atk.id, unit: "Pcs", minStock: 5,
      batches: [
        { qty: 20, price: 18000, date: "2026-01-15" },
        { qty: 15, price: 19000, date: "2026-03-15" },
      ],
    },
    {
      name: "Lem Kertas UHU Stick 21gr",
      categoryId: atk.id, unit: "Pcs", minStock: 10,
      batches: [
        { qty: 50, price: 9500, date: "2026-01-15" },
        { qty: 30, price: 10000, date: "2026-03-15" },
      ],
    },
    {
      name: "Lakban Bening OPP 2 Inch",
      categoryId: atk.id, unit: "Roll", minStock: 10,
      batches: [
        { qty: 60, price: 16000, date: "2026-01-20" },
        { qty: 50, price: 17000, date: "2026-03-20" },
      ],
    },
    // === FORM PERBANKAN ===
    {
      name: "Form Pembukaan Rekening Tabungan",
      categoryId: form.id, unit: "Pad", minStock: 30,
      batches: [
        { qty: 200, price: 45000, date: "2026-01-05" },
        { qty: 150, price: 47000, date: "2026-03-01" },
      ],
    },
    {
      name: "Form Setoran Tunai",
      categoryId: form.id, unit: "Pad", minStock: 50,
      batches: [
        { qty: 400, price: 35000, date: "2026-01-05" },
        { qty: 300, price: 37000, date: "2026-03-01" },
      ],
    },
    {
      name: "Form Penarikan Tunai",
      categoryId: form.id, unit: "Pad", minStock: 50,
      batches: [
        { qty: 400, price: 35000, date: "2026-01-05" },
        { qty: 300, price: 37000, date: "2026-03-01" },
      ],
    },
    {
      name: "Buku Tabungan Martabe",
      categoryId: form.id, unit: "Buku", minStock: 300,
      batches: [
        { qty: 2000, price: 5500, date: "2026-01-05" },
        { qty: 2000, price: 5500, date: "2026-02-03" },
        { qty: 2000, price: 5800, date: "2026-03-04" },
      ],
    },
  ];

  const itemMap: Record<string, string> = {}; // name → id

  for (const def of itemDefs) {
    const item = await prisma.item.upsert({
      where: { name: def.name },
      update: { minStock: def.minStock, unit: def.unit },
      create: {
        name: def.name,
        categoryId: def.categoryId,
        unit: def.unit,
        minStock: def.minStock,
      },
    });
    itemMap[def.name] = item.id;

    // Delete existing batches only if this is a fresh seed (no distributions yet)
    const hasDistributions = await prisma.distributionItem.count({
      where: { stockBatch: { itemId: item.id } },
    });

    if (hasDistributions === 0) {
      await prisma.stockBatch.deleteMany({ where: { itemId: item.id } });

      for (const b of def.batches) {
        await prisma.stockBatch.create({
          data: {
            itemId: item.id,
            initialQuantity: b.qty,
            currentQuantity: b.qty,
            price: b.price,
            receivedDate: new Date(b.date),
          },
        });
      }
    }
  }

  console.log(`✅ ${itemDefs.length} item dibuat`);

  // ─── 5. HISTORICAL REQUESTS & DISTRIBUTIONS ───────────────
  // Simulate 3 months of activity Jan–Apr 2026
  // Only seed if no distributions exist yet
  const existingDistCount = await prisma.distribution.count();
  if (existingDistCount === 0) {
    await seedDistributionHistory(itemMap, branches);
  } else {
    console.log("ℹ️  Riwayat distribusi sudah ada, skip.");
  }

  console.log("🎉 Seed selesai!");
}

async function seedDistributionHistory(
  itemMap: Record<string, string>,
  branches: { id: string; name: string }[]
) {
  const [kp, medanUtama, binjai, tebingTinggi, siantar, rantauPrapat] = branches;

  // Helper: create request + distribution + deduct stock
  const dist = async (
    branch: { id: string; name: string },
    requestDate: string,
    items: { name: string; qty: number }[],
    sjSuffix: string
  ) => {
    const validItems = items.filter((i) => itemMap[i.name]);

    const request = await prisma.request.create({
      data: {
        branchId: branch.id,
        status: "COMPLETED",
        createdAt: new Date(requestDate),
        updatedAt: new Date(requestDate),
        items: {
          create: validItems.map((i) => ({
            itemId: itemMap[i.name],
            quantityRequested: i.qty,
            quantityFulfilled: i.qty,
          })),
        },
      },
      include: { items: true },
    });

    const dateStr = requestDate.replace(/-/g, "");
    const sjNumber = `SJ-${dateStr}-${sjSuffix}`;

    const distribution = await prisma.distribution.create({
      data: {
        requestId: request.id,
        suratJalanNumber: sjNumber,
        status: "DELIVERED",
        createdAt: new Date(requestDate),
        updatedAt: new Date(requestDate),
      },
    });

    for (const reqItem of request.items) {
      let remaining = reqItem.quantityFulfilled;

      const batches = await prisma.stockBatch.findMany({
        where: { itemId: reqItem.itemId, currentQuantity: { gt: 0 } },
        orderBy: { receivedDate: "asc" },
      });

      for (const batch of batches) {
        if (remaining <= 0) break;
        const deduct = Math.min(remaining, batch.currentQuantity);

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

        remaining -= deduct;
      }
    }

    return distribution;
  };

  // ── Januari 2026 ──
  await dist(medanUtama, "2026-01-15", [
    { name: "Kertas A4 80gr Sinar Dunia", qty: 30 },
    { name: "Pulpen Pilot Balliner 0.7 Biru", qty: 5 },
    { name: "Materai 10.000", qty: 200 },
    { name: "Toner HP LaserJet 85A (CE285A)", qty: 2 },
  ], "001");

  await dist(binjai, "2026-01-20", [
    { name: "Kertas A4 80gr Sinar Dunia", qty: 20 },
    { name: "Form Pembukaan Rekening Tabungan", qty: 20 },
    { name: "Buku Tabungan Martabe", qty: 300 },
    { name: "Form Setoran Tunai", qty: 40 },
    { name: "Form Penarikan Tunai", qty: 40 },
  ], "002");

  await dist(tebingTinggi, "2026-01-25", [
    { name: "Kertas F4 80gr Sinar Dunia", qty: 15 },
    { name: "Map Ordner A4 (Biru)", qty: 10 },
    { name: "Amplop Coklat Besar A4", qty: 10 },
    { name: "Materai 10.000", qty: 150 },
  ], "003");

  // ── Februari 2026 ──
  await dist(siantar, "2026-02-05", [
    { name: "Kertas A4 80gr Sinar Dunia", qty: 25 },
    { name: "Buku Tabungan Martabe", qty: 400 },
    { name: "Toner HP LaserJet 85A (CE285A)", qty: 2 },
    { name: "Pulpen Pilot Balliner 0.7 Biru", qty: 4 },
  ], "004");

  await dist(rantauPrapat, "2026-02-12", [
    { name: "Kertas A4 80gr Sinar Dunia", qty: 20 },
    { name: "Kertas F4 80gr Sinar Dunia", qty: 10 },
    { name: "Materai 10.000", qty: 200 },
    { name: "Form Setoran Tunai", qty: 30 },
  ], "005");

  await dist(medanUtama, "2026-02-20", [
    { name: "Buku Tabungan Martabe", qty: 350 },
    { name: "Form Pembukaan Rekening Tabungan", qty: 25 },
    { name: "Amplop Putih Kecil No.90", qty: 8 },
    { name: "Binder Clip Joyko No.155 (41mm)", qty: 10 },
  ], "006");

  // ── Maret 2026 ──
  await dist(binjai, "2026-03-03", [
    { name: "Kertas A4 80gr Sinar Dunia", qty: 20 },
    { name: "Toner HP LaserJet 12A (Q2612A)", qty: 2 },
    { name: "Materai 10.000", qty: 200 },
    { name: "Lakban Bening OPP 2 Inch", qty: 6 },
  ], "007");

  await dist(tebingTinggi, "2026-03-10", [
    { name: "Buku Tabungan Martabe", qty: 250 },
    { name: "Form Penarikan Tunai", qty: 35 },
    { name: "Pulpen Pilot Balliner 0.7 Biru", qty: 4 },
    { name: "Staples Joyko No.10", qty: 5 },
  ], "008");

  await dist(siantar, "2026-03-18", [
    { name: "Kertas A4 80gr Sinar Dunia", qty: 25 },
    { name: "Kertas NCR A4 (Karbon 3-ply)", qty: 10 },
    { name: "Map Ordner A4 (Biru)", qty: 12 },
    { name: "Toner HP LaserJet 85A (CE285A)", qty: 2 },
  ], "009");

  await dist(rantauPrapat, "2026-03-25", [
    { name: "Kertas F4 80gr Sinar Dunia", qty: 15 },
    { name: "Buku Tabungan Martabe", qty: 300 },
    { name: "Form Pembukaan Rekening Tabungan", qty: 15 },
    { name: "Materai 10.000", qty: 150 },
  ], "010");

  // ── April 2026 ──
  await dist(medanUtama, "2026-04-02", [
    { name: "Kertas A4 80gr Sinar Dunia", qty: 30 },
    { name: "Materai 10.000", qty: 200 },
    { name: "Pulpen Pilot Balliner 0.7 Biru", qty: 5 },
    { name: "Amplop Coklat Besar A4", qty: 8 },
  ], "011");

  await dist(binjai, "2026-04-08", [
    { name: "Buku Tabungan Martabe", qty: 400 },
    { name: "Form Setoran Tunai", qty: 40 },
    { name: "Form Penarikan Tunai", qty: 40 },
    { name: "Toner HP LaserJet 85A (CE285A)", qty: 2 },
  ], "012");

  await dist(tebingTinggi, "2026-04-15", [
    { name: "Kertas A4 80gr Sinar Dunia", qty: 20 },
    { name: "Kertas F4 80gr Sinar Dunia", qty: 10 },
    { name: "Materai 10.000", qty: 150 },
    { name: "Lakban Bening OPP 2 Inch", qty: 5 },
  ], "013");

  // ── Permintaan PENDING (belum diproses) ──
  const pendingReqs = [
    {
      branch: siantar,
      date: "2026-04-28",
      items: [
        { name: "Kertas A4 80gr Sinar Dunia", qty: 25 },
        { name: "Buku Tabungan Martabe", qty: 300 },
        { name: "Form Setoran Tunai", qty: 35 },
      ],
    },
    {
      branch: rantauPrapat,
      date: "2026-04-29",
      items: [
        { name: "Toner HP LaserJet 85A (CE285A)", qty: 3 },
        { name: "Kertas F4 80gr Sinar Dunia", qty: 15 },
        { name: "Materai 10.000", qty: 200 },
        { name: "Map Ordner A4 (Biru)", qty: 8 },
      ],
    },
    {
      branch: medanUtama,
      date: "2026-04-30",
      items: [
        { name: "Pulpen Pilot Balliner 0.7 Biru", qty: 6 },
        { name: "Amplop Coklat Besar A4", qty: 10 },
        { name: "Binder Clip Joyko No.155 (41mm)", qty: 12 },
        { name: "Kertas A4 80gr Sinar Dunia", qty: 20 },
      ],
    },
    {
      branch: binjai,
      date: "2026-04-30",
      items: [
        { name: "Buku Tabungan Martabe", qty: 500 },
        { name: "Form Pembukaan Rekening Tabungan", qty: 30 },
        { name: "Form Penarikan Tunai", qty: 45 },
      ],
    },
  ];

  for (const pr of pendingReqs) {
    const validItems = pr.items.filter((i) => itemMap[i.name]);
    await prisma.request.create({
      data: {
        branchId: pr.branch.id,
        status: "PENDING",
        createdAt: new Date(pr.date),
        updatedAt: new Date(pr.date),
        items: {
          create: validItems.map((i) => ({
            itemId: itemMap[i.name],
            quantityRequested: i.qty,
            quantityFulfilled: 0,
          })),
        },
      },
    });
  }

  console.log("✅ Riwayat distribusi & permintaan dibuat");
}

// ─── Helpers ──────────────────────────────────────────────
async function upsertBranch(name: string, location: string) {
  return prisma.branch.upsert({
    where: { name },
    update: { location },
    create: { name, location },
  });
}

async function upsertUser(
  email: string,
  name: string,
  role: Role,
  branchId: string
) {
  return prisma.user.upsert({
    where: { email },
    update: { role, branchId },
    create: { email, name, role, branchId },
  });
}

async function upsertCategory(name: string) {
  return prisma.category.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
