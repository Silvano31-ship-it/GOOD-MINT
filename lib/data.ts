// lib/data.ts — camada de acesso a dados da área logada (server-only, usa `pg`).
// Todas as consultas são escopadas por user_id (1 corretor = 1 conta).
// Constantes e tipos compartilhados com componentes client vivem em
// lib/constants.ts (sem importar `pg`) — reexportados aqui por conveniência
// para quem só usa isso em Server Components.

import { db } from "./db";
import { sendPushToUser } from "./push";
import { sendNewQuestionEmail } from "./resend";
import {
  LEAD_STAGES,
  POST_SALE_STAGES,
  COMMISSION_RATE,
  isStale,
  resolveStages,
  type Lead,
  type Property,
  type Negotiation,
  type PostSale,
  type ChecklistItem,
  type Communication,
  type Referral,
  type Task,
  type Notification,
  type Note,
  type NoteMedia,
  type AiContent,
  type PostSaleStage,
  type Commission,
} from "./constants";

export { LEAD_STAGES, POST_SALE_STAGES, resolveStages };
export type { PostSaleStage };

/** Nomes de etapa personalizados pelo corretor (ver migration 019). Vazio
 * ({}) para quem nunca personalizou nenhuma. */
export async function getPostSaleStageOverrides(userId: string): Promise<Record<string, string>> {
  const { rows } = await db.query<{ post_sale_stage_labels: Record<string, string> }>(
    `SELECT post_sale_stage_labels FROM users WHERE id = $1`,
    [userId]
  );
  return rows[0]?.post_sale_stage_labels ?? {};
}
export type { Lead, Property, Negotiation, PostSale, ChecklistItem, Communication, Referral, Task, Notification, Note, NoteMedia, AiContent, Commission };

export interface Counts {
  leadsActive: number;
  properties: number;
  negotiationsOpen: number;
  postSaleActive: number;
  leadLimit: number | null;
  propertyLimit: number | null;
}

export async function getCounts(userId: string): Promise<Counts> {
  const { rows: uRows } = await db.query<{ ai_unlimited: boolean }>(
    `SELECT ai_unlimited FROM users WHERE id = $1`,
    [userId]
  );
  const unlimited = uRows[0]?.ai_unlimited ?? false;

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
    leadLimit: unlimited ? null : r.lead_limit == null ? null : Number(r.lead_limit),
    propertyLimit: unlimited ? null : r.property_limit == null ? null : Number(r.property_limit),
  };
}

export async function getLeads(userId: string): Promise<Lead[]> {
  const { rows } = await db.query<Lead>(
    `SELECT id, name, phone, email, origin, notes, funnel_stage, last_contact_at, created_at, estimated_value_cents
     FROM leads WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

export async function getLead(userId: string, id: string): Promise<Lead | null> {
  const { rows } = await db.query<Lead>(
    `SELECT id, name, phone, email, origin, notes, funnel_stage, last_contact_at, created_at, estimated_value_cents
     FROM leads WHERE user_id = $1 AND id = $2`,
    [userId, id]
  );
  return rows[0] ?? null;
}

export async function getProperties(userId: string): Promise<Property[]> {
  const { rows } = await db.query<Property>(
    `SELECT id, address, property_type, price_cents, area_m2, status, description, created_at, is_exclusive, price_alignment
     FROM properties WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

export async function getProperty(userId: string, id: string): Promise<Property | null> {
  const { rows } = await db.query<Property>(
    `SELECT id, address, property_type, price_cents, area_m2, status, description, created_at, is_exclusive, price_alignment
     FROM properties WHERE user_id = $1 AND id = $2`,
    [userId, id]
  );
  return rows[0] ?? null;
}

export async function getNegotiations(userId: string): Promise<Negotiation[]> {
  const { rows } = await db.query<Negotiation>(
    `SELECT n.id, l.id AS lead_id, l.name AS lead_name, l.email AS lead_email, p.address AS property_address,
            n.negotiation_type, n.status, n.value_cents, n.closed_at, n.created_at, c.id AS commission_id
     FROM negotiations n
     JOIN leads l ON l.id = n.lead_id
     LEFT JOIN properties p ON p.id = n.property_id
     LEFT JOIN commissions c ON c.negotiation_id = n.id
     WHERE n.user_id = $1 ORDER BY n.created_at DESC`,
    [userId]
  );
  return rows;
}

// ---------------------------------------------------------------- AGENDA / GOOGLE CALENDAR
export interface GoogleCalendarConnection {
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
}

export async function getGoogleCalendarConnection(userId: string): Promise<GoogleCalendarConnection | null> {
  const { rows } = await db.query<GoogleCalendarConnection>(
    `SELECT access_token, refresh_token, token_expires_at FROM google_calendar_connections WHERE user_id = $1`,
    [userId]
  );
  return rows[0] ?? null;
}

// ---------------------------------------------------------------- FINANCEIRO
export async function getCommissions(userId: string): Promise<Commission[]> {
  const { rows } = await db.query<Commission>(
    `SELECT id, negotiation_id, client_name, property_address, sale_value_cents,
            commission_percent, commission_cents, status, sale_date, expected_payment_date, paid_at, created_at
     FROM commissions WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

const POST_SALE_LIST_SELECT = `
  ps.id, l.name AS lead_name, l.phone AS lead_phone, p.address AS property_address, n.value_cents,
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

  const overrides = await getPostSaleStageOverrides(userId);
  const stages = resolveStages(overrides);
  const stageLabel = (k: string) => stages.find((s) => s.key === k)?.label ?? k;
  const timeline: TimelineEntry[] = [
    ...history.map((h) => ({
      kind: "etapa" as const,
      label: stageLabel(h.to_stage),
      detail: h.note,
      ts: h.changed_at,
    })),
    ...communications.map((c) => ({
      kind: "comunicacao" as const,
      label:
        c.kind === "mensagem_cliente"
          ? `Mensagem ao cliente (${c.channel ?? "-"})`
          : c.kind === "duvida_cliente"
          ? "Dúvida do cliente"
          : "Nota interna",
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
  const overrides = await getPostSaleStageOverrides(userId);
  const funnel = resolveStages(overrides).map((s) => ({ key: s.key, label: s.label, count: byStage[s.key] ?? 0 }));

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
  current_stage_label: string;
  stages: PostSaleStage[];
  is_financed: boolean;
  property_address: string | null;
  value_cents: string | null;
  photo_url: string | null;
  checklist: { label: string; status: string }[];
}

/** Portal do cliente (/acompanhar/[token]) — somente leitura, escopado
 * exclusivamente pelo token (nunca por user_id/id). Lista de colunas
 * explícita: nunca inclui notas internas ou dados de outra conta. */
export async function getPostSaleByToken(token: string): Promise<PublicPostSaleView | null> {
  const { rows } = await db.query<{
    id: string;
    lead_name: string;
    current_stage: string;
    is_financed: boolean;
    property_address: string | null;
    value_cents: string | null;
    property_id: string | null;
    post_sale_stage_labels: Record<string, string> | null;
  }>(
    `SELECT ps.id, l.name AS lead_name, ps.current_stage, ps.is_financed,
            p.address AS property_address, n.value_cents, p.id AS property_id,
            u.post_sale_stage_labels
     FROM post_sale_processes ps
     JOIN negotiations n ON n.id = ps.negotiation_id
     JOIN leads l ON l.id = n.lead_id
     JOIN users u ON u.id = ps.user_id
     LEFT JOIN properties p ON p.id = n.property_id
     WHERE ps.referral_token = $1`,
    [token]
  );
  const ps = rows[0];
  if (!ps) return null;

  const stages = resolveStages(ps.post_sale_stage_labels);
  const currentStageLabel = stages.find((s) => s.key === ps.current_stage)?.label ?? ps.current_stage;

  const [{ rows: checklist }, { rows: photos }] = await Promise.all([
    db.query<{ label: string; status: string }>(
      `SELECT label, status FROM post_sale_checklist_items WHERE post_sale_id = $1 ORDER BY created_at ASC`,
      [ps.id]
    ),
    ps.property_id
      ? db.query<{ url: string }>(
          `SELECT url FROM property_photos WHERE property_id = $1 ORDER BY display_order ASC LIMIT 1`,
          [ps.property_id]
        )
      : Promise.resolve({ rows: [] as { url: string }[] }),
  ]);

  return {
    lead_name: ps.lead_name,
    current_stage: ps.current_stage,
    current_stage_label: currentStageLabel,
    stages,
    is_financed: ps.is_financed,
    property_address: ps.property_address,
    value_cents: ps.value_cents,
    photo_url: photos[0]?.url ?? null,
    checklist,
  };
}

/** Cliente envia uma dúvida pelo portal público — escopado só pelo token.
 * Avisa o corretor na hora (notificação in-app + push), pra não ficar
 * "escondida" só na timeline do processo. */
export async function submitPortalQuestion(token: string, content: string): Promise<boolean> {
  const trimmed = content.trim();
  if (!trimmed) return false;
  const { rows } = await db.query<{
    id: string; user_id: string; lead_name: string; broker_email: string; broker_name: string;
  }>(
    `SELECT ps.id, ps.user_id, l.name AS lead_name, u.email AS broker_email, u.full_name AS broker_name
     FROM post_sale_processes ps
     JOIN negotiations n ON n.id = ps.negotiation_id
     JOIN leads l ON l.id = n.lead_id
     JOIN users u ON u.id = ps.user_id
     WHERE ps.referral_token = $1`,
    [token]
  );
  const ps = rows[0];
  if (!ps) return false;
  await db.query(
    `INSERT INTO post_sale_communications (post_sale_id, kind, content) VALUES ($1, 'duvida_cliente', $2)`,
    [ps.id, trimmed]
  );
  const notifContent = `${ps.lead_name} enviou uma dúvida no portal de acompanhamento`;
  await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id) VALUES ($1, 'duvida_cliente', $2, $3)`,
    [ps.user_id, notifContent, ps.id]
  );
  await sendPushToUser(ps.user_id, { title: "Nova dúvida do cliente 💬", body: notifContent, url: `/pos-venda/${ps.id}` });
  try {
    await sendNewQuestionEmail(
      ps.broker_email,
      ps.broker_name,
      ps.lead_name,
      trimmed,
      `${process.env.APP_URL}/pos-venda/${ps.id}`
    );
  } catch (err) {
    console.error("Erro ao enviar e-mail de nova dúvida:", err);
  }
  return true;
}

/** Leads sem contato recente (ver isStale em lib/constants.ts), pro widget
 * do Dashboard — os mais atrasados primeiro, limitado aos 5 mais urgentes. */
export async function getStaleLeadsForDashboard(userId: string): Promise<Lead[]> {
  const { rows } = await db.query<Lead>(
    `SELECT id, name, phone, email, origin, notes, funnel_stage, last_contact_at, created_at, estimated_value_cents
     FROM leads
     WHERE user_id = $1 AND is_active AND funnel_stage NOT IN ('fechado', 'perdido')
     ORDER BY last_contact_at ASC NULLS FIRST`,
    [userId]
  );
  return rows.filter(isStale).slice(0, 5);
}

/** Tarefas pendentes com vencimento até o fim do dia de hoje (inclui
 * atrasadas), pro widget do Dashboard. */
export async function getTodayTasksForDashboard(userId: string): Promise<Task[]> {
  const { rows } = await db.query<Task>(
    `SELECT id, title, due_at, done, related_type, created_at
     FROM tasks
     WHERE user_id = $1 AND done = false AND due_at IS NOT NULL AND due_at < (current_date + 1)
     ORDER BY due_at ASC
     LIMIT 5`,
    [userId]
  );
  return rows;
}

/** Comissão estimada (em centavos) se todas as negociações abertas fecharem,
 * pro widget do Dashboard. */
export async function getEstimatedMonthlyCommission(userId: string): Promise<number> {
  const { rows } = await db.query<{ total: string | null }>(
    `SELECT COALESCE(SUM(value_cents), 0) AS total FROM negotiations WHERE user_id = $1 AND status = 'aberta'`,
    [userId]
  );
  return Math.round(Number(rows[0]?.total ?? 0) * COMMISSION_RATE);
}

/** Reuniões (salas de videochamada) mais recentes, pro widget do Dashboard. */
export async function getRecentMeetings(userId: string): Promise<{ id: string; title: string; room_code: string; created_at: string }[]> {
  const { rows } = await db.query<{ id: string; title: string; room_code: string; created_at: string }>(
    `SELECT id, title, room_code, created_at FROM meetings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 3`,
    [userId]
  );
  return rows;
}

export interface DailySuggestion {
  icon: string;
  text: string;
  href: string;
}

/** Sugestões priorizadas do dia (regras simples, sem IA — rápido e sem
 * depender de chave/custo externo): 1 lead parado pra contatar, 1 imóvel
 * acima do mercado pra conversar preço com o proprietário, 1 tarefa
 * pendente mais urgente. Ataca a dor de "falta de tempo pra prospectar",
 * dando um ponto de partida claro em vez de exigir garimpar a carteira. */
export async function getDailySuggestions(userId: string): Promise<DailySuggestion[]> {
  const suggestions: DailySuggestion[] = [];

  const staleLeads = await getStaleLeadsForDashboard(userId);
  if (staleLeads[0]) {
    suggestions.push({
      icon: "📞",
      text: `Contatar ${staleLeads[0].name} (sem retorno recente)`,
      href: `/leads/${staleLeads[0].id}`,
    });
  }

  const { rows: overpriced } = await db.query<{ id: string; address: string }>(
    `SELECT id, address FROM properties
     WHERE user_id = $1 AND is_active AND price_alignment = 'acima_mercado'
     ORDER BY created_at ASC LIMIT 1`,
    [userId]
  );
  if (overpriced[0]) {
    suggestions.push({
      icon: "💬",
      text: `Conversar sobre o preço de "${overpriced[0].address}" com o proprietário`,
      href: `/imoveis/${overpriced[0].id}`,
    });
  }

  const { rows: tasks } = await db.query<{ id: string; title: string }>(
    `SELECT id, title FROM tasks WHERE user_id = $1 AND done = false
     ORDER BY due_at ASC NULLS LAST, created_at ASC LIMIT 1`,
    [userId]
  );
  if (tasks[0]) {
    suggestions.push({ icon: "✅", text: tasks[0].title, href: "/tarefas" });
  }

  return suggestions.slice(0, 3);
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
    `SELECT id, type, content, related_id, read_at, created_at
     FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return rows;
}

/** Pro sino/toast do topo: contagem de não lidas + as mais recentes (só o
 * essencial pra não pesar num polling frequente). */
export async function getUnreadNotifications(
  userId: string
): Promise<{ count: number; latest: Notification[] }> {
  const [{ rows: countRows }, { rows: latest }] = await Promise.all([
    db.query<{ c: string }>(
      `SELECT count(*)::int AS c FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    ),
    db.query<Notification>(
      `SELECT id, type, content, related_id, read_at, created_at
       FROM notifications WHERE user_id = $1 AND read_at IS NULL
       ORDER BY created_at DESC LIMIT 5`,
      [userId]
    ),
  ]);
  return { count: Number(countRows[0]?.c ?? 0), latest };
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

// ---------------------------------------------------------------- NOTAS
export async function getNotes(userId: string): Promise<Note[]> {
  const { rows } = await db.query<Note>(
    `SELECT id, title, content, created_at, updated_at
     FROM notes WHERE user_id = $1 ORDER BY updated_at DESC`,
    [userId]
  );
  return rows;
}

export async function getNote(
  userId: string,
  id: string
): Promise<(Note & { media: NoteMedia[] }) | null> {
  const { rows } = await db.query<Note>(
    `SELECT id, title, content, created_at, updated_at
     FROM notes WHERE user_id = $1 AND id = $2`,
    [userId, id]
  );
  const note = rows[0];
  if (!note) return null;
  const { rows: media } = await db.query<NoteMedia>(
    `SELECT id, url, media_type, created_at FROM note_media WHERE note_id = $1 ORDER BY created_at ASC`,
    [id]
  );
  return { ...note, media };
}

// ---------------------------------------------------------------- CHAT EM GRUPO
/** Escopado só pelo invite_code — usado pela página pública do convidado
 * (app/chat/[code]/), que não tem sessão. Mesmo padrão de getPostSaleByToken. */
export async function getChatGroupByCode(
  code: string
): Promise<{ id: string; name: string; inviteCode: string } | null> {
  const { rows } = await db.query<{ id: string; name: string; invite_code: string }>(
    `SELECT id, name, invite_code FROM chat_groups WHERE invite_code = $1`,
    [code]
  );
  const g = rows[0];
  return g ? { id: g.id, name: g.name, inviteCode: g.invite_code } : null;
}

// ---------------------------------------------------------------- REUNIÕES
/** Escopado só pelo room_code — usado pela sala pública (app/sala/[code]/),
 * que não tem sessão. Mesmo padrão de getChatGroupByCode. */
export async function getMeetingByCode(
  code: string
): Promise<{ id: string; title: string; roomCode: string } | null> {
  const { rows } = await db.query<{ id: string; title: string; room_code: string }>(
    `SELECT id, title, room_code FROM meetings WHERE room_code = $1`,
    [code]
  );
  const m = rows[0];
  return m ? { id: m.id, title: m.title, roomCode: m.room_code } : null;
}

// ---------------------------------------------------------------- CONTEÚDO COM IA
export async function getAiContent(userId: string): Promise<AiContent[]> {
  const { rows } = await db.query<AiContent>(
    `SELECT id, property_id, content_type, title, content, tone, image_url, image_prompt,
            image_style, post_tip, is_favorite, rating, created_at, updated_at
     FROM ai_content WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

export async function getAiContentItem(userId: string, id: string): Promise<AiContent | null> {
  const { rows } = await db.query<AiContent>(
    `SELECT id, property_id, content_type, title, content, tone, image_url, image_prompt,
            image_style, post_tip, is_favorite, rating, created_at, updated_at
     FROM ai_content WHERE user_id = $1 AND id = $2`,
    [userId, id]
  );
  return rows[0] ?? null;
}
