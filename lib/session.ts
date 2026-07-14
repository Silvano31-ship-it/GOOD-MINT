// lib/session.ts
// Sessão via JWT assinado (HS256) em cookie httpOnly + Secure + SameSite=Lax.
// Compatível com Edge Runtime (middleware) por usar `jose` em vez de `jsonwebtoken`.

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "gm_session";
const SESSION_DURATION_S = 60 * 60 * 24 * 7; // 7 dias (padrão)
const REMEMBER_DURATION_S = 60 * 60 * 24 * 30; // 30 dias ("Lembrar-me" marcado)

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET não definido");
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  email: string;
}

export async function createSession(
  payload: SessionPayload,
  options?: { remember?: boolean }
): Promise<void> {
  const duration = options?.remember ? REMEMBER_DURATION_S : SESSION_DURATION_S;
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${duration}s`)
    .sign(getSecret());

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: duration,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { userId: payload.userId as string, email: payload.email as string };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  cookies().delete(SESSION_COOKIE);
}

// Versão para uso no middleware (Edge), que recebe o token direto do request
export async function verifySessionToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { userId: payload.userId as string, email: payload.email as string };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE };
