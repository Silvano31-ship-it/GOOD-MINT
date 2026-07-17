// components/SidebarMenuItem.tsx — item do menu lateral com feedback de toque:
// onda dourada (ripple) a partir do ponto exato do clique, ícone com pulso +
// brilho, e "respiração" sutil no fundo do item ativo. Extraído do Sidebar
// pra cada item cuidar do próprio estado de ripple/pulso sem complicar o
// componente pai. Sem framer-motion/lucide — só CSS, consistente com o
// resto do projeto (ver components/Sidebar.tsx e app/globals.css).
"use client";

import { useRef, useState, type MouseEvent } from "react";
import Link from "next/link";

interface Ripple {
  x: number;
  y: number;
  id: number;
}

export function SidebarMenuItem({
  href,
  label,
  icon,
  active,
  transparent,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  transparent?: boolean;
  onNavigate?: () => void;
}) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [pulsing, setPulsing] = useState(false);
  const ref = useRef<HTMLAnchorElement>(null);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const id = Date.now();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setRipples((prev) => [...prev, { x, y, id }]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
    }

    setPulsing(true);
    setTimeout(() => setPulsing(false), 400);

    onNavigate?.();
  }

  return (
    <Link
      ref={ref}
      href={href}
      onClick={handleClick}
      className={`group relative flex items-center gap-3.5 overflow-hidden rounded-lg border-l-4 px-3.5 py-2.5 text-sm font-medium transition-all duration-300 ${
        active
          ? "border-[#F5C94A] bg-[rgba(245,201,74,0.08)] text-[#F5C94A]"
          : transparent
          ? "border-transparent bg-white/70 text-gm-900 backdrop-blur-sm hover:border-[#F5C94A]/70 hover:bg-white/90"
          : "border-transparent text-[#B0B8C8] hover:border-[#F5C94A] hover:bg-[rgba(245,201,74,0.06)] hover:text-[#F5C94A]"
      }`}
    >
      {/* Fundo "respirando" — só no item ativo, atrás do conteúdo */}
      {active && <span aria-hidden className="gm-menu-active-breath absolute inset-0 -z-10 rounded-lg" />}

      {/* Onda dourada a partir do ponto do clique */}
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden
          className="gm-menu-ripple pointer-events-none absolute rounded-full bg-[rgba(245,201,74,0.4)]"
          style={{ left: r.x - 10, top: r.y - 10, width: 20, height: 20 }}
        />
      ))}

      <span
        className={`pl-0.5 transition-all duration-300 ${pulsing ? "gm-menu-icon-pulse" : ""} ${
          active
            ? "[filter:drop-shadow(0_0_6px_rgba(245,201,74,0.55))]"
            : "group-hover:[filter:drop-shadow(0_0_6px_rgba(245,201,74,0.45))]"
        }`}
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}
