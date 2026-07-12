// app/recuperar-senha/page.tsx — Tela 3. Recuperação de Senha (solicitar link).
"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell, Field } from "@/components/AuthShell";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message ?? "Se este e-mail existir, enviamos um link.");
    } catch {
      setMessage("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Enviaremos um link para redefinir sua senha."
      footer={
        <Link href="/login" className="font-semibold text-gm-500 hover:underline">
          ← Voltar ao login
        </Link>
      }
    >
      {message ? (
        <p className="rounded-lg bg-gm-50 p-4 text-sm text-gm-700">{message}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gm-500 py-2.5 font-semibold text-white transition hover:bg-gm-600 disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
