// components/pos-venda/KanbanBoard.tsx — quadro Kanban do pós-venda, agrupado
// por kanban_status (coluna operacional própria, independente da etapa linear
// — ver plano: dois processos podem estar na mesma etapa com status
// operacional diferente). v1 usa dropdown por card em vez de drag-and-drop
// (evita adicionar uma lib de DnD só para isso).
"use client";

import Link from "next/link";
import type { PostSale, PostSaleStage } from "@/lib/constants";
import { POST_SALE_STAGES, KANBAN_STATUSES } from "@/lib/constants";
import { setKanbanStatus } from "@/app/(dashboard)/pos-venda/actions";
import { formatDate } from "@/lib/format";

const STALL_DAYS = 5;

export function KanbanBoard({ items, stages = POST_SALE_STAGES }: { items: PostSale[]; stages?: readonly PostSaleStage[] }) {
  const byStatus = Object.fromEntries(KANBAN_STATUSES.map((k) => [k.key, [] as PostSale[]]));
  for (const item of items) {
    (byStatus[item.kanban_status] ?? byStatus.a_fazer).push(item);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_STATUSES.map((col) => (
        <div key={col.key} className="w-72 flex-none">
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-gm-900">{col.label}</h3>
            <span className="text-xs text-gm-700/50">{byStatus[col.key].length}</span>
          </div>
          <div className="space-y-3">
            {byStatus[col.key].map((ps) => {
              const stalled =
                Date.now() - new Date(ps.stage_updated_at).getTime() > STALL_DAYS * 86400000 &&
                ps.current_stage !== "pesquisa_satisfacao";
              const stageLabel = stages.find((s) => s.key === ps.current_stage)?.label;
              return (
                <div key={ps.id} className="gm-card p-4">
                  <Link href={`/pos-venda/${ps.id}`} className="block">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-gm-900">{ps.lead_name}</h4>
                      {stalled && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">⏳</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gm-700/60">{ps.property_address ?? "Imóvel não vinculado"}</p>
                    <p className="mt-2 text-xs text-gm-700/50">{stageLabel} · {formatDate(ps.stage_updated_at)}</p>
                  </Link>
                  <select
                    defaultValue={ps.kanban_status}
                    onChange={(e) => setKanbanStatus(ps.id, e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gm-200 px-2 py-1.5 text-xs"
                  >
                    {KANBAN_STATUSES.map((k) => (
                      <option key={k.key} value={k.key}>{k.label}</option>
                    ))}
                  </select>
                </div>
              );
            })}
            {byStatus[col.key].length === 0 && (
              <p className="rounded-lg border border-dashed border-gm-200 p-3 text-center text-xs text-gm-700/40">Vazio</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
