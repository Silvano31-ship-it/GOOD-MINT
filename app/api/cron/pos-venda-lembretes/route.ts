// app/api/cron/pos-venda-lembretes/route.ts — GET
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendDeadlineReminderEmail } from "@/lib/resend";
import { POST_SALE_STAGES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { sendPushToUser } from "@/lib/push";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

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

  const { rows: due } = await db.query<{
    id: string;
    post_sale_id: string;
    email: string | null;
    lead_name: string;
    current_stage: string;
    due_at: string;
  }>(
    `SELECT r.id, r.post_sale_id, l.email, l.name AS lead_name, ps.current_stage, ps.next_action_due_at AS due_at
     FROM post_sale_reminders r
     JOIN post_sale_processes ps ON ps.id = r.post_sale_id
     JOIN negotiations n ON n.id = ps.negotiation_id
     JOIN leads l ON l.id = n.lead_id
     WHERE r.kind = 'prazo_3_dias' AND r.sent_at IS NULL AND r.due_at <= now()
     LIMIT 50`
  );

  let sent = 0;
  for (const r of due) {
    if (r.email) {
      try {
        const stageLabel = POST_SALE_STAGES.find((s) => s.key === r.current_stage)?.label ?? r.current_stage;
        await sendDeadlineReminderEmail(r.email, r.lead_name, stageLabel, formatDate(r.due_at));
        sent++;
      } catch (err) {
        console.error("Erro ao enviar lembrete de prazo:", err);
      }
    }
    await db.query(`UPDATE post_sale_reminders SET sent_at=now() WHERE id=$1`, [r.id]);
  }

  const { rows: newlyStalled } = await db.query<{
    id: string;
    user_id: string;
    lead_name: string;
    current_stage: string;
  }>(
    `UPDATE post_sale_processes ps SET stalled_alert_sent_at=now()
     FROM negotiations n JOIN leads l ON l.id = n.lead_id
     WHERE ps.negotiation_id = n.id
       AND ps.current_stage <> 'pesquisa_satisfacao'
       AND ps.stage_updated_at < now() - interval '5 days'
       AND (ps.stalled_alert_sent_at IS NULL OR ps.stalled_alert_sent_at < ps.stage_updated_at)
       AND NOT EXISTS (SELECT 1 FROM notifications nn WHERE nn.type = 'pos_venda_parado' AND nn.related_id = ps.id)
     RETURNING ps.id, ps.user_id, l.name AS lead_name, ps.current_stage`
  );
  for (const p of newlyStalled) {
    const stageLabel = POST_SALE_STAGES.find((s) => s.key === p.current_stage)?.label ?? p.current_stage;
    const content = `Cliente ${p.lead_name} parado há mais de 5 dias em "${stageLabel}"`;
    await db.query(
      `INSERT INTO notifications (user_id, type, content, related_id) VALUES ($1, 'pos_venda_parado', $2, $3)`,
      [p.user_id, content, p.id]
    );
    await sendPushToUser(p.user_id, { title: "Cliente parado no pós-venda 📦", body: content, url: `/pos-venda/${p.id}` });
  }

  return NextResponse.json({ ok: true, remindersSent: sent, stalledMarked: newlyStalled.length });
}
