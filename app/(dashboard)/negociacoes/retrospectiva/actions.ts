// app/(dashboard)/negociacoes/retrospectiva/actions.ts — marca uma negociação
// como perdida E registra a "autópsia" (motivo + etapa + observação), que
// alimenta a Retrospectiva de Perdas.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const REASONS = new Set(["preco", "outro_corretor", "sumiu", "desistiu", "outro"]);
const STAGES = new Set(["primeiro_contato", "visita", "proposta", "contraproposta", "documentacao", "outro"]);

export async function loseNegotiation(
  negotiationId: string,
  input: { reason: string; stageLost: string; note: string }
) {
  const session = await getSession();
  if (!session) redirect("/login");
  const userId = session.userId;

  const reason = REASONS.has(input.reason) ? input.reason : "outro";
  const stageLost = STAGES.has(input.stageLost) ? input.stageLost : null;
  const note = (input.note || "").trim().slice(0, 500) || null;

  const { rowCount } = await db.query(
    `UPDATE negotiations SET status='perdida', closed_at=now()
     WHERE id=$1 AND user_id=$2 AND status='aberta'`,
    [negotiationId, userId]
  );
  if (!rowCount) return;

  await db.query(
    `INSERT INTO negotiation_losses (user_id, negotiation_id, reason, stage_lost, note)
     VALUES ($1,$2,$3,$4,$5)`,
    [userId, negotiationId, reason, stageLost, note]
  );

  revalidatePath("/negociacoes");
  revalidatePath("/negociacoes/retrospectiva");
}
