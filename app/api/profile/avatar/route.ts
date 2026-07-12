// app/api/profile/avatar/route.ts — POST
// Upload da foto de perfil (JPG/PNG, máx. 2MB) via Vercel Blob. Salva a URL em
// users.avatar_url. Se o upload falhar, a UI mantém o avatar de iniciais.
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Envie uma imagem JPG ou PNG." }, { status: 422 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "A imagem deve ter no máximo 2 MB." }, { status: 422 });
  }

  const ext = file.type === "image/png" ? "png" : "jpg";
  try {
    const blob = await put(`avatars/${session.userId}-${Date.now()}.${ext}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    await db.query(`UPDATE users SET avatar_url=$1 WHERE id=$2`, [blob.url, session.userId]);
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Erro ao enviar avatar:", err);
    return NextResponse.json(
      { error: "Não foi possível enviar a foto agora. Tente novamente." },
      { status: 502 }
    );
  }
}
