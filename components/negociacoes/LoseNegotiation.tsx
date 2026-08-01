// components/negociacoes/LoseNegotiation.tsx — marca uma negociação como
// perdida e faz a "autópsia rápida" (3 perguntas) que alimenta a Retrospectiva
// de Perdas. Mesmo estilo de modal do CloseNegotiation.
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loseNegotiation } from "@/app/(dashboard)/negociacoes/retrospectiva/actions";

const REASONS = [
  { value: "preco", label: "Preço / achou caro" },
  { value: "outro_corretor", label: "Comprou com outro corretor" },
  { value: "sumiu", label: "Sumiu / parou de responder" },
  { value: "desistiu", label: "Desistiu da compra" },
  { value: "outro", label: "Outro motivo" },
];

const STAGES = [
  { value: "primeiro_contato", label: "Primeiro contato" },
  { value: "visita", label: "Visita" },
  { value: "proposta", label: "Proposta" },
  { value: "contraproposta", label: "Contraproposta" },
  { value: "documentacao", label: "Documentação" },
  { value: "outro", label: "Outro / não sei" },
];

export function LoseNegotiation({ negotiationId }: { negotiationId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("preco");
  const [stageLost, setStageLost] = useState("proposta");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirm() {
    startTransition(async () => {
      await loseNegotiation(negotiationId, { reason, stageLost, note });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
      >
        Perdi
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gm-900">Negócio perdido 📉</h2>
            <p className="mt-1 text-sm text-gm-700/60">
              Responda rapidinho — isso vira aprendizado na sua Retrospectiva de Perdas.
            </p>

            <label className="mt-4 block text-sm font-medium text-gm-900">Qual foi o motivo?</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            <label className="mt-3 block text-sm font-medium text-gm-900">Em que etapa você perdeu o controle?</label>
            <select
              value={stageLost}
              onChange={(e) => setStageLost(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
            >
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <label className="mt-3 block text-sm font-medium text-gm-900">Observação (opcional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Ex: cliente achou a parcela alta depois da simulação."
              className="mt-1 w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gm-700 hover:bg-gm-50">
                Cancelar
              </button>
              <button
                onClick={confirm}
                disabled={pending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {pending ? "Salvando..." : "Marcar como perdido"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
