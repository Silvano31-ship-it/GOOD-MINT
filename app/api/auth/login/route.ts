// app/api/auth/login/route.ts
// POST /api/auth/login
// Mensagem de erro genérica (não revela se o e-mail existe) e comparação de
// senha mesmo quando o usuário não existe, para dificultar enumeração/timing.

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, verifyPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";

const DUMMY_HASH = bcrypt.hashSync("senha-invalida-dummy", 12);

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(req: Request) {
  let body: { email?: string; password?: string; remember?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 422 });
  }

  if (rateLimited(email)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429 }
    );
  }

  const user = await findUserByEmail(email);

  const valid = user
    ? await verifyPassword(password, user.password_hash)
    : await verifyPassword(password, DUMMY_HASH);

  if (!user || !valid) {
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  await createSession({ userId: user.id, email: user.email }, { remember: body.remember === true });

  const redirect =
    user.account_status === "suspended" ? "/conta-suspensa" : "/dashboard";

  return NextResponse.json({ ok: true, redirect });
}
