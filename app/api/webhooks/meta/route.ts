// app/api/webhooks/meta/route.ts
// GET: handshake de verificação da assinatura do webhook (exigido pelo Meta ao
// configurar a URL no painel do App). POST: eventos reais (comentários,
// menções, mensagens) — grava em social_activity após validar a assinatura.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/meta";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "Verificação inválida." }, { status: 403 });
}

interface MetaChange {
  field: string;
  value: {
    item?: string;
    verb?: string;
    comment_id?: string;
    from?: { id?: string; name?: string };
    message?: string;
    text?: string;
    post_id?: string;
  };
}

interface MetaEntry {
  id: string; // page-scoped id ou ig-scoped id
  changes?: MetaChange[];
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  let payload: { entry?: MetaEntry[] };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  for (const entry of payload.entry ?? []) {
    const { rows } = await db.query<{ user_id: string; channel: string }>(
      `SELECT user_id, channel FROM channel_integrations WHERE external_account_id=$1 LIMIT 1`,
      [entry.id]
    );
    const integration = rows[0];
    if (!integration) continue;

    for (const change of entry.changes ?? []) {
      const kind =
        change.field === "comments"
          ? "comentario"
          : change.field === "mentions"
          ? "mencao"
          : change.value.verb === "add" && change.field === "feed"
          ? "mensagem"
          : "curtida";

      await db.query(
        `INSERT INTO social_activity (user_id, channel, kind, author_name, author_external_id, content, post_external_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          integration.user_id,
          integration.channel,
          kind,
          change.value.from?.name ?? null,
          change.value.from?.id ?? null,
          change.value.message ?? change.value.text ?? null,
          change.value.post_id ?? change.value.comment_id ?? null,
        ]
      );
    }
  }

  return NextResponse.json({ ok: true });
}
