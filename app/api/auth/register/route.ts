// app/api/auth/register/route.ts
// POST /api/auth/register
// Cria o usuário + assinatura em trial de 3 dias (seção 11 da spec), tudo
// numa transação. O cartão NÃO é coletado aqui — o cliente entra direto no
// painel e decide depois (em Configurações → Plano) se quer assinar.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  hashPassword,
  validateRegisterInput,
  findUserByEmail,
  type RegisterInput,
} from "@/lib/auth";
import { createSession } from "@/lib/session";

const TRIAL_DAYS = 3;
const VALID_PLAN_CODES = new Set(["mint_start", "mint_pro", "mint_business"]);

export async function POST(req: Request) {
  let input: RegisterInput & { planCode?: string };
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const errors = validateRegisterInput(input);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const planCode = VALID_PLAN_CODES.has(input.planCode ?? "") ? input.planCode! : "mint_start";

  const existing = await findUserByEmail(input.email);
  if (existing) {
    return NextResponse.json(
      { error: "Este e-mail já está cadastrado. Faça login ou recupere a senha." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(input.password);
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const userRes = await client.query<{ id: string }>(
      `INSERT INTO users (full_name, email, phone, password_hash, creci, account_status, lgpd_consent_at)
       VALUES ($1, lower($2), $3, $4, $5, 'trialing', now())
       RETURNING id`,
      [input.fullName.trim(), input.email, input.phone, passwordHash, input.creci ?? null]
    );
    const userId = userRes.rows[0].id;

    const planRes = await client.query<{ id: string }>(
      `INSERT INTO subscriptions (user_id, plan_id, status, trial_ends_at)
       SELECT $1, id, 'trialing', now() + interval '${TRIAL_DAYS} days'
       FROM plans WHERE code = $2
       RETURNING id`,
      [userId, planCode]
    );
    if (planRes.rowCount === 0) {
      throw new Error(`Plano '${planCode}' não encontrado`);
    }

    await client.query("COMMIT");

    await createSession({ userId, email: input.email.toLowerCase() });

    return NextResponse.json(
      { ok: true, trialDays: TRIAL_DAYS, redirect: "/dashboard" },
      { status: 201 }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro no cadastro:", err);
    return NextResponse.json(
      { error: "Erro interno ao criar a conta. Tente novamente." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
