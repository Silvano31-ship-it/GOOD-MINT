// app/(dashboard)/automacoes/actions.ts — server actions do módulo Automações
// v2 (múltiplos gatilhos e ações combináveis). Arquivo próprio pra não inchar
// mais o app/(dashboard)/actions.ts — mesmo padrão de pos-venda/actions.ts.
// toggleAutomation/deleteAutomation continuam no actions.ts principal.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const VALID_TRIGGERS = new Set(["lead_parado", "lead_novo", "negociacao_parada"]);
const VALID_ACTIONS = new Set(["enviar_email", "criar_tarefa", "notificacao"]);
const VALID_STAGES = new Set(["novo_lead", "contato_feito", "visita_agendada", "proposta"]);

export async function createAutomationV2(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const userId = session.userId;

  const name = String(formData.get("name") ?? "").trim();
  const message = String(formData.get("action_message") ?? "").trim();
  if (!name || !message) return;

  const triggerRaw = String(formData.get("trigger_type") ?? "lead_parado");
  const trigger = VALID_TRIGGERS.has(triggerRaw) ? triggerRaw : "lead_parado";
  const days = Math.min(90, Math.max(1, Number(formData.get("days_without_contact")) || 5));

  const stageRaw = String(formData.get("funnel_stage") ?? "");
  // Filtro de etapa só faz sentido no gatilho de lead parado.
  const stage = trigger === "lead_parado" && VALID_STAGES.has(stageRaw) ? stageRaw : null;

  const actions = Array.from(
    new Set(formData.getAll("actions").map(String).filter((a) => VALID_ACTIONS.has(a)))
  );
  if (actions.length === 0) return;

  // Coluna legada `action` é NOT NULL com CHECK (enviar_email|criar_tarefa) —
  // a fonte da verdade agora é `actions`, mas mantemos ela válida.
  const legacyAction =
    actions.find((a) => a === "enviar_email" || a === "criar_tarefa") ?? "criar_tarefa";

  await db.query(
    `INSERT INTO automations (user_id, name, days_without_contact, action, action_message, trigger_type, funnel_stage, actions)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [userId, name, days, legacyAction, message, trigger, stage, actions]
  );
  revalidatePath("/automacoes");
}
