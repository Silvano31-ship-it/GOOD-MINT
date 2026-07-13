// app/(dashboard)/pos-venda/dashboard/page.tsx — métricas + funil + tarefas urgentes.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getPostSaleDashboardMetrics, getUrgentPostSaleTasks } from "@/lib/data";
import { PageHeader, StatCard, EmptyState } from "@/components/ui";
import { PosVendaTabs } from "@/components/pos-venda/PosVendaTabs";
import { FunnelChart } from "@/components/pos-venda/FunnelChart";
import { formatDate } from "@/lib/format";

export default async function PosVendaDashboardPage() {
  const user = await requireActiveAccount();
  const [metrics, urgent] = await Promise.all([
    getPostSaleDashboardMetrics(user.id),
    getUrgentPostSaleTasks(user.id),
  ]);

  return (
    <div>
      <PageHeader title="Pós-Venda" subtitle="Visão geral do funil e do que precisa de atenção hoje." />
      <PosVendaTabs />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Processos ativos" value={metrics.active} icon="📦" />
        <StatCard label="Concluídos no mês" value={metrics.completedThisMonth} icon="🎉" />
        <StatCard label="Parados (+5 dias)" value={metrics.stalled} icon="⏳" />
        <StatCard label="Média dias/etapa" value={metrics.avgDaysPerStage} icon="📈" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="gm-card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-gm-900">Funil de etapas</h2>
          <FunnelChart data={metrics.funnel} />
        </div>

        <div className="gm-card p-5">
          <h2 className="mb-3 font-semibold text-gm-900">Urgente hoje</h2>
          {urgent.length === 0 ? (
            <EmptyState icon="✅" title="Nada urgente" desc="Nenhum prazo vencendo nos próximos dias." />
          ) : (
            <ul className="space-y-2">
              {urgent.map((u) => (
                <li key={u.id}>
                  <Link href={`/pos-venda/${u.id}`} className="block rounded-lg bg-gm-50 px-3 py-2 text-sm hover:bg-gm-100">
                    <div className="font-medium text-gm-900">{u.lead_name}</div>
                    <div className="text-xs text-gm-700/60">{u.next_action ?? "Prazo próximo"} · {formatDate(u.next_action_due_at)}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
