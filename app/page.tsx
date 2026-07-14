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
    plans: {
      title: "Planos e preços",
      subtitle: "Comece grátis por 3 dias, sem cartão. Escolha o plano quando quiser.",
      perMonth: "/mês",
      mostPopular: "⭐ Mais popular",
      cta: "Começar teste grátis",
      names: { mint_start: "MINT Start", mint_pro: "MINT Pro", mint_business: "MINT Business" },
      features: {
        mint_start: ["30 leads ativos", "15 imóveis cadastrados", "Clientes em pós-venda ilimitados", "Central de Mensagens com bot de IA", "Planilhas e exportação"],
        mint_pro: ["Leads e imóveis ilimitados", "Tudo do MINT Start incluso", "Clientes em pós-venda ilimitados", "Central de Mensagens com bot de IA", "Planilhas e exportação"],
        mint_business: ["Tudo ilimitado", "Tudo do MINT Pro incluso", "Prioridade nas próximas novidades", "Central de Mensagens com bot de IA", "Planilhas e exportação"],
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
    plans: {
      title: "Plans and pricing",
      subtitle: "Start free for 3 days, no card required. Choose a plan whenever you want.",
      perMonth: "/mo",
      mostPopular: "⭐ Most popular",
      cta: "Start free trial",
      names: { mint_start: "MINT Start", mint_pro: "MINT Pro", mint_business: "MINT Business" },
      features: {
        mint_start: ["30 active leads", "15 listed properties", "Unlimited after-sale clients", "AI-powered messaging hub", "Spreadsheets and export"],
        mint_pro: ["Unlimited leads and listings", "Everything in MINT Start", "Unlimited after-sale clients", "AI-powered messaging hub", "Spreadsheets and export"],
        mint_business: ["Everything unlimited", "Everything in MINT Pro", "Priority on upcoming features", "AI-powered messaging hub", "Spreadsheets and export"],
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

const PLAN_CODES = ["mint_start", "mint_pro", "mint_business"] as const;
const PLAN_PRICES: Record<(typeof PLAN_CODES)[number], string> = {
  mint_start: "R$ 19,90",
  mint_pro: "R$ 49,90",
  mint_business: "R$ 80,00",
};
const PLAN_HIGHLIGHT: Record<(typeof PLAN_CODES)[number], boolean> = {
  mint_start: false,
  mint_pro: true,
  mint_business: false,
};

function Feature({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="gm-card p-6">
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

  useEffect(() => {
    const saved = localStorage.getItem("gm-lang");
    if (saved === "en" || saved === "pt") setLang(saved);
  }, []);

  function toggleLang() {
    const next = lang === "pt" ? "en" : "pt";
    setLang(next);
    localStorage.setItem("gm-lang", next);
  }

  const s = STRINGS[lang];

  return (
    <main className="min-h-screen bg-white">
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
          <div>
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/20">
              {s.hero.badge}
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-white md:text-5xl">
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
          </div>

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
      <section className="gm-radial border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-center text-2xl font-bold text-white">{s.how.title}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-5">
            {s.how.steps.map((text, i) => (
              <Step key={i} n={i + 1} text={text} />
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold text-gm-900">{s.features.title}</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {s.features.items.map((f) => (
            <Feature key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </div>
      </section>

      {/* Diferencial: pré-venda + pós-venda */}
      <section className="bg-gm-50 py-16">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="gm-card p-8">
              <span className="text-xs font-semibold uppercase tracking-wide text-gm-500">
                {s.diff.problemLabel}
              </span>
              <h3 className="mt-2 text-xl font-bold text-gm-900">{s.diff.problemTitle}</h3>
              <p className="mt-3 text-sm text-gm-700/70">{s.diff.problemBody}</p>
            </div>
            <div className="gm-card border-2 border-gm-300 p-8">
              <span className="text-xs font-semibold uppercase tracking-wide text-gm-500">
                {s.diff.solutionLabel}
              </span>
              <h3 className="mt-2 text-xl font-bold text-gm-900">{s.diff.solutionTitle}</h3>
              <p className="mt-3 text-sm text-gm-700/70">{s.diff.solutionBody}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="plano" className="gm-radial">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-center text-3xl font-bold text-white">{s.plans.title}</h2>
          <p className="mt-2 text-center text-white/70">{s.plans.subtitle}</p>
          <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
            {PLAN_CODES.map((code) => (
              <div
                key={code}
                className={`relative rounded-2xl bg-white p-7 shadow-2xl ${
                  PLAN_HIGHLIGHT[code] ? "ring-2 ring-gm-300 md:-translate-y-3" : ""
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
                  <span className="text-3xl font-bold text-gm-900">{PLAN_PRICES[code]}</span>
                  <span className="pb-1 text-sm text-gm-700/60">{s.plans.perMonth}</span>
                </div>
                <ul className="mt-5 space-y-2 text-sm text-gm-700">
                  {s.plans.features[code].map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                <Link
                  href={`/cadastro?plano=${code}`}
                  className={`mt-6 block rounded-xl py-3 text-center font-semibold ${
                    PLAN_HIGHLIGHT[code]
                      ? "bg-gm-500 text-white hover:bg-gm-600"
                      : "bg-gm-50 text-gm-700 hover:bg-gm-100"
                  }`}
                >
                  {s.plans.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold text-gm-900">{s.faq.title}</h2>
        <div className="mt-8 space-y-4">
          {s.faq.items.map(([q, a]) => (
            <details key={q} className="gm-card group p-5">
              <summary className="cursor-pointer list-none font-semibold text-gm-900">{q}</summary>
              <p className="mt-2 text-sm text-gm-700/70">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <Footer lang={lang} />
    </main>
  );
}
