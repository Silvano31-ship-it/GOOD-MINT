// app/(dashboard)/pos-venda/actions.ts — server actions do módulo de pós-venda.
// Arquivo próprio (separado de app/(dashboard)/actions.ts, que já cobre 6
// outros módulos) para não inchar mais um único arquivo de 500+ linhas.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NEW_STAGE_ORDER } from "@/lib/constants";
import { sendStageCompleteEmail, sendCongratsEmail } from "@/lib/resend";

async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
}

interface PostSaleRow {
  current_stage: string;
  is_financed: boolean;
}

async function loadPostSale(postSaleId: string, userId: string): Promise<PostSaleRow | null> {
  const { rows } = await db.query<PostSaleRow>(
    `SELECT current_stage, is_financed FROM post_sale_processes WHERE id=$1 AND user_id=$2`,
    [postSaleId, userId]
  );
  return rows[0] ?? null;
}

/** Ordem efetiva das etapas para este processo — pula financiamento quando não financiado. */
function effectiveOrder(isFinanced: boolean): string[] {
  if (isFinanced) return [...NEW_STAGE_ORDER];
  return NEW_STAGE_ORDER.filter((k) => k !== "liberacao_financiamento");
}

// ---------------------------------------------------------------- ETAPAS
/** Avança para a PRÓXIMA etapa da ordem (forward-only). Ignora silenciosamente
 * qualquer tentativa de pular etapas — a UI só oferece um botão "Avançar". */
export async function advancePostSaleStage(postSaleId: string, toStage: string) {
  const userId = await requireUserId();
  const ps = await loadPostSale(postSaleId, userId);
  if (!ps) return;

  const order = effectiveOrder(ps.is_financed);
  const fromIdx = order.indexOf(ps.current_stage);
  const toIdx = order.indexOf(toStage);
  if (fromIdx === -1 || toIdx !== fromIdx + 1) return; // não é a próxima etapa

  await db.query(
    `UPDATE post_sale_processes SET current_stage=$1, stage_updated_at=now(), stalled_alert_sent_at=NULL
     WHERE id=$2 AND user_id=$3`,
    [toStage, postSaleId, userId]
  );
  await db.query(
    `INSERT INTO post_sale_stage_history (post_sale_id, from_stage, to_stage) VALUES ($1,$2,$3)`,
    [postSaleId, ps.current_stage, toStage]
  );
  await db.query(
    `INSERT INTO post_sale_notifications_sent (post_sale_id, stage, channel) VALUES ($1,$2,'email')`,
    [postSaleId, toStage]
  );

  const isLastStage = toIdx === order.length - 1;
  if (isLastStage) {
    await db.query(`UPDATE post_sale_processes SET kanban_status='concluido' WHERE id=$1`, [postSaleId]);
  }

  // Envio de e-mail é best-effort: nunca bloqueia a mudança de etapa no banco.
  try {
    const { rows } = await db.query<{
      email: string; lead_name: string; referral_token: string; broker_name: string;
    }>(
      `SELECT l.email, l.name AS lead_name, ps.referral_token, u.full_name AS broker_name
       FROM post_sale_processes ps
       JOIN negotiations n ON n.id = ps.negotiation_id
       JOIN leads l ON l.id = n.lead_id
       JOIN users u ON u.id = ps.user_id
       WHERE ps.id = $1`,
      [postSaleId]
    );
    const info = rows[0];
    if (info?.email) {
      const stageLabel = toStage;
      const portalUrl = `${process.env.APP_URL}/acompanhar/${info.referral_token}`;
      if (isLastStage) {
        await sendCongratsEmail(info.email, info.lead_name, portalUrl);
      } else {
        await sendStageCompleteEmail(info.email, info.lead_name, stageLabel, info.broker_name, portalUrl);
      }
    }
  } catch (err) {
    console.error("Erro ao enviar e-mail de pós-venda:", err);
  }

  revalidatePath(`/pos-venda/${postSaleId}`);
  revalidatePath("/pos-venda");
  revalidatePath("/pos-venda/dashboard");
  revalidatePath("/dashboard");
}

/** Retrocesso manual — exige motivo, exceção rara para corrigir cliques errados.
 * Fica atrás de um disclosure recolhido na UI, nunca num botão proeminente. */
export async function voltarPostSaleStage(postSaleId: string, toStage: string, formData: FormData) {
  const userId = await requireUserId();
  const ps = await loadPostSale(postSaleId, userId);
  if (!ps) return;

  const motivo = String(formData.get("motivo") ?? "").trim();
  if (!motivo) return;

  const order = effectiveOrder(ps.is_financed);
  const fromIdx = order.indexOf(ps.current_stage);
  const toIdx = order.indexOf(toStage);
  if (fromIdx === -1 || toIdx === -1 || toIdx >= fromIdx) return; // só permite ir pra trás

  await db.query(
    `UPDATE post_sale_processes SET current_stage=$1, stage_updated_at=now() WHERE id=$2 AND user_id=$3`,
    [toStage, postSaleId, userId]
  );
  await db.query(
    `INSERT INTO post_sale_stage_history (post_sale_id, from_stage, to_stage, note) VALUES ($1,$2,$3,$4)`,
    [postSaleId, ps.current_stage, toStage, `Retrocesso manual: ${motivo}`]
  );
  revalidatePath(`/pos-venda/${postSaleId}`);
  revalidatePath("/pos-venda");
}

export async function setPostSaleNextAction(postSaleId: string, formData: FormData) {
  const userId = await requireUserId();
  const dueAtRaw = String(formData.get("next_action_due_at") ?? "");
  await db.query(
    `UPDATE post_sale_processes SET next_action=$1, next_action_due_at=$2 WHERE id=$3 AND user_id=$4`,
    [
      String(formData.get("next_action") ?? "") || null,
      dueAtRaw ? new Date(dueAtRaw).toISOString() : null,
      postSaleId,
      userId,
    ]
  );
  revalidatePath(`/pos-venda/${postSaleId}`);
}

export async function setIsFinanced(postSaleId: string, isFinanced: boolean) {
  const userId = await requireUserId();
  await db.query(`UPDATE post_sale_processes SET is_financed=$1 WHERE id=$2 AND user_id=$3`, [
    isFinanced,
    postSaleId,
    userId,
  ]);
  revalidatePath(`/pos-venda/${postSaleId}`);
}

// ---------------------------------------------------------------- KANBAN
export async function setKanbanStatus(postSaleId: string, status: string) {
  const userId = await requireUserId();
  await db.query(`UPDATE post_sale_processes SET kanban_status=$1 WHERE id=$2 AND user_id=$3`, [
    status,
    postSaleId,
    userId,
  ]);
  revalidatePath("/pos-venda");
  revalidatePath("/pos-venda/dashboard");
}

// ---------------------------------------------------------------- CHECKLIST
export async function addChecklistItem(postSaleId: string, formData: FormData) {
  const userId = await requireUserId();
  const ps = await loadPostSale(postSaleId, userId);
  if (!ps) return;

  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;
  const documentType = String(formData.get("document_type") ?? "outro");
  const isRequired = formData.get("is_required") === "on";

  await db.query(
    `INSERT INTO post_sale_checklist_items (post_sale_id, document_type, label, is_required)
     VALUES ($1,$2,$3,$4)`,
    [postSaleId, documentType, label, isRequired]
  );
  revalidatePath(`/pos-venda/${postSaleId}`);
}

export async function updateChecklistItemStatus(itemId: string, postSaleId: string, status: string) {
  const userId = await requireUserId();
  const ps = await loadPostSale(postSaleId, userId);
  if (!ps) return;
  await db.query(`UPDATE post_sale_checklist_items SET status=$1 WHERE id=$2 AND post_sale_id=$3`, [
    status,
    itemId,
    postSaleId,
  ]);
  revalidatePath(`/pos-venda/${postSaleId}`);
}

export async function removeChecklistItem(itemId: string, postSaleId: string) {
  const userId = await requireUserId();
  const ps = await loadPostSale(postSaleId, userId);
  if (!ps) return;
  await db.query(`DELETE FROM post_sale_checklist_items WHERE id=$1 AND post_sale_id=$2`, [
    itemId,
    postSaleId,
  ]);
  revalidatePath(`/pos-venda/${postSaleId}`);
}

// ---------------------------------------------------------------- COMUNICAÇÃO
/** Nota interna (kind='nota_interna') ou mensagem ao cliente (kind='mensagem_cliente').
 * Mensagem ao cliente por e-mail é enviada de fato via lib/resend.ts; por
 * WhatsApp, retorna o link wa.me pro client abrir numa aba nova (mesmo padrão
 * de components/SupportForm.tsx). */
export async function addCommunication(
  postSaleId: string,
  formData: FormData
): Promise<{ waUrl?: string }> {
  const userId = await requireUserId();
  const { rows } = await db.query<{ id: string }>(
    `SELECT id FROM post_sale_processes WHERE id=$1 AND user_id=$2`,
    [postSaleId, userId]
  );
  if (!rows[0]) return {};

  const kind = String(formData.get("kind") ?? "nota_interna");
  const channel = String(formData.get("channel") ?? "") || null;
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return {};

  const isClientMessage = kind === "mensagem_cliente";
  const sentAt = isClientMessage ? new Date().toISOString() : null;

  await db.query(
    `INSERT INTO post_sale_communications (post_sale_id, kind, channel, content, sent_at)
     VALUES ($1,$2,$3,$4,$5)`,
    [postSaleId, kind, isClientMessage ? channel : null, content, sentAt]
  );
  revalidatePath(`/pos-venda/${postSaleId}`);

  if (isClientMessage && channel === "whatsapp") {
    const { rows: leadRows } = await db.query<{ phone: string | null }>(
      `SELECT l.phone FROM post_sale_processes ps
       JOIN negotiations n ON n.id = ps.negotiation_id
       JOIN leads l ON l.id = n.lead_id
       WHERE ps.id = $1`,
      [postSaleId]
    );
    const phone = leadRows[0]?.phone?.replace(/\D/g, "");
    if (phone) {
      return { waUrl: `https://wa.me/${phone}?text=${encodeURIComponent(content)}` };
    }
  }
  return {};
}

// ---------------------------------------------------------------- INDICAÇÃO
export async function requestReferral(postSaleId: string, formData: FormData) {
  const userId = await requireUserId();
  const { rows } = await db.query<{ id: string }>(
    `SELECT id FROM post_sale_processes WHERE id=$1 AND user_id=$2`,
    [postSaleId, userId]
  );
  if (!rows[0]) return;

  await db.query(
    `INSERT INTO referrals (user_id, post_sale_id, referred_name, referred_phone, reward_description)
     VALUES ($1,$2,$3,$4,$5)`,
    [
      userId,
      postSaleId,
      String(formData.get("referred_name") ?? "").trim() || null,
      String(formData.get("referred_phone") ?? "").trim() || null,
      String(formData.get("reward_description") ?? "").trim() || null,
    ]
  );
  revalidatePath(`/pos-venda/${postSaleId}`);
}

export async function updateReferralStatus(referralId: string, status: string) {
  const userId = await requireUserId();
  await db.query(`UPDATE referrals SET status=$1 WHERE id=$2 AND user_id=$3`, [
    status,
    referralId,
    userId,
  ]);
  revalidatePath("/pos-venda");
}

/** Formulário público (via /indicar/[token]) — cria o lead indicado e vincula
 * ao referral. Não tem sessão: escopado só pelo token do link. */
export async function submitPublicReferral(referralToken: string, formData: FormData) {
  const { rows } = await db.query<{ id: string; user_id: string }>(
    `SELECT id, user_id FROM post_sale_processes WHERE referral_token=$1`,
    [referralToken]
  );
  const ps = rows[0];
  if (!ps) return { ok: false as const };

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name) return { ok: false as const };

  const { rows: leadRows } = await db.query<{ id: string }>(
    `INSERT INTO leads (user_id, name, phone, origin, funnel_stage, last_contact_at)
     VALUES ($1,$2,$3,'Indicação',$4,now()) RETURNING id`,
    [ps.user_id, name, phone || null, "novo_lead"]
  );

  await db.query(
    `INSERT INTO referrals (user_id, post_sale_id, referred_name, referred_phone, status, created_lead_id)
     VALUES ($1,$2,$3,$4,'virou_lead',$5)`,
    [ps.user_id, ps.id, name, phone || null, leadRows[0].id]
  );

  return { ok: true as const };
}
