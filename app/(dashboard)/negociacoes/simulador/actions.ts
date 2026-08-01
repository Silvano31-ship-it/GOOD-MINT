// app/(dashboard)/negociacoes/simulador/actions.ts — server action do
// Simulador de Comissão Preditiva: define a probabilidade de fechamento de
// uma negociação aberta (10/25/50/75/90%).
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const ALLOWED = new Set([10, 25, 50, 75, 90]);

export async function setNegotiationProbability(negotiationId: string, probability: number) {
  const session = await getSession();
  if (!session) redirect("/login");

  const p = ALLOWED.has(probability) ? probability : 50;
  await db.query(
    `UPDATE negotiations SET probability = $1 WHERE id = $2 AND user_id = $3 AND status = 'aberta'`,
    [p, negotiationId, session.userId]
  );
  revalidatePath("/negociacoes/simulador");
}
