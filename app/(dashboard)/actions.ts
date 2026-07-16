// app/(dashboard)/actions.ts — server actions do CRM.
// Toda ação valida a sessão e escopa por user_id. Limites do plano (30 leads
// ativos / 15 imóveis) são aplicados aqui (seção 3 da spec).
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { onlyDigits } from "@/lib/format";
import { cancelSubscription as cancelAsaasSubscription, updateSubscriptionPlan } from "@/lib/asaas";
import { SUPPORT_WHATSAPP, PLAN_PRICING } from "@/lib/constants";
import { buildOAuthUrl, publishFacebookPost, publishInstagramPost } from "@/lib/meta";
import { publishTiktokPost } from "@/lib/tiktok";

async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
}

async function planLimits(userId: string) {
  const { rows: uRows } = await db.query<{ ai_unlimited: boolean }>(
    `SELECT ai_unlimited FROM users WHERE id = $1`,
    [userId]
  );
  if (uRows[0]?.ai_unlimited) return { lead_limit: null, property_limit: null };

  const { rows } = await db.query<{ lead_limit: number | null; property_limit: number | null }>(
    `SELECT p.lead_limit, p.property_limit
     FROM subscriptions s JOIN plans p ON p.id = s.plan_id
     WHERE s.user_id = $1 ORDER BY s.created_at DESC LIMIT 1`,
    [userId]
  );
  return rows[0] ?? { lead_limit: null, property_limit: null };
}

// ---------------------------------------------------------------- LEADS
/** Converte "1500", "1500,50" ou "1.500,50" em centavos. Vazio -> null. */
function parseEstimatedValueCents(raw: FormDataEntryValue | null): number | null {
  const str = String(raw ?? "").trim();
  if (!str) return null;
  const normalized = str.includes(",") ? str.replace(/\./g, "").replace(",", ".") : str;
  const n = Number(normalized);
  return isNaN(n) ? null : Math.round(n * 100);
}

/** Chamada direto do client (não via <form action>), pra poder devolver o
 * aviso de telefone duplicado sem sair da tela — ver NewLeadButton.tsx. */
export async function createLead(
  formData: FormData,
  options?: { forceCreate?: boolean }
): Promise<{ ok: boolean; duplicate?: { id: string; name: string } }> {
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
  if (!name) return { ok: false };

  const phone = String(formData.get("phone") ?? "") || null;
  const phoneDigits = phone ? onlyDigits(phone) : "";

  if (phoneDigits && !options?.forceCreate) {
    const { rows } = await db.query<{ id: string; name: string }>(
      `SELECT id, name FROM leads
       WHERE user_id=$1 AND is_active AND regexp_replace(phone, '[^0-9]', '', 'g') = $2
       LIMIT 1`,
      [userId, phoneDigits]
    );
    if (rows[0]) {
      return { ok: false, duplicate: { id: rows[0].id, name: rows[0].name } };
    }
  }

  const { rows: inserted } = await db.query<{ id: string }>(
    `INSERT INTO leads (user_id, name, phone, email, origin, notes, funnel_stage, last_contact_at, estimated_value_cents)
     VALUES ($1,$2,$3,$4,$5,$6,'novo_lead', now(), $7)
     RETURNING id`,
    [
      userId,
      name,
      phone,
      String(formData.get("email") ?? "") || null,
      String(formData.get("origin") ?? "") || null,
      String(formData.get("notes") ?? "") || null,
      parseEstimatedValueCents(formData.get("estimated_value")),
    ]
  );
  await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id) VALUES ($1, 'novo_lead', $2, $3)`,
    [userId, `Novo lead cadastrado: ${name}`, inserted[0].id]
  );
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { ok: true };
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
    `UPDATE leads SET name=$1, phone=$2, email=$3, origin=$4, notes=$5, last_contact_at=now(), estimated_value_cents=$6
     WHERE id=$7 AND user_id=$8`,
    [
      String(formData.get("name") ?? "").trim(),
      String(formData.get("phone") ?? "") || null,
      String(formData.get("email") ?? "") || null,
      String(formData.get("origin") ?? "") || null,
      String(formData.get("notes") ?? "") || null,
      parseEstimatedValueCents(formData.get("estimated_value")),
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

/** Edição inline na Planilha de Leads. Lista de colunas explícita — nunca um
 * nome de coluna vindo do client, pra não abrir brecha de SQL injection. */
export async function updateLeadField(leadId: string, field: string, value: string) {
  const userId = await requireUserId();
  const allowed = new Set(["name", "phone", "email", "origin", "estimated_value_cents"]);
  if (!allowed.has(field)) return;

  if (field === "estimated_value_cents") {
    await db.query(`UPDATE leads SET estimated_value_cents=$1 WHERE id=$2 AND user_id=$3`, [
      parseEstimatedValueCents(value),
      leadId,
      userId,
    ]);
  } else {
    await db.query(`UPDATE leads SET ${field}=$1 WHERE id=$2 AND user_id=$3`, [
      value || null,
      leadId,
      userId,
    ]);
  }
  revalidatePath("/planilhas/leads");
  revalidatePath(`/leads/${leadId}`);
}

// Wrappers finos com assinatura (id, valor) — passados direto como onSave das
// células editáveis da planilha, sem precisar de closures inline no server component.
export async function updateLeadName(id: string, value: string) { return updateLeadField(id, "name", value); }
export async function updateLeadEstimatedValue(id: string, value: string) { return updateLeadField(id, "estimated_value_cents", value); }
export async function updateLeadPhone(id: string, value: string) { return updateLeadField(id, "phone", value); }
export async function updateLeadOrigin(id: string, value: string) { return updateLeadField(id, "origin", value); }
export async function updateLeadStageField(id: string, toStage: string) { return bulkUpdateLeadStage([id], toStage); }

export async function bulkDeleteLeads(ids: string[]) {
  const userId = await requireUserId();
  if (ids.length === 0) return;
  await db.query(`UPDATE leads SET is_active=false WHERE id = ANY($1::uuid[]) AND user_id=$2`, [
    ids,
    userId,
  ]);
  revalidatePath("/planilhas/leads");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function duplicateLeads(ids: string[]) {
  const userId = await requireUserId();
  if (ids.length === 0) return;
  await db.query(
    `INSERT INTO leads (user_id, name, phone, email, origin, notes, funnel_stage)
     SELECT user_id, name || ' (cópia)', phone, email, origin, notes, 'novo_lead'
     FROM leads WHERE id = ANY($1::uuid[]) AND user_id=$2`,
    [ids, userId]
  );
  revalidatePath("/planilhas/leads");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function bulkUpdateLeadStage(ids: string[], toStage: string) {
  const userId = await requireUserId();
  if (ids.length === 0) return;
  const { rows } = await db.query<{ id: string; funnel_stage: string }>(
    `SELECT id, funnel_stage FROM leads WHERE id = ANY($1::uuid[]) AND user_id=$2`,
    [ids, userId]
  );
  for (const r of rows) {
    if (r.funnel_stage === toStage) continue;
    await db.query(`UPDATE leads SET funnel_stage=$1 WHERE id=$2`, [toStage, r.id]);
    await db.query(
      `INSERT INTO lead_stage_history (lead_id, from_stage, to_stage) VALUES ($1,$2,$3)`,
      [r.id, r.funnel_stage, toStage]
    );
  }
  revalidatePath("/planilhas/leads");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

/** Importação em lote (colar do Excel/CSV, ver ImportModal). Respeita o limite
 * do plano — linhas além do limite são ignoradas e reportadas ao usuário. */
export async function importLeads(
  rows: { name: string; phone?: string; email?: string; origin?: string }[]
): Promise<{ imported: number; skipped: number }> {
  const userId = await requireUserId();
  const clean = rows.filter((r) => r.name && r.name.trim());
  if (clean.length === 0) return { imported: 0, skipped: 0 };

  const { lead_limit } = await planLimits(userId);
  let allowed = clean;
  if (lead_limit != null) {
    const { rows: countRows } = await db.query<{ c: string }>(
      `SELECT count(*)::int AS c FROM leads WHERE user_id = $1 AND is_active`,
      [userId]
    );
    const remaining = Math.max(0, lead_limit - Number(countRows[0].c));
    allowed = clean.slice(0, remaining);
  }

  for (const r of allowed) {
    await db.query(
      `INSERT INTO leads (user_id, name, phone, email, origin, funnel_stage, last_contact_at)
       VALUES ($1,$2,$3,$4,$5,'novo_lead', now())`,
      [userId, r.name.trim(), r.phone?.trim() || null, r.email?.trim() || null, r.origin?.trim() || null]
    );
  }
  revalidatePath("/planilhas/leads");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { imported: allowed.length, skipped: clean.length - allowed.length };
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
    `INSERT INTO properties (user_id, address, property_type, price_cents, area_m2, status, description, is_exclusive, price_alignment)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      userId,
      String(formData.get("address") ?? "").trim(),
      String(formData.get("property_type") ?? "outro"),
      isNaN(priceCents) ? 0 : priceCents,
      String(formData.get("area_m2") ?? "") || null,
      String(formData.get("status") ?? "disponivel"),
      String(formData.get("description") ?? "") || null,
      String(formData.get("is_exclusive") ?? "true") === "true",
      String(formData.get("price_alignment") ?? "") || null,
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
    `UPDATE properties SET address=$1, property_type=$2, price_cents=$3, area_m2=$4, status=$5, description=$6, is_exclusive=$7, price_alignment=$8
     WHERE id=$9 AND user_id=$10`,
    [
      String(formData.get("address") ?? "").trim(),
      String(formData.get("property_type") ?? "outro"),
      isNaN(priceCents) ? 0 : priceCents,
      String(formData.get("area_m2") ?? "") || null,
      String(formData.get("status") ?? "disponivel"),
      String(formData.get("description") ?? "") || null,
      String(formData.get("is_exclusive") ?? "true") === "true",
      String(formData.get("price_alignment") ?? "") || null,
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

/** Edição inline na Planilha de Imóveis. Lista de colunas explícita. */
export async function updatePropertyField(propertyId: string, field: string, value: string) {
  const userId = await requireUserId();
  const allowed = new Set(["address", "price_cents", "property_type", "status"]);
  if (!allowed.has(field)) return;

  if (field === "price_cents") {
    const cents = Math.round(Number(value.replace(",", ".")) * 100);
    if (isNaN(cents)) return;
    await db.query(`UPDATE properties SET price_cents=$1 WHERE id=$2 AND user_id=$3`, [
      cents,
      propertyId,
      userId,
    ]);
  } else {
    await db.query(`UPDATE properties SET ${field}=$1 WHERE id=$2 AND user_id=$3`, [
      value,
      propertyId,
      userId,
    ]);
  }
  revalidatePath("/planilhas/imoveis");
  revalidatePath("/imoveis");
}

export async function updatePropertyAddress(id: string, value: string) { return updatePropertyField(id, "address", value); }
export async function updatePropertyPrice(id: string, value: string) { return updatePropertyField(id, "price_cents", value); }
export async function updatePropertyType(id: string, value: string) { return updatePropertyField(id, "property_type", value); }
export async function updatePropertyStatus(id: string, value: string) { return updatePropertyField(id, "status", value); }

export async function bulkDeleteProperties(ids: string[]) {
  const userId = await requireUserId();
  if (ids.length === 0) return;
  await db.query(
    `UPDATE properties SET is_active=false, status='inativo' WHERE id = ANY($1::uuid[]) AND user_id=$2`,
    [ids, userId]
  );
  revalidatePath("/planilhas/imoveis");
  revalidatePath("/imoveis");
  revalidatePath("/dashboard");
}

export async function duplicateProperties(ids: string[]) {
  const userId = await requireUserId();
  if (ids.length === 0) return;
  await db.query(
    `INSERT INTO properties (user_id, address, property_type, price_cents, area_m2, status, description)
     SELECT user_id, address || ' (cópia)', property_type, price_cents, area_m2, 'disponivel', description
     FROM properties WHERE id = ANY($1::uuid[]) AND user_id=$2`,
    [ids, userId]
  );
  revalidatePath("/planilhas/imoveis");
  revalidatePath("/imoveis");
  revalidatePath("/dashboard");
}

const VALID_PROPERTY_TYPES = new Set(["apartamento", "casa", "terreno", "comercial", "rural", "outro"]);
const VALID_PROPERTY_STATUSES = new Set(["disponivel", "reservado", "vendido", "alugado", "inativo"]);

/** Importação em lote (colar do Excel/CSV, ver ImportModal). Tipo/status fora
 * da lista válida caem no padrão (são enums no banco, não aceitam texto livre). */
export async function importProperties(
  rows: { address: string; property_type?: string; price_cents?: number; area_m2?: string; status?: string }[]
): Promise<{ imported: number; skipped: number }> {
  const userId = await requireUserId();
  const clean = rows.filter((r) => r.address && r.address.trim());
  if (clean.length === 0) return { imported: 0, skipped: 0 };

  const { property_limit } = await planLimits(userId);
  let allowed = clean;
  if (property_limit != null) {
    const { rows: countRows } = await db.query<{ c: string }>(
      `SELECT count(*)::int AS c FROM properties WHERE user_id=$1 AND is_active`,
      [userId]
    );
    const remaining = Math.max(0, property_limit - Number(countRows[0].c));
    allowed = clean.slice(0, remaining);
  }

  for (const r of allowed) {
    const propertyType = r.property_type && VALID_PROPERTY_TYPES.has(r.property_type) ? r.property_type : "outro";
    const status = r.status && VALID_PROPERTY_STATUSES.has(r.status) ? r.status : "disponivel";
    await db.query(
      `INSERT INTO properties (user_id, address, property_type, price_cents, area_m2, status)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [userId, r.address.trim(), propertyType, r.price_cents ?? 0, r.area_m2?.trim() || null, status]
    );
  }
  revalidatePath("/planilhas/imoveis");
  revalidatePath("/imoveis");
  revalidatePath("/dashboard");
  return { imported: allowed.length, skipped: clean.length - allowed.length };
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
       VALUES ($1,$2,'assinatura_contrato')
       ON CONFLICT (negotiation_id) DO NOTHING`,
      [userId, negotiationId]
    );
  }
  revalidatePath("/negociacoes");
  revalidatePath("/pos-venda");
  revalidatePath("/dashboard");
}

/** Edição inline na Planilha de Negociações. Lista de colunas explícita. */
export async function updateNegotiationField(negotiationId: string, field: string, value: string) {
  const userId = await requireUserId();
  const allowed = new Set(["value_cents", "status"]);
  if (!allowed.has(field)) return;

  if (field === "value_cents") {
    const cents = Math.round(Number(value.replace(",", ".")) * 100);
    if (isNaN(cents)) return;
    await db.query(`UPDATE negotiations SET value_cents=$1 WHERE id=$2 AND user_id=$3`, [
      cents,
      negotiationId,
      userId,
    ]);
  } else {
    await db.query(`UPDATE negotiations SET status=$1 WHERE id=$2 AND user_id=$3`, [
      value,
      negotiationId,
      userId,
    ]);
  }
  revalidatePath("/planilhas/negociacoes");
  revalidatePath("/negociacoes");
}

export async function updateNegotiationValue(id: string, value: string) { return updateNegotiationField(id, "value_cents", value); }
export async function updateNegotiationStatus(id: string, value: string) { return updateNegotiationField(id, "status", value); }

/** Sem coluna is_active em negotiations (diferente de leads/properties) — exclusão
 * é definitiva aqui, usada hoje só pelo "Remover duplicados" da planilha. */
export async function bulkDeleteNegotiations(ids: string[]) {
  const userId = await requireUserId();
  if (ids.length === 0) return;
  await db.query(`DELETE FROM negotiations WHERE id = ANY($1::uuid[]) AND user_id=$2`, [ids, userId]);
  revalidatePath("/planilhas/negociacoes");
  revalidatePath("/negociacoes");
  revalidatePath("/dashboard");
}

// Ações de pós-venda (avançar/corrigir etapa, checklist, comunicação, kanban,
// indicação) vivem em app/(dashboard)/pos-venda/actions.ts — arquivo próprio,
// separado deste (que já cobria 6 módulos) para não inchar mais.

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

const VALID_PLAN_CODES = new Set(["mint_start", "mint_pro", "mint_business"]);
const VALID_BILLING_CYCLES = new Set(["monthly", "yearly"]);

/** Troca de plano e/ou ciclo de cobrança pra quem já tem cartão ativo (fluxo
 * diferente de `cancelMySubscription`/`SubscribeForm`, que são pra antes de ter
 * cartão). Atualiza o valor cobrado direto na assinatura do Asaas. */
export async function changePlanAndCycle(planCode: string, billingCycle: string) {
  const userId = await requireUserId();
  if (!VALID_PLAN_CODES.has(planCode) || !VALID_BILLING_CYCLES.has(billingCycle)) return;

  const { rows } = await db.query<{ id: string; gateway_subscription_id: string | null }>(
    `SELECT id, gateway_subscription_id FROM subscriptions
     WHERE user_id=$1 AND canceled_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  const sub = rows[0];
  if (!sub) return;

  const pricing = PLAN_PRICING[planCode];
  const cents = billingCycle === "yearly" ? pricing.yearlyCents : pricing.monthlyCents;

  if (sub.gateway_subscription_id) {
    try {
      await updateSubscriptionPlan(sub.gateway_subscription_id, {
        value: cents / 100,
        cycle: billingCycle === "yearly" ? "YEARLY" : "MONTHLY",
      });
    } catch (err) {
      console.error("Erro ao atualizar plano no Asaas:", err);
      return;
    }
  }

  await db.query(
    `UPDATE subscriptions SET plan_id = (SELECT id FROM plans WHERE code=$1), billing_cycle=$2 WHERE id=$3`,
    [planCode, billingCycle, sub.id]
  );
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

/** Remove o fundo personalizado do Dashboard, voltando ao padrão. */
export async function resetDashboardBackground() {
  const userId = await requireUserId();
  await db.query(`UPDATE users SET background_url=NULL, background_type=NULL WHERE id=$1`, [
    userId,
  ]);
  revalidatePath("/dashboard");
  revalidatePath("/configuracoes");
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
