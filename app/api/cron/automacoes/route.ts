// app/api/cron/automacoes/route.ts — GET
// Roda diariamente (ver vercel.json). Protegido por CRON_SECRET, mesmo padrão
// dos outros crons. Executa as automações "lead parado" de cada corretor:
// verifica cada regra ativa contra os leads do próprio corretor, e dispara a
// ação configurada (e-mail personalizado ou criar tarefa) — uma vez por lead
// por regra, até o próximo contato (mesmo padrão de dedup do cron
// leads-parados).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendAutomationEmail } from "@/lib/resend";

interface AutomationMatch {
  automation_id: string;
  action: string;
  action_message: string;
  lead_id: string;
  lead_name: string;
  user_id: string;
  email: string;
  full_name: string;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { rows } = await db.query<AutomationMatch>(
    `SELECT a.id AS automation_id, a.action, a.action_message,
            l.id AS lead_id, l.name AS lead_name, a.user_id, u.email, u.full_name
     FROM automations a
     JOIN users u ON u.id = a.user_id
     JOIN leads l ON l.user_id = a.user_id
     WHERE a.enabled = true
       AND l.is_active AND l.funnel_stage NOT IN ('fechado', 'perdido')
       AND (l.last_contact_at IS NULL OR l.last_contact_at < now() - (a.days_without_contact || ' days')::interval)
       AND NOT EXISTS (
         SELECT 1 FROM automation_runs r
         WHERE r.automation_id = a.id AND r.lead_id = l.id
           AND r.ran_at > COALESCE(l.last_contact_at, l.created_at)
       )
     LIMIT 300`
  );

  let executed = 0;
  for (const row of rows) {
    try {
      if (row.action === "criar_tarefa") {
        await db.query(
          `INSERT INTO tasks (user_id, title, due_at, related_type, related_id, event_type)
           VALUES ($1,$2, now(), 'lead', $3, 'lembrete')`,
          [row.user_id, `${row.action_message} — ${row.lead_name}`, row.lead_id]
        );
      } else {
        await sendAutomationEmail(
          row.email,
          row.full_name,
          row.lead_name,
          row.action_message,
          `${process.env.APP_URL}/leads/${row.lead_id}`
        );
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

  return NextResponse.json({ ok: true, matched: rows.length, executed });
}
