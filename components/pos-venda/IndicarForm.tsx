// components/pos-venda/IndicarForm.tsx — formulário público de indicação.
"use client";

import { useState } from "react";
import { submitPublicReferral } from "@/app/(dashboard)/pos-venda/actions";

export function IndicarForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const fd = new FormData(e.currentTarget);
      const result = await submitPublicReferral(token, fd);
      if (result.ok) setDone(true);
      else setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
        Obrigado! Recebemos a indicação e seu corretor entrará em contato em breve.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gm-900">Nome da pessoa indicada</span>
        <input name="name" required className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gm-900">Telefone (opcional)</span>
        <input name="phone" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
      </label>
      {error && <p className="text-sm text-red-600">Não foi possível enviar. Verifique o link e tente novamente.</p>}
      <button disabled={loading} className="min-h-11 w-full rounded-lg bg-gm-500 py-2.5 text-sm font-semibold text-white hover:bg-gm-600 disabled:opacity-60">
        {loading ? "Enviando..." : "Enviar indicação"}
      </button>
    </form>
  );
}
