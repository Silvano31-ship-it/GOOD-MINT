// app/(dashboard)/metas/page.tsx — Metas de vendas (valor ou número de
// vendas) por período, com barra de progresso, badge e histórico. Progresso
// calculado ao vivo contra negotiations fechadas (ver getGoals em lib/data.ts).
import { requireActiveAccount } from "@/lib/account-guard";
import { getGoals } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { GoalsList } from "@/components/metas/GoalsList";
import { createGoal } from "@/app/(dashboard)/actions";

export default async function MetasPage() {
  const user = await requireActiveAccount();
  const goals = await getGoals(user.id);

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader title="Metas" subtitle="Defina metas de vendas por período e acompanhe o progresso em tempo real." />

      <details className="gm-card mb-6 p-5" open={goals.length === 0}>
        <summary className="cursor-pointer font-semibold text-gm-900">+ Nova meta</summary>
        <form action={createGoal} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-gm-700/60">Tipo de meta</span>
              <select name="goal_type" defaultValue="valor" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm">
                <option value="valor">Valor em vendas (R$)</option>
                <option value="quantidade">Número de vendas</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-gm-700/60">Meta (número)</span>
              <input
                name="target_value"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="Ex.: 50000 ou 5"
                className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-gm-700/60">Início do período</span>
              <input name="period_start" type="date" defaultValue={firstDay} required className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-gm-700/60">Fim do período</span>
              <input name="period_end" type="date" defaultValue={lastDay} required className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
            </label>
          </div>
          <SubmitButton>Criar meta</SubmitButton>
        </form>
      </details>

      <GoalsList goals={goals} />
    </div>
  );
}
