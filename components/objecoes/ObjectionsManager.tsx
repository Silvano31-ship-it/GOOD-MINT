// components/objecoes/ObjectionsManager.tsx — Arquivo de Objeções: busca rápida
// ("cozinha pequena" → melhor resposta), cadastro de novas objeções e contador
// de "funcionou" pra ranquear as contra-objeções mais eficazes do corretor.
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createObjection, markObjectionWorked, deleteObjection } from "@/app/(dashboard)/objecoes/actions";

export interface Objection {
  id: string;
  objection: string;
  response: string;
  times_worked: number;
}

export function ObjectionsManager({ objections }: { objections: Objection[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return objections;
    return objections.filter(
      (o) => o.objection.toLowerCase().includes(q) || o.response.toLowerCase().includes(q)
    );
  }, [query, objections]);

  function worked(id: string) {
    startTransition(async () => {
      await markObjectionWorked(id);
      router.refresh();
    });
  }
  function remove(id: string) {
    startTransition(async () => {
      await deleteObjection(id);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar objeção... (ex: cozinha pequena, tá caro)"
          className="min-w-0 flex-1 rounded-lg border border-gm-200 px-3 py-2 text-sm"
        />
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600"
        >
          {showForm ? "Fechar" : "+ Nova objeção"}
        </button>
      </div>

      {showForm && (
        <form
          action={async (fd) => {
            await createObjection(fd);
            setShowForm(false);
            router.refresh();
          }}
          className="gm-card mb-4 space-y-3 p-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gm-900">Objeção do cliente</label>
            <input
              name="objection"
              required
              placeholder="Ex: A cozinha é pequena"
              className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gm-900">Sua melhor resposta</label>
            <textarea
              name="response"
              required
              rows={3}
              placeholder="Ex: Verdade, a cozinha é compacta — e é exatamente isso que deixa a sala tão ampla. Dá pra integrar com um balcão e ganhar..."
              className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
            />
          </div>
          <button className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">
            Salvar objeção
          </button>
        </form>
      )}

      {objections.length === 0 ? (
        <div className="gm-card p-6 text-center text-sm text-gm-700/60">
          Sua biblioteca está vazia. Cadastre as objeções que mais ouve e a melhor resposta pra cada uma —
          na próxima visita, é só buscar aqui.
        </div>
      ) : filtered.length === 0 ? (
        <div className="gm-card p-6 text-center text-sm text-gm-700/60">
          Nenhuma objeção encontrada pra “{query}”. Que tal cadastrar essa e a resposta que funcionou?
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <div key={o.id} className="gm-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold text-gm-900">🗣️ {o.objection}</div>
                {o.times_worked > 0 && (
                  <span className="flex-none rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                    funcionou {o.times_worked}×
                  </span>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gm-700">{o.response}</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => worked(o.id)}
                  disabled={pending}
                  className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50"
                >
                  👍 Funcionou
                </button>
                <button
                  onClick={() => remove(o.id)}
                  disabled={pending}
                  className="rounded-lg border border-gm-200 px-3 py-1.5 text-xs font-semibold text-gm-700/60 hover:bg-gm-50 disabled:opacity-50"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
