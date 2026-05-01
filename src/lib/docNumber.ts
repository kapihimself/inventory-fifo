import { PrismaClient } from "@prisma/client";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// /KP-ART/MB-ATK/YYYY/NNNN
export async function generateNomorPermintaan(tx: TxClient): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.request.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
      },
    },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `/KP-ART/MB-ATK/${year}/${seq}`;
}

// /KP-ART/PB-ATK/YYYY/NNNN
export async function generateNomorPengadaan(tx: TxClient): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.procurement.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
      },
    },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `/KP-ART/PB-ATK/${year}/${seq}`;
}
