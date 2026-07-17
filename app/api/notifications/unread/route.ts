// app/api/notifications/unread/route.ts — GET
// Consultado por components/NotificationBell.tsx via polling (a cada ~25s)
// pra atualizar o contador do sino e disparar o toast de notificação nova.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUnreadNotifications } from "@/lib/data";
import { notificationUrl } from "@/lib/constants";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { count, latest } = await getUnreadNotifications(session.userId);
  return NextResponse.json({
    count,
    latest: latest.map((n) => ({
      id: n.id,
      type: n.type,
      content: n.content,
      created_at: n.created_at,
      url: notificationUrl(n.type, n.related_id),
    })),
  });
}
