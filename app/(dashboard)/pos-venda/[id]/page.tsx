// app/(dashboard)/pos-venda/[id]/page.tsx — Detalhe do Processo de Pós-Venda.
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveAccount } from "@/lib/account-guard";
import { getPostSale, POST_SALE_STAGES } from "@/lib/data";
import { StageProgress } from "@/components/pos-venda/StageProgress";
import { ChecklistPanel } from "@/components/pos-venda/ChecklistPanel";
import { CommunicationPanel } from "@/components/pos-venda/CommunicationPanel";
import { ReferralPanel } from "@/components/pos-venda/ReferralPanel";
import { DetailTabs } from "@/components/pos-venda/DetailTabs";
import {
  advancePostSaleStage,
  voltarPostSaleStage,
  setPostSaleNextAction,
  setIsFinanced,
} from "@/app/(dashboard)/pos-venda/actions";
import { formatBRL, formatDateTime } from "@/lib/format";

export default async function PosVendaDetailPage({ params }: { params: { id: string } }) {
  const user = await requireActiveAccount();
  const ps = await getPostSale(user.id, params.id);
  if (!ps) notFound();

  const stages = POST_SALE_STAGES.filter((s) => !("conditional" in s && s.conditional) || ps.is_financed);
  const currentIdx = stages.findIndex((s) => s.key === ps.current_stage);
  const nextStage = stages[currentIdx + 1];
  const priorStages = stages.slice(0, currentIdx);
  const saveNextAction = setPostSaleNextAction.bind(null, ps.id);
  const stageLabel = (k: string) => POST_SALE_STAGES.find((s) => s.key === k)?.label ?? k;

  const geral = (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="gm-card p-6 lg:col-span-2">
          <h2 className="mb-5 font-semibold text-gm-900">Andamento do processo</h2>
          <StageProgress current={ps.current_stage} isFinanced={ps.is_financed} />

          <div className="mt-4 flex flex-wrap gap-2 border-t border-gm-50 pt-4">
            {nextStage ? (
              <form action={advancePostSaleStage.bind(null, ps.id, nextStage.key)}>
                <button className="min-h-11 rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">
                  Avançar para: {nextStage.label} →
                </button>
              </form>
            ) : (
              <span className="rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                ✓ Processo concluído — pesquisa de satisfação enviada!
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-gm-700/50">
            Ao avançar, um e-mail automático é enviado ao cliente e a mudança fica
            registrada no histórico abaixo.
          </p>

          {priorStages.length > 0 && (
            <details className="mt-4 border-t border-gm-50 pt-3">
              <summary className="cursor-pointer text-xs font-medium text-gm-700/60">
                Corrigir etapa (raro)
              </summary>
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {priorStages.map((s) => (
                    <form key={s.key} action={voltarPostSaleStage.bind(null, ps.id, s.key)} className="flex items-center gap-1">
                      <input type="text" name="motivo" placeholder="Motivo (obrigatório)" required className="min-h-11 w-40 rounded-lg border border-gm-200 px-2 py-1.5 text-xs" />
                      <button className="min-h-11 rounded-full bg-gm-100 px-3 py-1.5 text-xs font-medium text-gm-700 hover:bg-gm-200">
                        ← {s.label}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            </details>
          )}

          <div className="mt-4 border-t border-gm-50 pt-3">
            <form action={setIsFinanced.bind(null, ps.id, !ps.is_financed)}>
              <button className="text-xs text-gm-500 hover:underline">
                {ps.is_financed ? "Marcar como negócio sem financiamento" : "Marcar como negócio financiado"}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="gm-card p-5">
            <h2 className="mb-3 font-semibold text-gm-900">Próxima ação pendente</h2>
            <form action={saveNextAction} className="space-y-2">
              <textarea name="next_action" defaultValue={ps.next_action ?? ""} rows={3} placeholder="Ex.: aguardar retorno do banco" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
              <label className="block">
                <span className="mb-1 block text-xs text-gm-700/60">Prazo (opcional)</span>
                <input
                  type="date"
                  name="next_action_due_at"
                  defaultValue={ps.next_action_due_at ? ps.next_action_due_at.slice(0, 10) : ""}
                  className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
                />
              </label>
              <button className="min-h-11 w-full rounded-lg bg-gm-500 py-2 text-sm font-semibold text-white hover:bg-gm-600">Salvar</button>
            </form>
          </div>

          <ReferralPanel postSaleId={ps.id} referralToken={ps.referral_token} referrals={ps.referrals} />
        </div>
      </div>

      <div className="gm-card p-5">
        <h2 className="mb-3 font-semibold text-gm-900">Linha do tempo</h2>
        {ps.timeline.length === 0 ? (
          <p className="text-sm text-gm-700/50">Nenhum evento registrado ainda.</p>
        ) : (
          <ul className="space-y-2">
            {ps.timeline.map((t, i) => (
              <li key={i} className="flex items-start justify-between gap-3 rounded-lg bg-gm-50 px-3 py-2 text-sm">
                <div>
                  <span className="font-medium text-gm-900">
                    {t.kind === "etapa" ? "🏷️ " : t.kind === "comunicacao" ? "💬 " : "📎 "}
                    {t.label}
                  </span>
                  {t.detail && <p className="mt-0.5 text-xs text-gm-700/60">{t.detail}</p>}
                </div>
                <span className="flex-none text-xs text-gm-700/40">{formatDateTime(t.ts)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <Link href="/pos-venda" className="text-sm text-gm-500 hover:underline">← Voltar ao pós-venda</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gm-900">{ps.lead_name}</h1>
          <p className="text-sm text-gm-700/60">{ps.property_address ?? "Imóvel não vinculado"}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-gm-900">{formatBRL(ps.value_cents ? Number(ps.value_cents) : null)}</div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ps.is_financed ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
            {ps.is_financed ? "Financiado" : "À vista"}
          </span>
          <div className="mt-1">
            <a href={`/api/pos-venda/${ps.id}/relatorio`} target="_blank" rel="noopener noreferrer" className="text-xs text-gm-500 hover:underline">
              📄 Baixar Laudo PDF
            </a>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <DetailTabs
          geral={geral}
          checklist={<ChecklistPanel postSaleId={ps.id} items={ps.checklist} />}
          comunicacao={<CommunicationPanel postSaleId={ps.id} items={ps.communications} />}
          documentos={
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ps.checklist.filter((c) => c.file_url).length === 0 ? (
                <p className="text-sm text-gm-700/50">Nenhum documento enviado ainda.</p>
              ) : (
                ps.checklist
                  .filter((c) => c.file_url)
                  .map((c) => (
                    <a key={c.id} href={c.file_url!} target="_blank" rel="noopener noreferrer" className="gm-card block p-4 text-sm hover:-translate-y-0.5">
                      <div className="font-medium text-gm-900">{c.label}</div>
                      <div className="mt-1 text-xs text-gm-700/50">{stageLabel(c.document_type)}</div>
                    </a>
                  ))
              )}
            </div>
          }
        />
      </div>
    </div>
  );
}
