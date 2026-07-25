// app/(dashboard)/configuracoes/notificacoes/actions.ts — inscrição/remoção
// de notificação push do navegador (ver components/PushSetup.tsx).
"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendPushToUser } from "@/lib/push";

async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
}

export async function savePushSubscription(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<void> {
  const userId = await requireUserId();
  await db.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE SET user_id = $1, p256dh = $3, auth = $4`,
    [userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth]
  );
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  await requireUserId();
  await db.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [endpoint]);
}

/** Envia uma notificação de teste pros dispositivos do corretor logado —
 * usado pelo botão "Enviar teste" pra confirmar o caminho completo do push.
 * Devolve quantos dispositivos foram alcançados (0 = chaves VAPID não
 * configuradas ou nenhum dispositivo inscrito ainda). */
export async function sendTestNotification(): Promise<{ sent: number }> {
  const userId = await requireUserId();
  const { rows } = await db.query<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM push_subscriptions WHERE user_id = $1`,
    [userId]
  );
  await sendPushToUser(userId, {
    title: "🔔 GOOD MINT",
    body: "Notificação de teste — está tudo funcionando!",
    url: "/dashboard",
  });
  return { sent: Number(rows[0]?.count ?? 0) };
}
