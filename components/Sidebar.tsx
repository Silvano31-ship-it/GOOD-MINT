// components/Sidebar.tsx — menu lateral do Dashboard (seção 4 da spec).
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import { LogoutButton } from "./LogoutButton";
import { getInitials } from "@/lib/constants";

const NAV = [
  { href: "/dashboard", label: "Visão Geral", icon: "📊" },
  { href: "/leads", label: "Leads", icon: "🎯" },
  { href: "/imoveis", label: "Imóveis", icon: "🏠" },
  { href: "/negociacoes", label: "Negociações", icon: "🤝" },
  { href: "/pos-venda", label: "Pós-Venda", icon: "📦" },
  { href: "/planilhas", label: "Planilhas", icon: "📋" },
  { href: "/tarefas", label: "Tarefas", icon: "✅" },
  { href: "/mensagens", label: "Central de Mensagens", icon: "💬" },
  { href: "/social", label: "Social", icon: "📣" },
  { href: "/suporte", label: "Suporte", icon: "🆘" },
  { href: "/configuracoes", label: "Configurações", icon: "⚙️" },
];

export function Sidebar({
  userName,
  avatarUrl,
}: {
  userName: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Topbar mobile */}
      <div className="flex items-center justify-between border-b border-gm-100 bg-white px-4 py-3 md:hidden">
        <Logo size={24} />
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          className="rounded-lg p-2 text-gm-700 hover:bg-gm-50"
        >
          ☰
        </button>
      </div>

      <aside
        className={`${
          open ? "block" : "hidden"
        } border-b border-gm-100 bg-white md:sticky md:top-0 md:block md:h-screen md:w-64 md:flex-none md:border-b-0 md:border-r`}
      >
        <div className="flex h-full flex-col p-4">
          <div className="hidden px-2 py-3 md:block">
            <Logo />
          </div>
          <nav className="mt-2 flex-1 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive(item.href)
                    ? "bg-gm-500 text-white"
                    : "text-gm-700 hover:bg-gm-50"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 flex items-center gap-2 border-t border-gm-100 px-1 pt-3">
            <div className="flex h-8 w-8 flex-none items-center justify-center overflow-hidden rounded-full bg-gm-500 text-xs font-semibold text-white">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                getInitials(userName)
              )}
            </div>
            <div className="truncate text-xs text-gm-700/50">{userName}</div>
          </div>
          <div className="pt-1">
            <LogoutButton
              label="↪ Sair"
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gm-700 hover:bg-gm-50"
            />
          </div>
        </div>
      </aside>
    </>
  );
}
