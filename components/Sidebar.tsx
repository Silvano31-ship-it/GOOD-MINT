// components/Sidebar.tsx — menu lateral do Dashboard (seção 4 da spec).
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { LogoutButton } from "./LogoutButton";
import { ThemeToggle } from "./ThemeToggle";
import { getInitials } from "@/lib/constants";

const NAV = [
  { href: "/dashboard", label: "Visão Geral", icon: "📊" },
  { href: "/leads", label: "Leads", icon: "🎯" },
  { href: "/imoveis", label: "Imóveis", icon: "🏠" },
  { href: "/negociacoes", label: "Negociações", icon: "🤝" },
  { href: "/pos-venda", label: "Pós-Venda", icon: "📦" },
  { href: "/planilhas", label: "Planilhas", icon: "📋" },
  { href: "/notas", label: "Notas", icon: "📝" },
  { href: "/grupos", label: "Grupos", icon: "👥" },
  { href: "/reunioes", label: "Reuniões", icon: "🎥" },
  { href: "/tarefas", label: "Tarefas", icon: "✅" },
  { href: "/mensagens", label: "Central de Mensagens", icon: "💬" },
  { href: "/social", label: "Social", icon: "📣" },
  { href: "/suporte", label: "Suporte", icon: "🆘" },
  { href: "/configuracoes", label: "Configurações", icon: "⚙️" },
];

export function Sidebar({
  userName,
  avatarUrl,
  transparent,
}: {
  userName: string;
  avatarUrl?: string | null;
  transparent?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Detecta o tamanho real da tela por JavaScript (não só por media query
  // CSS): alguns navegadores "in-app" (WhatsApp, Telegram etc.) às vezes não
  // aplicam a media query direito e mostram o menu de computador dentro de
  // um celular. Começa assumindo celular (o público deste app é majoritário
  // mobile) e só vira "computador" depois que o JS confirma a largura real.
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Topbar mobile */}
      {!isDesktop && (
        <div
          className={`flex items-center justify-between border-b px-4 py-3 ${
            transparent ? "border-white/10" : "border-gm-100 bg-gm-50"
          }`}
        >
          <Logo size={24} />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className={`rounded-lg p-2 text-gm-700 hover:bg-gm-50 ${
              transparent ? "border border-red-400/70 bg-white/70" : ""
            }`}
          >
            ☰
          </button>
        </div>
      )}

      <aside
        className={`${isDesktop || open ? "block" : "hidden"} border-b ${
          isDesktop ? "sticky top-0 h-screen w-64 flex-none border-b-0 border-r" : ""
        } ${transparent ? "border-transparent" : "border-gm-100 bg-gm-50"}`}
      >
        <div className="flex h-full flex-col p-4">
          {isDesktop && (
            <div className="px-2 py-3">
              <Logo />
            </div>
          )}
          <nav className="mt-2 flex-1 space-y-1.5">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3.5 rounded-full px-4 py-3 text-sm font-medium transition ${
                  isActive(item.href)
                    ? "bg-gm-500 text-white"
                    : transparent
                    ? "border border-red-400/70 bg-white/70 text-gm-900 backdrop-blur-sm hover:bg-white/90"
                    : "rounded-lg text-gm-700 hover:bg-gm-50"
                }`}
              >
                <span className="pl-0.5">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div
            className={`mt-2 space-y-1 ${
              transparent
                ? "rounded-2xl border border-red-400/70 bg-white/70 p-3 backdrop-blur-sm"
                : "border-t border-gm-100 pt-3"
            }`}
          >
            <div className="flex items-center gap-2 px-1 pb-1">
              <div className="flex h-8 w-8 flex-none items-center justify-center overflow-hidden rounded-full bg-gm-500 text-xs font-semibold text-white">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  getInitials(userName)
                )}
              </div>
              <div className={`truncate text-xs ${transparent ? "text-gm-900" : "text-gm-700/50"}`}>{userName}</div>
            </div>
            <ThemeToggle className="w-full justify-start" />
            <LogoutButton
              label="↪ Sair"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gm-700 hover:bg-gm-50"
            />
          </div>
        </div>
      </aside>
    </>
  );
}
