// app/api/profile/route.ts — PATCH
// Salva imediatamente o emoji escolhido no seletor do Dashboard (sem recarregar
// a página — por isso é uma rota de API chamada via fetch, e não uma server
// action, que exigiria um <form>).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let body: { dashboard_emoji?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const emoji = (body.dashboard_emoji ?? "").trim();
  if (!emoji || emoji.length > 8) {
    return NextResponse.json({ error: "Emoji inválido." }, { status: 422 });
  }

  await db.query(`UPDATE users SET dashboard_emoji=$1 WHERE id=$2`, [emoji, session.userId]);
  return NextResponse.json({ ok: true, dashboard_emoji: emoji });
}
