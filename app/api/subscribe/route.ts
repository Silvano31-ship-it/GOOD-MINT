// app/api/subscribe/route.ts — POST
// Chamado em Configurações → Plano (ou na tela de pagamento legada). Cria o
// cliente e a assinatura recorrente no Asaas (cartão tokenizado). Se
// `planCode` for enviado, troca o plano da assinatura antes de cobrar —
// permite ao usuário escolher/mudar de plano (Start/Pro/Business) na hora
// de assinar. O preço é sempre lido da tabela `plans`, nunca fixo no código.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { createCustomer, createCreditCardSubscription } from "@/lib/asaas";
import { onlyDigits, isoDatePlusDays } from "@/lib/format";
import { PLAN_PRICING } from "@/lib/constants";

const VALID_PLAN_CODES = new Set(["mint_start", "mint_pro", "mint_business"]);
const VALID_BILLING_CYCLES = new Set(["monthly", "yearly"]);

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let body: {
    holderName?: string;
    number?: string;
    expiryMonth?: string;
    expiryYear?: string;
    ccv?: string;
    cpfCnpj?: string;
    postalCode?: string;
    addressNumber?: string;
    planCode?: string;
    billingCycle?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { holderName, number, expiryMonth, expiryYear, ccv, cpfCnpj, postalCode, addressNumber, planCode } = body;
  const billingCycle = VALID_BILLING_CYCLES.has(body.billingCycle ?? "") ? body.billingCycle! : "monthly";
  if (!holderName || !number || !expiryMonth || !expiryYear || !ccv || !cpfCnpj || !postalCode || !addressNumber) {
    return NextResponse.json({ error: "Preencha todos os campos do cartão." }, { status: 422 });
  }

  const { rows: userRows } = await db.query<{
    id: string; full_name: string; email: string; phone: string;
  }>(`SELECT id, full_name, email, phone FROM users WHERE id = $1`, [session.userId]);
  const user = userRows[0];
  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  const { rows: subRows } = await db.query<{ id: string; trial_ends_at: string }>(
    `SELECT id, trial_ends_at FROM subscriptions
     WHERE user_id = $1 AND canceled_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    [user.id]
  );
  const subscription = subRows[0];
  if (!subscription) {
    return NextResponse.json({ error: "Assinatura não encontrada. Refaça o cadastro." }, { status: 404 });
  }

  // Troca de plano opcional (usuário escolhendo Start/Pro/Business na hora de assinar)
  if (planCode && VALID_PLAN_CODES.has(planCode)) {
    await db.query(
      `UPDATE subscriptions SET plan_id = (SELECT id FROM plans WHERE code = $1) WHERE id = $2`,
      [planCode, subscription.id]
    );
  }
  await db.query(`UPDATE subscriptions SET billing_cycle = $1 WHERE id = $2`, [billingCycle, subscription.id]);

  const { rows: planRows } = await db.query<{ code: string; name: string; price_cents: number }>(
    `SELECT p.code, p.name, p.price_cents FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id WHERE s.id = $1`,
    [subscription.id]
  );
  const plan = planRows[0];
  if (!plan) return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });

  const priceCents =
    PLAN_PRICING[plan.code]?.[billingCycle === "yearly" ? "yearlyCents" : "monthlyCents"] ?? plan.price_cents;

  const remoteIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

  try {
    const customer = await createCustomer({
      name: user.full_name,
      cpfCnpj: onlyDigits(cpfCnpj),
      email: user.email,
      mobilePhone: onlyDigits(user.phone),
    });

    // Cobra no fim do trial (mesma data de trial_ends_at); ao menos amanhã
    // para garantir uma data futura válida no Asaas.
    const trialEndsAt = new Date(subscription.trial_ends_at);
    const daysUntilTrialEnd = Math.max(
      1,
      Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000)
    );
    const nextDueDate = isoDatePlusDays(daysUntilTrialEnd);

    const asaasSub = await createCreditCardSubscription({
      customer: customer.id,
      value: priceCents / 100,
      nextDueDate,
      description: `GOOD MINT — Plano ${plan.name} (${billingCycle === "yearly" ? "anual" : "mensal"})`,
      cycle: billingCycle === "yearly" ? "YEARLY" : "MONTHLY",
      creditCard: { holderName, number, expiryMonth, expiryYear, ccv },
      holderInfo: {
        name: holderName,
        email: user.email,
        cpfCnpj: onlyDigits(cpfCnpj),
        postalCode: onlyDigits(postalCode),
        addressNumber,
        phone: onlyDigits(user.phone),
      },
      remoteIp,
    });

    const last4 = onlyDigits(number).slice(-4);
    await db.query(
      `UPDATE subscriptions
       SET gateway_customer_id=$1, gateway_subscription_id=$2, card_last4=$3, card_brand=$4
       WHERE id=$5`,
      [customer.id, asaasSub.id, last4, asaasSub.creditCard?.creditCardBrand ?? null, subscription.id]
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Erro ao registrar cartão no Asaas:", err);
    return NextResponse.json(
      { error: err?.message ?? "Não foi possível registrar o cartão. Verifique os dados e tente novamente." },
      { status: 502 }
    );
  }
}
