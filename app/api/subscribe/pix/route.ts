// app/api/subscribe/pix/route.ts — POST
// Assinatura do Plano Único via PIX. Cria o cliente e uma assinatura PIX no
// Asaas com vencimento hoje, e devolve o QR Code (imagem + copia-e-cola) da
// primeira cobrança pra o corretor pagar na hora. Ao pagar, o webhook do Asaas
// ativa a conta (trialing → active), igual ao cartão.
//
// Este arquivo fala com o Asaas por conta própria (helper `asaas` abaixo) pra
// não exigir mudança no lib/asaas.ts — só reaproveita o createCustomer que já
// existe lá.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { createCustomer } from "@/lib/asaas";
import { onlyDigits, isoDatePlusDays } from "@/lib/format";
import { PLAN_PRICING } from "@/lib/constants";

const ASAAS_ENV = process.env.ASAAS_ENV ?? "sandbox";
const BASE_URL =
  ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

async function asaas<T>(
  path: string,
  init?: Omit<RequestInit, "body"> & { body?: unknown }
): Promise<T> {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("ASAAS_API_KEY não definido");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    method: init?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      access_token: key,
      "User-Agent": "GoodMint",
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(data?.errors?.[0]?.description ?? `Erro Asaas (${res.status})`);
  }
  return data as T;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let body: { cpfCnpj?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const cpfCnpj = onlyDigits(body.cpfCnpj ?? "");
  if (cpfCnpj.length < 11) {
    return NextResponse.json({ error: "Digite um CPF ou CNPJ válido." }, { status: 422 });
  }

  const { rows: userRows } = await db.query<{
    id: string; full_name: string; email: string; phone: string;
  }>(`SELECT id, full_name, email, phone FROM users WHERE id = $1`, [session.userId]);
  const user = userRows[0];
  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  const { rows: subRows } = await db.query<{ id: string }>(
    `SELECT id FROM subscriptions WHERE user_id = $1 AND canceled_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    [user.id]
  );
  const subscription = subRows[0];
  if (!subscription) {
    return NextResponse.json({ error: "Assinatura não encontrada. Refaça o cadastro." }, { status: 404 });
  }

  const { rows: planRows } = await db.query<{ code: string; name: string; price_cents: number }>(
    `SELECT p.code, p.name, p.price_cents FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id WHERE s.id = $1`,
    [subscription.id]
  );
  const plan = planRows[0];
  if (!plan) return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });

  const priceCents = PLAN_PRICING[plan.code]?.monthlyCents ?? plan.price_cents;

  try {
    const customer = await createCustomer({
      name: user.full_name,
      cpfCnpj,
      email: user.email,
      mobilePhone: onlyDigits(user.phone),
    });

    // Assinatura PIX (não é débito automático: o Asaas gera uma cobrança PIX
    // por ciclo e o cliente paga escaneando o QR). Vencimento hoje = paga já.
    const asaasSub = await asaas<{ id: string }>("/subscriptions", {
      method: "POST",
      body: {
        customer: customer.id,
        billingType: "PIX",
        cycle: "MONTHLY",
        value: priceCents / 100,
        nextDueDate: isoDatePlusDays(0),
        description: `GOOD MINT — Plano ${plan.name} (mensal, PIX)`,
      },
    });

    await db.query(
      `UPDATE subscriptions
       SET gateway_customer_id=$1, gateway_subscription_id=$2, billing_cycle='monthly'
       WHERE id=$3`,
      [customer.id, asaasSub.id, subscription.id]
    );

    // QR Code da primeira cobrança pendente da assinatura.
    const payments = await asaas<{ data: { id: string; status: string }[] }>(
      `/subscriptions/${asaasSub.id}/payments`
    );
    const charge = payments.data?.find((p) => p.status === "PENDING") ?? payments.data?.[0];
    const qr = charge
      ? await asaas<{ encodedImage?: string; payload?: string }>(`/payments/${charge.id}/pixQrCode`)
      : null;

    if (!qr?.encodedImage || !qr?.payload) {
      return NextResponse.json(
        { error: "PIX ainda não está habilitado nesta conta. Configure uma chave PIX no Asaas ou use cartão." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      qrImage: `data:image/png;base64,${qr.encodedImage}`,
      payload: qr.payload,
      valueCents: priceCents,
    });
  } catch (err: any) {
    console.error("Erro ao gerar PIX no Asaas:", err);
    return NextResponse.json(
      { error: err?.message ?? "Não foi possível gerar o PIX agora. Tente novamente." },
      { status: 502 }
    );
  }
}
