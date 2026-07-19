// components/dashboard/QuickActionsCustom.tsx — ações rápidas do Dashboard
// personalizáveis: o corretor escolhe quais atalhos aparecem (salvo em
// localStorage, sem migration). Renderiza o padrão no primeiro paint e
// hidrata a escolha salva no useEffect, evitando mismatch de hidratação.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "gm_quick_actions";
const DEFAULT_KEYS = ["lead", "imovel", "posvenda"];

const CATALOG: { key: string; href: string; icon: string; title: string; desc: string }[] = [
  { key: "lead", href: "/leads", icon: "🎯", title: "Adicionar lead", desc: "Cadastre um novo contato" },
  { key: "imovel", href: "/imoveis/novo", icon: "🏠", title: "Cadastrar imóvel", desc: "Adicione um imóvel à carteira" },
  { key: "posvenda", href: "/pos-venda", icon: "📦", title: "Ver pós-venda", desc: "Acompanhe os processos em andamento" },
  { key: "agenda", href: "/agenda", icon: "🗓️", title: "Agenda", desc: "Visitas e compromissos" },
  { key: "disparo", href: "/social/disparo", icon: "📤", title: "Disparo WhatsApp", desc: "Mensagem-modelo pros seus leads" },
  { key: "metas", href: "/metas", icon: "🏆", title: "Metas", desc: "Progresso das suas metas" },
  { key: "financeiro", href: "/financeiro", icon: "💰", title: "Financeiro", desc: "Comissões a receber" },
  { key: "ia", href: "/ia-chat", icon: "🤖", title: "Assistente de IA", desc: "Textos, dicas e ideias na hora" },
];

export function QuickActionsCustom() {
  const [keys, setKeys] = useState<string[]>(DEFAULT_KEYS);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (Array.isArray(saved) && saved.length > 0) {
        setKeys(saved.filter((k: string) => CATALOG.some((c) => c.key === k)));
      }
    } catch {
      // localStorage corrompido — fica no padrão.
    }
  }, []);

  function toggleKey(key: string) {
    setKeys((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      if (next.length === 0) return prev; // sempre pelo menos 1 atalho
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const active = CATALOG.filter((c) => keys.includes(c.key));

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gm-700/50">Ações rápidas</h2>
        <button
          onClick={() => setEditing((v) => !v)}
          className="rounded-lg border border-gm-200 px-2.5 py-1 text-xs font-semibold text-gm-700 hover:bg-gm-50"
        >
          {editing ? "Pronto" : "⚙️ Personalizar"}
        </button>
      </div>

      {editing ? (
        <div className="gm-card p-4">
          <p className="mb-3 text-xs text-gm-700/60">Marque os atalhos que você quer ver no topo do seu Dashboard:</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {CATALOG.map((c) => (
              <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded-lg border border-gm-200 p-2.5 text-sm hover:bg-gm-50">
                <input
                  type="checkbox"
                  checked={keys.includes(c.key)}
                  onChange={() => toggleKey(c.key)}
                  className="h-4 w-4 flex-none accent-gm-500"
                />
                <span className="flex-none">{c.icon}</span>
                <span className="font-medium text-gm-900">{c.title}</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {active.map((c) => (
            <Link key={c.key} href={c.href} className="gm-card group p-5 transition hover:-translate-y-0.5">
              <div className="text-2xl">{c.icon}</div>
              <div className="mt-2 font-semibold text-gm-900 group-hover:text-gm-500">{c.title}</div>
              <div className="text-sm text-gm-700/60">{c.desc}</div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
