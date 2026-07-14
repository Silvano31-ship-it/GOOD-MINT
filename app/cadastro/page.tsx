// app/cadastro/page.tsx — Tela 4. Cadastro / Escolha de Plano.
// Sem cartão obrigatório: o cliente entra direto no painel em trial e decide
// depois (em Configurações → Plano) se quer assinar. Ver app/api/auth/register.
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell, Field } from "@/components/AuthShell";
import { BrokerEmoji } from "@/components/BrokerEmoji";
import { Footer } from "@/components/Footer";

const PLAN_OPTIONS = [
  { code: "mint_start", name: "MINT Start", price: "R$ 19,90/mês", desc: "30 leads · 15 imóveis" },
  { code: "mint_pro", name: "MINT Pro", price: "R$ 49,90/mês", desc: "Leads e imóveis ilimitados" },
  { code: "mint_business", name: "MINT Business", price: "R$ 80,00/mês", desc: "Tudo ilimitado" },
];

function CadastroForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialPlan = params.get("plano") ?? "mint_start";

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    creci: "",
    lgpdConsent: false,
    planCode: initialPlan,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);

    const clientErrors: string[] = [];
    if (form.password.length < 8) clientErrors.push("A senha deve ter no mínimo 8 caracteres.");
    if (form.password !== form.confirmPassword) clientErrors.push("As senhas não coincidem.");
    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? [data.error ?? "Não foi possível cadastrar."]);
        return;
      }
      router.push(data.redirect || "/dashboard");
    } catch {
      setErrors(["Erro de conexão. Tente novamente."]);
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
                form.planCode === p.code
                  ? "border-gm-500 bg-gm-50 ring-1 ring-gm-500"
                  : "border-gm-200 hover:border-gm-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="planCode"
                  value={p.code}
                  checked={form.planCode === p.code}
                  onChange={() => set("planCode", p.code)}
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

      <Field label="Nome completo" required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
      <Field label="E-mail" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
      <Field label="Telefone / WhatsApp" placeholder="(11) 99999-9999" required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      <Field label="Senha (mín. 8 caracteres)" type="password" required minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} />
      <Field label="Confirmar senha" type="password" required minLength={8} value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} />
      <Field label="CRECI (opcional)" value={form.creci} onChange={(e) => set("creci", e.target.value)} />

      <label className="flex items-start gap-2 text-sm text-gm-700/80">
        <input
          type="checkbox"
          checked={form.lgpdConsent}
          onChange={(e) => set("lgpdConsent", e.target.checked)}
          className="mt-0.5"
          required
        />
        <span>
          Li e aceito os{" "}
          <Link href="/termos" className="text-gm-500 hover:underline">termos de uso</Link> e a{" "}
          <Link href="/privacidade" className="text-gm-500 hover:underline">política de privacidade</Link>.
        </span>
      </label>

      {errors.length > 0 && (
        <ul className="space-y-1 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {errors.map((er) => <li key={er}>• {er}</li>)}
        </ul>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gm-500 py-2.5 font-semibold text-white transition hover:bg-gm-600 disabled:opacity-60"
      >
        {loading ? "Criando conta..." : "Criar conta e começar"}
      </button>
    </form>
  );
}

export default function CadastroPage() {
  return (
    <>
      <AuthShell
        animated
        emoji={<BrokerEmoji />}
        title="Comece seu teste grátis"
        subtitle="3 dias grátis, sem cartão de crédito. Escolha um plano e comece agora."
        footer={
          <>
            Já tem conta?{" "}
            <Link href="/login" className="font-semibold text-gm-500 hover:underline">
              Entrar
            </Link>
          </>
        }
      >
        <Suspense fallback={<p className="text-sm text-gm-700/60">Carregando...</p>}>
          <CadastroForm />
        </Suspense>
      </AuthShell>
      <Footer />
    </>
  );
}
