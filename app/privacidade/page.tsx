// app/privacidade/page.tsx — Política de privacidade (LGPD).
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";

export default function PrivacidadePage() {
  return (
    <div>
      <main className="mx-auto max-w-2xl px-5 py-12">
        <Link href="/"><Logo /></Link>
        <h1 className="mt-8 text-2xl font-bold text-gm-900">Política de Privacidade</h1>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-gm-700/80">
          <p>
            O GOOD MINT trata dados pessoais conforme a LGPD (Lei 13.709/2018).
            Coletamos apenas os dados necessários para operar o serviço: dados de
            cadastro do corretor e os registros de leads/clientes inseridos por ele.
          </p>
          <p>
            Dados de cartão nunca são armazenados em nossos servidores — são
            tokenizados diretamente pelo gateway de pagamento (Asaas).
          </p>
          <p>
            Você pode solicitar a exclusão dos seus dados a qualquer momento pelo
            e-mail <a href="mailto:privacidade@goodmint.com.br" className="text-gm-500">privacidade@goodmint.com.br</a>.
          </p>
          <p className="text-gm-700/50">Documento modelo — ajuste com seu jurídico antes do lançamento.</p>
        </div>
        <Link href="/" className="mt-8 inline-block text-sm text-gm-500 hover:underline">← Voltar</Link>
      </main>
      <Footer />
    </div>
  );
}
