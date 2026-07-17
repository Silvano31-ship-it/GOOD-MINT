// app/page.tsx — Landing Page (tela 1). Pública. Paleta azul/branco (seção 6).
// "use client" só por causa do toggle de idioma PT/EN (única página pública
// com esse toggle, por pedido explícito — o resto do app continua só em PT).
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CrystalSphere } from "@/components/CrystalSphere";
import { FloatingEmojis } from "@/components/FloatingEmojis";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { PLAN_PRICING, type BillingCycle } from "@/lib/constants";
import { formatBRL } from "@/lib/format";

type Lang = "pt" | "en";

const STRINGS = {
  pt: {
    nav: { features: "Funcionalidades", plan: "Plano", about: "Sobre", login: "Login", cta: "Teste grátis" },
    hero: {
      badge: "CRM para corretores autônomos",
      title1: "Organize seus leads e imóveis — e acompanhe o cliente",
      title2: "até depois da venda.",
      subtitle: (
        <>O único CRM que cuida da pré-venda <b>e</b> da pós-venda. Nunca mais ouça "cadê meu processo?" — o cliente é avisado automaticamente a cada etapa.</>
      ),
      ctaPrimary: "Comece seu teste grátis de 3 dias",
      ctaSecondary: "Ver funcionalidades",
      note: "Teste por 3 dias sem compromisso. Seu cartão só será cobrado se você continuar.",
      sphereCaption: "Sua bola de cristal do negócio",
    },
    how: {
      title: "Como funciona",
      steps: [
        "Cadastre-se e comece o teste grátis",
        "Adicione seus leads e imóveis",
        "Organize seu funil de vendas",
        "Feche a venda",
        "Mantenha o cliente informado até a entrega das chaves",
      ],
    },
    features: {
      title: "Tudo que o corretor autônomo precisa",
      items: [
        { icon: "🗂️", title: "Funil Kanban", desc: "Arraste leads entre etapas: Novo → Contato → Visita → Proposta → Fechado." },
        { icon: "🏠", title: "Cadastro de imóveis", desc: "Fotos, endereço, tipo, valor e status — tudo organizado." },
        { icon: "🤝", title: "Acompanhamento de Pós-Venda", desc: "Barra de progresso da documentação até a entrega das chaves." },
        { icon: "🔔", title: "Alertas automáticos", desc: "O cliente é avisado a cada etapa, sem você precisar lembrar." },
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
      body: (
        <>
          Com a GOOD MINT, ele é avisado automaticamente a cada etapa. Você{" "}
          <b className="text-gm-900">para de apagar incêndios</b> e{" "}
          <b className="text-gm-900">volta a vender</b>.
        </>
      ),
      badges: ["✅ Cliente informado", "🕒 Zero esforço", "🚀 Foco em vendas"],
    },
    plans: {
      title: "Planos e preços",
      subtitle: "Comece grátis por 3 dias, sem cartão. Escolha o plano quando quiser.",
      perMonth: "/mês",
      perYear: "/ano",
      monthlyLabel: "Mensal",
      annualLabel: "Anual (economize 20%)",
      mostPopular: "⭐ Mais popular",
      cta: "Começar teste grátis",
      footerNote: "Teste grátis de 3 dias. Cancele quando quiser.",
      names: { mint_start: "MINT Start", mint_pro: "MINT Pro" },
      features: {
        mint_start: ["30 leads ativos", "15 imóveis cadastrados", "Clientes em pós-venda ilimitados", "Central de Mensagens com bot de IA", "Planilhas e exportação"],
        mint_pro: ["Leads e imóveis ilimitados", "Tudo do MINT Start incluso", "Clientes em pós-venda ilimitados", "Central de Mensagens com bot de IA", "Planilhas e exportação"],
      },
    },
    faq: {
      title: "Perguntas frequentes",
      items: [
        ["Como funciona o teste grátis?", "Você usa o GOOD MINT por 3 dias sem nenhuma cobrança e sem precisar cadastrar cartão. Se quiser continuar depois do teste, escolhe um plano e cadastra o pagamento quando quiser."],
        ["Posso cancelar quando quiser?", "Sim. O cancelamento é imediato e sem multa. Você mantém o acesso até o fim do período já pago."],
        ["Preciso instalar algo?", "Não. O GOOD MINT roda no navegador do celular, tablet ou computador."],
      ],
    },
  },
  en: {
    nav: { features: "Features", plan: "Pricing", about: "About", login: "Log in", cta: "Free trial" },
    hero: {
      badge: "CRM for independent real estate agents",
      title1: "Organize your leads and listings — and follow up with clients",
      title2: "long after the sale.",
      subtitle: (
        <>The only CRM that handles both the sale <b>and</b> the after-sale journey. Never hear "what's the status of my deal?" again — clients are notified automatically at every step.</>
      ),
      ctaPrimary: "Start your free 3-day trial",
      ctaSecondary: "See features",
      note: "Try it free for 3 days, no commitment. Your card is only charged if you continue.",
      sphereCaption: "Your business crystal ball",
    },
    how: {
      title: "How it works",
      steps: [
        "Sign up and start your free trial",
        "Add your leads and listings",
        "Organize your sales pipeline",
        "Close the deal",
        "Keep the client updated until the keys are handed over",
      ],
    },
    features: {
      title: "Everything an independent agent needs",
      items: [
        { icon: "🗂️", title: "Kanban pipeline", desc: "Drag leads across stages: New → Contact → Visit → Proposal → Closed." },
        { icon: "🏠", title: "Listing management", desc: "Photos, address, type, price and status — all organized." },
        { icon: "🤝", title: "After-sale tracking", desc: "Progress bar from paperwork all the way to key handover." },
        { icon: "🔔", title: "Automatic alerts", desc: "The client is notified at every stage — you don't have to remember." },
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
      body: (
        <>
          With GOOD MINT, they're notified automatically at every step. You{" "}
          <b className="text-gm-900">stop putting out fires</b> and{" "}
          <b className="text-gm-900">get back to selling</b>.
        </>
      ),
      badges: ["✅ Client informed", "🕒 Zero effort", "🚀 Focus on selling"],
    },
    plans: {
      title: "Plans and pricing",
      subtitle: "Start free for 3 days, no card required. Choose a plan whenever you want.",
      perMonth: "/mo",
      perYear: "/yr",
      monthlyLabel: "Monthly",
      annualLabel: "Annual (save 20%)",
      mostPopular: "⭐ Most popular",
      cta: "Start free trial",
      footerNote: "3-day free trial. Cancel anytime.",
      names: { mint_start: "MINT Start", mint_pro: "MINT Pro" },
      features: {
        mint_start: ["30 active leads", "15 listed properties", "Unlimited after-sale clients", "AI-powered messaging hub", "Spreadsheets and export"],
        mint_pro: ["Unlimited leads and listings", "Everything in MINT Start", "Unlimited after-sale clients", "AI-powered messaging hub", "Spreadsheets and export"],
      },
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        ["How does the free trial work?", "You use GOOD MINT for 3 days at no charge and without adding a card. If you want to continue afterwards, pick a plan and add payment whenever you're ready."],
        ["Can I cancel anytime?", "Yes. Cancellation is immediate and fee-free. You keep access until the end of the period you've already paid for."],
        ["Do I need to install anything?", "No. GOOD MINT runs in the browser on phone, tablet or computer."],
      ],
    },
  },
} as const;

const PLAN_CODES = ["mint_start", "mint_pro"] as const;
const PLAN_HIGHLIGHT: Record<(typeof PLAN_CODES)[number], boolean> = {
  mint_start: false,
  mint_pro: true,
};

function Feature({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="gm-card p-8">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gm-50 text-2xl">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gm-900">{title}</h3>
      <p className="mt-1 text-sm text-gm-700/70">{desc}</p>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gm-500 text-sm font-bold text-white">
        {n}
      </span>
      <p className="pt-1 text-sm text-white/90">{text}</p>
    </div>
  );
}

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("pt");
  const [isAnnual, setIsAnnual] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("gm-lang");
    if (saved === "en" || saved === "pt") setLang(saved);
  }, []);

  // Barra de progresso de leitura ("fio condutor" azul) — throttled via rAF
  // pra não disparar setState em toda linha de scroll.
  useEffect(() => {
    let ticking = false;
    function update() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setScrollPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
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
    <main className="min-h-screen bg-white">
      {/* Barra de progresso de leitura — o "fio condutor" azul da página */}
      <div className="fixed left-0 top-0 z-40 h-1 w-full md:h-full md:w-1">
        <div
          className="block h-full bg-gm-500 transition-[width] duration-150 ease-out md:hidden"
          style={{ width: `${scrollPct}%` }}
        />
        <div
          className="hidden bg-gm-500 transition-[height] duration-150 ease-out md:block"
          style={{ height: `${scrollPct}%` }}
        />
      </div>

      {/* Cabeçalho fixo */}
      <header className="sticky top-0 z-30 border-b border-gm-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo />
          <div className="hidden items-center gap-6 md:flex">
            <nav className="flex items-center gap-6 text-sm font-medium text-gm-700">
              <a href="#funcionalidades" className="hover:text-gm-500">{s.nav.features}</a>
              <a href="#plano" className="hover:text-gm-500">{s.nav.plan}</a>
              <a href="#faq" className="hover:text-gm-500">{s.nav.about}</a>
            </nav>
            <div className="h-6 w-px bg-gm-100" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              aria-label="Trocar idioma / Switch language"
              className="rounded-full border border-gm-200 px-3 py-1 text-xs font-medium text-gm-700 hover:bg-gm-50"
            >
              {lang === "pt" ? "🇧🇷 PT" : "🇺🇸 EN"}
            </button>
            <div className="hidden h-5 w-px bg-gm-200 sm:block" aria-hidden="true" />
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gm-700 hover:bg-gm-50"
            >
              {s.nav.login}
            </Link>
            <Link
              href="/cadastro"
              className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gm-600"
            >
              {s.nav.cta}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="gm-radial gm-radial-animated relative overflow-hidden">
        <FloatingEmojis />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
          <Reveal>
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/20">
              {s.hero.badge}
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
              {s.hero.title1}{" "}
              <span className="text-gm-300">{s.hero.title2}</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/80">{s.hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/cadastro"
                className="rounded-xl bg-white px-6 py-3 font-semibold text-gm-700 shadow-lg hover:bg-gm-50"
              >
                {s.hero.ctaPrimary}
              </Link>
              <a
                href="#funcionalidades"
                className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10"
              >
                {s.hero.ctaSecondary}
              </a>
            </div>
            <p className="mt-3 text-xs text-white/60">{s.hero.note}</p>
          </Reveal>

          {/* Esfera "bola de cristal" — impecável, sem dados atrelados */}
          <div className="relative mx-auto hidden flex-col items-center md:flex">
            <div className="gm-breathe absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-gm-300/30 to-gm-500/20 blur-3xl" />
            <div className="relative">
              <CrystalSphere empty={false} caption={s.hero.sphereCaption} />
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="gm-radial relative border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <h2 className="text-center text-2xl font-bold text-white">{s.how.title}</h2>
          </Reveal>
          <div className="mt-8 grid gap-5 md:grid-cols-5">
            {s.how.steps.map((text, i) => (
              <Reveal key={i} delay={i * 80}>
                <Step n={i + 1} text={text} />
              </Reveal>
            ))}
          </div>
        </div>
        {/* Onda suave marcando a transição pro fundo branco de Funcionalidades */}
        <svg
          className="absolute -bottom-1 left-0 w-full text-white"
          viewBox="0 0 1440 60"
          fill="currentColor"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,32 C240,64 480,0 720,16 C960,32 1200,64 1440,32 L1440,60 L0,60 Z" />
        </svg>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <h2 className="text-center text-3xl font-bold text-gm-900">{s.features.title}</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {s.features.items.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <Feature icon={f.icon} title={f.title} desc={f.desc} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Diferencial: pré-venda + pós-venda */}
      <section className="bg-gm-50 py-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-8 md:grid-cols-2">
            <Reveal>
              <div className="gm-card p-8">
                <span className="text-xs font-semibold uppercase tracking-wide text-gm-500">
                  {s.diff.problemLabel}
                </span>
                <h3 className="mt-2 text-xl font-bold text-gm-900">{s.diff.problemTitle}</h3>
                <p className="mt-3 text-sm text-gm-700/70">{s.diff.problemBody}</p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="gm-card border-2 border-gm-300 p-8">
                <span className="text-xs font-semibold uppercase tracking-wide text-gm-500">
                  {s.diff.solutionLabel}
                </span>
                <h3 className="mt-2 text-xl font-bold text-gm-900">{s.diff.solutionTitle}</h3>
                <p className="mt-3 text-sm text-gm-700/70">{s.diff.solutionBody}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Bloco de impacto */}
      <section className="mx-auto max-w-4xl px-5 pt-20">
        <Reveal>
          <div className="rounded-2xl bg-gradient-to-b from-gm-50 to-white p-8 text-center shadow-lg sm:p-12">
            <span className="inline-block rounded-full bg-red-100 px-4 py-1.5 text-sm font-semibold text-red-700">
              {s.impact.painBadge}
            </span>
            <h2 className="mt-4 text-xl font-bold text-gm-900 sm:text-2xl">{s.impact.title}</h2>
            <p className="mt-3 text-sm text-gm-700/70 sm:text-base">{s.impact.body}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {s.impact.badges.map((b) => (
                <span key={b} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-gm-700 shadow-sm">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Planos */}
      <section id="plano" className="gm-radial">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <h2 className="text-center text-3xl font-bold text-white">{s.plans.title}</h2>
            <p className="mt-2 text-center text-white/70">{s.plans.subtitle}</p>
          </Reveal>

          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium transition-all duration-300 ${!isAnnual ? "text-white" : "text-white/50"}`}>
              {s.plans.monthlyLabel}
            </span>
            <button
              onClick={() => setIsAnnual((v) => !v)}
              aria-label="Alternar cobrança mensal ou anual"
              className={`relative h-7 w-14 flex-none rounded-full transition-all duration-300 ${isAnnual ? "bg-gm-300" : "bg-white/20"}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${isAnnual ? "left-8" : "left-1"}`}
              />
            </button>
            <span className={`text-sm font-medium transition-all duration-300 ${isAnnual ? "text-white" : "text-white/50"}`}>
              {s.plans.annualLabel}
            </span>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl gap-8 sm:grid-cols-2 lg:gap-10">
            {PLAN_CODES.map((code, i) => {
              const cents = isAnnual ? PLAN_PRICING[code].yearlyCents : PLAN_PRICING[code].monthlyCents;
              return (
                <Reveal key={code} delay={i * 120}>
                  <div
                    className={`relative min-w-[320px] rounded-2xl bg-white p-10 shadow-2xl transition-all duration-300 ${
                      PLAN_HIGHLIGHT[code] ? "border-2 border-blue-500 shadow-blue-200/50 md:-translate-y-3" : ""
                    }`}
                  >
                    {PLAN_HIGHLIGHT[code] && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gm-500 px-3 py-1 text-xs font-semibold text-white">
                        {s.plans.mostPopular}
                      </span>
                    )}
                    <div className="text-sm font-semibold uppercase tracking-wide text-gm-500">
                      {s.plans.names[code]}
                    </div>
                    <div className="mt-2 flex items-end gap-1">
                      <span className="text-4xl font-bold text-gm-900">{formatBRL(cents)}</span>
                      <span className="pb-1 text-sm text-gm-700/60">{isAnnual ? s.plans.perYear : s.plans.perMonth}</span>
                    </div>
                    <ul className="mt-5 space-y-2 text-sm text-gm-700">
                      {s.plans.features[code].map((f) => (
                        <li key={f}>✅ {f}</li>
                      ))}
                    </ul>
                    <Link
                      href={`/cadastro?plano=${code}&billing=${isAnnual ? "yearly" : "monthly"}`}
                      className={`mt-6 block rounded-xl py-3 text-center font-semibold transition-all duration-300 ${
                        PLAN_HIGHLIGHT[code]
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-gm-50 text-gm-700 hover:bg-gm-100"
                      }`}
                    >
                      {s.plans.cta}
                    </Link>
                    <p className="mt-3 text-center text-xs text-gm-700/50">{s.plans.footerNote}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-20">
        <Reveal>
          <h2 className="text-center text-3xl font-bold text-gm-900">{s.faq.title}</h2>
        </Reveal>
        <div className="mt-8 space-y-4">
          {s.faq.items.map(([q, a], i) => (
            <Reveal key={q} delay={i * 60}>
              <details className="gm-card group p-5">
                <summary className="cursor-pointer list-none font-semibold text-gm-900">{q}</summary>
                <p className="mt-2 text-sm text-gm-700/70">{a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      <Footer lang={lang} />
    </main>
  );
}
