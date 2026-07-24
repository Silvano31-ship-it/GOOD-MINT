// app/(dashboard)/automacoes/page.tsx — Automações v2: regras "SE... ENTÃO..."
// com múltiplos gatilhos (lead parado, lead novo, negociação parada) e ações
// combináveis (e-mail + tarefa + notificação/push). A consulta é feita aqui
// direto (e não em lib/data.ts) porque só esta tela usa as colunas novas da
// migration 026. O botão "Rodar agora" dispara a mesma lógica do cron na hora
// (ver runMyAutomationsNow + lib/automations.ts).
import { requireActiveAccount } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { runMyAutomationsNow } from "@/app/(dashboard)/automacoes/actions";
import {
  AutomationsList,
  NewAutomationForm,
  type AutomationV2,
} from "@/components/automacoes/AutomationsList";

export default async function AutomacoesPage({
  searchParams,
}: {
  searchParams: { rodou?: string; achou?: string };
}) {
  const user = await requireActiveAccount();
  const { rows: automations } = await db.query<AutomationV2>(
    `SELECT id, name, enabled, days_without_contact, action, action_message,
            trigger_type, funnel_stage, actions, created_at
     FROM automations WHERE user_id = $1 ORDER BY created_at DESC`,
    [user.id]
  );

  const rodou = searchParams.rodou !== undefined;
  const executed = Number(searchParams.rodou) || 0;
  const matched = Number(searchParams.achou) || 0;

  return (
    <div>
      <PageHeader
        title="Automações"
        subtitle="Regras SE... ENTÃO... com gatilhos de lead e negociação — o sistema trabalha por você."
        action={
          automations.length > 0 ? (
            <form action={runMyAutomationsNow}>
              <button className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">
                ▶ Rodar agora
              </button>
            </form>
          ) : undefined
        }
      />

      {rodou && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {matched > 0
            ? `✓ Rodei agora: ${executed} ${executed === 1 ? "ação executada" : "ações executadas"} em ${matched} ${matched === 1 ? "situação" : "situações"}.`
            : "✓ Rodei agora — nenhuma automação tinha condição de disparar neste momento. (Nada pendente, ou já foi disparado antes.)"}
        </div>
      )}

      <NewAutomationForm hasAutomations={automations.length > 0} />
      <AutomationsList automations={automations} />
    </div>
  );
}
