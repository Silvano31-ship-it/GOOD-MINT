// app/api/dashboard/background/route.ts — POST
// Upload do fundo personalizado do Dashboard (foto ou vídeo curto) via Vercel
// Blob. Salva a URL em users.background_url/background_type. Mesmo padrão do
// upload de avatar (app/api/profile/avatar/route.ts).
//
// Limite de 4MB: rotas de API na Vercel têm teto de request de ~4,5MB (limite
// da plataforma, não configurável) — mantemos margem de segurança abaixo disso.
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const MAX_BYTES = 4 * 1024 * 1024;
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  // .mov — formato padrão de vídeos gravados/exportados direto da galeria do
  // iPhone sem conversão. O Safari (usado pelo usuário) reproduz nativamente.
  "video/quicktime": "mov",
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Envie uma imagem (JPG/PNG/WEBP) ou um vídeo (MP4/WEBM/MOV)." },
      { status: 422 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "O arquivo deve ter no máximo 4 MB." }, { status: 422 });
  }

  const type: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";

  try {
    const blob = await put(`dashboard-bg/${session.userId}-${Date.now()}.${ext}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    await db.query(`UPDATE users SET background_url=$1, background_type=$2 WHERE id=$3`, [
      blob.url,
      type,
      session.userId,
    ]);
    return NextResponse.json({ url: blob.url, type });
  } catch (err) {
    console.error("Erro ao enviar fundo do dashboard:", err);
    return NextResponse.json(
      { error: "Não foi possível enviar o arquivo agora. Tente novamente." },
      { status: 502 }
    );
  }
}
