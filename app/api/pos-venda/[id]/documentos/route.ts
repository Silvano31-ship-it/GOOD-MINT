// app/api/pos-venda/[id]/documentos/route.ts — POST
// Upload de documento de um item do checklist (JPG/PNG/PDF, máx. 5MB) via
// Vercel Blob. Depois do upload, chama a validação de legibilidade por IA
// (lib/claude-vision.ts) e grava o veredito no próprio item.
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { validateUploadedFile } from "@/lib/blob-upload";
import { assessDocumentLegibility } from "@/lib/claude-vision";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { rows } = await db.query<{ id: string }>(
    `SELECT id FROM post_sale_processes WHERE id=$1 AND user_id=$2`,
    [params.id, session.userId]
  );
  if (!rows[0]) return NextResponse.json({ error: "Processo não encontrado." }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  const itemId = String(form.get("item_id") ?? "");
  if (!(file instanceof File) || !itemId) {
    return NextResponse.json({ error: "Arquivo ou item inválido." }, { status: 400 });
  }

  const validation = validateUploadedFile(file, { maxBytes: MAX_BYTES, allowedTypes: ALLOWED_TYPES });
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 422 });

  const { rows: itemRows } = await db.query<{ id: string }>(
    `SELECT id FROM post_sale_checklist_items WHERE id=$1 AND post_sale_id=$2`,
    [itemId, params.id]
  );
  if (!itemRows[0]) return NextResponse.json({ error: "Item do checklist não encontrado." }, { status: 404 });

  const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
  try {
    const blob = await put(`pos-venda-docs/${params.id}/${itemId}-${Date.now()}.${ext}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    await db.query(
      `UPDATE post_sale_checklist_items SET file_url=$1, status='enviado' WHERE id=$2`,
      [blob.url, itemId]
    );

    if (file.type !== "application/pdf") {
      try {
        const { verdict, notes } = await assessDocumentLegibility(blob.url);
        await db.query(
          `UPDATE post_sale_checklist_items SET ai_verdict=$1, ai_notes=$2 WHERE id=$3`,
          [verdict, notes, itemId]
        );
      } catch (err) {
        console.error("Erro na validação de IA do documento:", err);
      }
    }

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Erro ao enviar documento:", err);
    return NextResponse.json({ error: "Não foi possível enviar o arquivo agora." }, { status: 502 });
  }
}
