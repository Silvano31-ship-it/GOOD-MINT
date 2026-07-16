// app/api/cron/pos-venda-lembretes/route.ts — GET
// Roda diariamente (ver vercel.json). Protegido por CRON_SECRET, mesmo padrão
// de app/api/cron/social/route.ts. Três tarefas:
// 1) cria lembretes 3 dias antes de next_action_due_at (se ainda não existir um);
// 2) envia por e-mail os lembretes vencidos e ainda não enviados;
// 3) marca stalled_alert_sent_at para processos parados há mais de 5 dias.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendDeadlineReminderEmail } from "@/lib/resend";
import { resolveStages } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { sendPushToUser } from "@/lib/push";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // 1) cria lembretes de prazo (3 dias antes) que ainda não existem
  await db.query(
    `INSERT INTO post_sale_reminders (post_sale_id, kind, due_at)
     SELECT ps.id, 'prazo_3_dias', ps.next_action_due_at - interval '3 days'
     FROM post_sale_processes ps
     WHERE ps.next_action_due_at IS NOT NULL
       AND ps.current_stage <> 'pesquisa_satisfacao'
       AND NOT EXISTS (
         SELECT 1 FROM post_sale_reminders r
         WHERE r.post_sale_id = ps.id AND r.kind = 'prazo_3_dias' AND r.due_at = ps.next_action_due_at - interval '3 days'
       )`
  );

  // 2) envia lembretes vencidos e ainda não enviados
  const { rows: due } = await db.query<{
    id: string;
    post_sale_id: string;
    email: string | null;
    lead_name: string;
    current_stage: string;
    due_at: string;
    post_sale_stage_labels: Record<string, string> | null;
  }>(
    `SELECT r.id, r.post_sale_id, l.email, l.name AS lead_name, ps.current_stage, ps.next_action_due_at AS due_at,
            u.post_sale_stage_labels
     FROM post_sale_reminders r
     JOIN post_sale_processes ps ON ps.id = r.post_sale_id
     JOIN negotiations n ON n.id = ps.negotiation_id
     JOIN leads l ON l.id = n.lead_id
     JOIN users u ON u.id = ps.user_id
     WHERE r.kind = 'prazo_3_dias' AND r.sent_at IS NULL AND r.due_at <= now()
     LIMIT 50`
  );

  let sent = 0;
  for (const r of due) {
    if (r.email) {
      try {
        const stageLabel = resolveStages(r.post_sale_stage_labels).find((s) => s.key === r.current_stage)?.label ?? r.current_stage;
        await sendDeadlineReminderEmail(r.email, r.lead_name, stageLabel, formatDate(r.due_at));
        sent++;
      } catch (err) {
        console.error("Erro ao enviar lembrete de prazo:", err);
      }
    }
    await db.query(`UPDATE post_sale_reminders SET sent_at=now() WHERE id=$1`, [r.id]);
  }

  // 3) marca alerta de "parado" para processos sem avanço há mais de 5 dias e
  // cria uma notificação in-app (uma vez só por processo, ver migration 017).
  const { rows: newlyStalled } = await db.query<{
    id: string;
    user_id: string;
    lead_name: string;
    current_stage: string;
    post_sale_stage_labels: Record<string, string> | null;
  }>(
    `UPDATE post_sale_processes ps SET stalled_alert_sent_at=now()
     FROM negotiations n JOIN leads l ON l.id = n.lead_id, users u
     WHERE ps.negotiation_id = n.id
       AND u.id = ps.user_id
       AND ps.current_stage <> 'pesquisa_satisfacao'
       AND ps.stage_updated_at < now() - interval '5 days'
       AND (ps.stalled_alert_sent_at IS NULL OR ps.stalled_alert_sent_at < ps.stage_updated_at)
       AND NOT EXISTS (SELECT 1 FROM notifications nn WHERE nn.type = 'pos_venda_parado' AND nn.related_id = ps.id)
     RETURNING ps.id, ps.user_id, l.name AS lead_name, ps.current_stage, u.post_sale_stage_labels`
  );
  for (const p of newlyStalled) {
    const stageLabel = resolveStages(p.post_sale_stage_labels).find((s) => s.key === p.current_stage)?.label ?? p.current_stage;
    const content = `Cliente ${p.lead_name} parado há mais de 5 dias em "${stageLabel}"`;
    await db.query(
      `INSERT INTO notifications (user_id, type, content, related_id) VALUES ($1, 'pos_venda_parado', $2, $3)`,
      [p.user_id, content, p.id]
    );
    await sendPushToUser(p.user_id, { title: "Cliente parado no pós-venda 📦", body: content, url: `/pos-venda/${p.id}` });
  }

  return NextResponse.json({ ok: true, remindersSent: sent, stalledMarked: newlyStalled.length });
}
