// app/api/auth/reset-password/route.ts
// POST /api/auth/reset-password
// Valida o token (não usado, não expirado), troca a senha e invalida o token.

import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const token = body.token ?? "";
  const password = body.password ?? "";

  if (!token || password.length < 8) {
    return NextResponse.json(
      { error: "Token inválido ou senha com menos de 8 caracteres." },
      { status: 422 }
    );
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const { rows } = await db.query<{ id: string; user_id: string }>(
    `SELECT id, user_id FROM password_reset_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
    [tokenHash]
  );

  const reset = rows[0];
  if (!reset) {
    return NextResponse.json(
      { error: "Link de recuperação inválido ou expirado. Solicite um novo." },
      { status: 400 }
    );
  }

  const newHash = await hashPassword(password);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
      newHash,
      reset.user_id,
    ]);
    await client.query(
      `UPDATE password_reset_tokens SET used_at = now() WHERE id = $1`,
      [reset.id]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro ao redefinir senha:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  } finally {
    client.release();
  }

  return NextResponse.json({ ok: true, redirect: "/login" });
}
