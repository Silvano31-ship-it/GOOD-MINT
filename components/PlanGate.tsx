// components/PlanGate.tsx — paywall do Plano Único durante o teste grátis.
// No trial, só as funções essenciais ficam liberadas; ao navegar pra uma
// função exclusiva, este overlay cobre a tela e convida a assinar. Montado
// uma vez no layout logado; consulta /api/plan-status (conta paga não vê
// nada disso). As rotas liberadas no teste: Visão Geral, Relatório, Leads,
// Imóveis, Negociações, Tarefas, Suporte e Configurações.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LOCKED_PREFIXES = [
  "/financeiro",
  "/pos-venda",
  "/planilhas",
  "/notas",
  "/grupos",
  "/reunioes",
  "/agenda",
  "/mensagens",
  "/social",
  "/portal-cliente",
  "/ia-chat",
  "/conteudo",
  "/metas",
  "/automacoes",
];

const BENEFITS = [
  "🎯 Leads e imóveis ilimitados",
  "🤖 Assistente de IA + geração de conteúdo",
  "⚡ Automações e Agenda com Google Calendar",
  "📦 Pós-Venda completo + Portal do Cliente",
  "📤 Disparo WhatsApp e Planilhas inteligentes",
  "🏆 Metas, Financeiro, Notas, Grupos e Reuniões",
];

export function PlanGate() {
  const pathname = usePathname();
  const [paid, setPaid] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/plan-status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { paid: boolean } | null) => {
        if (!cancelled && data) setPaid(data.paid);
      })
      .catch(() => {
        // Em caso de erro de rede, não bloqueia nada (fail-open).
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const locked = paid === false && LOCKED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!locked) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#0B1220]/90 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="text-center">
          <div className="text-4xl">👑</div>
          <h2 className="mt-2 text-xl font-bold text-gm-900">Função exclusiva do Plano Único</h2>
          <p className="mt-1 text-sm text-gm-700/70">
            No teste grátis você usa o essencial: Leads, Imóveis, Negociações, Tarefas e Relatório.
            Assine pra destravar <b>tudo, ilimitado</b>:
          </p>
        </div>

        <ul className="mt-4 space-y-1.5 text-sm text-gm-700">
          {BENEFITS.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        <div className="mt-4 rounded-xl bg-gm-50 p-3 text-center">
          <span className="text-3xl font-bold text-gm-900">R$ 49,90</span>
          <span className="text-sm text-gm-700/60">/mês</span>
          <p className="mt-0.5 text-xs text-gm-700/60">Sem fidelidade — cancele quando quiser.</p>
        </div>

        <Link
          href="/configuracoes/plano"
          className="mt-4 block rounded-xl bg-gm-500 py-3 text-center font-semibold text-white transition hover:bg-gm-600"
        >
          Assinar o Plano Único
        </Link>
        <Link
          href="/dashboard"
          className="mt-2 block rounded-xl border border-gm-200 py-2.5 text-center text-sm font-semibold text-gm-700 transition hover:bg-gm-50"
        >
          ← Continuar no teste grátis
        </Link>

        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-center text-[11px] leading-relaxed text-amber-800">
          🛡️ <b>Garantia de reembolso de 7 dias:</b> se assinar e não gostar, devolvemos 100% do
          valor em até 7 dias após a compra. Após 7 dias, não há reembolso.
        </p>
      </div>
    </div>
  );
}
