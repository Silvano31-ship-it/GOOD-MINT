// app/api/plan-status/route.ts — GET
// Diz se a conta já é paga (Plano Único ativo) ou está no teste grátis.
// Consultado por components/PlanGate.tsx pra decidir se mostra o paywall nas
// funções exclusivas do plano. account_status vira 'active' quando o webhook
// do Asaas confirma o pagamento (ver app/api/webhooks/asaas/route.ts).
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { rows } = await db.query<{ account_status: string; ai_unlimited: boolean }>(
    `SELECT account_status, ai_unlimited FROM users WHERE id = $1`,
    [session.userId]
  );
  const u = rows[0];
  const paid = Boolean(u && (u.ai_unlimited || u.account_status === "active"));

  return NextResponse.json({ paid });
}
