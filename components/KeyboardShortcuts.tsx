// components/KeyboardShortcuts.tsx — atalhos de teclado globais do Dashboard
// (desktop): uma tecla leva direto pra cada módulo, "?" abre o guia de
// atalhos. Montado uma vez dentro do Sidebar (que aparece em todas as telas
// logadas). Ignora quando o foco está num campo de texto e não faz nada no
// celular (sem teclado físico, os listeners simplesmente nunca disparam).
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SHORTCUTS: { key: string; label: string; href: string }[] = [
  { key: "d", label: "Visão Geral", href: "/dashboard" },
  { key: "l", label: "Leads", href: "/leads" },
  { key: "i", label: "Imóveis", href: "/imoveis" },
  { key: "n", label: "Negociações", href: "/negociacoes" },
  { key: "f", label: "Financeiro", href: "/financeiro" },
  { key: "p", label: "Pós-Venda", href: "/pos-venda" },
  { key: "t", label: "Tarefas", href: "/tarefas" },
  { key: "a", label: "Agenda", href: "/agenda" },
  { key: "m", label: "Metas", href: "/metas" },
  { key: "c", label: "Assistente de IA", href: "/ia-chat" },
];

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setHintDismissed(localStorage.getItem("gm_shortcut_hint_dismissed") === "1");
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "?") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      const hit = SHORTCUTS.find((s) => s.key === e.key.toLowerCase());
      if (hit) {
        e.preventDefault();
        setOpen(false);
        router.push(hit.href);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  function dismissHint() {
    setHintDismissed(true);
    localStorage.setItem("gm_shortcut_hint_dismissed", "1");
  }

  return (
    <>
      {/* Dica discreta (só desktop) até o corretor dispensar */}
      {!hintDismissed && (
        <div className="fixed bottom-4 left-4 z-40 hidden items-center gap-2 rounded-full border border-gm-200 bg-white px-3 py-1.5 text-xs text-gm-700 shadow-lg md:flex">
          ⌨️ Tecle <kbd className="rounded border border-gm-200 bg-gm-50 px-1 font-semibold">?</kbd> pra ver os atalhos
          <button onClick={dismissHint} aria-label="Dispensar dica" className="ml-1 text-gm-700/40 hover:text-gm-700">✕</button>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Atalhos de teclado"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gm-900">⌨️ Atalhos de teclado</h2>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-gm-700/40 hover:text-gm-700">✕</button>
            </div>
            <ul className="mt-3 space-y-1.5">
              {SHORTCUTS.map((s) => (
                <li key={s.key} className="flex items-center justify-between text-sm text-gm-700">
                  {s.label}
                  <kbd className="rounded border border-gm-200 bg-gm-50 px-2 py-0.5 text-xs font-semibold uppercase text-gm-900">{s.key}</kbd>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-gm-700/50">Os atalhos não disparam enquanto você digita num campo.</p>
          </div>
        </div>
      )}
    </>
  );
}
