// app/api/badges/route.ts — GET
// Contadores leves pro menu lateral (hoje: leads criados hoje, no fuso do
// Brasil). Consultado por components/Sidebar.tsx via polling — mesmo padrão
// de app/api/notifications/unread/route.ts.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { rows } = await db.query<{ c: number }>(
    `SELECT count(*)::int AS c
     FROM leads
     WHERE user_id = $1 AND is_active
       AND created_at >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo'`,
    [session.userId]
  );

  return NextResponse.json({ leadsHoje: rows[0]?.c ?? 0 });
}
