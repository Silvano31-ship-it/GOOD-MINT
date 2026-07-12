// components/negociacoes/CloseNegotiation.tsx — fecha negociação e (opcional)
// inicia o acompanhamento de pós-venda (regra da seção 3 da spec).
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { closeNegotiation } from "@/app/(dashboard)/actions";

export function CloseNegotiation({ negotiationId }: { negotiationId: string }) {
  const [open, setOpen] = useState(false);
  const [startPostSale, setStartPostSale] = useState(true);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirm() {
    startTransition(async () => {
      await closeNegotiation(negotiationId, startPostSale);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-lg border border-gm-200 px-3 py-1.5 text-xs font-semibold text-gm-700 hover:bg-gm-50">
        Fechar negócio
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gm-900">Fechar negociação 🎉</h2>
            <p className="mt-1 text-sm text-gm-700/60">O lead será marcado como “Fechado”.</p>
            <label className="mt-4 flex items-start gap-2 rounded-lg bg-gm-50 p-3 text-sm text-gm-700">
              <input type="checkbox" checked={startPostSale} onChange={(e) => setStartPostSale(e.target.checked)} className="mt-0.5" />
              <span>Iniciar acompanhamento de <b>Pós-Venda</b> (recomendado — mantém o cliente informado até a entrega das chaves).</span>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gm-700 hover:bg-gm-50">Cancelar</button>
              <button onClick={confirm} disabled={pending} className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600 disabled:opacity-60">
                {pending ? "Fechando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
