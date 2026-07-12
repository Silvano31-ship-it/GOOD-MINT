// app/(dashboard)/actions.ts — server actions do CRM.
// Toda ação valida a sessão e escopa por user_id. Limites do plano (30 leads
// ativos / 15 imóveis) são aplicados aqui (seção 3 da spec).
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { onlyDigits } from "@/lib/format";
import { cancelSubscription as cancelAsaasSubscription } from "@/lib/asaas";
import { SUPPORT_WHATSAPP } from "@/lib/constants";
import { buildOAuthUrl, publishFacebookPost, publishInstagramPost } from "@/lib/meta";
import { publishTiktokPost } from "@/lib/tiktok";

async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
}

async function planLimits(userId: string) {
  const { rows } = await db.query<{ lead_limit: number | null; property_limit: number | null }>(
    `SELECT p.lead_limit, p.property_limit
     FROM subscriptions s JOIN plans p ON p.id = s.plan_id
     WHERE s.user_id = $1 ORDER BY s.created_at DESC LIMIT 1`,
    [userId]
  );
  return rows[0] ?? { lead_limit: null, property_limit: null };
}

// ---------------------------------------------------------------- LEADS
export async function createLead(formData: FormData) {
  const userId = await requireUserId();
  const { lead_limit } = await planLimits(userId);
  if (lead_limit != null) {
    const { rows } = await db.query<{ c: string }>(
      `SELECT count(*)::int AS c FROM leads WHERE user_id = $1 AND is_active`,
      [userId]
    );
    if (Number(rows[0].c) >= lead_limit) {
      redirect("/leads?limite=1");
    }
  }
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/leads");
  await db.query(
    `INSERT INTO leads (user_id, name, phone, email, origin, notes, funnel_stage, last_contact_at)
     VALUES ($1,$2,$3,$4,$5,$6,'novo_lead', now())`,
    [
      userId,
      name,
      String(formData.get("phone") ?? "") || null,
      String(formData.get("email") ?? "") || null,
      String(formData.get("origin") ?? "") || null,
      String(formData.get("notes") ?? "") || null,
    ]
  );
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function updateLeadStage(leadId: string, toStage: string) {
  const userId = await requireUserId();
  const { rows } = await db.query<{ funnel_stage: string }>(
    `SELECT funnel_stage FROM leads WHERE id = $1 AND user_id = $2`,
    [leadId, userId]
  );
  if (!rows[0]) return;
  const from = rows[0].funnel_stage;
  if (from === toStage) return;
  await db.query(`UPDATE leads SET funnel_stage = $1 WHERE id = $2 AND user_id = $3`, [
    toStage,
    leadId,
    userId,
  ]);
  await db.query(
    `INSERT INTO lead_stage_history (lead_id, from_stage, to_stage) VALUES ($1,$2,$3)`,
    [leadId, from, toStage]
  );
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function updateLead(leadId: string, formData: FormData) {
  const userId = await requireUserId();
  await db.query(
    `UPDATE leads SET name=$1, phone=$2, email=$3, origin=$4, notes=$5, last_contact_at=now()
     WHERE id=$6 AND user_id=$7`,
    [
      String(formData.get("name") ?? "").trim(),
      String(formData.get("phone") ?? "") || null,
      String(formData.get("email") ?? "") || null,
      String(formData.get("origin") ?? "") || null,
      String(formData.get("notes") ?? "") || null,
      leadId,
      userId,
    ]
  );
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
}

export async function addLeadInteraction(leadId: string, formData: FormData) {
  const userId = await requireUserId();
  const { rows } = await db.query(`SELECT id FROM leads WHERE id=$1 AND user_id=$2`, [
    leadId,
    userId,
  ]);
  if (!rows[0]) return;
  await db.query(
    `INSERT INTO lead_interactions (lead_id, interaction_type, content) VALUES ($1,$2,$3)`,
    [leadId, String(formData.get("type") ?? "nota"), String(formData.get("content") ?? "")]
  );
  await db.query(`UPDATE leads SET last_contact_at = now() WHERE id=$1`, [leadId]);
  revalidatePath(`/leads/${leadId}`);
}

// ---------------------------------------------------------------- IMÓVEIS
export async function createProperty(formData: FormData) {
  const userId = await requireUserId();
  const { property_limit } = await planLimits(userId);
  if (property_limit != null) {
    const { rows } = await db.query<{ c: string }>(
      `SELECT count(*)::int AS c FROM properties WHERE user_id=$1 AND is_active`,
      [userId]
    );
    if (Number(rows[0].c) >= property_limit) redirect("/imoveis?limite=1");
  }
  const priceCents = Math.round(Number(String(formData.get("price") ?? "0").replace(",", ".")) * 100);
  await db.query(
    `INSERT INTO properties (user_id, address, property_type, price_cents, area_m2, status, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      userId,
      String(formData.get("address") ?? "").trim(),
      String(formData.get("property_type") ?? "outro"),
      isNaN(priceCents) ? 0 : priceCents,
      String(formData.get("area_m2") ?? "") || null,
      String(formData.get("status") ?? "disponivel"),
      String(formData.get("description") ?? "") || null,
    ]
  );
  revalidatePath("/imoveis");
  revalidatePath("/dashboard");
  redirect("/imoveis");
}

export async function updateProperty(propertyId: string, formData: FormData) {
  const userId = await requireUserId();
  const priceCents = Math.round(Number(String(formData.get("price") ?? "0").replace(",", ".")) * 100);
  await db.query(
    `UPDATE properties SET address=$1, property_type=$2, price_cents=$3, area_m2=$4, status=$5, description=$6
     WHERE id=$7 AND user_id=$8`,
    [
      String(formData.get("address") ?? "").trim(),
      String(formData.get("property_type") ?? "outro"),
      isNaN(priceCents) ? 0 : priceCents,
      String(formData.get("area_m2") ?? "") || null,
      String(formData.get("status") ?? "disponivel"),
      String(formData.get("description") ?? "") || null,
      propertyId,
      userId,
    ]
  );
  revalidatePath("/imoveis");
  redirect("/imoveis");
}

export async function deactivateProperty(propertyId: string) {
  const userId = await requireUserId();
  await db.query(`UPDATE properties SET is_active=false, status='inativo' WHERE id=$1 AND user_id=$2`, [
    propertyId,
    userId,
  ]);
  revalidatePath("/imoveis");
  revalidatePath("/dashboard");
}

// ---------------------------------------------------------------- NEGOCIAÇÕES
export async function createNegotiation(formData: FormData) {
  const userId = await requireUserId();
  const leadId = String(formData.get("lead_id") ?? "");
  if (!leadId) redirect("/negociacoes");
  const valueCents = Math.round(Number(String(formData.get("value") ?? "0").replace(",", ".")) * 100);
  await db.query(
    `INSERT INTO negotiations (user_id, lead_id, property_id, negotiation_type, value_cents)
     VALUES ($1,$2,$3,$4,$5)`,
    [
      userId,
      leadId,
      String(formData.get("property_id") ?? "") || null,
      String(formData.get("negotiation_type") ?? "venda"),
      isNaN(valueCents) ? null : valueCents,
    ]
  );
  revalidatePath("/negociacoes");
  revalidatePath("/dashboard");
}

/** Fecha a negociação e, opcionalmente, inicia o acompanhamento de pós-venda. */
export async function closeNegotiation(negotiationId: string, startPostSale: boolean) {
  const userId = await requireUserId();
  const { rows } = await db.query<{ lead_id: string }>(
    `SELECT lead_id FROM negotiations WHERE id=$1 AND user_id=$2`,
    [negotiationId, userId]
  );
  if (!rows[0]) return;
  await db.query(
    `UPDATE negotiations SET status='fechada', closed_at=now() WHERE id=$1 AND user_id=$2`,
    [negotiationId, userId]
  );
  await db.query(`UPDATE leads SET funnel_stage='fechado' WHERE id=$1 AND user_id=$2`, [
    rows[0].lead_id,
    userId,
  ]);
  if (startPostSale) {
    await db.query(
      `INSERT INTO post_sale_processes (user_id, negotiation_id, current_stage)
       VALUES ($1,$2,'documentacao_enviada')
       ON CONFLICT (negotiation_id) DO NOTHING`,
      [userId, negotiationId]
    );
  }
  revalidatePath("/negociacoes");
  revalidatePath("/pos-venda");
  revalidatePath("/dashboard");
}

// ---------------------------------------------------------------- PÓS-VENDA
const POST_SALE_ORDER = [
  "documentacao_enviada",
  "analise_credito",
  "aprovacao",
  "assinatura_contrato",
  "registro_cartorio",
  "entrega_chaves",
];

/** Avança o processo para uma etapa e registra o "envio" automático ao cliente. */
export async function advancePostSaleStage(postSaleId: string, toStage: string) {
  const userId = await requireUserId();
  const { rows } = await db.query<{ current_stage: string }>(
    `SELECT current_stage FROM post_sale_processes WHERE id=$1 AND user_id=$2`,
    [postSaleId, userId]
  );
  if (!rows[0]) return;
  const from = rows[0].current_stage;
  if (from === toStage) return;

  await db.query(
    `UPDATE post_sale_processes SET current_stage=$1, stage_updated_at=now(), stalled_alert_sent_at=NULL
     WHERE id=$2 AND user_id=$3`,
    [toStage, postSaleId, userId]
  );
  await db.query(
    `INSERT INTO post_sale_stage_history (post_sale_id, from_stage, to_stage) VALUES ($1,$2,$3)`,
    [postSaleId, from, toStage]
  );
  // Registra a mensagem automática que seria enviada ao cliente via WhatsApp
  // (envio real depende da Central de Mensagens conectada — seção 8).
  await db.query(
    `INSERT INTO post_sale_notifications_sent (post_sale_id, stage, channel) VALUES ($1,$2,'whatsapp')`,
    [postSaleId, toStage]
  );
  revalidatePath(`/pos-venda/${postSaleId}`);
  revalidatePath("/pos-venda");
  revalidatePath("/dashboard");
}

export async function setPostSaleNextAction(postSaleId: string, formData: FormData) {
  const userId = await requireUserId();
  await db.query(`UPDATE post_sale_processes SET next_action=$1 WHERE id=$2 AND user_id=$3`, [
    String(formData.get("next_action") ?? "") || null,
    postSaleId,
    userId,
  ]);
  revalidatePath(`/pos-venda/${postSaleId}`);
}

// ---------------------------------------------------------------- TAREFAS
export async function createTask(formData: FormData) {
  const userId = await requireUserId();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect("/tarefas");
  await db.query(
    `INSERT INTO tasks (user_id, title, due_at, related_type) VALUES ($1,$2,$3,'geral')`,
    [userId, title, String(formData.get("due_at") ?? "") || null]
  );
  revalidatePath("/tarefas");
}

export async function toggleTask(taskId: string, done: boolean) {
  const userId = await requireUserId();
  await db.query(`UPDATE tasks SET done=$1 WHERE id=$2 AND user_id=$3`, [done, taskId, userId]);
  revalidatePath("/tarefas");
}

// ---------------------------------------------------------------- CENTRAL DE MENSAGENS
// Fase 1 do lançamento (seção 10 da spec): a conexão real de canais depende
// de aprovação de negócio da Meta (WhatsApp/Instagram/Facebook) e validação
// técnica da API do TikTok — nenhuma delas está disponível nesta fase. Este
// botão registra a intenção de conectar; a integração real (OAuth com o
// canal) entra quando essas aprovações existirem.
export async function requestChannelConnection(channel: string) {
  const userId = await requireUserId();
  await db.query(
    `INSERT INTO channel_integrations (user_id, channel, status)
     VALUES ($1, $2, 'desconectado')
     ON CONFLICT (user_id, channel) DO NOTHING`,
    [userId, channel]
  );
  revalidatePath("/configuracoes/integracoes");
}

/** Inicia o fluxo OAuth do Meta (Instagram/Facebook). Navegação de página
 * inteira até o Meta — por isso é o único caso que usa redirect() de verdade
 * em vez de retornar dados pro client. */
export async function startMetaOAuth(channel: "instagram" | "facebook") {
  const userId = await requireUserId();
  const redirectUri = `${process.env.APP_URL}/api/oauth/meta/callback`;
  const url = buildOAuthUrl(redirectUri, `${userId}:${channel}`);
  redirect(url);
}

export async function toggleAutoReply(channel: string, enabled: boolean) {
  const userId = await requireUserId();
  await db.query(
    `UPDATE channel_integrations SET auto_reply_enabled=$1 WHERE user_id=$2 AND channel=$3`,
    [enabled, userId, channel]
  );
  revalidatePath("/configuracoes/integracoes");
}

export async function saveBotConfig(formData: FormData) {
  const userId = await requireUserId();
  await db.query(
    `INSERT INTO bot_configs (user_id, tone, allowed_info, is_active)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id) DO UPDATE SET tone=$2, allowed_info=$3, is_active=$4, updated_at=now()`,
    [
      userId,
      String(formData.get("tone") ?? "profissional"),
      String(formData.get("allowed_info") ?? "") || null,
      formData.get("is_active") === "on",
    ]
  );
  revalidatePath("/configuracoes/bot");
}

// ---------------------------------------------------------------- PLANO E COBRANÇA
/** Cancela a assinatura no Asaas e marca localmente; acesso segue até o fim
 * do período já pago (seção 11 da spec — sem corte imediato). */
export async function cancelMySubscription() {
  const userId = await requireUserId();
  const { rows } = await db.query<{ id: string; gateway_subscription_id: string | null }>(
    `SELECT id, gateway_subscription_id FROM subscriptions
     WHERE user_id=$1 AND canceled_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  const sub = rows[0];
  if (!sub) return;

  if (sub.gateway_subscription_id) {
    try {
      await cancelAsaasSubscription(sub.gateway_subscription_id);
    } catch (err) {
      console.error("Erro ao cancelar assinatura no Asaas:", err);
    }
  }
  await db.query(`UPDATE subscriptions SET canceled_at=now(), status='canceled' WHERE id=$1`, [sub.id]);
  revalidatePath("/configuracoes/plano");
}

// ---------------------------------------------------------------- PERFIL
export async function updateProfile(formData: FormData) {
  const userId = await requireUserId();
  await db.query(
    `UPDATE users SET full_name=$1, phone=$2, creci=$3, bio=$4, company_name=$5, company_bio=$6 WHERE id=$7`,
    [
      String(formData.get("full_name") ?? "").trim(),
      onlyDigits(String(formData.get("phone") ?? "")) ? String(formData.get("phone")) : "",
      String(formData.get("creci") ?? "") || null,
      String(formData.get("bio") ?? "").slice(0, 400) || null,
      String(formData.get("company_name") ?? "").trim() || null,
      String(formData.get("company_bio") ?? "").slice(0, 400) || null,
      userId,
    ]
  );
  revalidatePath("/configuracoes");
  revalidatePath("/dashboard");
}

export async function completeOnboarding() {
  const userId = await requireUserId();
  await db.query(`UPDATE users SET onboarding_done=true WHERE id=$1`, [userId]);
  revalidatePath("/dashboard");
}

// ---------------------------------------------------------------- SUPORTE
/** Grava o ticket e devolve o link do WhatsApp — não usa redirect() porque
 * precisamos abrir o WhatsApp numa aba nova a partir do client, e não navegar
 * o próprio app para fora. */
export async function createSupportTicket(formData: FormData): Promise<{ waUrl: string }> {
  const userId = await requireUserId();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  const { rows } = await db.query<{ full_name: string; email: string }>(
    `SELECT full_name, email FROM users WHERE id=$1`,
    [userId]
  );
  const user = rows[0];

  await db.query(
    `INSERT INTO support_tickets (user_id, category, description) VALUES ($1,$2,$3)`,
    [userId, category, description]
  );

  const message = [
    `Olá! Sou ${user.full_name}, usuário do GOOD MINT.`,
    `Categoria: ${category}`,
    `Situação: ${description ?? "—"}`,
    `Meu e-mail de cadastro: ${user.email}`,
  ].join("\n");

  return { waUrl: `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}` };
}

// ---------------------------------------------------------------- SOCIAL
/** Publica agora (chama a API do canal direto) ou agenda (grava para o cron
 * processar depois). Sempre registra o resultado em scheduled_posts, mesmo
 * quando é "agora", para aparecer em Minhas publicações. */
export async function createPost(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId();
  const content = String(formData.get("content") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "") || null;
  const channels = formData.getAll("channels").map(String);
  const mode = String(formData.get("mode") ?? "agora");
  const scheduledForRaw = String(formData.get("scheduled_for") ?? "");

  if (!content || channels.length === 0) {
    return { ok: false, error: "Escreva um texto e selecione ao menos um canal." };
  }

  if (mode === "agendar") {
    if (!scheduledForRaw) return { ok: false, error: "Escolha data e hora." };
    await db.query(
      `INSERT INTO scheduled_posts (user_id, content, image_url, channels, status, scheduled_for)
       VALUES ($1,$2,$3,$4,'agendado',$5)`,
      [userId, content, imageUrl, channels, new Date(scheduledForRaw).toISOString()]
    );
    revalidatePath("/social/publicacoes");
    return { ok: true };
  }

  const { rows: integrationRows } = await db.query<{
    channel: string;
    external_account_id: string | null;
    access_token_encrypted: string | null;
  }>(
    `SELECT channel, external_account_id, access_token_encrypted FROM channel_integrations WHERE user_id=$1`,
    [userId]
  );
  const byChannel = Object.fromEntries(integrationRows.map((r) => [r.channel, r]));

  const errors: string[] = [];
  for (const channel of channels) {
    try {
      if (channel === "facebook") {
        const c = byChannel.facebook;
        if (!c?.external_account_id || !c.access_token_encrypted) throw new Error("Facebook não conectado.");
        await publishFacebookPost({
          pageId: c.external_account_id,
          pageToken: c.access_token_encrypted,
          message: content,
          imageUrl: imageUrl ?? undefined,
        });
      } else if (channel === "instagram") {
        const c = byChannel.instagram;
        if (!c?.external_account_id || !c.access_token_encrypted || !imageUrl) {
          throw new Error("Instagram precisa de uma imagem e de conexão ativa.");
        }
        await publishInstagramPost({
          igUserId: c.external_account_id,
          pageToken: c.access_token_encrypted,
          imageUrl,
          caption: content,
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
    `INSERT INTO scheduled_posts (user_id, content, image_url, channels, status, published_at, error)
     VALUES ($1,$2,$3,$4,$5,now(),$6)`,
    [
      userId,
      content,
      imageUrl,
      channels,
      errors.length === 0 ? "publicado" : "falhou",
      errors.length ? errors.join("; ") : null,
    ]
  );
  revalidatePath("/social/publicacoes");
  return { ok: errors.length === 0, error: errors.join("; ") || undefined };
}

export async function cancelScheduledPost(id: string) {
  const userId = await requireUserId();
  await db.query(
    `UPDATE scheduled_posts SET status='cancelado' WHERE id=$1 AND user_id=$2 AND status='agendado'`,
    [id, userId]
  );
  revalidatePath("/social/publicacoes");
}
