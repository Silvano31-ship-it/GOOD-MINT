// app/page.tsx — Landing Page (tela 1). Pública. Paleta azul/branco (seção 6).
import Link from "next/link";
import { Logo } from "@/components/Logo";

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
      <section className="gm-radial relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
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
              Sem cobrança durante o teste. Cancele quando quiser.
            </p>
          </div>

          {/* Esfera "bola de cristal" decorativa */}
          <div className="relative mx-auto hidden h-80 w-80 md:block">
            <div className="gm-breathe absolute inset-0 rounded-full bg-gradient-to-br from-gm-300/40 to-gm-500/30 blur-2xl" />
            <div className="absolute inset-6 rounded-full border border-white/20 gm-glass" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="gm-glass rounded-2xl px-5 py-4 text-center text-white">
                <div className="text-3xl font-bold">R$ 19,90</div>
                <div className="text-xs text-white/70">por mês, tudo incluído</div>
              </div>
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

      {/* Plano */}
      <section id="plano" className="gm-radial">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-center text-3xl font-bold text-white">Plano e preço</h2>
          <p className="mt-2 text-center text-white/70">Um plano simples, sem pegadinha.</p>
          <div className="mx-auto mt-8 max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
            <div className="text-sm font-semibold uppercase tracking-wide text-gm-500">
              MINT Start
            </div>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-4xl font-bold text-gm-900">R$ 19,90</span>
              <span className="pb-1 text-gm-700/60">/mês</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-gm-700">
              <li>✓ 30 leads ativos</li>
              <li>✓ 15 imóveis cadastrados</li>
              <li>✓ Clientes em pós-venda <b>ilimitados</b></li>
              <li>✓ Central de Mensagens com bot de IA</li>
              <li>✓ Planilhas e exportação</li>
            </ul>
            <Link
              href="/cadastro"
              className="mt-7 block rounded-xl bg-gm-500 py-3 text-center font-semibold text-white hover:bg-gm-600"
            >
              Começar teste grátis de 3 dias
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold text-gm-900">Perguntas frequentes</h2>
        <div className="mt-8 space-y-4">
          {[
            ["Como funciona o teste grátis?", "Você usa o GOOD MINT por 3 dias sem nenhuma cobrança. Pedimos o cartão no cadastro, mas ele só é cobrado ao final do teste, se você continuar."],
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

      {/* Rodapé */}
      <footer className="border-t border-gm-100 bg-gm-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-gm-700/70 md:flex-row">
          <Logo size={24} />
          <div className="flex gap-5">
            <Link href="/termos" className="hover:text-gm-500">Termos de uso</Link>
            <Link href="/privacidade" className="hover:text-gm-500">Privacidade</Link>
            <a href="mailto:contato@goodmint.com.br" className="hover:text-gm-500">Contato</a>
          </div>
          <span>© {new Date().getFullYear()} GOOD MINT</span>
        </div>
      </footer>
    </main>
  );
}
