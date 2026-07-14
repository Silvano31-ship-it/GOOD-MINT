// app/api/webhooks/asaas/route.ts — POST
// Recebe eventos de pagamento do Asaas (seção 11 da spec: "cobrança
// automática, confirmação via webhook"). Configure em Asaas → Integrações →
// Webhooks: URL = https://seu-app.vercel.app/api/webhooks/asaas
// Token de autenticação = valor de ASAAS_WEBHOOK_TOKEN.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPaymentFailedEmail } from "@/lib/mailer";

interface AsaasWebhookPayload {
  event: string;
  payment: {
    id: string;
    subscription?: string;
    value: number;
    status: string;
    dueDate: string;
    paymentDate?: string;
    invoiceUrl?: string;
  };
}

const ACTIVATING_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
const SUSPENDING_EVENTS = new Set(["PAYMENT_OVERDUE", "PAYMENT_DELETED"]);

export async function POST(req: Request) {
  const token = req.headers.get("asaas-access-token");
  if (!process.env.ASAAS_WEBHOOK_TOKEN || token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }

  let payload: AsaasWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { event, payment } = payload;
  if (!payment?.subscription) {
    // Cobrança avulsa, fora do fluxo de assinatura — nada a fazer.
    return NextResponse.json({ ok: true, ignored: true });
  }

  const { rows } = await db.query<{ id: string; user_id: string }>(
    `SELECT id, user_id FROM subscriptions WHERE gateway_subscription_id = $1`,
    [payment.subscription]
  );
  const subscription = rows[0];
  if (!subscription) {
    return NextResponse.json({ ok: true, ignored: true, reason: "subscription not found" });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Registro da fatura (idempotente por gateway_invoice_id)
    await client.query(
      `INSERT INTO invoices (subscription_id, amount_cents, status, gateway_invoice_id, paid_at, due_at)
       SELECT $1, $2, $3, $4, $5, $6
       WHERE NOT EXISTS (SELECT 1 FROM invoices WHERE gateway_invoice_id = $4)`,
      [
        subscription.id,
        Math.round(payment.value * 100),
        payment.status,
        payment.id,
        payment.paymentDate ?? null,
        payment.dueDate,
      ]
    );

    if (ACTIVATING_EVENTS.has(event)) {
      await client.query(
        `UPDATE subscriptions SET status='active', current_period_start=now(),
           current_period_end = now() + interval '1 month' WHERE id=$1`,
        [subscription.id]
      );
      await client.query(`UPDATE users SET account_status='active' WHERE id=$1`, [subscription.user_id]);
    } else if (SUSPENDING_EVENTS.has(event)) {
      await client.query(`UPDATE subscriptions SET status='past_due' WHERE id=$1`, [subscription.id]);
      await client.query(`UPDATE users SET account_status='suspended' WHERE id=$1`, [subscription.user_id]);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro ao processar webhook Asaas:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  } finally {
    client.release();
  }

  // E-mail de aviso é best-effort — nunca deve fazer o webhook falhar/reprocessar.
  if (SUSPENDING_EVENTS.has(event)) {
    try {
      const { rows: userRows } = await db.query<{ email: string; full_name: string }>(
        `SELECT email, full_name FROM users WHERE id = $1`,
        [subscription.user_id]
      );
      const user = userRows[0];
      if (user) {
        const manageUrl = `${process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL}/configuracoes/plano`;
        await sendPaymentFailedEmail(user.email, user.full_name, manageUrl);
      }
    } catch (err) {
      console.error("Erro ao enviar e-mail de falha de pagamento:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
