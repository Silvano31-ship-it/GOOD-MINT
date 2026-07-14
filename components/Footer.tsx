// components/Footer.tsx — rodapé compartilhado das páginas públicas
// (landing, termos, privacidade, login, cadastro). Extraído do markup que
// antes só existia em app/page.tsx.
import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
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
  );
}
