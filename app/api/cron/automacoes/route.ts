// app/api/cron/automacoes/route.ts — GET
// Roda diariamente (ver vercel.json). Protegido por CRON_SECRET, mesmo padrão
// dos outros crons. A lógica das Automações v2 mora em lib/automations.ts,
// compartilhada com o botão "Rodar agora" da tela de Automações.
import { NextResponse } from "next/server";
import { runAutomations } from "@/lib/automations";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { matched, executed } = await runAutomations();
  return NextResponse.json({ ok: true, matched, executed });
}
