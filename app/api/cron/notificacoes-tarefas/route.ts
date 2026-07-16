// app/api/cron/notificacoes-tarefas/route.ts — GET
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { rows } = await db.query<{ user_id: string; content: string }>(
    `INSERT INTO notifications (user_id, type, content, related_id)
     SELECT user_id, 'tarefa_pendente', 'Tarefa vencida: ' || title, id
     FROM tasks t
     WHERE done = false AND due_at IS NOT NULL AND due_at < now()
       AND NOT EXISTS (
         SELECT 1 FROM notifications n WHERE n.type = 'tarefa_pendente' AND n.related_id = t.id
       )
     RETURNING user_id, content`
  );

  for (const r of rows) {
    await sendPushToUser(r.user_id, { title: "Tarefa vencida ✅", body: r.content, url: "/tarefas" });
  }

  return NextResponse.json({ ok: true, notified: rows.length });
}
