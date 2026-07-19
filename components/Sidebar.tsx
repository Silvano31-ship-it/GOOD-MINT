// components/Sidebar.tsx — menu lateral do Dashboard (seção 4 da spec).
// Visual "Night Gold": fundo azul-marinho/roxo com logo dourada brilhante,
// hover com borda esquerda e brilho dourado, badge de notificação pulsante.
// Extras: badge de leads novos hoje no item Leads (via /api/badges), ponto
// "Online" ao lado da logo e atalhos de teclado globais (KeyboardShortcuts).
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { SidebarMenuItem } from "./SidebarMenuItem";
import { KeyboardShortcuts } from "./KeyboardShortcuts";

const BADGE_POLL_MS = 60000;

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
  { href: "/agenda", label: "Agenda", icon: "🗓️" },
  { href: "/mensagens", label: "Central de Mensagens", icon: "💬" },
  { href: "/social", label: "Social", icon: "📣" },
  { href: "/social/disparo", label: "Disparo WhatsApp", icon: "📤" },
  { href: "/portal-cliente", label: "Portal do Cliente", icon: "🔗" },
  { href: "/ia-chat", label: "Assistente de IA", icon: "🤖" },
  { href: "/metas", label: "Metas", icon: "🏆" },
  { href: "/automacoes", label: "Automações", icon: "⚡" },
  { href: "/configuracoes/plano", label: "Plano e Cobrança", icon: "💳" },
  { href: "/configuracoes/notificacoes", label: "Notificações", icon: "🔔" },
  { href: "/suporte", label: "Suporte", icon: "🆘" },
  { href: "/configuracoes", label: "Configurações", icon: "⚙️" },
];

/** Pontinho verde "Online" ao lado da logo — hoje sempre ativo enquanto o app
 * está aberto (preparação visual pro multi-usuário/equipes). */
function OnlineDot() {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-[rgba(52,199,89,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[#34C759]">
      <span className="gm-badge-pulse h-1.5 w-1.5 rounded-full bg-[#34C759]" />
      Online
    </span>
  );
}

export function Sidebar({ transparent }: { transparent?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [leadsHoje, setLeadsHoje] = useState(0);
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

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/badges", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data: { leadsHoje: number } = await res.json();
        if (!cancelled) setLeadsHoje(data.leadsHoje);
      } catch {
        // Silencioso — próximo ciclo tenta de novo.
      }
    }
    poll();
    const interval = setInterval(poll, BADGE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    // /social não deve acender junto com /social/disparo (que tem item próprio)
    if (href === "/social") return pathname.startsWith("/social") && !pathname.startsWith("/social/disparo");
    return pathname.startsWith(href);
  };

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
          badge={item.href === "/leads" ? leadsHoje : undefined}
          onNavigate={() => setOpen(false)}
        />
      ))}
    </nav>
  );

  return (
    <>
      <KeyboardShortcuts />

      {/* Topbar mobile */}
      {!isDesktop && (
        <div
          className={`flex items-center justify-between border-b px-4 py-3 ${
            transparent ? "border-white/10" : "gm-sidebar-dark border-[#1E2A3A]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Logo size={24} variant={transparent ? "dark" : "gold"} />
            <OnlineDot />
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
              className={`relative rounded-lg p-2 transition-colors duration-300 ${
                transparent
                  ? "border border-[#F5C94A]/70 bg-white/70 text-gm-900"
                  : "text-[#B0B8C8] hover:bg-[rgba(245,201,74,0.1)] hover:text-[#F5C94A]"
              }`}
            >
              ☰
              {leadsHoje > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF3B5C] px-1 text-[10px] font-bold text-white">
                  {leadsHoje > 9 ? "9+" : leadsHoje}
                </span>
              )}
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
              <div className="flex items-center gap-2">
                <Logo size={24} variant="gold" />
                <OnlineDot />
              </div>
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
              <div className="flex items-center gap-2">
                <Logo variant={transparent ? "dark" : "gold"} />
                <OnlineDot />
              </div>
              <NotificationBell />
            </div>
            {navLinks}
          </div>
        </aside>
      )}
    </>
  );
}
