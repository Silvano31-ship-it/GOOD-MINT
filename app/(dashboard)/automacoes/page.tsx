// app/(dashboard)/automacoes/page.tsx — Automações v2: regras "SE... ENTÃO..."
// com múltiplos gatilhos (lead parado, lead novo, negociação parada) e ações
// combináveis (e-mail + tarefa + notificação/push). A consulta é feita aqui
// direto (e não em lib/data.ts) porque só esta tela usa as colunas novas da
// migration 026.
import { requireActiveAccount } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import {
  AutomationsList,
  NewAutomationForm,
  type AutomationV2,
} from "@/components/automacoes/AutomationsList";

export default async function AutomacoesPage() {
  const user = await requireActiveAccount();
  const { rows: automations } = await db.query<AutomationV2>(
    `SELECT id, name, enabled, days_without_contact, action, action_message,
            trigger_type, funnel_stage, actions, created_at
     FROM automations WHERE user_id = $1 ORDER BY created_at DESC`,
    [user.id]
  );

  return (
    <div>
      <PageHeader
        title="Automações"
        subtitle="Regras SE... ENTÃO... com gatilhos de lead e negociação — o sistema trabalha por você."
      />
      <NewAutomationForm hasAutomations={automations.length > 0} />
      <AutomationsList automations={automations} />
    </div>
  );
}
