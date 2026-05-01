import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, getSessionRole } from "@/lib/auth";

export async function GET() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const period = await prisma.closingPeriod.findUnique({
    where: { year_month: { year, month } },
  });

  return NextResponse.json({
    year,
    month,
    isClosed: period?.isClosed ?? false,
    closedAt: period?.closedAt ?? null,
    closedBy: period?.closedBy ?? null,
  });
}

export async function POST(req: NextRequest) {
  const roleError = requireRole(req, ["ADMIN_PUSAT", "STAFF_LOGISTIK"]);
  if (roleError) return roleError;

  const now = new Date();
  const day = now.getDate();
  if (day < 25) {
    return NextResponse.json(
      { error: "Penutupan periode hanya dapat dilakukan mulai tanggal 25." },
      { status: 400 }
    );
  }

  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const closedBy = getSessionRole(req);

  const existing = await prisma.closingPeriod.findUnique({
    where: { year_month: { year, month } },
  });

  const willClose = !(existing?.isClosed ?? false);

  const period = await prisma.closingPeriod.upsert({
    where: { year_month: { year, month } },
    update: {
      isClosed: willClose,
      closedAt: willClose ? now : null,
      closedBy: willClose ? closedBy : null,
    },
    create: {
      year,
      month,
      isClosed: true,
      closedAt: now,
      closedBy,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: willClose ? "CLOSING_PERIOD_CLOSED" : "CLOSING_PERIOD_REOPENED",
      entity: "ClosingPeriod",
      entityId: period.id,
      newData: { year, month, isClosed: willClose },
    },
  });

  return NextResponse.json(period);
}
