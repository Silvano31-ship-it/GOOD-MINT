// app/(dashboard)/automacoes/page.tsx — Automações: regras "SE lead parado
// há X dias ENTÃO enviar e-mail ou criar tarefa". Escopo do MVP: só esse
// gatilho — os outros gatilhos/ações do pedido original (nova mensagem,
// etapa alterada, documento entregue, mover etapa, WhatsApp) já têm avisos
// fixos prontos em outros módulos, ou dependem de integrações externas ainda
// não configuradas (ver Central de Mensagens).
import { requireActiveAccount } from "@/lib/account-guard";
import { getAutomations } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { AutomationsList } from "@/components/automacoes/AutomationsList";
import { createAutomation } from "@/app/(dashboard)/actions";

export default async function AutomacoesPage() {
  const user = await requireActiveAccount();
  const automations = await getAutomations(user.id);

  return (
    <div>
      <PageHeader title="Automações" subtitle="Regras SE... ENTÃO... para leads parados — o sistema trabalha por você." />

      <details className="gm-card mb-6 p-5" open={automations.length === 0}>
        <summary className="cursor-pointer font-semibold text-gm-900">+ Nova automação</summary>
        <form action={createAutomation} className="mt-4 space-y-3">
          <input
            name="name"
            required
            placeholder="Nome da regra (ex.: Lembrete de 3 dias) *"
            className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-gm-700/60">SE o lead ficar parado por (dias)</span>
              <input
                name="days_without_contact"
                type="number"
                min="1"
                max="90"
                defaultValue={5}
                className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-gm-700/60">ENTÃO</span>
              <select name="action" defaultValue="enviar_email" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm">
                <option value="enviar_email">Enviar e-mail personalizado</option>
                <option value="criar_tarefa">Criar tarefa</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gm-700/60">Mensagem (corpo do e-mail ou título da tarefa) *</span>
            <textarea
              name="action_message"
              required
              rows={2}
              placeholder="Ex.: Esse lead está esfriando, hora de ligar!"
              className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
            />
          </label>
          <SubmitButton>Criar automação</SubmitButton>
        </form>
      </details>

      <AutomationsList automations={automations} />
    </div>
  );
}
