// app/(dashboard)/negociacoes/simulador/page.tsx — Simulador de Comissão
// Preditiva. Projeta a comissão do corretor ponderando cada negociação aberta
// pela probabilidade de fechamento, e compara com a meta de valor (VGV) ativa.
// Consulta feita aqui direto (coluna `probability` da migration 028 só é usada
// nesta tela). Alinhado ao módulo Metas: meta 'valor' mede a soma do
// value_cents das negociações FECHADAS no período (ver getGoals em lib/data).
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import { formatBRL } from "@/lib/format";
import { COMMISSION_RATE } from "@/lib/constants";
import { ProbabilityPicker } from "@/components/negociacoes/ProbabilityPicker";

export default async function SimuladorPage() {
  const user = await requireActiveAccount();

  const { rows: open } = await db.query<{
    id: string;
    lead_name: string;
    property_address: string | null;
    value_cents: string | null;
    probability: number;
  }>(
    `SELECT n.id, l.name AS lead_name, p.address AS property_address, n.value_cents, n.probability
     FROM negotiations n
     JOIN leads l ON l.id = n.lead_id
     LEFT JOIN properties p ON p.id = n.property_id
     WHERE n.user_id = $1 AND n.status = 'aberta'
     ORDER BY (COALESCE(n.value_cents, 0) * n.probability) DESC`,
    [user.id]
  );

  const { rows: goalRows } = await db.query<{ target_value: string; realizado: string }>(
    `SELECT g.target_value,
            COALESCE((
              SELECT SUM(n.value_cents) FROM negotiations n
              WHERE n.user_id = g.user_id AND n.status = 'fechada'
                AND n.closed_at::date BETWEEN g.period_start AND g.period_end
            ), 0) AS realizado
     FROM goals g
     WHERE g.user_id = $1 AND g.goal_type = 'valor'
       AND CURRENT_DATE BETWEEN g.period_start AND g.period_end
     ORDER BY g.period_end DESC
     LIMIT 1`,
    [user.id]
  );
  const goal = goalRows[0];

  let weightedValue = 0;
  for (const n of open) {
    weightedValue += (Number(n.value_cents) || 0) * (n.probability / 100);
  }
  const weightedCommission = Math.round(weightedValue * COMMISSION_RATE);

  const target = goal ? Number(goal.target_value) : null;
  const realizado = goal ? Number(goal.realizado) : 0;
  const projTotal = realizado + weightedValue;
  const gap = target != null ? target - projTotal : null;

  return (
    <div>
      <Link href="/negociacoes" className="text-sm text-gm-500 hover:underline">← Negociações</Link>
      <PageHeader
        title="Simulador de Comissão"
        subtitle="Ajuste a chance de cada negócio fechar e veja sua comissão projetada — pra saber onde focar."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="gm-card p-5">
          <div className="text-xs uppercase tracking-wide text-gm-700/50">Comissão projetada</div>
          <div className="mt-1 text-2xl font-bold text-gm-900">{formatBRL(weightedCommission)}</div>
          <div className="text-xs text-gm-700/50">ponderada pela chance de cada negócio ({Math.round(COMMISSION_RATE * 100)}% de comissão)</div>
        </div>
        <div className="gm-card p-5">
          <div className="text-xs uppercase tracking-wide text-gm-700/50">VGV ponderado (abertas)</div>
          <div className="mt-1 text-2xl font-bold text-gm-900">{formatBRL(Math.round(weightedValue))}</div>
          <div className="text-xs text-gm-700/50">soma dos valores × probabilidade</div>
        </div>
        <div className="gm-card p-5">
          <div className="text-xs uppercase tracking-wide text-gm-700/50">Negócios abertos</div>
          <div className="mt-1 text-2xl font-bold text-gm-900">{open.length}</div>
          <div className="text-xs text-gm-700/50">em negociação agora</div>
        </div>
      </div>

      {goal ? (
        <div className={`mb-6 rounded-xl border p-4 ${gap! > 0 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}>
          {gap! > 0 ? (
            <p className="text-sm text-amber-900">
              🎯 <b>Faltam {formatBRL(Math.round(gap!))}</b> pra bater a meta de {formatBRL(target!)}.
              Já realizado: <b>{formatBRL(realizado)}</b> · projeção com as abertas:{" "}
              <b>{formatBRL(Math.round(projTotal))}</b>. Foque nos negócios de maior valor × chance abaixo.
            </p>
          ) : (
            <p className="text-sm text-green-800">
              🎉 <b>Projeção já supera a meta!</b> Meta {formatBRL(target!)} · projeção total{" "}
              <b>{formatBRL(Math.round(projTotal))}</b> (realizado {formatBRL(realizado)} + abertas ponderadas).
            </p>
          )}
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-gm-100 bg-gm-50 px-4 py-3 text-sm text-gm-700/70">
          Defina uma <Link href="/metas" className="font-semibold text-gm-500 hover:underline">meta de valor</Link> pra ver o quanto falta pra batê-la com base nesta projeção.
        </div>
      )}

      {open.length === 0 ? (
        <EmptyState
          icon="📈"
          title="Nenhuma negociação aberta"
          desc="Crie negociações a partir dos seus leads. Aqui você ajusta a chance de cada uma fechar e vê a comissão projetada."
        />
      ) : (
        <div className="gm-card overflow-hidden">
          <div className="gm-scroll overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gm-50 text-left text-xs uppercase text-gm-700/60">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Imóvel</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Chance</th>
                  <th className="px-4 py-3">Comissão ponderada</th>
                </tr>
              </thead>
              <tbody>
                {open.map((n) => {
                  const value = Number(n.value_cents) || 0;
                  const wComm = Math.round(value * COMMISSION_RATE * (n.probability / 100));
                  return (
                    <tr key={n.id} className="border-t border-gm-50">
                      <td className="px-4 py-3 font-medium text-gm-900">{n.lead_name}</td>
                      <td className="px-4 py-3 text-gm-700/70">{n.property_address ?? "—"}</td>
                      <td className="px-4 py-3 text-gm-700/70">{formatBRL(value || null)}</td>
                      <td className="px-4 py-3">
                        <ProbabilityPicker negotiationId={n.id} value={n.probability} />
                      </td>
                      <td className="px-4 py-3 font-semibold text-gm-900">{formatBRL(wComm)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-gm-700/40">
        A projeção é uma estimativa baseada nas chances que você atribui — serve pra priorizar, não é garantia de fechamento.
      </p>
    </div>
  );
}
