// app/indicar/[token]/page.tsx — formulário público de indicação de cliente.
// Aberto pelo link compartilhado no botão "Solicitar Indicação" do corretor.
// Sem login: escopado só pelo referral_token (ver submitPublicReferral).
import { Logo } from "@/components/Logo";
import { IndicarForm } from "@/components/pos-venda/IndicarForm";

export default function IndicarPage({ params }: { params: { token: string } }) {
  return (
    <div className="min-h-screen bg-gm-50/40 px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="gm-card p-6">
          <h1 className="text-lg font-semibold text-gm-900">Indique alguém 🎁</h1>
          <p className="mt-1 text-sm text-gm-700/60">
            Conhece alguém que também está buscando um imóvel? Deixe o contato
            abaixo que seu corretor vai entrar em contato.
          </p>
          <div className="mt-5">
            <IndicarForm token={params.token} />
          </div>
        </div>
      </div>
    </div>
  );
}
