// lib/account-guard.ts
// Usado no layout da área logada (server component). Busca o usuário da
// sessão e aplica a regra de conta suspensa (seção 11: cartão inválido no
// fim do trial → conta suspensa).

import { redirect } from "next/navigation";
import { db } from "./db";
import { getSession } from "./session";

export interface CurrentUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  creci: string | null;
  avatar_url: string | null;
  bio: string | null;
  company_name: string | null;
  company_bio: string | null;
  dashboard_emoji: string;
  onboarding_done: boolean;
  account_status: string;
  trial_ends_at: Date | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;

  const { rows } = await db.query<CurrentUser>(
    `SELECT u.id, u.full_name, u.email, u.phone, u.creci, u.avatar_url,
            u.bio, u.company_name, u.company_bio, u.dashboard_emoji, u.onboarding_done,
            u.account_status, s.trial_ends_at
     FROM users u
     LEFT JOIN subscriptions s ON s.user_id = u.id AND s.canceled_at IS NULL
     WHERE u.id = $1
     ORDER BY s.created_at DESC NULLS LAST
     LIMIT 1`,
    [session.userId]
  );
  return rows[0] ?? null;
}

export async function requireActiveAccount(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.account_status === "suspended") redirect("/conta-suspensa");
  return user;
}

/** Dias restantes do trial (arredondado pra cima). Null se não estiver em trial. */
export function trialDaysLeft(user: CurrentUser): number | null {
  if (user.account_status !== "trialing" || !user.trial_ends_at) return null;
  const ms = new Date(user.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
