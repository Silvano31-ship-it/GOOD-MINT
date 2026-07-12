// components/social/SocialTabs.tsx — navegação entre as sub-telas do Módulo Social.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/social/atividade", label: "Atividade" },
  { href: "/social/nova", label: "Nova publicação" },
  { href: "/social/publicacoes", label: "Minhas publicações" },
];

export function SocialTabs() {
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
