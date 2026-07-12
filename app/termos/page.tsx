// app/termos/page.tsx — Termos de uso (institucional).
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function TermosPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/"><Logo /></Link>
      <h1 className="mt-8 text-2xl font-bold text-gm-900">Termos de Uso</h1>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-gm-700/80">
        <p>
          Ao utilizar o GOOD MINT, você concorda com estes termos. O serviço é
          oferecido no modelo de assinatura mensal (plano MINT Start, R$ 19,90/mês),
          com período de teste gratuito de 3 dias.
        </p>
        <p>
          O cancelamento pode ser feito a qualquer momento, sem multa. O acesso
          permanece ativo até o fim do período já pago.
        </p>
        <p>
          O corretor é responsável pelo conteúdo cadastrado (leads, imóveis,
          mensagens) e pelo cumprimento das regras das plataformas de mensagem
          conectadas.
        </p>
        <p className="text-gm-700/50">Documento modelo — ajuste com seu jurídico antes do lançamento.</p>
      </div>
      <Link href="/" className="mt-8 inline-block text-sm text-gm-500 hover:underline">← Voltar</Link>
    </main>
  );
}
