// components/leads/KanbanBoard.tsx — Funil Kanban com drag-and-drop (tela 8).
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateLeadStage } from "@/app/(dashboard)/actions";
import { LEAD_STAGES, type Lead } from "@/lib/constants";

export function KanbanBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function moveLead(id: string, stage: string) {
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.funnel_stage === stage) return;
    // otimista
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, funnel_stage: stage } : l))
    );
    startTransition(async () => {
      await updateLeadStage(id, stage);
      router.refresh();
    });
  }

  function onDrop(stage: string) {
    setOverCol(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    moveLead(id, stage);
  }

  return (
    <div className="gm-scroll flex gap-4 overflow-x-auto pb-4">
      {LEAD_STAGES.map((stage) => {
        const items = leads.filter((l) => l.funnel_stage === stage.key);
        return (
          <div
            key={stage.key}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(stage.key);
            }}
            onDragLeave={() => setOverCol((c) => (c === stage.key ? null : c))}
            onDrop={() => onDrop(stage.key)}
            className={`flex w-72 flex-none flex-col rounded-xl border p-3 transition ${
              overCol === stage.key
                ? "border-gm-400 bg-gm-50"
                : "border-gm-100 bg-white"
            }`}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-gm-900">{stage.label}</span>
              <span className="rounded-full bg-gm-100 px-2 text-xs font-medium text-gm-700">
                {items.length}
              </span>
            </div>
            <div className="flex-1 space-y-2">
              {items.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => setDragId(lead.id)}
                  onDragEnd={() => setDragId(null)}
                  className={`cursor-grab rounded-lg border border-gm-100 bg-white p-3 shadow-sm transition active:cursor-grabbing ${
                    dragId === lead.id ? "opacity-50" : ""
                  }`}
                >
                  <Link href={`/leads/${lead.id}`} className="block">
                    <div className="font-medium text-gm-900">{lead.name}</div>
                    {lead.phone && (
                      <div className="mt-0.5 text-xs text-gm-700/60">{lead.phone}</div>
                    )}
                    {lead.origin && (
                      <span className="mt-2 inline-block rounded bg-gm-50 px-1.5 py-0.5 text-[11px] text-gm-500">
                        {lead.origin}
                      </span>
                    )}
                  </Link>
                  {/* Fallback pra telas pequenas, onde arrastar é ruim de usar. */}
                  <select
                    aria-label="Mover para..."
                    value=""
                    onChange={(e) => {
                      if (e.target.value) moveLead(lead.id, e.target.value);
                    }}
                    className="mt-2 min-h-9 w-full rounded-lg border border-gm-200 bg-white px-2 py-1 text-xs sm:hidden"
                  >
                    <option value="">Mover para...</option>
                    {LEAD_STAGES.filter((s) => s.key !== lead.funnel_stage).map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
              ))}
              {items.length === 0 && (
                <div className="rounded-lg border border-dashed border-gm-100 py-6 text-center text-xs text-gm-700/40">
                  Arraste leads para cá
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
