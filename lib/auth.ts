// lib/auth.ts
// Hash de senha (bcrypt), validação de campos do cadastro e consulta de usuário.

import bcrypt from "bcryptjs";
import { db } from "./db";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  creci?: string; // opcional nesta fase (seção 11 da spec)
  lgpdConsent: boolean; // obrigatório (LGPD, seção 12)
}

export function validateRegisterInput(input: RegisterInput): string[] {
  const errors: string[] = [];
  if (!input.fullName || input.fullName.trim().length < 3)
    errors.push("Nome completo é obrigatório (mínimo 3 caracteres).");
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
    errors.push("E-mail inválido.");
  if (!input.phone || input.phone.replace(/\D/g, "").length < 10)
    errors.push("Telefone/WhatsApp inválido (informe DDD + número).");
  if (!input.password || input.password.length < 8)
    errors.push("Senha deve ter no mínimo 8 caracteres.");
  if (!input.lgpdConsent)
    errors.push("É necessário aceitar a política de privacidade (LGPD).");
  return errors;
}

export interface DbUser {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  account_status: "trialing" | "active" | "past_due" | "suspended" | "canceled";
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const { rows } = await db.query<DbUser>(
    `SELECT id, full_name, email, password_hash, account_status
     FROM users WHERE lower(email) = lower($1)`,
    [email]
  );
  return rows[0] ?? null;
}
