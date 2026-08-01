// app/(dashboard)/negociacoes/retrospectiva/page.tsx — Retrospectiva de Perdas.
// Mostra os padrões dos negócios perdidos (motivo mais comum, etapa que mais
// perde) e a lista com a autópsia de cada um. Consulta feita aqui direto
// (tabela negotiation_losses da migration 029 só é usada nesta tela).
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import { formatBRL, formatDate } from "@/lib/format";

const REASON_LABEL: Record<string, string> = {
  preco: "Preço / achou caro",
  outro_corretor: "Comprou com outro corretor",
  sumiu: "Sumiu / parou de responder",
  desistiu: "Desistiu da compra",
  outro: "Outro motivo",
};
const STAGE_LABEL: Record<string, string> = {
  primeiro_contato: "Primeiro contato",
  visita: "Visita",
  proposta: "Proposta",
  contraproposta: "Contraproposta",
  documentacao: "Documentação",
  outro: "Outro / não sei",
};

export default async function RetrospectivaPage() {
  const user = await requireActiveAccount();

  const [{ rows: losses }, { rows: byReason }, { rows: byStage }] = await Promise.all([
    db.query<{
      id: string;
      reason: string;
      stage_lost: string | null;
      note: string | null;
      created_at: string;
      lead_name: string;
      value_cents: string | null;
    }>(
      `SELECT nl.id, nl.reason, nl.stage_lost, nl.note, nl.created_at,
              l.name AS lead_name, n.value_cents
       FROM negotiation_losses nl
       JOIN negotiations n ON n.id = nl.negotiation_id
       JOIN leads l ON l.id = n.lead_id
       WHERE nl.user_id = $1
       ORDER BY nl.created_at DESC
       LIMIT 100`,
      [user.id]
    ),
    db.query<{ reason: string; c: number }>(
      `SELECT reason, COUNT(*)::int AS c FROM negotiation_losses WHERE user_id=$1 GROUP BY reason ORDER BY c DESC`,
      [user.id]
    ),
    db.query<{ stage_lost: string | null; c: number }>(
      `SELECT stage_lost, COUNT(*)::int AS c FROM negotiation_losses WHERE user_id=$1 AND stage_lost IS NOT NULL GROUP BY stage_lost ORDER BY c DESC`,
      [user.id]
    ),
  ]);

  const total = byReason.reduce((s, r) => s + r.c, 0);
  const topReason = byReason[0];
  const topStage = byStage[0];
  const pct = (c: number) => (total ? Math.round((c / total) * 100) : 0);

  return (
    <div>
      <Link href="/negociacoes" className="text-sm text-gm-500 hover:underline">← Negociações</Link>
      <PageHeader
        title="Retrospectiva de Perdas"
        subtitle="Perder faz parte — não aprender com a perda que é o problema. Veja seus padrões e ataque o ponto fraco."
      />

      {total === 0 ? (
        <EmptyState
          icon="📉"
          title="Nenhum negócio perdido registrado"
          desc="Quando marcar um negócio como perdido (botão 'Perdi' nas Negociações), a autópsia aparece aqui e vira aprendizado."
        />
      ) : (
        <>
          {topReason && (
            <div className="mb-6 rounded-xl border border-gm-100 bg-gm-50 p-4 text-sm text-gm-800">
              🔎 <b>Seu padrão:</b> em <b>{pct(topReason.c)}%</b> dos {total}{" "}
              {total === 1 ? "negócio perdido" : "negócios perdidos"}, o motivo foi{" "}
              <b>{REASON_LABEL[topReason.reason] ?? topReason.reason}</b>
              {topStage && (
                <> — e a etapa que mais perde é <b>{STAGE_LABEL[topStage.stage_lost!] ?? topStage.stage_lost}</b>.</>
              )}
            </div>
          )}

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="gm-card p-5">
              <h2 className="mb-3 text-sm font-semibold text-gm-900">Por motivo</h2>
              <div className="space-y-2">
                {byReason.map((r) => (
                  <Bar key={r.reason} label={REASON_LABEL[r.reason] ?? r.reason} count={r.c} pct={pct(r.c)} />
                ))}
              </div>
            </div>
            <div className="gm-card p-5">
              <h2 className="mb-3 text-sm font-semibold text-gm-900">Por etapa</h2>
              {byStage.length === 0 ? (
                <p className="text-sm text-gm-700/50">Sem etapa registrada ainda.</p>
              ) : (
                <div className="space-y-2">
                  {byStage.map((s) => (
                    <Bar key={s.stage_lost!} label={STAGE_LABEL[s.stage_lost!] ?? s.stage_lost!} count={s.c} pct={pct(s.c)} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="gm-card overflow-hidden">
            <div className="gm-scroll overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gm-50 text-left text-xs uppercase text-gm-700/60">
                  <tr>
                    <th className="px-4 py-3">Lead</th>
                    <th className="px-4 py-3">Valor</th>
                    <th className="px-4 py-3">Motivo</th>
                    <th className="px-4 py-3">Etapa</th>
                    <th className="px-4 py-3">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {losses.map((l) => (
                    <tr key={l.id} className="border-t border-gm-50 align-top">
                      <td className="px-4 py-3 font-medium text-gm-900">
                        {l.lead_name}
                        {l.note && <div className="text-xs font-normal text-gm-700/50">“{l.note}”</div>}
                      </td>
                      <td className="px-4 py-3 text-gm-700/70">{formatBRL(l.value_cents ? Number(l.value_cents) : null)}</td>
                      <td className="px-4 py-3 text-gm-700/70">{REASON_LABEL[l.reason] ?? l.reason}</td>
                      <td className="px-4 py-3 text-gm-700/70">{l.stage_lost ? STAGE_LABEL[l.stage_lost] ?? l.stage_lost : "—"}</td>
                      <td className="px-4 py-3 text-gm-700/40">{formatDate(l.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Bar({ label, count, pct }: { label: string; count: number; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gm-700/80">{label}</span>
        <span className="font-medium text-gm-900">{count} ({pct}%)</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gm-100">
        <div className="h-full rounded-full bg-gm-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
