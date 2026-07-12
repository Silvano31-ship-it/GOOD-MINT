// app/(dashboard)/pos-venda/[id]/page.tsx — Tela 13. Pós-Venda — Detalhe do Processo.
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveAccount } from "@/lib/account-guard";
import { getPostSale, POST_SALE_STAGES } from "@/lib/data";
import { StageProgress } from "@/components/pos-venda/StageProgress";
import { advancePostSaleStage, setPostSaleNextAction } from "@/app/(dashboard)/actions";
import { formatDateTime } from "@/lib/format";

export default async function PosVendaDetailPage({ params }: { params: { id: string } }) {
  const user = await requireActiveAccount();
  const ps = await getPostSale(user.id, params.id);
  if (!ps) notFound();

  const currentIdx = POST_SALE_STAGES.findIndex((s) => s.key === ps.current_stage);
  const nextStage = POST_SALE_STAGES[currentIdx + 1];
  const saveNextAction = setPostSaleNextAction.bind(null, ps.id);
  const stageLabel = (k: string) => POST_SALE_STAGES.find((s) => s.key === k)?.label ?? k;

  return (
    <div>
      <Link href="/pos-venda" className="text-sm text-gm-500 hover:underline">← Voltar ao pós-venda</Link>
      <div className="mt-3">
        <h1 className="text-2xl font-bold text-gm-900">{ps.lead_name}</h1>
        <p className="text-sm text-gm-700/60">{ps.property_address ?? "Imóvel não vinculado"}</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Stepper */}
        <div className="gm-card p-6 lg:col-span-2">
          <h2 className="mb-5 font-semibold text-gm-900">Andamento do processo</h2>
          <StageProgress current={ps.current_stage} />

          <div className="mt-4 flex flex-wrap gap-2 border-t border-gm-50 pt-4">
            {nextStage ? (
              <form action={advancePostSaleStage.bind(null, ps.id, nextStage.key)}>
                <button className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">
                  Avançar para: {nextStage.label} →
                </button>
              </form>
            ) : (
              <span className="rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                ✓ Processo concluído — chaves entregues!
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-gm-700/50">
            Ao avançar, uma mensagem automática é registrada para envio ao cliente
            via WhatsApp (envio real depende da Central de Mensagens conectada).
          </p>
        </div>

        {/* Próxima ação + pular etapa */}
        <div className="space-y-6">
          <div className="gm-card p-5">
            <h2 className="mb-3 font-semibold text-gm-900">Próxima ação pendente</h2>
            <form action={saveNextAction} className="space-y-2">
              <textarea name="next_action" defaultValue={ps.next_action ?? ""} rows={3} placeholder="Ex.: aguardar retorno do banco" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
              <button className="w-full rounded-lg bg-gm-500 py-2 text-sm font-semibold text-white hover:bg-gm-600">Salvar</button>
            </form>
          </div>

          <div className="gm-card p-5">
            <h2 className="mb-3 font-semibold text-gm-900">Ir para etapa</h2>
            <div className="flex flex-wrap gap-2">
              {POST_SALE_STAGES.map((s) => (
                <form key={s.key} action={advancePostSaleStage.bind(null, ps.id, s.key)}>
                  <button className={`rounded-full px-3 py-1 text-xs font-medium ${s.key === ps.current_stage ? "bg-gm-500 text-white" : "bg-gm-100 text-gm-700 hover:bg-gm-200"}`}>
                    {s.label}
                  </button>
                </form>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mensagens automáticas enviadas */}
      <div className="mt-6 gm-card p-5">
        <h2 className="mb-3 font-semibold text-gm-900">Mensagens automáticas ao cliente</h2>
        {ps.messages.length === 0 ? (
          <p className="text-sm text-gm-700/50">Nenhuma mensagem enviada ainda. Elas são registradas a cada mudança de etapa.</p>
        ) : (
          <ul className="space-y-2">
            {ps.messages.map((m, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-gm-50 px-3 py-2 text-sm">
                <span className="text-gm-900">📲 Cliente avisado: <b>{stageLabel(m.stage)}</b></span>
                <span className="text-xs text-gm-700/40">{formatDateTime(m.sent_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
