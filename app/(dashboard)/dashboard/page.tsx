// app/(dashboard)/dashboard/page.tsx — Tela 7. Dashboard — Home.
// Fica só com a saudação e as ações rápidas — bola de cristal, contadores,
// funil, metas e o resto viraram a tela "Relatório | GOOD 🟢"
// (ver app/(dashboard)/relatorio/page.tsx), pra deixar isso aqui limpo.
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { DashboardGreeting } from "@/components/DashboardGreeting";

export default async function DashboardHome() {
  const user = await requireActiveAccount();
  if (!user.onboarding_done) redirect("/onboarding");

  return (
    <div className="space-y-8">
      <DashboardGreeting fullName={user.full_name} initialEmoji={user.dashboard_emoji} />

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
