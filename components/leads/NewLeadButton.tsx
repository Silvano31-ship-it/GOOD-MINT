// components/leads/NewLeadButton.tsx — botão + modal de novo lead.
"use client";

import { useState } from "react";
import { createLead } from "@/app/(dashboard)/actions";

export function NewLeadButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600"
      >
        + Novo lead
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gm-900">Novo lead</h2>
            <form action={createLead} onSubmit={() => setTimeout(() => setOpen(false), 50)} className="mt-4 space-y-3">
              <input name="name" required placeholder="Nome *" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm outline-none focus:border-gm-500" />
              <div className="grid grid-cols-2 gap-3">
                <input name="phone" placeholder="Telefone/WhatsApp" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm outline-none focus:border-gm-500" />
                <input name="email" type="email" placeholder="E-mail" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm outline-none focus:border-gm-500" />
              </div>
              <input name="origin" placeholder="Origem (ex.: Instagram, Indicação)" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm outline-none focus:border-gm-500" />
              <textarea name="notes" placeholder="Observações" rows={3} className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm outline-none focus:border-gm-500" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gm-700 hover:bg-gm-50">
                  Cancelar
                </button>
                <button type="submit" className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
