// app/(dashboard)/dashboard/page.tsx — Tela 7. Dashboard — Home.
// Contadores reais (sempre zerado em conta nova) + bola de cristal.
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getCounts, getLeadFunnelMetrics, getWeeklyLeadGoalProgress } from "@/lib/data";
import { WEEKLY_LEAD_GOAL } from "@/lib/constants";
import { CrystalSphere } from "@/components/CrystalSphere";
import { StatCard } from "@/components/ui";
import { DashboardGreeting } from "@/components/DashboardGreeting";
import { FunnelChart } from "@/components/pos-venda/FunnelChart";

export default async function DashboardHome() {
  const user = await requireActiveAccount();
  if (!user.onboarding_done) redirect("/onboarding");
  const [counts, funnelMetrics, weeklyLeads] = await Promise.all([
    getCounts(user.id),
    getLeadFunnelMetrics(user.id),
    getWeeklyLeadGoalProgress(user.id),
  ]);

  const isEmpty =
    counts.leadsActive === 0 &&
    counts.properties === 0 &&
    counts.negotiationsOpen === 0 &&
    counts.postSaleActive === 0;

  return (
    <div className="space-y-8">
      <DashboardGreeting fullName={user.full_name} initialEmoji={user.dashboard_emoji} />

      {/* Esfera + dados flutuantes */}
      <section className="gm-radial relative overflow-hidden rounded-2xl p-6">
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div className="flex justify-center">
            <CrystalSphere empty={isEmpty} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FloatingStat label="Leads ativos" value={counts.leadsActive} />
            <FloatingStat label="Imóveis" value={counts.properties} />
            <FloatingStat label="Negociações abertas" value={counts.negotiationsOpen} />
            <FloatingStat label="Em pós-venda" value={counts.postSaleActive} />
          </div>
        </div>
      </section>

      {/* Cards de contadores com limites do plano */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Leads ativos" value={counts.leadsActive} limit={counts.leadLimit} icon="🎯" />
        <StatCard label="Imóveis" value={counts.properties} limit={counts.propertyLimit} icon="🏠" />
        <StatCard label="Negociações abertas" value={counts.negotiationsOpen} icon="🤝" />
        <StatCard label="Clientes em pós-venda" value={counts.postSaleActive} icon="📦" />
      </section>

      {/* Funil de leads + meta da semana */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="gm-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gm-900">Funil de leads</h2>
            <span className="rounded-full bg-gm-50 px-3 py-1 text-xs font-semibold text-gm-700">
              Taxa de conversão: {funnelMetrics.conversionRate}%
            </span>
          </div>
          <FunnelChart data={funnelMetrics.funnel} />
        </div>

        <div className="gm-card p-5">
          <h2 className="mb-3 font-semibold text-gm-900">🎯 Meta da semana</h2>
          <p className="text-sm text-gm-700/70">
            Cadastre {WEEKLY_LEAD_GOAL} leads essa semana. Você já cadastrou {weeklyLeads}!
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gm-100">
            <div
              className="h-full rounded-full bg-gm-500 transition-all"
              style={{ width: `${Math.min(100, Math.round((weeklyLeads / WEEKLY_LEAD_GOAL) * 100))}%` }}
            />
          </div>
          {weeklyLeads >= WEEKLY_LEAD_GOAL && (
            <p className="mt-2 text-xs font-medium text-green-600">Meta batida! 🎉</p>
          )}
        </div>
      </section>

      {/* Ações rápidas */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gm-700/50">
          Ações rápidas
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickAction href="/leads" icon="🎯" title="Adicionar lead" desc="Cadastre um novo contato" />
          <QuickAction href="/imoveis/novo" icon="🏠" title="Cadastrar imóvel" desc="Adicione um imóvel à carteira" />
          <QuickAction href="/pos-venda" icon="📦" title="Ver pós-venda" desc="Acompanhe os processos em andamento" />
        </div>
      </section>
    </div>
  );
}

function FloatingStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="gm-glass gm-breathe rounded-xl px-4 py-3 text-white">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-white/70">{label}</div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="gm-card group p-5 transition hover:-translate-y-0.5">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 font-semibold text-gm-900 group-hover:text-gm-500">{title}</div>
      <div className="text-sm text-gm-700/60">{desc}</div>
    </Link>
  );
}
