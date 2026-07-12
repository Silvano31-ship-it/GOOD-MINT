// app/(dashboard)/leads/[id]/page.tsx — Tela 9. Detalhe do Lead.
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveAccount } from "@/lib/account-guard";
import { getLead, LEAD_STAGES } from "@/lib/data";
import { db } from "@/lib/db";
import { updateLead, addLeadInteraction, updateLeadStage } from "@/app/(dashboard)/actions";
import { Badge } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const user = await requireActiveAccount();
  const lead = await getLead(user.id, params.id);
  if (!lead) notFound();

  const { rows: interactions } = await db.query(
    `SELECT interaction_type, content, created_at FROM lead_interactions
     WHERE lead_id = $1 ORDER BY created_at DESC`,
    [params.id]
  );

  const stageLabel = LEAD_STAGES.find((s) => s.key === lead.funnel_stage)?.label ?? lead.funnel_stage;
  const saveLead = updateLead.bind(null, lead.id);
  const addInteraction = addLeadInteraction.bind(null, lead.id);

  return (
    <div>
      <Link href="/leads" className="text-sm text-gm-500 hover:underline">← Voltar ao funil</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gm-900">{lead.name}</h1>
        <Badge value={lead.funnel_stage} label={stageLabel} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Edição */}
        <div className="gm-card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-gm-900">Dados do lead</h2>
          <form action={saveLead} className="space-y-3">
            <input name="name" defaultValue={lead.name} required className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input name="phone" defaultValue={lead.phone ?? ""} placeholder="Telefone" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
              <input name="email" defaultValue={lead.email ?? ""} placeholder="E-mail" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
            </div>
            <input name="origin" defaultValue={lead.origin ?? ""} placeholder="Origem" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
            <textarea name="notes" defaultValue={lead.notes ?? ""} rows={3} placeholder="Observações" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
            <button className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">Salvar</button>
          </form>
        </div>

        {/* Etapa + ações */}
        <div className="space-y-6">
          <div className="gm-card p-5">
            <h2 className="mb-3 font-semibold text-gm-900">Mudar etapa</h2>
            <div className="flex flex-wrap gap-2">
              {LEAD_STAGES.map((s) => (
                <form key={s.key} action={updateLeadStage.bind(null, lead.id, s.key)}>
                  <button
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      s.key === lead.funnel_stage ? "bg-gm-500 text-white" : "bg-gm-100 text-gm-700 hover:bg-gm-200"
                    }`}
                  >
                    {s.label}
                  </button>
                </form>
              ))}
            </div>
            <p className="mt-3 text-xs text-gm-700/50">Último contato: {formatDateTime(lead.last_contact_at)}</p>
          </div>

          <div className="gm-card p-5">
            <h2 className="mb-3 font-semibold text-gm-900">Nova interação</h2>
            <form action={addInteraction} className="space-y-2">
              <select name="type" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm">
                <option value="ligacao">Ligação</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="visita">Visita</option>
                <option value="nota">Nota</option>
              </select>
              <textarea name="content" rows={2} placeholder="O que aconteceu?" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
              <button className="w-full rounded-lg bg-gm-500 py-2 text-sm font-semibold text-white hover:bg-gm-600">Registrar</button>
            </form>
          </div>
        </div>
      </div>

      {/* Histórico */}
      <div className="mt-6 gm-card p-5">
        <h2 className="mb-3 font-semibold text-gm-900">Histórico de interações</h2>
        {interactions.length === 0 ? (
          <p className="text-sm text-gm-700/50">Nenhuma interação registrada ainda.</p>
        ) : (
          <ul className="space-y-3">
            {interactions.map((it: any, i: number) => (
              <li key={i} className="flex gap-3 border-b border-gm-50 pb-3 last:border-0">
                <span className="mt-0.5 rounded bg-gm-50 px-2 py-0.5 text-xs font-medium text-gm-500">
                  {it.interaction_type}
                </span>
                <div>
                  <p className="text-sm text-gm-900">{it.content || "—"}</p>
                  <p className="text-xs text-gm-700/40">{formatDateTime(it.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
