// lib/automations.ts — lógica compartilhada das Automações v2, usada tanto
// pelo cron diário (app/api/cron/automacoes) quanto pelo botão "Rodar agora"
// da tela de Automações. Foi extraída da rota pra poder ser executada sob
// demanda, escopada a um corretor (botão) ou pra todos (cron).
//
// Três gatilhos (lead parado com filtro opcional de etapa, lead novo,
// negociação parada) e ações combináveis por regra (e-mail + tarefa +
// notificação/push). Dedup por automation_runs: lead_parado/negociacao_parada
// disparam de novo só após novo contato/movimento; lead_novo dispara uma
// única vez por lead.
import { db } from "@/lib/db";
import { sendAutomationEmail } from "@/lib/resend";
import { sendPushToUser } from "@/lib/push";

interface AutomationMatch {
  automation_id: string;
  automation_name: string;
  actions: string[];
  action_message: string;
  lead_id: string;
  lead_name: string;
  user_id: string;
  email: string;
  full_name: string;
}

const MATCH_COLUMNS = `a.id AS automation_id, a.name AS automation_name,
       COALESCE(a.actions, ARRAY[a.action]::text[]) AS actions, a.action_message,
       l.id AS lead_id, l.name AS lead_name, a.user_id, u.email, u.full_name`;

/** Executa as automações e devolve quantas casaram e quantas ações rodaram.
 * Sem `userId` → todas as contas (cron diário). Com `userId` → só as regras
 * daquele corretor (botão "Rodar agora"). */
export async function runAutomations(
  opts: { userId?: string } = {}
): Promise<{ matched: number; executed: number }> {
  const userId = opts.userId ?? null;
  // Filtro opcional por usuário. Como as queries não têm outros placeholders,
  // $1 (quando presente) é sempre o user_id.
  const uf = userId ? "AND a.user_id = $1" : "";
  const params = userId ? [userId] : [];

  // 1) Lead parado há X dias (com filtro opcional de etapa do funil).
  const { rows: leadParado } = await db.query<AutomationMatch>(
    `SELECT ${MATCH_COLUMNS}
     FROM automations a
     JOIN users u ON u.id = a.user_id
     JOIN leads l ON l.user_id = a.user_id
     WHERE a.enabled = true
       AND COALESCE(a.trigger_type, 'lead_parado') = 'lead_parado'
       AND l.is_active AND l.funnel_stage NOT IN ('fechado', 'perdido')
       AND (a.funnel_stage IS NULL OR l.funnel_stage = a.funnel_stage)
       AND (l.last_contact_at IS NULL OR l.last_contact_at < now() - (a.days_without_contact || ' days')::interval)
       AND NOT EXISTS (
         SELECT 1 FROM automation_runs r
         WHERE r.automation_id = a.id AND r.lead_id = l.id
           AND r.ran_at > COALESCE(l.last_contact_at, l.created_at)
       )
       ${uf}
     LIMIT 300`,
    params
  );

  // 2) Lead novo — só leads criados DEPOIS da regra (senão a base inteira
  // dispararia na primeira rodada) e dentro da janela recente; uma vez por lead.
  const { rows: leadNovo } = await db.query<AutomationMatch>(
    `SELECT ${MATCH_COLUMNS}
     FROM automations a
     JOIN users u ON u.id = a.user_id
     JOIN leads l ON l.user_id = a.user_id
     WHERE a.enabled = true
       AND a.trigger_type = 'lead_novo'
       AND l.is_active
       AND l.created_at > a.created_at
       AND l.created_at > now() - interval '3 days'
       AND NOT EXISTS (
         SELECT 1 FROM automation_runs r
         WHERE r.automation_id = a.id AND r.lead_id = l.id
       )
       ${uf}
     LIMIT 300`,
    params
  );

  // 3) Negociação aberta parada há X dias (updated_at é atualizado por trigger
  // a cada mudança na negociação). O run é registrado no lead da negociação.
  const { rows: negociacaoParada } = await db.query<AutomationMatch>(
    `SELECT ${MATCH_COLUMNS}
     FROM automations a
     JOIN users u ON u.id = a.user_id
     JOIN negotiations n ON n.user_id = a.user_id
     JOIN leads l ON l.id = n.lead_id
     WHERE a.enabled = true
       AND a.trigger_type = 'negociacao_parada'
       AND n.status::text NOT IN ('fechada', 'cancelada', 'perdida')
       AND n.updated_at < now() - (a.days_without_contact || ' days')::interval
       AND NOT EXISTS (
         SELECT 1 FROM automation_runs r
         WHERE r.automation_id = a.id AND r.lead_id = l.id AND r.ran_at > n.updated_at
       )
       ${uf}
     LIMIT 300`,
    params
  );

  const matches = [...leadParado, ...leadNovo, ...negociacaoParada];

  let executed = 0;
  for (const row of matches) {
    try {
      const leadUrl = `${process.env.APP_URL}/leads/${row.lead_id}`;

      for (const action of row.actions) {
        if (action === "criar_tarefa") {
          await db.query(
            `INSERT INTO tasks (user_id, title, due_at, related_type, related_id, event_type)
             VALUES ($1,$2, now(), 'lead', $3, 'lembrete')`,
            [row.user_id, `${row.action_message} — ${row.lead_name}`, row.lead_id]
          );
        } else if (action === "enviar_email") {
          await sendAutomationEmail(row.email, row.full_name, row.lead_name, row.action_message, leadUrl);
        } else if (action === "notificacao") {
          await db.query(
            `INSERT INTO notifications (user_id, type, content, related_id) VALUES ($1, 'lead_parado', $2, $3)`,
            [row.user_id, `⚡ ${row.automation_name}: ${row.action_message} — ${row.lead_name}`, row.lead_id]
          );
          await sendPushToUser(row.user_id, {
            title: `⚡ ${row.automation_name}`,
            body: `${row.action_message} — ${row.lead_name}`,
            url: `/leads/${row.lead_id}`,
          });
        }
      }

      await db.query(`INSERT INTO automation_runs (automation_id, lead_id) VALUES ($1,$2)`, [
        row.automation_id,
        row.lead_id,
      ]);
      executed++;
    } catch (err) {
      console.error("Erro ao executar automação:", err);
    }
  }

  return { matched: matches.length, executed };
}
