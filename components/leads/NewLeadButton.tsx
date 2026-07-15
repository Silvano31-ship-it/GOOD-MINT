// components/leads/NewLeadButton.tsx — botão + modal de novo lead.
// Chama createLead diretamente (não via <form action>) pra poder mostrar o
// aviso de telefone duplicado sem sair da tela.
"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createLead } from "@/app/(dashboard)/actions";

export function NewLeadButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [duplicate, setDuplicate] = useState<{ id: string; name: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function submit(forceCreate: boolean) {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    startTransition(async () => {
      const res = await createLead(fd, { forceCreate });
      if (res.duplicate) {
        setDuplicate(res.duplicate);
        return;
      }
      setDuplicate(null);
      setOpen(false);
      formRef.current?.reset();
      router.refresh();
    });
  }

  function close() {
    setOpen(false);
    setDuplicate(null);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600"
      >
        + Novo lead
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gm-900">Novo lead</h2>
            <form
              ref={formRef}
              onSubmit={(e) => {
                e.preventDefault();
                submit(false);
              }}
              className="mt-4 space-y-3"
            >
              <input name="name" required placeholder="Nome *" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm outline-none focus:border-gm-500" />
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="phone"
                  placeholder="Telefone/WhatsApp"
                  onChange={() => setDuplicate(null)}
                  className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm outline-none focus:border-gm-500"
                />
                <input name="email" type="email" placeholder="E-mail" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm outline-none focus:border-gm-500" />
              </div>
              <input name="origin" placeholder="Origem (ex.: Instagram, Indicação)" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm outline-none focus:border-gm-500" />
              <input
                name="estimated_value"
                type="number"
                step="0.01"
                min="0"
                placeholder="Valor estimado (R$, opcional)"
                className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm outline-none focus:border-gm-500"
              />
              <textarea name="notes" placeholder="Observações" rows={3} className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm outline-none focus:border-gm-500" />

              {duplicate && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  Já existe um lead ativo com esse telefone: <b>{duplicate.name}</b>.{" "}
                  <Link href={`/leads/${duplicate.id}`} className="underline">Ver lead</Link>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => submit(true)}
                      disabled={pending}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                    >
                      Cadastrar mesmo assim
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={close} className="rounded-lg px-4 py-2 text-sm font-medium text-gm-700 hover:bg-gm-50">
                  Cancelar
                </button>
                <button type="submit" disabled={pending} className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600 disabled:opacity-60">
                  {pending ? "Adicionando..." : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
