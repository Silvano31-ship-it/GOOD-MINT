// lib/push.ts — envia notificação push pro navegador do corretor (protocolo
// Web Push padrão). Usa a lib `web-push` porque o protocolo exige criptografia
// específica (ECDH + HKDF) — não dá pra fazer com um fetch direto como as
// outras integrações deste projeto.
import webpush from "web-push";
import { db } from "./db";

const vapidPublic = process.env.VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:contato@goodmint.app";

if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Manda pra todos os dispositivos em que o corretor ativou notificações.
 * Silencioso se as chaves VAPID não estiverem configuradas nesta conta ainda. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!vapidPublic || !vapidPrivate) return;

  const { rows } = await db.query<{ id: string; endpoint: string; p256dh: string; auth: string }>(
    `SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
    [userId]
  );

  for (const sub of rows) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
    } catch (err: any) {
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await db.query(`DELETE FROM push_subscriptions WHERE id = $1`, [sub.id]);
      } else {
        console.error("Erro ao enviar push:", err);
      }
    }
  }
}
