// app/(dashboard)/dashboard/page.tsx — Tela 7. Dashboard — Home.
// Contadores reais (sempre zerado em conta nova) + bola de cristal.
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import {
  getCounts,
  getLeadFunnelMetrics,
  getWeeklyLeadGoalProgress,
  getStaleLeadsForDashboard,
  getTodayTasksForDashboard,
  getEstimatedMonthlyCommission,
  getRecentMeetings,
  getDailySuggestions,
} from "@/lib/data";
import { WEEKLY_LEAD_GOAL, LEAD_MESSAGE_TEMPLATES } from "@/lib/constants";
import { formatBRL, formatDateTime } from "@/lib/format";
import { CrystalSphere } from "@/components/CrystalSphere";
import { StatCard } from "@/components/ui";
import { DashboardGreeting } from "@/components/DashboardGreeting";
import { FunnelChart } from "@/components/pos-venda/FunnelChart";

export default async function DashboardHome() {
  const user = await requireActiveAccount();
  if (!user.onboarding_done) redirect("/onboarding");
  const [counts, funnelMetrics, weeklyLeads, staleLeads, todayTasks, estimatedCommission, recentMeetings, dailySuggestions] = await Promise.all([
    getCounts(user.id),
    getLeadFunnelMetrics(user.id),
    getWeeklyLeadGoalProgress(user.id),
    getStaleLeadsForDashboard(user.id),
    getTodayTasksForDashboard(user.id),
    getEstimatedMonthlyCommission(user.id),
    getRecentMeetings(user.id),
    getDailySuggestions(user.id),
  ]);

  const isEmpty =
    counts.leadsActive === 0 &&
    counts.properties === 0 &&
    counts.negotiationsOpen === 0 &&
    counts.postSaleActive === 0;

  return (
    <div className="space-y-8">
      <DashboardGreeting fullName={user.full_name} initialEmoji={user.dashboard_emoji} />

      {/* Sugestões do dia — 2-3 ações prioritárias, pra quem não tem tempo de
          garimpar a carteira toda procurando o que fazer primeiro. */}
      {dailySuggestions.length > 0 && (
        <section className="gm-card p-4">
          <h2 className="mb-3 font-semibold text-gm-900">✨ Prioridades de hoje</h2>
          <ul className="space-y-2">
            {dailySuggestions.map((s, i) => (
              <li key={i}>
                <Link href={s.href} className="flex items-center gap-2 rounded-lg px-2 py-1.5 -mx-2 text-sm hover:bg-gm-50">
                  <span>{s.icon}</span>
                  <span className="text-gm-900">{s.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      {/* Widgets de acompanhamento */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="gm-card p-4">
          <h3 className="mb-3 flex items-center gap-1.5 font-semibold text-gm-900">⏰ Leads atrasados</h3>
          {staleLeads.length === 0 ? (
            <p className="text-sm text-gm-700/50">Nenhum lead esperando retorno. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {staleLeads.map((l) => {
                const digits = l.phone?.replace(/\D/g, "");
                const waHref = digits
                  ? `https://wa.me/${digits}?text=${encodeURIComponent(
                      (LEAD_MESSAGE_TEMPLATES[l.funnel_stage] ?? LEAD_MESSAGE_TEMPLATES.novo_lead)
                        .replace("{nome}", l.name.split(" ")[0])
                        .replace("{corretor}", user.full_name)
                    )}`
                  : null;
                return (
                  <li key={l.id} className="flex items-center gap-1 rounded-lg px-2 py-1.5 -mx-2 hover:bg-gm-50">
                    <Link href={`/leads/${l.id}`} className="min-w-0 flex-1 text-sm">
                      <span className="block font-medium text-gm-900">{l.name}</span>
                      <span className="block text-xs text-gm-700/50">
                        {l.last_contact_at ? `Sem contato desde ${formatDateTime(l.last_contact_at)}` : "Nunca contatado"}
                      </span>
                    </Link>
                    {waHref && (
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg bg-[#25D366] px-2 py-1 text-xs font-semibold text-white hover:opacity-90"
                      >
                        💬
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/leads" className="mt-3 block text-xs font-medium text-gm-500 hover:underline">Ver todos os leads →</Link>
        </div>

        <div className="gm-card p-4">
          <h3 className="mb-3 flex items-center gap-1.5 font-semibold text-gm-900">✅ Tarefas de hoje</h3>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-gm-700/50">Nenhuma tarefa vencendo hoje.</p>
          ) : (
            <ul className="space-y-2">
              {todayTasks.map((t) => (
                <li key={t.id} className="text-sm">
                  <span className="block font-medium text-gm-900">{t.title}</span>
                  <span className="block text-xs text-gm-700/50">Vence em {formatDateTime(t.due_at)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/tarefas" className="mt-3 block text-xs font-medium text-gm-500 hover:underline">Ver todas as tarefas →</Link>
        </div>

        <div className="gm-card p-4">
          <h3 className="mb-3 flex items-center gap-1.5 font-semibold text-gm-900">💰 Comissão prevista</h3>
          <p className="text-2xl font-bold text-gm-900">{formatBRL(estimatedCommission)}</p>
          <p className="mt-1 text-xs text-gm-700/50">Se todas as negociações em aberto fecharem, nesse mês.</p>
          <Link href="/negociacoes" className="mt-3 block text-xs font-medium text-gm-500 hover:underline">Ver negociações →</Link>
        </div>

        <div className="gm-card p-4">
          <h3 className="mb-3 flex items-center gap-1.5 font-semibold text-gm-900">🎥 Reuniões recentes</h3>
          {recentMeetings.length === 0 ? (
            <p className="text-sm text-gm-700/50">Nenhuma reunião criada ainda.</p>
          ) : (
            <ul className="space-y-2">
              {recentMeetings.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-gm-900">{m.title}</span>
                  <Link href={`/sala/${m.room_code}`} target="_blank" className="shrink-0 rounded-lg bg-gm-500 px-2 py-1 text-xs font-semibold text-white hover:bg-gm-600">
                    Entrar
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/reunioes" className="mt-3 block text-xs font-medium text-gm-500 hover:underline">Ver todas as reuniões →</Link>
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
