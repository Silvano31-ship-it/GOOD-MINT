// components/pos-venda/DetailTabs.tsx — tabs client-side (mesmo processo, sem
// rota nova) para Visão Geral / Checklist / Comunicação / Documentos.
"use client";

import { useState } from "react";

const TABS = [
  { key: "geral", label: "Visão Geral" },
  { key: "checklist", label: "Checklist" },
  { key: "comunicacao", label: "Comunicação" },
  { key: "documentos", label: "Documentos" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function DetailTabs({
  geral,
  checklist,
  comunicacao,
  documentos,
}: {
  geral: React.ReactNode;
  checklist: React.ReactNode;
  comunicacao: React.ReactNode;
  documentos: React.ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>("geral");
  const panels: Record<TabKey, React.ReactNode> = { geral, checklist, comunicacao, documentos };

  return (
    <div>
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-gm-100">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`min-h-11 flex-none border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.key ? "border-gm-500 text-gm-900" : "border-transparent text-gm-700/60 hover:text-gm-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{panels[tab]}</div>
    </div>
  );
}
