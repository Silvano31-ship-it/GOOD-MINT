// components/configuracoes/SubscribeForm.tsx
// Formulário de assinatura (escolha de plano + cartão), usado em
// Configurações → Plano por quem ainda não assinou (fluxo sem cartão
// obrigatório no cadastro — o cliente decide depois de já estar no painel).
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/AuthShell";

const PLAN_OPTIONS = [
  { code: "mint_start", name: "MINT Start", price: "R$ 19,90/mês", desc: "30 leads · 15 imóveis" },
  { code: "mint_pro", name: "MINT Pro", price: "R$ 49,90/mês", desc: "Leads e imóveis ilimitados" },
  { code: "mint_business", name: "MINT Business", price: "R$ 80,00/mês", desc: "Tudo ilimitado" },
];

export function SubscribeForm({ currentPlanCode }: { currentPlanCode: string }) {
  const router = useRouter();
  const [planCode, setPlanCode] = useState(currentPlanCode);
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
        body: JSON.stringify({ ...form, planCode }),
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
      <div>
        <span className="mb-2 block text-sm font-medium text-gm-900">Escolha seu plano</span>
        <div className="grid grid-cols-1 gap-2">
          {PLAN_OPTIONS.map((p) => (
            <label
              key={p.code}
              className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition ${
                planCode === p.code
                  ? "border-gm-500 bg-gm-50 ring-1 ring-gm-500"
                  : "border-gm-200 hover:border-gm-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="subscribePlanCode"
                  value={p.code}
                  checked={planCode === p.code}
                  onChange={() => setPlanCode(p.code)}
                  className="accent-gm-500"
                />
                <span>
                  <span className="block font-medium text-gm-900">{p.name}</span>
                  <span className="block text-xs text-gm-700/60">{p.desc}</span>
                </span>
              </span>
              <span className="font-semibold text-gm-700">{p.price}</span>
            </label>
          ))}
        </div>
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

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gm-500 py-2.5 font-semibold text-white transition hover:bg-gm-600 disabled:opacity-60"
      >
        {loading ? "Registrando..." : "Assinar agora"}
      </button>
      <p className="text-center text-xs text-gm-700/50">
        🔒 Seus dados de cartão são tokenizados pelo Asaas. Nunca armazenamos o número do cartão.
      </p>
    </form>
  );
}
