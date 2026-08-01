// components/negociacoes/ProbabilityPicker.tsx — seletor de probabilidade de
// fechamento de uma negociação (usado no Simulador de Comissão Preditiva).
// Ao mudar, salva via server action e atualiza a página (recalcula as projeções).
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setNegotiationProbability } from "@/app/(dashboard)/negociacoes/simulador/actions";

const OPTIONS = [10, 25, 50, 75, 90];

export function ProbabilityPicker({
  negotiationId,
  value,
}: {
  negotiationId: string;
  value: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => {
        const p = Number(e.target.value);
        startTransition(async () => {
          await setNegotiationProbability(negotiationId, p);
          router.refresh();
        });
      }}
      className="rounded-lg border border-gm-200 bg-white px-2 py-1 text-sm text-gm-900 disabled:opacity-50"
    >
      {OPTIONS.map((o) => (
        <option key={o} value={o}>
          {o}%
        </option>
      ))}
    </select>
  );
}
