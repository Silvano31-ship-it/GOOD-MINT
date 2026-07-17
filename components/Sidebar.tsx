// components/Sidebar.tsx — menu lateral do Dashboard (seção 4 da spec).
// Visual "Night Gold": fundo azul-marinho/roxo com logo dourada brilhante,
// hover com borda esquerda e brilho dourado, badge de notificação pulsante.
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { SidebarMenuItem } from "./SidebarMenuItem";

const NAV = [
  { href: "/dashboard", label: "Visão Geral", icon: "📊" },
  { href: "/relatorio", label: "Relatório | GOOD 🟢", icon: "📈" },
  { href: "/leads", label: "Leads", icon: "🎯" },
  { href: "/imoveis", label: "Imóveis", icon: "🏠" },
  { href: "/negociacoes", label: "Negociações", icon: "🤝" },
  { href: "/financeiro", label: "Financeiro", icon: "💰" },
  { href: "/pos-venda", label: "Pós-Venda", icon: "📦" },
  { href: "/pos-venda/etapas", label: "Etapas do Pós-Venda", icon: "🪜" },
  { href: "/planilhas", label: "Planilhas", icon: "📋" },
  { href: "/notas", label: "Notas", icon: "📝" },
  { href: "/grupos", label: "Grupos", icon: "👥" },
  { href: "/reunioes", label: "Reuniões", icon: "🎥" },
  { href: "/tarefas", label: "Tarefas", icon: "✅" },
  { href: "/mensagens", label: "Central de Mensagens", icon: "💬" },
  { href: "/social", label: "Social", icon: "📣" },
  { href: "/ia-chat", label: "Assistente de IA", icon: "🤖" },
  { href: "/automacoes", label: "Automações", icon: "⚡" },
  { href: "/configuracoes/plano", label: "Plano e Cobrança", icon: "💳" },
  { href: "/configuracoes/notificacoes", label: "Notificações", icon: "🔔" },
  { href: "/suporte", label: "Suporte", icon: "🆘" },
  { href: "/configuracoes", label: "Configurações", icon: "⚙️" },
];

export function Sidebar({ transparent }: { transparent?: boolean }) {
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

  const navLinks = (
    <nav className="gm-scroll mt-2 flex-1 space-y-1 overflow-y-auto">
      {NAV.map((item) => (
        <SidebarMenuItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={isActive(item.href)}
          transparent={transparent}
          onNavigate={() => setOpen(false)}
        />
      ))}
    </nav>
  );

  return (
    <>
      {/* Topbar mobile */}
      {!isDesktop && (
        <div
          className={`flex items-center justify-between border-b px-4 py-3 ${
            transparent ? "border-white/10" : "gm-sidebar-dark border-[#1E2A3A]"
          }`}
        >
          <Logo size={24} variant={transparent ? "dark" : "gold"} />
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
              className={`rounded-lg p-2 transition-colors duration-300 ${
                transparent
                  ? "border border-[#F5C94A]/70 bg-white/70 text-gm-900"
                  : "text-[#B0B8C8] hover:bg-[rgba(245,201,74,0.1)] hover:text-[#F5C94A]"
              }`}
            >
              ☰
            </button>
          </div>
        </div>
      )}

      {/* Menu mobile: sobreposição de tela cheia (fixed), independente do
          layout em coluna do resto da página — assim ele nunca aparece
          "junto"/espremido ao lado do conteúdo da página, mesmo em
          navegadores in-app que às vezes ignoram a media query md:. */}
      {!isDesktop && open && (
        <div className="gm-sidebar-dark fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex h-full flex-col p-4">
            <div className="flex items-center justify-between border-b border-[#1E2A3A] pb-3">
              <Logo size={24} variant="gold" />
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="rounded-lg p-2 text-lg text-[#B0B8C8] transition-colors duration-300 hover:bg-[rgba(245,201,74,0.1)] hover:text-[#F5C94A]"
              >
                ✕
              </button>
            </div>
            {navLinks}
          </div>
        </div>
      )}

      {isDesktop && (
        <aside
          className={`sticky top-0 h-screen w-64 flex-none border-r ${
            transparent ? "border-transparent" : "gm-sidebar-dark border-[#1E2A3A]"
          }`}
        >
          <div className="flex h-full flex-col p-4">
            <div className="flex items-center justify-between border-b border-[#1E2A3A] px-2 pb-3">
              <Logo variant={transparent ? "dark" : "gold"} />
              <NotificationBell />
            </div>
            {navLinks}
          </div>
        </aside>
      )}
    </>
  );
}
