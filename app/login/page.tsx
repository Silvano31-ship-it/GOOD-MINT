// app/login/page.tsx — Tela 2. Login — versão "Night Gold" cinematográfica.
// Fundo azul-marinho→roxo com campo de estrelas (douradas e brancas), esfera
// de cristal com brilho dourado, card glassmorphism e botão com gradiente
// azul→dourado. Tudo CSS puro (classes gm-night* em app/globals.css) — sem
// Three.js/tsparticles/framer-motion, pra manter o login leve no celular.
// cadastro/recuperar-senha continuam com o AuthShell normal.
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CrystalSphere } from "@/components/CrystalSphere";
import { FloatingEmojis } from "@/components/FloatingEmojis";
import { Reveal } from "@/components/Reveal";
import { Footer } from "@/components/Footer";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
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
        body: JSON.stringify({ email, password, remember }),
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
    <div className="gm-night-glass w-full max-w-sm rounded-2xl p-8">
      <h2 className="text-2xl font-semibold text-white">Acesse sua conta</h2>
      <p className="mt-1 text-sm text-[#B0B8C8]">Entre com seu e-mail e senha.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-white/80">E-mail</label>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1A2035] px-3 transition-colors duration-300 focus-within:border-[#F5C94A]">
            <span aria-hidden="true">📧</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              className="w-full bg-transparent py-2.5 text-sm text-white placeholder-white/40 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-white/80">Senha</label>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1A2035] px-3 transition-colors duration-300 focus-within:border-[#F5C94A]">
            <span aria-hidden="true">🔒</span>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent py-2.5 text-sm text-white placeholder-white/40 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="text-white/60 hover:text-white"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-[#B0B8C8]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-[#F5C94A]"
            />
            Lembrar-me
          </label>
          <Link href="/recuperar-senha" className="text-[#B0B8C8] transition-colors duration-300 hover:text-[#F5C94A]">
            Esqueci minha senha
          </Link>
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="gm-night-btn w-full rounded-lg py-3 font-semibold text-white shadow-lg disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#B0B8C8]">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-[#F5C94A] hover:underline">
          Comece o teste grátis
        </Link>
      </p>
    </div>
  );
}

const BADGES = [
  "🏢 CRM exclusivo pra corretores",
  "🤖 Pós-venda automático",
  "⏳ Teste grátis de 3 dias",
];

export default function LoginPage() {
  return (
    <>
      <main className="gm-night relative min-h-screen overflow-hidden">
        <div className="gm-stars" aria-hidden="true" />
        <FloatingEmojis />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-5 pb-8 pt-16 md:grid-cols-2">
          <Reveal className="order-2 flex flex-col items-center text-center md:order-1 md:items-start md:text-left">
            <h1 className="gm-night-title text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Pré-venda e pós-venda,{" "}
              <span className="text-[#F5C94A]">numa só visão.</span>
            </h1>
            <p className="mt-3 max-w-md text-[#B0B8C8]">
              A tecnologia que conecta você ao futuro do mercado imobiliário.
            </p>
            <div className="mt-6 scale-75 md:scale-100">
              <CrystalSphere empty={false} accent="gold" caption="Veja seu negócio em uma única visão." />
            </div>
          </Reveal>

          <div className="order-1 flex justify-center md:order-2 md:justify-end">
            <Suspense fallback={<p className="text-sm text-[#B0B8C8]">Carregando...</p>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>

        <div className="relative z-10 mx-auto flex max-w-6xl flex-wrap justify-center gap-3 px-5 pb-16 md:justify-start">
          {BADGES.map((b) => (
            <span
              key={b}
              className="rounded-full border border-[#F5C94A]/20 bg-[#F5C94A]/[0.12] px-4 py-1.5 text-sm font-medium text-[#F5C94A]"
            >
              {b}
            </span>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
