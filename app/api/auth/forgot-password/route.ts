// app/api/auth/forgot-password/route.ts
// POST /api/auth/forgot-password
// Gera token de uso único (1h), guarda apenas o hash no banco e envia o link
// por e-mail. Resposta sempre igual, exista o e-mail ou não (anti-enumeração).

import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { findUserByEmail } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/mailer";

const TOKEN_TTL_MINUTES = 60;

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const genericResponse = NextResponse.json({
    ok: true,
    message: "Se este e-mail estiver cadastrado, você receberá um link de recuperação.",
  });

  if (!email) return genericResponse;

  const user = await findUserByEmail(email);
  if (!user) return genericResponse;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  await db.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + interval '${TOKEN_TTL_MINUTES} minutes')`,
    [user.id, tokenHash]
  );

  const resetUrl = `${process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL}/recuperar-senha/redefinir?token=${rawToken}`;
  await sendPasswordResetEmail(user.email, user.full_name, resetUrl);

  return genericResponse;
}
