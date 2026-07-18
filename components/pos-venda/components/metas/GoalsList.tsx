// components/metas/GoalsList.tsx — metas ativas (barra de progresso + badge)
// e histórico de metas encerradas. Progresso vem pronto de getGoals (lib/data.ts),
// calculado ao vivo contra negotiations fechadas no período.
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Goal } from "@/lib/constants";
import { formatBRL, formatDate } from "@/lib/format";
import { deleteGoal } from "@/app/(dashboard)/actions";
import { EmptyState } from "@/components/ui";

function badgeFor(percent: number): { label: string; className: string } | null {
  if (percent >= 100) return { label: "🏆 Meta batida", className: "bg-[#F5C94A]/20 text-[#8A6A00] border-[#F5C94A]/50" };
  if (percent >= 75) return { label: "🥈 Quase lá", className: "bg-gm-100 text-gm-700 border-gm-200" };
  if (percent >= 50) return { label: "🥉 Na metade", className: "bg-gm-50 text-gm-700/70 border-gm-200" };
  return null;
}

function GoalCard({ goal, onDelete, pending }: { goal: Goal; onDelete: (id: string) => void; pending: boolean }) {
  const target = Number(goal.target_value);
  const achieved = Number(goal.achieved_value);
  const percent = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
  const badge = badgeFor(percent);
  const isValor = goal.goal_type === "valor";

  return (
    <div className="gm-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-gm-700/60">
            {formatDate(goal.period_start)} – {formatDate(goal.period_end)}
          </p>
          <p className="font-semibold text-gm-900">
            {isValor ? formatBRL(achieved) : achieved} de {isValor ? formatBRL(target) : target}
            {isValor ? "" : " vendas"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
              {badge.label}
            </span>
          )}
          <button
            onClick={() => onDelete(goal.id)}
            disabled={pending}
            className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Remover
          </button>
        </div>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gm-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#F5C94A] to-gm-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-right text-xs font-medium text-gm-700/60">{percent}%</p>
    </div>
  );
}

export function GoalsList({ goals }: { goals: Goal[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const current = goals.filter((g) => g.period_end >= today);
  const past = goals.filter((g) => g.period_end < today);

  function remove(id: string) {
    if (!confirm("Remover esta meta?")) return;
    startTransition(async () => {
      await deleteGoal(id);
      router.refresh();
    });
  }

  if (goals.length === 0) {
    return <EmptyState icon="🏆" title="Nenhuma meta criada" desc="Crie uma meta acima: de valor em vendas ou número de vendas, para um período." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gm-700/50">Em andamento</h3>
        {current.length === 0 ? (
          <p className="gm-card p-4 text-sm text-gm-700/50">Nenhuma meta ativa no momento.</p>
        ) : (
          <div className="space-y-3">
            {current.map((g) => (
              <GoalCard key={g.id} goal={g} onDelete={remove} pending={pending} />
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gm-700/50">Histórico</h3>
          <div className="space-y-3">
            {past.map((g) => (
              <GoalCard key={g.id} goal={g} onDelete={remove} pending={pending} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
