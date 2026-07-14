// app/page.tsx — Landing Page (tela 1). Pública. Paleta azul/branco (seção 6).
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CrystalSphere } from "@/components/CrystalSphere";
import { FloatingEmojis } from "@/components/FloatingEmojis";
import { Footer } from "@/components/Footer";

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

const PLANS = [
  {
    code: "mint_start",
    name: "MINT Start",
    price: "R$ 19,90",
    highlight: false,
    features: [
      "30 leads ativos",
      "15 imóveis cadastrados",
      "Clientes em pós-venda ilimitados",
      "Central de Mensagens com bot de IA",
      "Planilhas e exportação",
    ],
  },
  {
    code: "mint_pro",
    name: "MINT Pro",
    price: "R$ 49,90",
    highlight: true,
    features: [
      "Leads e imóveis ilimitados",
      "Tudo do MINT Start incluso",
      "Clientes em pós-venda ilimitados",
      "Central de Mensagens com bot de IA",
      "Planilhas e exportação",
    ],
  },
  {
    code: "mint_business",
    name: "MINT Business",
    price: "R$ 80,00",
    highlight: false,
    features: [
      "Tudo ilimitado",
      "Tudo do MINT Pro incluso",
      "Prioridade nas próximas novidades",
      "Central de Mensagens com bot de IA",
      "Planilhas e exportação",
    ],
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Cabeçalho fixo */}
      <header className="sticky top-0 z-30 border-b border-gm-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-gm-700 md:flex">
            <a href="#funcionalidades" className="hover:text-gm-500">Funcionalidades</a>
            <a href="#plano" className="hover:text-gm-500">Plano</a>
            <a href="#faq" className="hover:text-gm-500">Sobre</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gm-700 hover:bg-gm-50"
            >
              Login
            </Link>
            <Link
              href="/cadastro"
              className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gm-600"
            >
              Teste grátis
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
              CRM para corretores autônomos
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-white md:text-5xl">
              Organize seus leads e imóveis — e acompanhe o cliente{" "}
              <span className="text-gm-300">até depois da venda.</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/80">
              O único CRM que cuida da pré-venda <b>e</b> da pós-venda. Nunca mais
              ouça "cadê meu processo?" — o cliente é avisado automaticamente a
              cada etapa.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/cadastro"
                className="rounded-xl bg-white px-6 py-3 font-semibold text-gm-700 shadow-lg hover:bg-gm-50"
              >
                Comece seu teste grátis de 3 dias
              </Link>
              <a
                href="#funcionalidades"
                className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10"
              >
                Ver funcionalidades
              </a>
            </div>
            <p className="mt-3 text-xs text-white/60">
              Sem cartão de crédito no cadastro. Cancele quando quiser.
            </p>
          </div>

          {/* Esfera "bola de cristal" — impecável, sem dados atrelados */}
          <div className="relative mx-auto hidden flex-col items-center md:flex">
            <div className="gm-breathe absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-gm-300/30 to-gm-500/20 blur-3xl" />
            <div className="relative">
              <CrystalSphere empty={false} caption="Sua bola de cristal do negócio" />
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="gm-radial border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-center text-2xl font-bold text-white">Como funciona</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-5">
            <Step n={1} text="Cadastre-se e comece o teste grátis" />
            <Step n={2} text="Adicione seus leads e imóveis" />
            <Step n={3} text="Organize seu funil de vendas" />
            <Step n={4} text="Feche a venda" />
            <Step n={5} text="Mantenha o cliente informado até a entrega das chaves" />
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold text-gm-900">
          Tudo que o corretor autônomo precisa
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Feature icon="🗂️" title="Funil Kanban" desc="Arraste leads entre etapas: Novo → Contato → Visita → Proposta → Fechado." />
          <Feature icon="🏠" title="Cadastro de imóveis" desc="Fotos, endereço, tipo, valor e status — tudo organizado." />
          <Feature icon="🤝" title="Acompanhamento de Pós-Venda" desc="Barra de progresso da documentação até a entrega das chaves." />
          <Feature icon="🔔" title="Alertas automáticos" desc="O cliente é avisado a cada etapa, sem você precisar lembrar." />
        </div>
      </section>

      {/* Diferencial: pré-venda + pós-venda */}
      <section className="bg-gm-50 py-16">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="gm-card p-8">
              <span className="text-xs font-semibold uppercase tracking-wide text-gm-500">
                O problema comum
              </span>
              <h3 className="mt-2 text-xl font-bold text-gm-900">
                CRM genérico só cuida da venda
              </h3>
              <p className="mt-3 text-sm text-gm-700/70">
                Depois que o cliente compra, ele fica sem saber em que pé está a
                documentação, o financiamento, a assinatura. O corretor perde
                tempo respondendo "cadê meu processo?" repetidamente — e o
                cliente fica ansioso, mesmo com a venda fechada.
              </p>
            </div>
            <div className="gm-card border-2 border-gm-300 p-8">
              <span className="text-xs font-semibold uppercase tracking-wide text-gm-500">
                A solução GOOD MINT
              </span>
              <h3 className="mt-2 text-xl font-bold text-gm-900">
                Pré-venda e pós-venda, sempre atualizados
              </h3>
              <p className="mt-3 text-sm text-gm-700/70">
                Cada mudança de etapa dispara um aviso automático pro cliente.
                Documentação enviada, análise de crédito, aprovação, assinatura,
                registro, entrega das chaves — tudo acompanhado, sem esforço
                manual do corretor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="plano" className="gm-radial">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-center text-3xl font-bold text-white">Planos e preços</h2>
          <p className="mt-2 text-center text-white/70">
            Comece grátis por 3 dias, sem cartão. Escolha o plano quando quiser.
          </p>
          <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.code}
                className={`relative rounded-2xl bg-white p-7 shadow-2xl ${
                  plan.highlight ? "ring-2 ring-gm-300 md:-translate-y-3" : ""
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gm-500 px-3 py-1 text-xs font-semibold text-white">
                    Mais popular
                  </span>
                )}
                <div className="text-sm font-semibold uppercase tracking-wide text-gm-500">
                  {plan.name}
                </div>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-3xl font-bold text-gm-900">{plan.price}</span>
                  <span className="pb-1 text-sm text-gm-700/60">/mês</span>
                </div>
                <ul className="mt-5 space-y-2 text-sm text-gm-700">
                  {plan.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                <Link
                  href={`/cadastro?plano=${plan.code}`}
                  className={`mt-6 block rounded-xl py-3 text-center font-semibold ${
                    plan.highlight
                      ? "bg-gm-500 text-white hover:bg-gm-600"
                      : "bg-gm-50 text-gm-700 hover:bg-gm-100"
                  }`}
                >
                  Começar teste grátis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold text-gm-900">Perguntas frequentes</h2>
        <div className="mt-8 space-y-4">
          {[
            ["Como funciona o teste grátis?", "Você usa o GOOD MINT por 3 dias sem nenhuma cobrança e sem precisar cadastrar cartão. Se quiser continuar depois do teste, escolhe um plano e cadastra o pagamento quando quiser."],
            ["Posso cancelar quando quiser?", "Sim. O cancelamento é imediato e sem multa. Você mantém o acesso até o fim do período já pago."],
            ["Preciso instalar algo?", "Não. O GOOD MINT roda no navegador do celular, tablet ou computador."],
          ].map(([q, a]) => (
            <details key={q} className="gm-card group p-5">
              <summary className="cursor-pointer list-none font-semibold text-gm-900">
                {q}
              </summary>
              <p className="mt-2 text-sm text-gm-700/70">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
