// components/login/LoginFooter.tsx — rodapé institucional "Night Gold" da
// tela de login e cadastro. Premium, escuro, tudo CSS puro (sem libs):
// frase de impacto, prova social, links institucionais, selos de segurança,
// copyright e ícones sociais.
import Link from "next/link";
import { Logo } from "@/components/Logo";

const TRUST = [
  { value: "500+", label: "corretores usando" },
  { value: "4.9", label: "avaliação média" },
  { value: "98%", label: "recomendam" },
];

const SEALS = [
  { icon: "🔒", label: "Conexão Segura" },
  { icon: "🛡️", label: "Pagamento Protegido" },
  { icon: "💰", label: "Garantia de 7 dias" },
];

export function LoginFooter() {
  return (
    <footer className="relative z-10 border-t border-[#F5C94A]/15 bg-[#0A0F1F]/70 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <p className="mx-auto max-w-2xl text-center text-lg font-medium leading-relaxed text-[#E6E9F2] sm:text-xl">
          A tecnologia que conecta você ao{" "}
          <span className="gm-night-title text-[#F5C94A]">futuro</span> do mercado
          imobiliário.
        </p>

        <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {TRUST.map((t) => (
            <div key={t.label} className="text-center">
              <div className="text-2xl font-bold text-[#F5C94A]">{t.value}</div>
              <div className="text-xs text-[#B0B8C8]">{t.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {SEALS.map((s) => (
            <span
              key={s.label}
              className="flex items-center gap-2 rounded-full border border-[#F5C94A]/20 bg-[#F5C94A]/[0.08] px-4 py-1.5 text-sm text-[#E6E9F2]"
            >
              <span aria-hidden="true">{s.icon}</span>
              {s.label}
            </span>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Logo size={24} variant="gold" />

            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <Link href="/termos" className="text-[#B0B8C8] transition-colors duration-300 hover:text-[#F5C94A]">
                Termos de Uso
              </Link>
              <Link href="/privacidade" className="text-[#B0B8C8] transition-colors duration-300 hover:text-[#F5C94A]">
                Privacidade
              </Link>
              <Link href="/termos#reembolso" className="text-[#B0B8C8] transition-colors duration-300 hover:text-[#F5C94A]">
                Reembolso
              </Link>
              <a
                href="mailto:contato@goodmint.com.br"
                className="text-[#B0B8C8] transition-colors duration-300 hover:text-[#F5C94A]"
              >
                Contato
              </a>
            </nav>
          </div>

          <p className="mt-6 text-center text-xs text-[#B0B8C8]/70">
            © {new Date().getFullYear()} GOOD MINT — Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
