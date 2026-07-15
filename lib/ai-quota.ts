// lib/ai-quota.ts — cota mensal de geração por IA (texto/imagem), por plano.
// Checar (getAiQuota) e registrar (logAiUsage) são chamadas separadas de
// propósito: uma geração que falhou (erro da Claude/OpenAI) nunca deve
// consumir cota — só registramos depois que a geração dá certo.

import { db } from "@/lib/db";

export type AiUsageKind = "texto" | "imagem";

export interface AiQuotaStatus {
  used: number;
  limit: number | null;
  exceeded: boolean;
}

export async function getAiQuota(userId: string, kind: AiUsageKind): Promise<AiQuotaStatus> {
  const { rows: countRows } = await db.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM ai_usage_log
     WHERE user_id = $1 AND kind = $2 AND created_at >= date_trunc('month', now())`,
    [userId, kind]
  );
  const used = Number(countRows[0]?.count ?? 0);

  // Contas marcadas como ai_unlimited (ex.: o dono do SaaS) não passam pelo
  // limite do plano — sempre ilimitado, independente da assinatura.
  const { rows: userRows } = await db.query<{ ai_unlimited: boolean }>(
    `SELECT ai_unlimited FROM users WHERE id = $1`,
    [userId]
  );
  if (userRows[0]?.ai_unlimited) {
    return { used, limit: null, exceeded: false };
  }

  const limitCol = kind === "texto" ? "ai_text_limit" : "ai_image_limit";
  const { rows: planRows } = await db.query<{ limit: number | null }>(
    `SELECT p.${limitCol} AS limit
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     WHERE s.user_id = $1
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [userId]
  );
  const limit = planRows[0]?.limit ?? null;

  return { used, limit, exceeded: limit !== null && used >= limit };
}

export async function logAiUsage(userId: string, kind: AiUsageKind): Promise<void> {
  await db.query(`INSERT INTO ai_usage_log (user_id, kind) VALUES ($1, $2)`, [userId, kind]);
}
