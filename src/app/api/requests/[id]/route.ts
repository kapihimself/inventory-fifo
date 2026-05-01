import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidId, badRequest, notFound } from "@/lib/validate";
import { requireRole } from "@/lib/auth";

// PATCH /api/requests/[id] — cancel a request (sets status to CANCELLED)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleError = requireRole(req, ["ADMIN_PUSAT", "STAFF_LOGISTIK", "MANAGER"]);
  if (roleError) return roleError;
  const { id } = await params;
  try {
    if (!isValidId(id)) return badRequest("ID permintaan tidak valid");

    const body = await req.json();
    const { status } = body;

    // Only CANCELLED is allowed via this endpoint — other transitions happen via distribution
    if (status !== "CANCELLED") {
      return badRequest("Hanya status CANCELLED yang diizinkan lewat endpoint ini");
    }

    const existing = await prisma.request.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!existing) return notFound("Permintaan");
    if (existing.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Permintaan yang sudah selesai tidak dapat dibatalkan" },
        { status: 409 }
      );
    }

    const request = await prisma.request.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { branch: true },
    });

    await prisma.auditLog.create({
      data: {
        action: "REQUEST_CANCELLED",
        entity: "Request",
        entityId: id,
        newData: { status: "CANCELLED", previousStatus: existing.status },
      },
    });

    return NextResponse.json(request);
  } catch (e: any) {
    console.error("[PATCH /api/requests/[id]]", e.message);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE /api/requests/[id] — soft-cancel only if PENDING
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    if (!isValidId(id)) return badRequest("ID permintaan tidak valid");

    const existing = await prisma.request.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!existing) return notFound("Permintaan");
    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { error: "Hanya permintaan PENDING yang dapat dibatalkan" },
        { status: 409 }
      );
    }

    await prisma.request.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[DELETE /api/requests/[id]]", e.message);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
