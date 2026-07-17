// components/automacoes/AutomationsList.tsx — lista de automações com
// toggle ativo/inativo e remoção. Mesmo padrão de components/financeiro/CommissionsList.tsx.
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Automation } from "@/lib/constants";
import { AUTOMATION_ACTION_LABELS } from "@/lib/constants";
import { toggleAutomation, deleteAutomation } from "@/app/(dashboard)/actions";
import { EmptyState } from "@/components/ui";

export function AutomationsList({ automations }: { automations: Automation[] }) {
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
    return <EmptyState icon="⚡" title="Nenhuma automação criada" desc="Crie uma regra acima: SE um lead ficar parado, ENTÃO envie um e-mail ou crie uma tarefa." />;
  }

  return (
    <div className="space-y-3">
      {automations.map((a) => (
        <div key={a.id} className="gm-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gm-900">{a.name}</span>
                {!a.enabled && <span className="rounded-full bg-gm-100 px-2 py-0.5 text-[10px] font-semibold text-gm-700/60">Desativada</span>}
              </div>
              <p className="mt-1 text-sm text-gm-700/70">
                <b>SE</b> um lead ficar {a.days_without_contact} dias sem contato → <b>ENTÃO</b> {AUTOMATION_ACTION_LABELS[a.action].toLowerCase()}
              </p>
              <p className="mt-1 text-xs italic text-gm-700/50">"{a.action_message}"</p>
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
      ))}
    </div>
  );
}
