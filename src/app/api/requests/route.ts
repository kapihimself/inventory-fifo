import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidRequestStatus, badRequest } from "@/lib/validate";
import { checkClosingPeriod } from "@/lib/closing";
import { generateNomorPermintaan } from "@/lib/docNumber";
import { requireRole } from "@/lib/auth";

// GET /api/requests — list all requests (optionally filter by status)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const month = searchParams.get("month") ? Number(searchParams.get("month")) : null;
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : null;

    // Reject unknown status strings before they reach the ORM
    if (status && !isValidRequestStatus(status)) {
      return badRequest(`Status tidak valid: ${status}`);
    }

    const where: any = {};
    if (status) where.status = status;
    if (month && year) {
      where.createdAt = {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      };
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        branch: true,
        items: {
          include: { item: { include: { category: true } } },
        },
        distributions: {
          select: { id: true, suratJalanNumber: true, status: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/requests — create a new supply request from a branch
export async function POST(req: NextRequest) {
  // All authenticated roles may create a request; only unauthenticated callers are blocked
  const roleError = requireRole(req, ["ADMIN_PUSAT", "STAFF_LOGISTIK", "MANAGER", "KARYAWAN_UMUM"]);
  if (roleError) return roleError;

  const closingError = await checkClosingPeriod();
  if (closingError) return closingError;

  try {
    const body = await req.json();
    const { branchId, items } = body;
    // items: [{ itemId, quantityRequested }]

    if (!branchId || !items?.length) {
      return NextResponse.json(
        { error: "branchId dan items wajib diisi" },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      return NextResponse.json(
        { error: "Cabang tidak ditemukan" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const nomorPermintaan = await generateNomorPermintaan(tx);

      const request = await tx.request.create({
        data: {
          branchId,
          nomorPermintaan,
          items: {
            create: items.map((i: { itemId: string; quantityRequested: number }) => ({
              itemId: i.itemId,
              quantityRequested: i.quantityRequested,
            })),
          },
        },
        include: {
          branch: true,
          items: { include: { item: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          action: "CREATE_REQUEST",
          entity: "Request",
          entityId: request.id,
          newData: { branchId, nomorPermintaan, itemCount: items.length },
        },
      });

      return request;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
