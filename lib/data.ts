// lib/data.ts — camada de acesso a dados da área logada (server-only, usa `pg`).
// Todas as consultas são escopadas por user_id (1 corretor = 1 conta).
// Constantes e tipos compartilhados com componentes client vivem em
// lib/constants.ts (sem importar `pg`) — reexportados aqui por conveniência
// para quem só usa isso em Server Components.

import { db } from "./db";
import {
  LEAD_STAGES,
  POST_SALE_STAGES,
  type Lead,
  type Property,
  type Negotiation,
  type PostSale,
  type ChecklistItem,
  type Communication,
  type Referral,
  type Task,
  type Notification,
} from "./constants";

export { LEAD_STAGES, POST_SALE_STAGES };
export type { Lead, Property, Negotiation, PostSale, ChecklistItem, Communication, Referral, Task, Notification };

export interface Counts {
  leadsActive: number;
  properties: number;
  negotiationsOpen: number;
  postSaleActive: number;
  leadLimit: number | null;
  propertyLimit: number | null;
}

export async function getCounts(userId: string): Promise<Counts> {
  const { rows } = await db.query(
    `SELECT
       (SELECT count(*) FROM leads WHERE user_id = $1 AND is_active) AS leads_active,
       (SELECT count(*) FROM properties WHERE user_id = $1 AND is_active) AS properties,
       (SELECT count(*) FROM negotiations WHERE user_id = $1 AND status = 'aberta') AS negotiations_open,
       (SELECT count(*) FROM post_sale_processes WHERE user_id = $1 AND current_stage <> 'pesquisa_satisfacao') AS post_sale_active,
       (SELECT p.lead_limit FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.user_id = $1 ORDER BY s.created_at DESC LIMIT 1) AS lead_limit,
       (SELECT p.property_limit FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.user_id = $1 ORDER BY s.created_at DESC LIMIT 1) AS property_limit`,
    [userId]
  );
  const r = rows[0];
  return {
    leadsActive: Number(r.leads_active),
    properties: Number(r.properties),
    negotiationsOpen: Number(r.negotiations_open),
    postSaleActive: Number(r.post_sale_active),
    leadLimit: r.lead_limit == null ? null : Number(r.lead_limit),
    propertyLimit: r.property_limit == null ? null : Number(r.property_limit),
  };
}

export async function getLeads(userId: string): Promise<Lead[]> {
  const { rows } = await db.query<Lead>(
    `SELECT id, name, phone, email, origin, notes, funnel_stage, last_contact_at, created_at
     FROM leads WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

export async function getLead(userId: string, id: string): Promise<Lead | null> {
  const { rows } = await db.query<Lead>(
    `SELECT id, name, phone, email, origin, notes, funnel_stage, last_contact_at, created_at
     FROM leads WHERE user_id = $1 AND id = $2`,
    [userId, id]
  );
  return rows[0] ?? null;
}

export async function getProperties(userId: string): Promise<Property[]> {
  const { rows } = await db.query<Property>(
    `SELECT id, address, property_type, price_cents, area_m2, status, description, created_at
     FROM properties WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

export async function getProperty(userId: string, id: string): Promise<Property | null> {
  const { rows } = await db.query<Property>(
    `SELECT id, address, property_type, price_cents, area_m2, status, description, created_at
     FROM properties WHERE user_id = $1 AND id = $2`,
    [userId, id]
  );
  return rows[0] ?? null;
}

export async function getNegotiations(userId: string): Promise<Negotiation[]> {
  const { rows } = await db.query<Negotiation>(
    `SELECT n.id, l.name AS lead_name, p.address AS property_address,
            n.negotiation_type, n.status, n.value_cents, n.closed_at, n.created_at
     FROM negotiations n
     JOIN leads l ON l.id = n.lead_id
     LEFT JOIN properties p ON p.id = n.property_id
     WHERE n.user_id = $1 ORDER BY n.created_at DESC`,
    [userId]
  );
  return rows;
}

const POST_SALE_LIST_SELECT = `
  ps.id, l.name AS lead_name, p.address AS property_address, n.value_cents,
  ps.current_stage, ps.stage_updated_at, ps.next_action, ps.next_action_due_at,
  ps.is_financed, ps.kanban_status, ps.referral_token
`;

export async function getPostSales(userId: string): Promise<PostSale[]> {
  const { rows } = await db.query<PostSale>(
    `SELECT ${POST_SALE_LIST_SELECT}
     FROM post_sale_processes ps
     JOIN negotiations n ON n.id = ps.negotiation_id
     JOIN leads l ON l.id = n.lead_id
     LEFT JOIN properties p ON p.id = n.property_id
     WHERE ps.user_id = $1 ORDER BY ps.updated_at DESC`,
    [userId]
  );
  return rows;
}

export interface TimelineEntry {
  kind: "etapa" | "comunicacao" | "documento";
  label: string;
  detail: string | null;
  ts: string;
}

export interface PostSaleDetail extends PostSale {
  history: { to_stage: string; changed_at: string; note: string | null }[];
  messages: { stage: string; sent_at: string }[];
  checklist: ChecklistItem[];
  communications: Communication[];
  referrals: Referral[];
  timeline: TimelineEntry[];
}

export async function getPostSale(userId: string, id: string): Promise<PostSaleDetail | null> {
  const { rows } = await db.query<PostSale>(
    `SELECT ${POST_SALE_LIST_SELECT}
     FROM post_sale_processes ps
     JOIN negotiations n ON n.id = ps.negotiation_id
     JOIN leads l ON l.id = n.lead_id
     LEFT JOIN properties p ON p.id = n.property_id
     WHERE ps.user_id = $1 AND ps.id = $2`,
    [userId, id]
  );
  if (!rows[0]) return null;

  const [historyRes, messagesRes, checklistRes, communicationsRes, referralsRes] = await Promise.all([
    db.query(
      `SELECT to_stage, changed_at, note FROM post_sale_stage_history
       WHERE post_sale_id = $1 ORDER BY changed_at ASC`,
      [id]
    ),
    db.query(
      `SELECT stage, sent_at FROM post_sale_notifications_sent
       WHERE post_sale_id = $1 ORDER BY sent_at ASC`,
      [id]
    ),
    db.query<ChecklistItem>(
      `SELECT id, document_type, label, is_required, status, file_url, ai_verdict, ai_notes, created_at, updated_at
       FROM post_sale_checklist_items WHERE post_sale_id = $1 ORDER BY created_at ASC`,
      [id]
    ),
    db.query<Communication>(
      `SELECT id, kind, channel, content, sent_at, created_at
       FROM post_sale_communications WHERE post_sale_id = $1 ORDER BY created_at ASC`,
      [id]
    ),
    db.query<Referral>(
      `SELECT id, referred_name, referred_phone, reward_description, status, created_at
       FROM referrals WHERE post_sale_id = $1 ORDER BY created_at DESC`,
      [id]
    ),
  ]);

  const history = historyRes.rows as { to_stage: string; changed_at: string; note: string | null }[];
  const checklist = checklistRes.rows;
  const communications = communicationsRes.rows;

  const stageLabel = (k: string) => POST_SALE_STAGES.find((s) => s.key === k)?.label ?? k;
  const timeline: TimelineEntry[] = [
    ...history.map((h) => ({
      kind: "etapa" as const,
      label: stageLabel(h.to_stage),
      detail: h.note,
      ts: h.changed_at,
    })),
    ...communications.map((c) => ({
      kind: "comunicacao" as const,
      label: c.kind === "mensagem_cliente" ? `Mensagem ao cliente (${c.channel ?? "-"})` : "Nota interna",
      detail: c.content,
      ts: c.created_at,
    })),
    ...checklist
      .filter((c) => c.file_url)
      .map((c) => ({
        kind: "documento" as const,
        label: `Documento enviado: ${c.label}`,
        detail: c.ai_verdict ? `Avaliação automática: ${c.ai_verdict}` : null,
        ts: c.updated_at ?? c.created_at,
      })),
  ].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  return {
    ...rows[0],
    history,
    messages: messagesRes.rows as any,
    checklist,
    communications,
    referrals: referralsRes.rows,
    timeline,
  };
}

export interface PostSaleDashboardMetrics {
  active: number;
  completedThisMonth: number;
  stalled: number;
  avgDaysPerStage: number;
  funnel: { key: string; label: string; count: number }[];
}

export async function getPostSaleDashboardMetrics(userId: string): Promise<PostSaleDashboardMetrics> {
  const { rows: countRows } = await db.query<{
    active: string;
    completed_this_month: string;
    stalled: string;
  }>(
    `SELECT
       (SELECT count(*) FROM post_sale_processes WHERE user_id=$1 AND current_stage <> 'pesquisa_satisfacao') AS active,
       (SELECT count(*) FROM post_sale_processes WHERE user_id=$1 AND current_stage = 'pesquisa_satisfacao'
          AND date_trunc('month', stage_updated_at) = date_trunc('month', now())) AS completed_this_month,
       (SELECT count(*) FROM post_sale_processes WHERE user_id=$1 AND current_stage <> 'pesquisa_satisfacao'
          AND stage_updated_at < now() - interval '5 days') AS stalled`,
    [userId]
  );

  // A função de janela (lag) precisa ser calculada numa subconsulta antes de
  // agregar com avg() — Postgres não permite aggregate(window_function(...))
  // diretamente na mesma consulta.
  const { rows: avgRows } = await db.query<{ avg_days: string | null }>(
    `SELECT avg(day_diff) AS avg_days FROM (
       SELECT extract(epoch FROM (changed_at - lag(changed_at) OVER (PARTITION BY post_sale_id ORDER BY changed_at))) / 86400 AS day_diff
       FROM post_sale_stage_history h
       JOIN post_sale_processes ps ON ps.id = h.post_sale_id
       WHERE ps.user_id = $1
     ) sub`,
    [userId]
  );

  const { rows: funnelRows } = await db.query<{ current_stage: string; c: string }>(
    `SELECT current_stage, count(*)::int AS c FROM post_sale_processes WHERE user_id=$1 GROUP BY current_stage`,
    [userId]
  );
  const byStage = Object.fromEntries(funnelRows.map((r) => [r.current_stage, Number(r.c)]));
  const funnel = POST_SALE_STAGES.map((s) => ({ key: s.key, label: s.label, count: byStage[s.key] ?? 0 }));

  const r = countRows[0];
  return {
    active: Number(r.active),
    completedThisMonth: Number(r.completed_this_month),
    stalled: Number(r.stalled),
    avgDaysPerStage: avgRows[0]?.avg_days ? Math.round(Number(avgRows[0].avg_days) * 10) / 10 : 0,
    funnel,
  };
}

export interface PublicPostSaleView {
  lead_name: string;
  current_stage: string;
  is_financed: boolean;
  checklist: { label: string; status: string }[];
}

/** Portal do cliente (/acompanhar/[token]) — somente leitura, escopado
 * exclusivamente pelo token (nunca por user_id/id). Lista de colunas
 * explícita: nunca inclui value_cents, notas internas ou dados de outra conta. */
export async function getPostSaleByToken(token: string): Promise<PublicPostSaleView | null> {
  const { rows } = await db.query<{ id: string; lead_name: string; current_stage: string; is_financed: boolean }>(
    `SELECT ps.id, l.name AS lead_name, ps.current_stage, ps.is_financed
     FROM post_sale_processes ps
     JOIN negotiations n ON n.id = ps.negotiation_id
     JOIN leads l ON l.id = n.lead_id
     WHERE ps.referral_token = $1`,
    [token]
  );
  const ps = rows[0];
  if (!ps) return null;

  const { rows: checklist } = await db.query<{ label: string; status: string }>(
    `SELECT label, status FROM post_sale_checklist_items WHERE post_sale_id = $1 ORDER BY created_at ASC`,
    [ps.id]
  );

  return { lead_name: ps.lead_name, current_stage: ps.current_stage, is_financed: ps.is_financed, checklist };
}

export async function getUrgentPostSaleTasks(userId: string) {
  const { rows } = await db.query<{ id: string; lead_name: string; next_action: string | null; next_action_due_at: string }>(
    `SELECT ps.id, l.name AS lead_name, ps.next_action, ps.next_action_due_at
     FROM post_sale_processes ps
     JOIN negotiations n ON n.id = ps.negotiation_id
     JOIN leads l ON l.id = n.lead_id
     WHERE ps.user_id = $1 AND ps.next_action_due_at IS NOT NULL
       AND ps.next_action_due_at <= now() + interval '1 day'
       AND ps.current_stage <> 'pesquisa_satisfacao'
     ORDER BY ps.next_action_due_at ASC LIMIT 10`,
    [userId]
  );
  return rows;
}

export async function getTasks(userId: string): Promise<Task[]> {
  const { rows } = await db.query<Task>(
    `SELECT id, title, due_at, done, related_type, created_at
     FROM tasks WHERE user_id = $1 ORDER BY done ASC, due_at ASC NULLS LAST, created_at DESC`,
    [userId]
  );
  return rows;
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { rows } = await db.query<Notification>(
    `SELECT id, type, content, read_at, created_at
     FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return rows;
}

/** Lista de leads simples para selects (ex.: nova negociação). */
export async function getLeadOptions(userId: string) {
  const { rows } = await db.query<{ id: string; name: string }>(
    `SELECT id, name FROM leads WHERE user_id = $1 ORDER BY name`,
    [userId]
  );
  return rows;
}

export async function getPropertyOptions(userId: string) {
  const { rows } = await db.query<{ id: string; address: string }>(
    `SELECT id, address FROM properties WHERE user_id = $1 AND is_active ORDER BY address`,
    [userId]
  );
  return rows;
}

export interface LeadFunnelMetrics {
  funnel: { key: string; label: string; count: number }[];
  conversionRate: number;
}

/** Funil de leads por etapa + taxa de conversão (fechados / total leads já
 * cadastrados, incluindo inativos, pra dar a taxa histórica real). */
export async function getLeadFunnelMetrics(userId: string): Promise<LeadFunnelMetrics> {
  const { rows } = await db.query<{ funnel_stage: string; c: string }>(
    `SELECT funnel_stage, count(*)::int AS c FROM leads WHERE user_id=$1 GROUP BY funnel_stage`,
    [userId]
  );
  const byStage = Object.fromEntries(rows.map((r) => [r.funnel_stage, Number(r.c)]));
  const funnel = LEAD_STAGES.map((s) => ({ key: s.key, label: s.label, count: byStage[s.key] ?? 0 }));
  const total = funnel.reduce((sum, s) => sum + s.count, 0);
  const closed = byStage["fechado"] ?? 0;
  return { funnel, conversionRate: total ? Math.round((closed / total) * 1000) / 10 : 0 };
}

/** Progresso da meta semanal de novos leads (gamificação leve do dashboard). */
export async function getWeeklyLeadGoalProgress(userId: string): Promise<number> {
  const { rows } = await db.query<{ c: string }>(
    `SELECT count(*)::int AS c FROM leads
     WHERE user_id=$1 AND created_at >= date_trunc('week', now())`,
    [userId]
  );
  return Number(rows[0]?.c ?? 0);
}
