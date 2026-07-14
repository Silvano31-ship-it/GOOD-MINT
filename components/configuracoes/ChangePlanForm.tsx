// components/configuracoes/ChangePlanForm.tsx — troca de plano/ciclo pra quem já
// tem cartão ativo (diferente do SubscribeForm, que é pra quem ainda não assinou).
"use client";

import { useState, useTransition } from "react";
import { PLAN_PRICING, type BillingCycle } from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import { changePlanAndCycle } from "@/app/(dashboard)/actions";

const PLAN_OPTIONS = [
  { code: "mint_start", name: "MINT Start" },
  { code: "mint_pro", name: "MINT Pro" },
  { code: "mint_business", name: "MINT Business" },
];

export function ChangePlanForm({
  currentPlanCode,
  currentBillingCycle,
}: {
  currentPlanCode: string;
  currentBillingCycle: BillingCycle;
}) {
  const [planCode, setPlanCode] = useState(currentPlanCode);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(currentBillingCycle);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const isUnchanged = planCode === currentPlanCode && billingCycle === currentBillingCycle;

  function save() {
    startTransition(async () => {
      await changePlanAndCycle(planCode, billingCycle);
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-4 text-sm font-medium text-gm-500 hover:underline">
        Trocar de plano ou ciclo de cobrança
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-3 border-t border-gm-100 pt-4">
      <div className="flex items-center gap-1.5 rounded-full bg-gm-50 p-0.5 text-xs font-medium w-fit">
        <button
          type="button"
          onClick={() => setBillingCycle("monthly")}
          className={`rounded-full px-2.5 py-1 transition ${billingCycle === "monthly" ? "bg-white text-gm-900 shadow-sm" : "text-gm-700/60"}`}
        >
          Mensal
        </button>
        <button
          type="button"
          onClick={() => setBillingCycle("yearly")}
          className={`rounded-full px-2.5 py-1 transition ${billingCycle === "yearly" ? "bg-white text-gm-900 shadow-sm" : "text-gm-700/60"}`}
        >
          Anual (-20%)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {PLAN_OPTIONS.map((p) => {
          const cents = billingCycle === "yearly" ? PLAN_PRICING[p.code].yearlyCents : PLAN_PRICING[p.code].monthlyCents;
          return (
            <label
              key={p.code}
              className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                planCode === p.code ? "border-gm-500 bg-gm-50 ring-1 ring-gm-500" : "border-gm-200 hover:border-gm-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="changePlanCode"
                  checked={planCode === p.code}
                  onChange={() => setPlanCode(p.code)}
                  className="accent-gm-500"
                />
                {p.name}
              </span>
              <span className="font-semibold text-gm-700">
                {formatBRL(cents)}/{billingCycle === "yearly" ? "ano" : "mês"}
              </span>
            </label>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={pending || isUnchanged}
          className="min-h-9 rounded-lg bg-gm-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gm-600 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Confirmar troca"}
        </button>
        <button onClick={() => setOpen(false)} className="min-h-9 rounded-lg px-4 py-1.5 text-sm font-medium text-gm-700 hover:bg-gm-50">
          Cancelar
        </button>
      </div>
      <p className="text-xs text-gm-700/50">
        A troca vale a partir da próxima cobrança. Nada é cobrado agora.
      </p>
    </div>
  );
}
