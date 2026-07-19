// components/configuracoes/SubscribeForm.tsx
// Formulário de assinatura do Plano Único (cartão), usado em Configurações →
// Plano por quem ainda não assinou. Plano e ciclo são fixos (Plano Único,
// mensal) — o produto tem um plano só; a escolha antiga Start/Pro saiu.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/AuthShell";
import type { BillingCycle } from "@/lib/constants";

const BENEFITS = [
  "Leads e imóveis ilimitados",
  "IA, Automações e Agenda ilimitadas",
  "Pós-Venda completo + Portal do Cliente",
  "Disparo WhatsApp, Metas e Financeiro",
];

// Props legadas mantidas como opcionais pra compatibilidade com quem ainda
// renderiza <SubscribeForm currentPlanCode=... /> — são ignoradas.
export function SubscribeForm(_props: {
  currentPlanCode?: string;
  currentBillingCycle?: BillingCycle;
} = {}) {
  const router = useRouter();
  const [form, setForm] = useState({
    holderName: "",
    number: "",
    expiryMonth: "",
    expiryYear: "",
    ccv: "",
    cpfCnpj: "",
    postalCode: "",
    addressNumber: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, planCode: "mint_pro", billingCycle: "monthly" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível registrar o cartão.");
        return;
      }
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-xl border-2 border-gm-500 bg-gm-50 p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gm-900">👑 Plano Único</span>
          <span className="text-xl font-bold text-gm-900">
            R$ 49,90<span className="text-xs font-normal text-gm-700/60">/mês</span>
          </span>
        </div>
        <ul className="mt-2 space-y-1 text-xs text-gm-700/80">
          {BENEFITS.map((b) => (
            <li key={b}>✅ {b}</li>
          ))}
        </ul>
      </div>

      <Field label="Nome no cartão" required value={form.holderName} onChange={(e) => set("holderName", e.target.value)} />
      <Field label="Número do cartão" inputMode="numeric" placeholder="0000 0000 0000 0000" required value={form.number} onChange={(e) => set("number", e.target.value)} />
      <div className="grid grid-cols-3 gap-3">
        <Field label="Mês" placeholder="MM" required value={form.expiryMonth} onChange={(e) => set("expiryMonth", e.target.value)} />
        <Field label="Ano" placeholder="AAAA" required value={form.expiryYear} onChange={(e) => set("expiryYear", e.target.value)} />
        <Field label="CVV" placeholder="123" required value={form.ccv} onChange={(e) => set("ccv", e.target.value)} />
      </div>
      <Field label="CPF/CNPJ do titular" required value={form.cpfCnpj} onChange={(e) => set("cpfCnpj", e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="CEP" required value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
        <Field label="Número" required value={form.addressNumber} onChange={(e) => set("addressNumber", e.target.value)} />
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
        🛡️ <b>Garantia de reembolso de 7 dias:</b> se você assinar e não gostar, devolvemos 100% do
        valor em até 7 dias após a compra. <b>Após 7 dias, não há reembolso</b> — o cancelamento
        continua livre, valendo até o fim do período já pago.
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gm-500 py-2.5 font-semibold text-white transition hover:bg-gm-600 disabled:opacity-60"
      >
        {loading ? "Registrando..." : "Assinar o Plano Único — R$ 49,90/mês"}
      </button>
      <p className="text-center text-xs text-gm-700/50">
        🔒 Seus dados de cartão são tokenizados pelo Asaas. Nunca armazenamos o número do cartão.
      </p>
    </form>
  );
}

  
