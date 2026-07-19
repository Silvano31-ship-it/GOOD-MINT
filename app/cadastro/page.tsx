// app/cadastro/page.tsx — Tela 4. Cadastro.
// Plano Único: sem escolha de plano (todo mundo entra no mesmo, R$ 49,90/mês)
// e sem cartão obrigatório — o cliente entra em trial de 3 dias com as
// funções essenciais e assina depois em Configurações → Plano pra destravar
// tudo. Ver app/api/auth/register e components/PlanGate.tsx.
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell, Field } from "@/components/AuthShell";
import { BrokerEmoji } from "@/components/BrokerEmoji";
import { Footer } from "@/components/Footer";

function CadastroForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    creci: "",
    lgpdConsent: false,
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
    if (!/^\S+@\S+\.\S+$/.test(form.email)) clientErrors.push("Digite um e-mail válido.");
    if (!form.lgpdConsent) clientErrors.push("Você precisa aceitar os termos de uso e a política de privacidade.");
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
      <div className="rounded-xl border-2 border-gm-500 bg-gm-50 p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gm-900">👑 Plano Único</span>
          <span className="text-xl font-bold text-gm-900">
            R$ 49,90<span className="text-xs font-normal text-gm-700/60">/mês</span>
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-gm-700/70">
          <b>Teste grátis de 3 dias</b> com as funções essenciais (Leads, Imóveis, Negociações,
          Tarefas e Relatório), sem cartão. Assinando, você destrava <b>tudo, ilimitado</b>: IA,
          Automações, Agenda, Pós-Venda, Disparo WhatsApp e muito mais.
        </p>
        <p className="mt-2 rounded-lg bg-white p-2 text-[11px] leading-relaxed text-gm-700/70">
          🛡️ <b>Garantia de reembolso de 7 dias:</b> assinou e não gostou? Devolvemos 100% em até
          7 dias após a compra. Após 7 dias, não há reembolso.
        </p>
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
        {loading ? "Criando conta..." : "Criar conta e começar o teste grátis"}
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
        subtitle="3 dias grátis com as funções essenciais, sem cartão. Assine o Plano Único quando quiser destravar tudo."
        footer={
          <>
            Já tem conta?{" "}
            <Link href="/login" className="font-semibold text-gm-500 hover:underline">
              Entrar
            </Link>
          </>
        }
      >
        <CadastroForm />
      </AuthShell>
      <Footer />
    </>
  );
}
