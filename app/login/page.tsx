// app/login/page.tsx — Tela 2. Login.
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell, Field } from "@/components/AuthShell";
import { BrokerEmoji } from "@/components/BrokerEmoji";
import { Footer } from "@/components/Footer";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      router.push(params.get("next") || data.redirect || "/dashboard");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="E-mail"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Field
        label="Senha"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gm-500 py-2.5 font-semibold text-white transition hover:bg-gm-600 disabled:opacity-60"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
      <div className="text-center">
        <Link href="/recuperar-senha" className="text-sm text-gm-700/70 hover:text-gm-500">
          Esqueci minha senha
        </Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <>
      <AuthShell
        emoji={<BrokerEmoji />}
        title="Entrar"
        subtitle="Acesse sua conta GOOD MINT."
        footer={
          <>
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="font-semibold text-gm-500 hover:underline">
              Comece o teste grátis
            </Link>
          </>
        }
      >
        <Suspense fallback={<p className="text-sm text-gm-700/60">Carregando...</p>}>
          <LoginForm />
        </Suspense>
      </AuthShell>
      <Footer />
    </>
  );
}
