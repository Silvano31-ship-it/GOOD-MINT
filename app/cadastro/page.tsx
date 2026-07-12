// app/cadastro/page.tsx — Tela 4. Cadastro / Escolha de Plano.
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell, Field } from "@/components/AuthShell";

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
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
      router.push(data.redirect || "/cadastro/pagamento");
    } catch {
      setErrors(["Erro de conexão. Tente novamente."]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Comece seu teste grátis"
      subtitle="3 dias grátis no plano MINT Start (R$ 19,90/mês). Sem cobrança durante o teste."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-gm-500 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Nome completo" required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
        <Field label="E-mail" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        <Field label="Telefone / WhatsApp" placeholder="(11) 99999-9999" required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        <Field label="Senha (mín. 8 caracteres)" type="password" required value={form.password} onChange={(e) => set("password", e.target.value)} />
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
    </AuthShell>
  );
}
