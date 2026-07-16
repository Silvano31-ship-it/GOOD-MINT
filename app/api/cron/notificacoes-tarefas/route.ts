// app/api/cron/notificacoes-tarefas/route.ts — GET
// Roda diariamente (ver vercel.json). Protegido por CRON_SECRET, mesmo padrão
// dos outros crons. Cria uma notificação in-app por tarefa vencida — uma vez
// só por tarefa (ver NOT EXISTS), não repete todo dia enquanto ela continuar
// vencida.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { rowCount } = await db.query(
    `INSERT INTO notifications (user_id, type, content, related_id)
     SELECT user_id, 'tarefa_pendente', 'Tarefa vencida: ' || title, id
     FROM tasks t
     WHERE done = false AND due_at IS NOT NULL AND due_at < now()
       AND NOT EXISTS (
         SELECT 1 FROM notifications n WHERE n.type = 'tarefa_pendente' AND n.related_id = t.id
       )`
  );

  return NextResponse.json({ ok: true, notified: rowCount });
}
