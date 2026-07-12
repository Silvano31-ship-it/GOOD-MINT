// components/negociacoes/NewNegotiationButton.tsx — modal de nova negociação.
"use client";

import { useState } from "react";
import { createNegotiation } from "@/app/(dashboard)/actions";

export function NewNegotiationButton({
  leads,
  properties,
}: {
  leads: { id: string; name: string }[];
  properties: { id: string; address: string }[];
}) {
  const [open, setOpen] = useState(false);

  if (leads.length === 0) {
    return (
      <span className="text-sm text-gm-700/50">Cadastre um lead antes de criar negociações.</span>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">
        + Nova negociação
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gm-900">Nova negociação</h2>
            <form action={createNegotiation} onSubmit={() => setTimeout(() => setOpen(false), 50)} className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gm-900">Lead *</span>
                <select name="lead_id" required className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm">
                  {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gm-900">Imóvel (opcional)</span>
                <select name="property_id" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm">
                  <option value="">—</option>
                  {properties.map((p) => <option key={p.id} value={p.id}>{p.address}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gm-900">Tipo</span>
                  <select name="negotiation_type" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm">
                    <option value="venda">Venda</option>
                    <option value="aluguel">Aluguel</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gm-900">Valor (R$)</span>
                  <input name="value" inputMode="decimal" placeholder="350000" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gm-700 hover:bg-gm-50">Cancelar</button>
                <button type="submit" className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
