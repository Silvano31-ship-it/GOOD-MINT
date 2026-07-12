// app/api/cron/social/route.ts — GET
// Chamado pela Vercel a cada 5 minutos (ver vercel.json). Publica os posts
// agendados vencidos. Protegido por CRON_SECRET (a Vercel envia
// "Authorization: Bearer $CRON_SECRET" automaticamente quando configurado nas
// env vars do projeto) — não depende de sessão de usuário, por isso o
// middleware precisa liberar /api/cron sem checar cookie de login.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishFacebookPost, publishInstagramPost } from "@/lib/meta";
import { publishTiktokPost } from "@/lib/tiktok";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { rows: due } = await db.query<{
    id: string;
    user_id: string;
    content: string;
    image_url: string | null;
    channels: string[];
  }>(
    `SELECT id, user_id, content, image_url, channels FROM scheduled_posts
     WHERE status='agendado' AND scheduled_for <= now()
     ORDER BY scheduled_for ASC LIMIT 20`
  );

  let processed = 0;
  for (const post of due) {
    await db.query(`UPDATE scheduled_posts SET status='publicando' WHERE id=$1`, [post.id]);

    const { rows: integrationRows } = await db.query<{
      channel: string;
      external_account_id: string | null;
      access_token_encrypted: string | null;
    }>(
      `SELECT channel, external_account_id, access_token_encrypted FROM channel_integrations WHERE user_id=$1`,
      [post.user_id]
    );
    const byChannel = Object.fromEntries(integrationRows.map((r) => [r.channel, r]));

    const errors: string[] = [];
    for (const channel of post.channels) {
      try {
        if (channel === "facebook") {
          const c = byChannel.facebook;
          if (!c?.external_account_id || !c.access_token_encrypted) throw new Error("Facebook não conectado.");
          await publishFacebookPost({
            pageId: c.external_account_id,
            pageToken: c.access_token_encrypted,
            message: post.content,
            imageUrl: post.image_url ?? undefined,
          });
        } else if (channel === "instagram") {
          const c = byChannel.instagram;
          if (!c?.external_account_id || !c.access_token_encrypted || !post.image_url) {
            throw new Error("Instagram precisa de imagem e conexão ativa.");
          }
          await publishInstagramPost({
            igUserId: c.external_account_id,
            pageToken: c.access_token_encrypted,
            imageUrl: post.image_url,
            caption: post.content,
          });
        } else if (channel === "tiktok") {
          const result = await publishTiktokPost();
          if (!result.ok) throw new Error(result.reason);
        }
      } catch (err: any) {
        errors.push(`${channel}: ${err.message}`);
      }
    }

    await db.query(
      `UPDATE scheduled_posts SET status=$1, published_at=now(), error=$2 WHERE id=$3`,
      [errors.length === 0 ? "publicado" : "falhou", errors.length ? errors.join("; ") : null, post.id]
    );
    processed++;
  }

  return NextResponse.json({ ok: true, processed });
}
