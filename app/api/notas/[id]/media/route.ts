// app/api/notas/[id]/media/route.ts — POST
// Upload de foto/vídeo anexado a uma nota, via Vercel Blob. Mesmo padrão de
// app/api/dashboard/background/route.ts (teto de 4MB — limite de request da
// Vercel, não configurável).
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { validateUploadedFile } from "@/lib/blob-upload";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { rows: noteRows } = await db.query(`SELECT id FROM notes WHERE id=$1 AND user_id=$2`, [
    params.id,
    session.userId,
  ]);
  if (!noteRows[0]) return NextResponse.json({ error: "Nota não encontrada." }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  const validation = validateUploadedFile(file, { maxBytes: MAX_BYTES, allowedTypes: ALLOWED_TYPES });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 422 });
  }

  const ext = EXT_BY_TYPE[file.type];
  const mediaType: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";

  try {
    const blob = await put(`notas/${params.id}-${Date.now()}.${ext}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    await db.query(`INSERT INTO note_media (note_id, url, media_type) VALUES ($1,$2,$3)`, [
      params.id,
      blob.url,
      mediaType,
    ]);
    return NextResponse.json({ url: blob.url, type: mediaType });
  } catch (err) {
    console.error("Erro ao enviar anexo da nota:", err);
    return NextResponse.json(
      { error: "Não foi possível enviar o arquivo agora. Tente novamente." },
      { status: 502 }
    );
  }
}
