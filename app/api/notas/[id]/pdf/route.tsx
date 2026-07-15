// app/api/notas/[id]/pdf/route.tsx — GET
// Gera e baixa o PDF da nota. Rota (não Server Component), checagem de sessão
// manual — mesmo padrão de app/api/pos-venda/[id]/relatorio/route.tsx.
import { renderToStream } from "@react-pdf/renderer";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { NotePDF } from "@/components/notas/NotePDF";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return new Response("Não autenticado.", { status: 401 });

  const { rows } = await db.query<{ title: string; content: string | null }>(
    `SELECT title, content FROM notes WHERE id=$1 AND user_id=$2`,
    [params.id, session.userId]
  );
  const note = rows[0];
  if (!note) return new Response("Nota não encontrada.", { status: 404 });

  const { rows: media } = await db.query<{ url: string; media_type: string }>(
    `SELECT url, media_type FROM note_media WHERE note_id=$1 ORDER BY created_at ASC`,
    [params.id]
  );
  const photos = media.filter((m) => m.media_type === "image").map((m) => m.url);
  const videoCount = media.filter((m) => m.media_type === "video").length;

  const stream = await renderToStream(
    <NotePDF
      title={note.title}
      content={note.content}
      photos={photos}
      videoCount={videoCount}
      generatedAt={new Date().toISOString()}
    />
  );

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="nota-${params.id}.pdf"`,
    },
  });
}
