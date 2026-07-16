// app/api/cron/cobranca-lembretes/route.ts — GET
// Roda diariamente (ver vercel.json). Protegido por CRON_SECRET, mesmo padrão
// de app/api/cron/social e pos-venda-lembretes. Avisa por e-mail ~3 dias antes
// da próxima cobrança — tanto o fim do trial (primeira cobrança) quanto a
// renovação mensal de quem já está ativo.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPaymentReminderEmail } from "@/lib/mailer";
import { formatBRL, formatDate } from "@/lib/format";

const REMINDER_WINDOW_DAYS = 3;

interface DueSubscription {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  plan_name: string;
  price_cents: number;
  due_at: string;
  status: string;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // Trial (primeira cobrança) e assinatura ativa (renovação mensal) usam datas
  // diferentes (trial_ends_at vs. current_period_end), mas o mesmo aviso serve
  // pros dois casos — union das duas situações.
  const { rows: due } = await db.query<DueSubscription>(
    `SELECT s.id, s.user_id, u.email, u.full_name, p.name AS plan_name, p.price_cents,
            COALESCE(s.current_period_end, s.trial_ends_at) AS due_at, s.status
     FROM subscriptions s
     JOIN users u ON u.id = s.user_id
     JOIN plans p ON p.id = s.plan_id
     WHERE s.canceled_at IS NULL
       AND s.status IN ('trialing', 'active')
       AND COALESCE(s.current_period_end, s.trial_ends_at)
             BETWEEN now() AND now() + interval '3 days'
       AND (
         s.payment_reminder_sent_at IS NULL
         OR s.payment_reminder_sent_at < COALESCE(s.current_period_start, s.created_at)
       )
     LIMIT 100`
  );

  let sent = 0;
  for (const row of due) {
    try {
      await sendPaymentReminderEmail(
        row.email,
        row.full_name,
        row.plan_name,
        formatBRL(row.price_cents),
        formatDate(row.due_at)
      );
      sent++;
    } catch (err) {
      console.error("Erro ao enviar lembrete de cobrança:", err);
    }
    await db.query(`UPDATE subscriptions SET payment_reminder_sent_at = now() WHERE id = $1`, [row.id]);

    // Notificação in-app só pra quem ainda está no trial (quem já é cliente
    // ativo recebe o e-mail de renovação acima, mas não precisa do aviso de
    // "trial acabando" — esse é só pra quem ainda não virou cliente pagante).
    if (row.status === "trialing") {
      await db.query(
        `INSERT INTO notifications (user_id, type, content, related_id)
         SELECT $1, 'trial_expirando', 'Seu período de teste grátis termina em breve', $2
         WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE type = 'trial_expirando' AND related_id = $2)`,
        [row.user_id, row.id]
      );
    }
  }

  return NextResponse.json({ ok: true, remindersSent: sent });
}
