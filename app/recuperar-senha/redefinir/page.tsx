// app/recuperar-senha/redefinir/page.tsx — redefinição de senha via token.
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell, Field } from "@/components/AuthShell";

function RedefinirForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível redefinir a senha.");
        return;
      }
      router.push(data.redirect || "/login");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="Nova senha (mín. 8 caracteres)"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !token}
        className="w-full rounded-lg bg-gm-500 py-2.5 font-semibold text-white transition hover:bg-gm-600 disabled:opacity-60"
      >
        {loading ? "Salvando..." : "Redefinir senha"}
      </button>
    </form>
  );
}

export default function RedefinirPage() {
  return (
    <AuthShell
      title="Nova senha"
      subtitle="Escolha uma nova senha para sua conta."
      footer={
        <Link href="/login" className="font-semibold text-gm-500 hover:underline">
          ← Voltar ao login
        </Link>
      }
    >
      <Suspense fallback={<p className="text-sm text-gm-700/60">Carregando...</p>}>
        <RedefinirForm />
      </Suspense>
    </AuthShell>
  );
}
