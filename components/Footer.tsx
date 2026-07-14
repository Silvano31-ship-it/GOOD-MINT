// components/Footer.tsx — rodapé compartilhado das páginas públicas
// (landing, termos, privacidade, login, cadastro). Extraído do markup que
// antes só existia em app/page.tsx.
import Link from "next/link";
import { Logo } from "./Logo";

const LABELS = {
  pt: { terms: "Termos de uso", privacy: "Privacidade", contact: "Contato" },
  en: { terms: "Terms of Service", privacy: "Privacy Policy", contact: "Contact" },
};

/** `lang` é opcional — só a landing page (a única com o toggle PT/EN) passa
 * "en"; nas demais páginas (login, cadastro, termos, privacidade) o rodapé
 * continua em português por padrão. */
export function Footer({ lang = "pt" }: { lang?: "pt" | "en" }) {
  const t = LABELS[lang];
  return (
    <footer className="border-t border-gm-100 bg-gm-50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-gm-700/70 md:flex-row">
        <Logo size={24} />
        <div className="flex gap-5">
          <Link href="/termos" className="hover:text-gm-500">{t.terms}</Link>
          <Link href="/privacidade" className="hover:text-gm-500">{t.privacy}</Link>
          <a href="mailto:contato@goodmint.com.br" className="hover:text-gm-500">{t.contact}</a>
        </div>
        <span>© {new Date().getFullYear()} GOOD MINT</span>
      </div>
    </footer>
  );
}
