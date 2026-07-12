// app/cadastro/pagamento/page.tsx — Tela 5. Pagamento (cadastro de cartão).
// O cartão é tokenizado no Asaas; só cobramos ao final dos 3 dias de trial.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell, Field } from "@/components/AuthShell";

export default function PagamentoPage() {
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
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível registrar o cartão.");
        return;
      }
      router.push("/dashboard?bemvindo=1");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Cadastre seu cartão"
      subtitle="Sem cobrança agora. Você só será cobrado (R$ 19,90/mês) ao final dos 3 dias de teste, e pode cancelar antes."
    >
      <form onSubmit={onSubmit} className="space-y-4">
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
          {loading ? "Registrando..." : "Finalizar e acessar o painel"}
        </button>
        <p className="text-center text-xs text-gm-700/50">
          🔒 Seus dados de cartão são tokenizados pelo Asaas. Nunca armazenamos o número do cartão.
        </p>
      </form>
    </AuthShell>
  );
}
