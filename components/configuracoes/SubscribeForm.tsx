// components/configuracoes/SubscribeForm.tsx
// Assinatura do Plano Único — agora com escolha entre CARTÃO (débito recorrente
// automático) e PIX (paga na hora escaneando o QR; o Asaas gera uma nova
// cobrança a cada mês). Plano e ciclo fixos (Plano Único, mensal). O preço vem
// da tabela plans no servidor.
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

export function SubscribeForm(_props: {
  currentPlanCode?: string;
  currentBillingCycle?: BillingCycle;
} = {}) {
  const router = useRouter();
  const [method, setMethod] = useState<"card" | "pix">("card");

  return (
    <div className="space-y-4">
      {/* Cabeçalho do plano */}
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

      {/* Escolha do método */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMethod("card")}
          className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
            method === "card" ? "border-gm-500 bg-gm-500 text-white" : "border-gm-200 text-gm-700 hover:bg-gm-50"
          }`}
        >
          💳 Cartão
        </button>
        <button
          type="button"
          onClick={() => setMethod("pix")}
          className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
            method === "pix" ? "border-gm-500 bg-gm-500 text-white" : "border-gm-200 text-gm-700 hover:bg-gm-50"
          }`}
        >
          ⚡ PIX
        </button>
      </div>

      {method === "card" ? <CardForm onDone={() => router.refresh()} /> : <PixForm />}

      {/* Garantia (comum aos dois) */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
        🛡️ <b>Garantia de reembolso de 7 dias:</b> se você assinar e não gostar, devolvemos 100% do
        valor em até 7 dias após a compra. <b>Após 7 dias, não há reembolso</b> — o cancelamento
        continua livre, valendo até o fim do período já pago.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Cartão
function CardForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    holderName: "", number: "", expiryMonth: "", expiryYear: "", ccv: "",
    cpfCnpj: "", postalCode: "", addressNumber: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
      if (!res.ok) { setError(data.error ?? "Não foi possível registrar o cartão."); return; }
      onDone();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="rounded-lg bg-gm-50 p-3 text-xs text-gm-700/70">
        No cartão, a cobrança é <b>automática todo mês</b> — e só começa <b>ao fim do teste grátis</b>.
      </p>
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
        {loading ? "Registrando..." : "Assinar no cartão — R$ 49,90/mês"}
      </button>
      <p className="text-center text-xs text-gm-700/50">
        🔒 Seu cartão é tokenizado pelo Asaas. Nunca guardamos o número.
      </p>
    </form>
  );
}

// ---------------------------------------------------------------- PIX
function PixForm() {
  const router = useRouter();
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<{ qrImage: string; payload: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/subscribe/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpfCnpj }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Não foi possível gerar o PIX."); return; }
      setPix({ qrImage: data.qrImage, payload: data.payload });
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!pix) return;
    await navigator.clipboard.writeText(pix.payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (pix) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm font-semibold text-gm-900">Escaneie o QR no app do seu banco 👇</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pix.qrImage} alt="QR Code PIX" className="mx-auto h-56 w-56 rounded-lg border border-gm-100" />
        <button
          onClick={copy}
          className="w-full rounded-lg border border-gm-200 px-4 py-2 text-sm font-semibold text-gm-700 hover:bg-gm-50"
        >
          {copied ? "Copiado! ✓" : "📋 Copiar código PIX (copia e cola)"}
        </button>
        <p className="rounded-lg bg-gm-50 p-3 text-xs text-gm-700/70">
          Assim que o pagamento cair, sua conta é ativada automaticamente (pode levar alguns segundos).
        </p>
        <button
          onClick={() => router.refresh()}
          className="w-full rounded-lg bg-gm-500 py-2.5 text-sm font-semibold text-white hover:bg-gm-600"
        >
          Já paguei — atualizar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={generate} className="space-y-4">
      <p className="rounded-lg bg-gm-50 p-3 text-xs text-gm-700/70">
        No PIX você paga <b>na hora</b> e a conta ativa em segundos. O Asaas envia uma nova cobrança
        PIX a cada mês (o PIX não é débito automático).
      </p>
      <Field label="Seu CPF ou CNPJ" inputMode="numeric" placeholder="Só números" required value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} />

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gm-500 py-2.5 font-semibold text-white transition hover:bg-gm-600 disabled:opacity-60"
      >
        {loading ? "Gerando PIX..." : "Gerar PIX — R$ 49,90"}
      </button>
    </form>
  );
}
