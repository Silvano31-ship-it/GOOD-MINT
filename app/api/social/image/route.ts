// app/api/social/image/route.ts — POST
// Upload de imagem para uma publicação do Módulo Social (mesmo mecanismo do
// avatar, mas sem gravar em `users` — só devolve a URL pro formulário usar).
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/session";

const MAX_BYTES = 8 * 1024 * 1024;
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
    return NextResponse.json({ error: "A imagem deve ter no máximo 8 MB." }, { status: 422 });
  }

  const ext = file.type === "image/png" ? "png" : "jpg";
  try {
    const blob = await put(`social/${session.userId}-${Date.now()}.${ext}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Erro ao enviar imagem da publicação:", err);
    return NextResponse.json({ error: "Não foi possível enviar a imagem agora." }, { status: 502 });
  }
}
