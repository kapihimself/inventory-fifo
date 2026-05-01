import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/auth";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  const roleError = requireRole(req, ["ADMIN_PUSAT", "STAFF_LOGISTIK"]);
  if (roleError) return roleError;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Hanya file PDF yang diperbolehkan." },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Ukuran file melebihi batas maksimum 50 MB." },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
  const path = `surat-izin/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from("surat-izin")
    .upload(path, buffer, { contentType: "application/pdf", upsert: false });

  if (uploadError) {
    return NextResponse.json(
      { error: `Gagal mengunggah file: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data: publicData } = supabase.storage
    .from("surat-izin")
    .getPublicUrl(path);

  return NextResponse.json({ url: publicData.publicUrl }, { status: 201 });
}
