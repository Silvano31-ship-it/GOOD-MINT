// app/(dashboard)/dashboard/page.tsx — Tela 7. Dashboard — Home.
// Contadores reais (sempre zerado em conta nova) + bola de cristal.
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getCounts } from "@/lib/data";
import { CrystalSphere } from "@/components/CrystalSphere";
import { StatCard } from "@/components/ui";
import { DashboardGreeting } from "@/components/DashboardGreeting";

export default async function DashboardHome() {
  const user = await requireActiveAccount();
  if (!user.onboarding_done) redirect("/onboarding");
  const counts = await getCounts(user.id);

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
