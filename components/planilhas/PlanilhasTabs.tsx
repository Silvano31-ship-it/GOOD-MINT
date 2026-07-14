// components/planilhas/PlanilhasTabs.tsx — navegação entre as 3 planilhas.
// Mesmo padrão de PosVendaTabs/SocialTabs (tabs por rota).
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/planilhas/leads", label: "🎯 Leads" },
  { href: "/planilhas/imoveis", label: "🏠 Imóveis" },
  { href: "/planilhas/negociacoes", label: "🤝 Negociações" },
];

export function PlanilhasTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gm-100">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`min-h-11 flex-none border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            pathname === t.href
              ? "border-gm-500 text-gm-900"
              : "border-transparent text-gm-700/60 hover:text-gm-900"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
