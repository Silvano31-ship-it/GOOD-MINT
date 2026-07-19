// app/page.tsx — Landing Page (tela 1) — versão "Night Gold" premium.
// Página pública repintada na paleta NIGHT GOLD (#0A0F1F/roxo/dourado #F5C94A),
// reaproveitando as classes gm-night* de app/globals.css (mesmas do login) —
// sem Framer Motion / AOS / lucide / react-countup. O scroll reveal usa o
// componente Reveal (IntersectionObserver nativo) que já existia. "use client"
// só por causa do toggle de idioma PT/EN e do scroll do cabeçalho.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CrystalSphere } from "@/components/CrystalSphere";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { formatBRL } from "@/lib/format";

const PLANO_UNICO_CENTS = 4990;

type Lang = "pt" | "en";

const STRINGS = {
  pt: {
    nav: { features: "Funcionalidades", plan: "Plano", about: "Sobre", login: "Login", cta: "Teste grátis" },
    hero: {
      badge: "CRM para corretores autônomos",
      title1: "O CRM do corretor autônomo que vai",
      titleHighlight: "além da venda.",
      subtitle: "Organize seus leads e imóveis — e acompanhe o cliente até depois da venda. O único CRM que cuida da pré-venda e da pós-venda.",
      trust: "🔔 Nunca mais ouça \"cadê meu processo?\" — o cliente é avisado automaticamente a cada etapa.",
      ctaPrimary: "Comece seu teste grátis de 3 dias",
      ctaSecondary: "Ver funcionalidades",
      note: "Teste por 3 dias sem compromisso. Seu cartão só será cobrado se você continuar.",
      sphereCaption: "Sua bola de cristal do negócio",
    },
    how: {
      title: "Como funciona",
      subtitle: "Do cadastro à entrega das chaves, em 5 passos.",
      steps: [
        { icon: "🙋", t: "Cadastre-se", d: "Comece o teste grátis em segundos, sem cartão." },
        { icon: "🗂️", t: "Adicione leads e imóveis", d: "Toda a sua carteira organizada num lugar só." },
        { icon: "📊", t: "Organize o funil", d: "Arraste leads entre as etapas do Kanban." },
        { icon: "🤝", t: "Feche a venda", d: "Registre a negociação e comemore." },
        { icon: "🔔", t: "Acompanhe o pós-venda", d: "O cliente é avisado a cada etapa, até as chaves." },
      ],
    },
    features: {
      title: "Tudo que o corretor autônomo precisa",
      subtitle: "Ferramentas poderosas para cada etapa da sua jornada.",
      items: [
        { icon: "📊", title: "Funil Kanban", desc: "Arraste leads entre etapas: Novo → Contato → Visita → Proposta → Fechado." },
        { icon: "🏠", title: "Cadastro de imóveis", desc: "Fotos, endereço, tipo, valor e status — tudo organizado." },
        { icon: "📦", title: "Pós-Venda", desc: "Barra de progresso da documentação até a entrega das chaves." },
        { icon: "🔔", title: "Alertas automáticos", desc: "O cliente é avisado a cada etapa, sem você precisar lembrar." },
        { icon: "🤖", title: "IA Assistente", desc: "Gere conteúdo, imagens e respostas automáticas com inteligência artificial." },
        { icon: "💰", title: "Financeiro", desc: "Controle de comissões, metas e fluxo de caixa." },
      ],
    },
    diff: {
      problemLabel: "O problema comum",
      problemTitle: "CRM genérico só cuida da venda",
      problemBody: 'Depois que o cliente compra, ele fica sem saber em que pé está a documentação, o financiamento, a assinatura. O corretor perde tempo respondendo "cadê meu processo?" repetidamente — e o cliente fica ansioso, mesmo com a venda fechada.',
      solutionLabel: "A solução GOOD MINT",
      solutionTitle: "Pré-venda e pós-venda, sempre atualizados",
      solutionBody: "Cada mudança de etapa dispara um aviso automático pro cliente. Documentação enviada, análise de crédito, aprovação, assinatura, registro, entrega das chaves — tudo acompanhado, sem esforço manual do corretor.",
    },
    impact: {
      painBadge: "⚡ A maior dor do corretor resolvida",
      title: 'Chega de cliente no seu WhatsApp perguntando "cadê meu processo?"',
      body: "Com a GOOD MINT, ele é avisado automaticamente a cada etapa. Você para de apagar incêndios e volta a vender.",
      badges: ["✅ Cliente informado", "🕒 Zero esforço", "🚀 Foco em vendas"],
    },
    plans: {
      title: "Um plano só. Tudo ilimitado.",
      subtitle: "Teste grátis de 3 dias com as funções essenciais, sem cartão. Assine e destrave tudo.",
      perMonth: "/mês",
      badge: "👑 Plano Único",
      cta: "Começar teste grátis",
      footerNote: "Teste grátis de 3 dias. Sem fidelidade — cancele quando quiser.",
      refundNote: "🛡️ Garantia de reembolso de 7 dias: assinou e não gostou? Devolvemos 100% em até 7 dias após a compra. Após 7 dias, não há reembolso.",
      features: [
        "Leads e imóveis ilimitados",
        "IA ilimitada: assistente, conteúdo e imagens",
        "Automações e Agenda com Google Calendar",
        "Pós-venda completo + Portal do Cliente",
        "Disparo WhatsApp, Metas, Financeiro e Planilhas",
        "Notas, Grupos, Reuniões e Central de Mensagens",
      ],
    },
    faq: {
      title: "Perguntas frequentes",
      subtitle: "Tire suas dúvidas sobre o GOOD MINT.",
      items: [
        ["Como funciona o teste grátis?", "Você usa as funções essenciais do GOOD MINT (Leads, Imóveis, Negociações, Tarefas e Relatório) por 3 dias, sem nenhuma cobrança e sem cadastrar cartão. Pra destravar tudo — IA, Automações, Agenda, Pós-Venda e mais — é só assinar o Plano Único quando quiser."],
        ["Tem garantia de reembolso?", "Sim: se você assinar e não gostar, devolvemos 100% do valor em até 7 dias após a compra. Após 7 dias, não há reembolso — mas o cancelamento continua livre, valendo até o fim do período já pago."],
        ["Posso cancelar quando quiser?", "Sim. O cancelamento é imediato e sem multa. Você mantém o acesso até o fim do período já pago."],
        ["Preciso instalar algo?", "Não. O GOOD MINT roda no navegador do celular, tablet ou computador."],
      ],
    },
  },
  en: {
    nav: { features: "Features", plan: "Pricing", about: "About", login: "Log in", cta: "Free trial" },
    hero: {
      badge: "CRM for independent real estate agents",
      title1: "The CRM for independent agents that goes",
      titleHighlight: "beyond the sale.",
      subtitle: "Organize your leads and listings — and follow up with clients long after the sale. The only CRM that handles both the sale and the after-sale.",
      trust: "🔔 Never hear \"what's the status of my deal?\" again — clients are notified automatically at every step.",
      ctaPrimary: "Start your free 3-day trial",
      ctaSecondary: "See features",
      note: "Try it free for 3 days, no commitment. Your card is only charged if you continue.",
      sphereCaption: "Your business crystal ball",
    },
    how: {
      title: "How it works",
      subtitle: "From sign-up to key handover, in 5 steps.",
      steps: [
        { icon: "🙋", t: "Sign up", d: "Start your free trial in seconds, no card." },
        { icon: "🗂️", t: "Add leads and listings", d: "Your whole portfolio in one place." },
        { icon: "📊", t: "Organize your pipeline", d: "Drag leads across the Kanban stages." },
        { icon: "🤝", t: "Close the deal", d: "Log the deal and celebrate." },
        { icon: "🔔", t: "Track the after-sale", d: "The client is notified at every step, up to the keys." },
      ],
    },
    features: {
      title: "Everything an independent agent needs",
      subtitle: "Powerful tools for every step of your journey.",
      items: [
        { icon: "📊", title: "Kanban pipeline", desc: "Drag leads across stages: New → Contact → Visit → Proposal → Closed." },
        { icon: "🏠", title: "Listing management", desc: "Photos, address, type, price and status — all organized." },
        { icon: "📦", title: "After-sale tracking", desc: "Progress bar from paperwork all the way to key handover." },
        { icon: "🔔", title: "Automatic alerts", desc: "The client is notified at every stage — you don't have to remember." },
        { icon: "🤖", title: "AI assistant", desc: "Generate content, images and automatic replies with AI." },
        { icon: "💰", title: "Finance", desc: "Track commissions, goals and cash flow." },
      ],
    },
    diff: {
      problemLabel: "The common problem",
      problemTitle: "Generic CRMs stop caring after the sale",
      problemBody: 'Once the client buys, they\'re left in the dark about paperwork, financing, signing. The agent wastes time repeatedly answering "what\'s the status?" — and the client stays anxious even after the deal is closed.',
      solutionLabel: "The GOOD MINT solution",
      solutionTitle: "Pre-sale and after-sale, always up to date",
      solutionBody: "Every stage change triggers an automatic update to the client. Documents sent, credit analysis, approval, signing, registration, key handover — all tracked, with zero manual effort from the agent.",
    },
    impact: {
      painBadge: "⚡ The broker's biggest pain point, solved",
      title: 'No more clients messaging you asking "what\'s the status of my deal?"',
      body: "With GOOD MINT, they're notified automatically at every step. You stop putting out fires and get back to selling.",
      badges: ["✅ Client informed", "🕒 Zero effort", "🚀 Focus on selling"],
    },
    plans: {
      title: "One plan. Everything unlimited.",
      subtitle: "3-day free trial with the essential features, no card required. Subscribe to unlock everything.",
      perMonth: "/mo",
      badge: "👑 Single Plan",
      cta: "Start free trial",
      footerNote: "3-day free trial. No lock-in — cancel anytime.",
      refundNote: "🛡️ 7-day money-back guarantee: subscribed and changed your mind? Full refund within 7 days of purchase. After 7 days, no refunds.",
      features: [
        "Unlimited leads and listings",
        "Unlimited AI: assistant, content and images",
        "Automations and Google Calendar agenda",
        "Full after-sale tracking + Client Portal",
        "WhatsApp blast, Goals, Finance and Spreadsheets",
        "Notes, Groups, Meetings and Messaging hub",
      ],
    },
    faq: {
      title: "Frequently asked questions",
      subtitle: "Clear up your doubts about GOOD MINT.",
      items: [
        ["How does the free trial work?", "You use GOOD MINT's essential features (Leads, Listings, Deals, Tasks and Reports) for 3 days at no charge and without adding a card. To unlock everything — AI, Automations, Agenda, After-sale and more — just subscribe to the Single Plan whenever you're ready."],
        ["Is there a money-back guarantee?", "Yes: if you subscribe and change your mind, we refund 100% within 7 days of purchase. After 7 days there are no refunds — but you can still cancel anytime and keep access until the end of the paid period."],
        ["Can I cancel anytime?", "Yes. Cancellation is immediate and fee-free. You keep access until the end of the period you've already paid for."],
        ["Do I need to install anything?", "No. GOOD MINT runs in the browser on phone, tablet or computer."],
      ],
    },
  },
} as const;

function Feature({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="gm-night-glass group h-full rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#F5C94A]/40">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5C94A]/[0.12] text-2xl gm-breathe">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-[#B0B8C8]">{desc}</p>
    </div>
  );
}

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("pt");
  const [scrollPct, setScrollPct] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("gm-lang");
    if (saved === "en" || saved === "pt") setLang(saved);
  }, []);

  // Barra de progresso de leitura (fio dourado) + fundo sólido do header ao rolar.
  useEffect(() => {
    let ticking = false;
    function update() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setScrollPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
      setScrolled(window.scrollY > 20);
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toggleLang() {
    const next = lang === "pt" ? "en" : "pt";
    setLang(next);
    localStorage.setItem("gm-lang", next);
  }

  const s = STRINGS[lang];

  return (
    <main className="gm-night relative min-h-screen overflow-hidden text-white">
      {/* Campo de estrelas douradas por trás de toda a página */}
      <div className="gm-stars" aria-hidden="true" />

      {/* Barra de progresso de leitura — fio dourado */}
      <div className="fixed left-0 top-0 z-40 h-1 w-full md:h-full md:w-1">
        <div className="block h-full bg-[#F5C94A] transition-[width] duration-150 ease-out md:hidden" style={{ width: `${scrollPct}%` }} />
        <div className="hidden bg-[#F5C94A] transition-[height] duration-150 ease-out md:block" style={{ height: `${scrollPct}%` }} />
      </div>

      {/* Cabeçalho fixo — transparente no topo, vidro escuro ao rolar */}
      <header className={`sticky top-0 z-30 transition-colors duration-300 ${scrolled ? "border-b border-white/10 bg-[#0A0F1F]/80 backdrop-blur-xl" : "border-b border-transparent"}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo variant="gold" />
          <div className="hidden items-center gap-6 md:flex">
            <nav className="flex items-center gap-6 text-sm font-medium text-[#B0B8C8]">
              <a href="#funcionalidades" className="transition-colors hover:text-[#F5C94A]">{s.nav.features}</a>
              <a href="#plano" className="transition-colors hover:text-[#F5C94A]">{s.nav.plan}</a>
              <a href="#faq" className="transition-colors hover:text-[#F5C94A]">{s.nav.about}</a>
            </nav>
            <div className="h-6 w-px bg-white/10" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              aria-label="Trocar idioma / Switch language"
              className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-[#B0B8C8] transition-colors hover:border-[#F5C94A]/60 hover:text-[#F5C94A]"
            >
              {lang === "pt" ? "🇧🇷 PT" : "🇺🇸 EN"}
            </button>
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-[#B0B8C8] transition-colors hover:text-white">
              {s.nav.login}
            </Link>
            <Link href="/cadastro" className="gm-night-btn rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm">
              {s.nav.cta}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:py-28">
          <Reveal>
            <span className="inline-block rounded-full border border-[#F5C94A]/20 bg-[#F5C94A]/[0.12] px-3 py-1 text-xs font-semibold text-[#F5C94A]">
              {s.hero.badge}
            </span>
            <h1 className="gm-night-title mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
              {s.hero.title1}{" "}
              <span className="text-[#F5C94A]">{s.hero.titleHighlight}</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-[#B0B8C8]">{s.hero.subtitle}</p>
            <p className="mt-5 inline-block rounded-full border border-[#F5C94A]/15 bg-[#F5C94A]/[0.08] px-5 py-2 text-sm text-[#F5C94A]">
              {s.hero.trust}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cadastro" className="gm-night-btn rounded-xl px-6 py-3 font-semibold text-white shadow-lg">
                {s.hero.ctaPrimary}
              </Link>
              <a href="#funcionalidades" className="rounded-xl border border-[#F5C94A]/50 px-6 py-3 font-semibold text-[#F5C94A] transition-colors hover:bg-[#F5C94A]/10">
                {s.hero.ctaSecondary}
              </a>
            </div>
            <p className="mt-3 text-xs text-[#6A7A8A]">{s.hero.note}</p>
          </Reveal>

          <div className="relative mx-auto hidden flex-col items-center md:flex">
            <div className="gm-breathe absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F5C94A]/10 blur-3xl" />
            <div className="relative">
              <CrystalSphere empty={false} accent="gold" caption={s.hero.sphereCaption} />
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona — timeline dourada */}
      <section className="relative border-t border-white/5">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <Reveal>
            <h2 className="text-center text-3xl font-bold text-white md:text-4xl">{s.how.title}</h2>
            <div className="mx-auto mt-2 h-0.5 w-16 rounded-full bg-[#F5C94A]" />
            <p className="mt-3 text-center text-[#B0B8C8]">{s.how.subtitle}</p>
          </Reveal>

          <div className="relative mt-12">
            {/* linha vertical dourada (fio condutor) */}
            <div className="absolute left-6 top-0 hidden h-full w-0.5 bg-gradient-to-b from-[#F5C94A] via-[#F5C94A]/40 to-transparent sm:block" aria-hidden="true" />
            <div className="space-y-6">
              {s.how.steps.map((step, i) => (
                <Reveal key={i} delay={i * 80}>
                  <div className="flex items-start gap-4">
                    <div className="relative z-10 flex h-12 w-12 flex-none items-center justify-center rounded-full border border-[#F5C94A]/40 bg-[#0A0F1F] text-xl shadow-[0_0_20px_rgba(245,201,74,0.25)]">
                      {step.icon}
                    </div>
                    <div className="gm-night-glass flex-1 rounded-2xl p-5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#F5C94A]">{String(i + 1).padStart(2, "0")}</span>
                        <h3 className="font-semibold text-white">{step.t}</h3>
                      </div>
                      <p className="mt-1 text-sm text-[#B0B8C8]">{step.d}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="relative border-t border-white/5">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <h2 className="text-center text-3xl font-bold text-white md:text-4xl">{s.features.title}</h2>
            <p className="mt-3 text-center text-[#B0B8C8]">{s.features.subtitle}</p>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {s.features.items.map((f, i) => (
              <Reveal key={f.title} delay={i * 70}>
                <Feature icon={f.icon} title={f.title} desc={f.desc} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Problema vs Solução */}
      <section className="relative border-t border-white/5">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <div className="grid gap-6 md:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-2xl border border-red-400/20 bg-red-500/[0.06] p-8">
                <span className="text-2xl">⚠️</span>
                <span className="mt-3 block text-xs font-semibold uppercase tracking-wide text-red-300/80">{s.diff.problemLabel}</span>
                <h3 className="mt-1 text-xl font-bold text-white">{s.diff.problemTitle}</h3>
                <p className="mt-3 text-sm text-[#B0B8C8]">{s.diff.problemBody}</p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="h-full rounded-2xl border border-[#F5C94A]/25 bg-[#F5C94A]/[0.06] p-8">
                <span className="text-2xl">⭐</span>
                <span className="mt-3 block text-xs font-semibold uppercase tracking-wide text-[#F5C94A]">{s.diff.solutionLabel}</span>
                <h3 className="mt-1 text-xl font-bold text-white">{s.diff.solutionTitle}</h3>
                <p className="mt-3 text-sm text-[#B0B8C8]">{s.diff.solutionBody}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Bloco de impacto */}
      <section className="relative border-t border-white/5">
        <div className="mx-auto max-w-4xl px-5 py-20">
          <Reveal>
            <div className="gm-night-glass rounded-2xl p-8 text-center sm:p-12">
              <span className="inline-block rounded-full border border-[#F5C94A]/20 bg-[#F5C94A]/[0.12] px-4 py-1.5 text-sm font-semibold text-[#F5C94A]">
                {s.impact.painBadge}
              </span>
              <h2 className="gm-night-title mt-4 text-2xl font-bold text-white sm:text-3xl">{s.impact.title}</h2>
              <p className="mt-3 text-[#B0B8C8]">{s.impact.body}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {s.impact.badges.map((b) => (
                  <span key={b} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm font-medium text-white">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Plano Único */}
      <section id="plano" className="relative border-t border-white/5">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <h2 className="text-center text-3xl font-bold text-white md:text-4xl">{s.plans.title}</h2>
            <p className="mt-2 text-center text-[#B0B8C8]">{s.plans.subtitle}</p>
          </Reveal>

          <div className="mx-auto mt-10 max-w-md">
            <Reveal>
              <div className="relative rounded-2xl border-2 border-[#F5C94A]/70 bg-white/[0.03] p-10 shadow-2xl shadow-[#F5C94A]/10 backdrop-blur-xl">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#F5C94A] px-3 py-1 text-xs font-bold text-[#0A0F1F]">
                  {s.plans.badge}
                </span>
                <div className="mt-2 flex items-end justify-center gap-1">
                  <span className="text-5xl font-bold text-white">{formatBRL(PLANO_UNICO_CENTS)}</span>
                  <span className="pb-1.5 text-sm text-[#B0B8C8]">{s.plans.perMonth}</span>
                </div>
                <ul className="mt-6 space-y-2 text-sm text-[#B0B8C8]">
                  {s.plans.features.map((f) => (
                    <li key={f}>✅ {f}</li>
                  ))}
                </ul>
                <Link href="/cadastro" className="gm-night-btn mt-6 block rounded-xl py-3 text-center font-semibold text-white shadow-lg">
                  {s.plans.cta}
                </Link>
                <p className="mt-3 text-center text-xs text-[#6A7A8A]">{s.plans.footerNote}</p>
                <p className="mt-3 rounded-lg border border-[#F5C94A]/20 bg-[#F5C94A]/[0.08] p-2.5 text-center text-[11px] leading-relaxed text-[#F5C94A]">
                  {s.plans.refundNote}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative border-t border-white/5">
        <div className="mx-auto max-w-3xl px-5 py-20">
          <Reveal>
            <h2 className="text-center text-3xl font-bold text-white md:text-4xl">{s.faq.title}</h2>
            <p className="mt-2 text-center text-[#B0B8C8]">{s.faq.subtitle}</p>
          </Reveal>
          <div className="mt-8 space-y-3">
            {s.faq.items.map(([q, a], i) => (
              <Reveal key={q} delay={i * 60}>
                <details className="gm-night-glass group rounded-xl p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-white">
                    {q}
                    <span className="text-[#F5C94A] transition-transform duration-300 group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm text-[#B0B8C8]">{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Footer lang={lang} />
    </main>
  );
}
