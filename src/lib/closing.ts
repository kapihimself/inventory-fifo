import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function checkClosingPeriod(): Promise<NextResponse | null> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const period = await prisma.closingPeriod.findUnique({
    where: { year_month: { year, month } },
  });

  if (period?.isClosed) {
    return NextResponse.json(
      {
        error: `Periode ${month}/${year} sudah ditutup. Tidak ada transaksi yang dapat dilakukan.`,
      },
      { status: 403 }
    );
  }
  return null;
}
