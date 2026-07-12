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
  type Task,
  type Notification,
} from "./constants";

export { LEAD_STAGES, POST_SALE_STAGES };
export type { Lead, Property, Negotiation, PostSale, Task, Notification };

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
       (SELECT count(*) FROM post_sale_processes WHERE user_id = $1 AND current_stage <> 'entrega_chaves') AS post_sale_active,
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

export async function getPostSales(userId: string): Promise<PostSale[]> {
  const { rows } = await db.query<PostSale>(
    `SELECT ps.id, l.name AS lead_name, p.address AS property_address,
            ps.current_stage, ps.stage_updated_at, ps.next_action
     FROM post_sale_processes ps
     JOIN negotiations n ON n.id = ps.negotiation_id
     JOIN leads l ON l.id = n.lead_id
     LEFT JOIN properties p ON p.id = n.property_id
     WHERE ps.user_id = $1 ORDER BY ps.updated_at DESC`,
    [userId]
  );
  return rows;
}

export interface PostSaleDetail extends PostSale {
  history: { to_stage: string; changed_at: string; note: string | null }[];
  messages: { stage: string; sent_at: string }[];
}

export async function getPostSale(userId: string, id: string): Promise<PostSaleDetail | null> {
  const { rows } = await db.query<PostSale>(
    `SELECT ps.id, l.name AS lead_name, p.address AS property_address,
            ps.current_stage, ps.stage_updated_at, ps.next_action
     FROM post_sale_processes ps
     JOIN negotiations n ON n.id = ps.negotiation_id
     JOIN leads l ON l.id = n.lead_id
     LEFT JOIN properties p ON p.id = n.property_id
     WHERE ps.user_id = $1 AND ps.id = $2`,
    [userId, id]
  );
  if (!rows[0]) return null;
  const { rows: history } = await db.query(
    `SELECT to_stage, changed_at, note FROM post_sale_stage_history
     WHERE post_sale_id = $1 ORDER BY changed_at ASC`,
    [id]
  );
  const { rows: messages } = await db.query(
    `SELECT stage, sent_at FROM post_sale_notifications_sent
     WHERE post_sale_id = $1 ORDER BY sent_at ASC`,
    [id]
  );
  return { ...rows[0], history: history as any, messages: messages as any };
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
