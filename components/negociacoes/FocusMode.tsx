// components/negociacoes/FocusMode.tsx — Modo Foco: sessão de 25 min de
// imersão em um único negócio. Timer + checklist de ações; ao final, o
// corretor atualiza a probabilidade de fechamento (alimenta o Simulador de
// Comissão). Tudo client-side (a sessão vive no estado do componente) — a
// única persistência é a probabilidade, via a action já existente do #2.
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/format";
import { setNegotiationProbability } from "@/app/(dashboard)/negociacoes/simulador/actions";

interface OpenNeg {
  id: string;
  lead_name: string;
  property_address: string | null;
  value_cents: string | null;
  probability: number;
}

const FOCUS_SECONDS = 25 * 60;
const CHECKLIST = [
  "Revisar o histórico de conversas e visitas desse cliente",
  "Conferir os imóveis concorrentes (preço e diferenciais)",
  "Escrever 3 argumentos de venda novos pra esse negócio",
  "Enviar uma mensagem de valor pro cliente",
];
const PROB_OPTIONS = [10, 25, 50, 75, 90];

export function FocusMode({ negotiations }: { negotiations: OpenNeg[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<OpenNeg | null>(null);
  const [seconds, setSeconds] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(CHECKLIST.map(() => false));
  const [finished, setFinished] = useState(false);
  const [savedProb, setSavedProb] = useState<number | null>(null);

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      setFinished(true);
      return;
    }
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [running, seconds]);

  const mmss = useMemo(() => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [seconds]);

  function start(neg: OpenNeg) {
    setSelected(neg);
    setSeconds(FOCUS_SECONDS);
    setChecked(CHECKLIST.map(() => false));
    setFinished(false);
    setSavedProb(null);
    setRunning(true);
  }

  function reset() {
    setSelected(null);
    setRunning(false);
    setFinished(false);
    setSavedProb(null);
  }

  async function saveProbability(p: number) {
    if (!selected) return;
    await setNegotiationProbability(selected.id, p);
    setSavedProb(p);
    router.refresh();
  }

  if (!selected) {
    if (negotiations.length === 0) {
      return (
        <div className="gm-card p-6 text-center text-sm text-gm-700/60">
          Você não tem negociações abertas pra focar agora. Crie uma negociação primeiro.
        </div>
      );
    }
    return (
      <div>
        <p className="mb-3 text-sm text-gm-700/70">Escolha o negócio pra focar nos próximos 25 minutos:</p>
        <div className="space-y-2">
          {negotiations.map((n) => (
            <button
              key={n.id}
              onClick={() => start(n)}
              className="flex w-full items-center justify-between rounded-xl border border-gm-200 bg-white p-4 text-left hover:border-gm-500 hover:bg-gm-50"
            >
              <div>
                <div className="font-semibold text-gm-900">{n.lead_name}</div>
                <div className="text-xs text-gm-700/60">{n.property_address ?? "—"}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gm-900">{formatBRL(n.value_cents ? Number(n.value_cents) : null)}</div>
                <div className="text-xs text-gm-700/50">chance atual: {n.probability}%</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="gm-card p-6 text-center">
        <div className="text-xs uppercase tracking-wide text-gm-700/50">Foco em</div>
        <div className="text-lg font-bold text-gm-900">{selected.lead_name}</div>
        {selected.property_address && <div className="text-sm text-gm-700/60">{selected.property_address}</div>}

        <div className="my-6 text-6xl font-bold tabular-nums text-gm-900">{mmss}</div>

        {!finished ? (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setRunning((r) => !r)}
              className="rounded-lg bg-gm-500 px-5 py-2 text-sm font-semibold text-white hover:bg-gm-600"
            >
              {running ? "Pausar" : "Retomar"}
            </button>
            <button
              onClick={() => { setRunning(false); setFinished(true); }}
              className="rounded-lg border border-gm-200 px-5 py-2 text-sm font-semibold text-gm-700 hover:bg-gm-50"
            >
              Encerrar
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-gm-50 p-4">
            <p className="text-sm font-semibold text-gm-900">Sessão encerrada! 🎯</p>
            <p className="mt-1 text-sm text-gm-700/70">Depois desse foco, qual a chance real desse negócio fechar?</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {PROB_OPTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => saveProbability(p)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                    savedProb === p
                      ? "border-gm-500 bg-gm-500 text-white"
                      : "border-gm-200 text-gm-700 hover:bg-white"
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
            {savedProb !== null && (
              <p className="mt-3 text-sm text-green-700">✓ Chance atualizada pra {savedProb}% — já reflete no Simulador.</p>
            )}
            <button onClick={reset} className="mt-4 text-sm text-gm-500 hover:underline">
              Focar em outro negócio
            </button>
          </div>
        )}
      </div>

      <div className="gm-card mt-4 p-5">
        <h2 className="mb-3 text-sm font-semibold text-gm-900">Passo a passo do foco</h2>
        <div className="space-y-2">
          {CHECKLIST.map((label, i) => (
            <label key={i} className="flex items-start gap-2 text-sm text-gm-700">
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() =>
                  setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
                }
                className="mt-0.5 accent-gm-500"
              />
              <span className={checked[i] ? "text-gm-700/40 line-through" : ""}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-gm-700/40">
        Dica: silencie o celular por esses 25 minutos pra aproveitar o foco de verdade.
      </p>
    </div>
  );
}
