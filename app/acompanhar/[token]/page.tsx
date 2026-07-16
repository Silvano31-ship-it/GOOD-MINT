// app/acompanhar/[token]/page.tsx — portal público do cliente (link mágico,
// sem login). Fora do route group (dashboard): sem sidebar, sem sessão.
// Escopado só pelo token — ver lib/data.ts#getPostSaleByToken.
import { notFound } from "next/navigation";
import { getPostSaleByToken } from "@/lib/data";
import { StageProgress } from "@/components/pos-venda/StageProgress";
import { QuestionForm } from "@/components/pos-venda/QuestionForm";
import { Logo } from "@/components/Logo";
import { formatBRL } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  enviado: "Em análise",
  validado: "Aprovado",
  rejeitado: "Precisa reenviar",
};

export default async function AcompanharPage({ params }: { params: { token: string } }) {
  const ps = await getPostSaleByToken(params.token);
  if (!ps) notFound();

  const stageLabel = ps.current_stage_label;

  return (
    <div className="min-h-screen bg-gm-50/40 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="gm-card p-6">
          <h1 className="text-lg font-semibold text-gm-900">Olá, {ps.lead_name}!</h1>
          <p className="mt-1 text-sm text-gm-700/60">Acompanhe aqui o andamento do seu processo.</p>

          {ps.property_address && (
            <div className="mt-4 overflow-hidden rounded-xl border border-gm-100">
              {ps.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ps.photo_url} alt="" className="h-40 w-full object-cover" />
              )}
              <div className="p-3">
                <div className="text-sm font-medium text-gm-900">{ps.property_address}</div>
                {ps.value_cents && (
                  <div className="text-sm text-gm-700/60">{formatBRL(Number(ps.value_cents))}</div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6">
            <StageProgress current={ps.current_stage} isFinanced={ps.is_financed} stages={ps.stages} />
          </div>
          <p className="mt-3 rounded-lg bg-gm-50 px-3 py-2 text-center text-sm font-medium text-gm-900">
            Etapa atual: {stageLabel}
          </p>

          {ps.checklist.length > 0 && (
            <div className="mt-6 border-t border-gm-50 pt-4">
              <h2 className="mb-2 text-sm font-semibold text-gm-900">Documentos</h2>
              <ul className="space-y-1.5">
                {ps.checklist.map((c, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gm-700">{c.label}</span>
                    <span className="text-xs font-medium text-gm-700/60">{STATUS_LABEL[c.status] ?? c.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 border-t border-gm-50 pt-4">
            <h2 className="mb-2 text-sm font-semibold text-gm-900">Ficou com alguma dúvida?</h2>
            <QuestionForm token={params.token} />
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-gm-700/40">GOOD MINT · Acompanhamento de pós-venda</p>
      </div>
    </div>
  );
}
