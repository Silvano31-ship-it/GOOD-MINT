// components/automacoes/AutomationsList.tsx — Automações v2: formulário com
// múltiplos gatilhos (lead parado, lead novo, negociação parada) e ações
// combináveis (e-mail + tarefa + notificação/push), + lista com toggle e
// remoção. Form e lista vivem juntos aqui porque ambos são client components
// e o form precisa de estado (campos mudam conforme o gatilho escolhido).
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LEAD_STAGES } from "@/lib/constants";
import { toggleAutomation, deleteAutomation } from "@/app/(dashboard)/actions";
import { createAutomationV2 } from "@/app/(dashboard)/automacoes/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { EmptyState } from "@/components/ui";

export interface AutomationV2 {
  id: string;
  name: string;
  enabled: boolean;
  days_without_contact: number;
  action: string;
  action_message: string;
  created_at: string;
  trigger_type?: string | null;
  funnel_stage?: string | null;
  actions?: string[] | null;
}

const TRIGGER_LABELS: Record<string, string> = {
  lead_parado: "Lead parado (X dias sem contato)",
  lead_novo: "Novo lead cadastrado",
  negociacao_parada: "Negociação parada (X dias sem movimento)",
};

const ACTION_OPTIONS: { key: string; label: string; desc: string }[] = [
  { key: "criar_tarefa", label: "Criar tarefa", desc: "Aparece em Tarefas e na Agenda" },
  { key: "enviar_email", label: "Enviar e-mail pra você", desc: "Com a mensagem e o link do lead" },
  { key: "notificacao", label: "Notificação + push", desc: "Sino do app e aviso no celular" },
];

const ACTION_SHORT: Record<string, string> = {
  criar_tarefa: "📝 Tarefa",
  enviar_email: "✉️ E-mail",
  notificacao: "🔔 Notificação",
};

const STAGE_LABELS: Record<string, string> = Object.fromEntries(
  LEAD_STAGES.map((s) => [s.key, s.label])
);

export function NewAutomationForm({ hasAutomations }: { hasAutomations: boolean }) {
  const [trigger, setTrigger] = useState("lead_parado");
  const usesDays = trigger !== "lead_novo";

  return (
    <details className="gm-card mb-6 p-5" open={!hasAutomations}>
      <summary className="cursor-pointer font-semibold text-gm-900">+ Nova automação</summary>
      <form action={createAutomationV2} className="mt-4 space-y-3">
        <input
          name="name"
          required
          placeholder="Nome da regra (ex.: Resgatar leads esfriando) *"
          className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
        />

        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-gm-700/60">SE (gatilho)</span>
          <select
            name="trigger_type"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
          >
            {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>

        {usesDays && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-gm-700/60">
                {trigger === "negociacao_parada" ? "Dias sem movimento na negociação" : "Dias sem contato com o lead"}
              </span>
              <input
                name="days_without_contact"
                type="number"
                min="1"
                max="90"
                defaultValue={5}
                className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
              />
            </label>
            {trigger === "lead_parado" && (
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-gm-700/60">Somente leads na etapa (opcional)</span>
                <select name="funnel_stage" defaultValue="" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm">
                  <option value="">Qualquer etapa</option>
                  {LEAD_STAGES.filter((s) => s.key !== "fechado" && s.key !== "perdido").map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}

        <fieldset>
          <legend className="mb-1 block text-xs font-medium text-gm-700/60">ENTÃO (marque uma ou mais ações)</legend>
          <div className="space-y-2">
            {ACTION_OPTIONS.map((opt) => (
              <label key={opt.key} className="flex cursor-pointer items-start gap-2 rounded-lg border border-gm-200 p-2.5 text-sm hover:bg-gm-50">
                <input
                  type="checkbox"
                  name="actions"
                  value={opt.key}
                  defaultChecked={opt.key === "criar_tarefa"}
                  className="mt-0.5 h-4 w-4 accent-gm-500"
                />
                <span>
                  <span className="font-medium text-gm-900">{opt.label}</span>
                  <span className="block text-xs text-gm-700/50">{opt.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gm-700/60">Mensagem (corpo do e-mail / título da tarefa / texto da notificação) *</span>
          <textarea
            name="action_message"
            required
            rows={2}
            placeholder={
              trigger === "lead_novo"
                ? "Ex.: Lead novo na base — fazer o primeiro contato em até 1h!"
                : trigger === "negociacao_parada"
                ? "Ex.: Negociação esfriando, retomar conversa com o cliente."
                : "Ex.: Esse lead está esfriando, hora de ligar!"
            }
            className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
          />
        </label>
        <SubmitButton>Criar automação</SubmitButton>
      </form>
    </details>
  );
}

function describeTrigger(a: AutomationV2): string {
  const trigger = a.trigger_type ?? "lead_parado";
  if (trigger === "lead_novo") return "um novo lead for cadastrado";
  if (trigger === "negociacao_parada") return `uma negociação ficar ${a.days_without_contact} dias sem movimento`;
  const stage = a.funnel_stage ? ` na etapa ${STAGE_LABELS[a.funnel_stage] ?? a.funnel_stage}` : "";
  return `um lead${stage} ficar ${a.days_without_contact} dias sem contato`;
}

export function AutomationsList({ automations }: { automations: AutomationV2[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(id: string, enabled: boolean) {
    startTransition(async () => {
      await toggleAutomation(id, enabled);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm("Remover esta automação?")) return;
    startTransition(async () => {
      await deleteAutomation(id);
      router.refresh();
    });
  }

  if (automations.length === 0) {
    return <EmptyState icon="⚡" title="Nenhuma automação criada" desc="Crie uma regra acima: escolha um gatilho (lead parado, lead novo ou negociação parada) e combine as ações que quiser." />;
  }

  return (
    <div className="space-y-3">
      {automations.map((a) => {
        const acts = a.actions && a.actions.length > 0 ? a.actions : [a.action];
        return (
          <div key={a.id} className="gm-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gm-900">{a.name}</span>
                  {!a.enabled && <span className="rounded-full bg-gm-100 px-2 py-0.5 text-[10px] font-semibold text-gm-700/60">Desativada</span>}
                </div>
                <p className="mt-1 text-sm text-gm-700/70">
                  <b>SE</b> {describeTrigger(a)} <b>ENTÃO</b>
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {acts.map((act) => (
                    <span key={act} className="rounded-full border border-gm-200 bg-gm-50 px-2 py-0.5 text-[11px] font-semibold text-gm-700">
                      {ACTION_SHORT[act] ?? act}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-xs italic text-gm-700/50">"{a.action_message}"</p>
              </div>
              <div className="flex flex-none items-center gap-2">
                <button
                  onClick={() => toggle(a.id, !a.enabled)}
                  disabled={pending}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                    a.enabled ? "border-gm-200 text-gm-700 hover:bg-gm-50" : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
                >
                  {a.enabled ? "Desativar" : "Ativar"}
                </button>
                <button
                  onClick={() => remove(a.id)}
                  disabled={pending}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
