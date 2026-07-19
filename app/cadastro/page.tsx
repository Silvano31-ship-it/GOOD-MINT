// app/cadastro/page.tsx — Tela 4. Cadastro — versão "Night Gold" cinematográfica,
// no mesmo padrão do /login (fundo azul-marinho→roxo com estrelas, card
// glassmorphism dourado, inputs escuros com foco dourado e botão azul→dourado).
// Tudo CSS puro (classes gm-night* em app/globals.css) — sem libs pesadas.
//
// Plano Único: sem escolha de plano (todo mundo entra no mesmo, R$ 49,90/mês)
// e sem cartão obrigatório — o cliente entra em trial de 3 dias com as
// funções essenciais e assina depois em Configurações → Plano pra destravar
// tudo. Ver app/api/auth/register e components/PlanGate.tsx.
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CrystalSphere } from "@/components/CrystalSphere";
import { FloatingEmojis } from "@/components/FloatingEmojis";
import { Reveal } from "@/components/Reveal";
import { LoginFooter } from "@/components/login/LoginFooter";

/** Campo escuro reutilizável, no mesmo estilo dos inputs do /login. */
function NightField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-white/80">{label}</label>
      <div className="flex items-center rounded-lg border border-white/10 bg-[#1A2035] px-3 transition-colors duration-300 focus-within:border-[#F5C94A]">
        <input
          {...props}
          className="w-full bg-transparent py-2.5 text-sm text-white placeholder-white/40 outline-none"
        />
      </div>
    </div>
  );
}

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
    <div className="gm-night-glass w-full max-w-md rounded-2xl p-8">
      <h2 className="text-2xl font-semibold text-white">Comece seu teste grátis</h2>
      <p className="mt-1 text-sm text-[#B0B8C8]">
        3 dias grátis com as funções essenciais, sem cartão. Assine o Plano Único
        quando quiser destravar tudo.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {/* Card do Plano Único — dourado, no tema Night Gold */}
        <div className="rounded-xl border border-[#F5C94A]/30 bg-[#F5C94A]/[0.06] p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">👑 Plano Único</span>
            <span className="text-xl font-bold text-[#F5C94A]">
              R$ 49,90<span className="text-xs font-normal text-[#B0B8C8]">/mês</span>
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#B0B8C8]">
            <b className="text-white">Teste grátis de 3 dias</b> com as funções essenciais
            (Leads, Imóveis, Negociações, Tarefas e Relatório), sem cartão. Assinando, você
            destrava <b className="text-white">tudo, ilimitado</b>: IA, Automações, Agenda,
            Pós-Venda, Disparo WhatsApp e muito mais.
          </p>
          <p className="mt-2 rounded-lg bg-black/20 p-2 text-[11px] leading-relaxed text-[#B0B8C8]">
            🛡️ <b className="text-white">Garantia de reembolso de 7 dias:</b> assinou e não
            gostou? Devolvemos 100% em até 7 dias após a compra. Após 7 dias, não há reembolso.
          </p>
        </div>

        <NightField label="Nome completo" required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
        <NightField label="E-mail" type="email" autoComplete="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        <NightField label="Telefone / WhatsApp" placeholder="(11) 99999-9999" required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        <NightField label="Senha (mín. 8 caracteres)" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} />
        <NightField label="Confirmar senha" type="password" autoComplete="new-password" required minLength={8} value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} />
        <NightField label="CRECI (opcional)" value={form.creci} onChange={(e) => set("creci", e.target.value)} />

        <label className="flex items-start gap-2 text-sm text-[#B0B8C8]">
          <input
            type="checkbox"
            checked={form.lgpdConsent}
            onChange={(e) => set("lgpdConsent", e.target.checked)}
            className="mt-0.5 accent-[#F5C94A]"
            required
          />
          <span>
            Li e aceito os{" "}
            <Link href="/termos" className="text-[#F5C94A] hover:underline">termos de uso</Link> e a{" "}
            <Link href="/privacidade" className="text-[#F5C94A] hover:underline">política de privacidade</Link>.
          </span>
        </label>

        {errors.length > 0 && (
          <ul className="space-y-1 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
            {errors.map((er) => <li key={er}>• {er}</li>)}
          </ul>
        )}

        <button
          type="submit"
          disabled={loading}
          className="gm-night-btn w-full rounded-lg py-3 font-semibold text-white shadow-lg disabled:opacity-60"
        >
          {loading ? "Criando conta..." : "Criar conta e começar o teste grátis"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#B0B8C8]">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-[#F5C94A] hover:underline">
          Entrar
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

export default function CadastroPage() {
  return (
    <>
      <main className="gm-night relative min-h-screen overflow-hidden">
        <div className="gm-stars" aria-hidden="true" />
        <FloatingEmojis />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-5 pb-8 pt-16 md:grid-cols-2">
          <Reveal className="order-2 flex flex-col items-center text-center md:order-1 md:items-start md:text-left">
            <h1 className="gm-night-title text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Pré-venda e pós-venda,{" "}
              <span className="text-[#F5C94A]">num só lugar.</span>
            </h1>
            <p className="mt-3 max-w-md text-[#B0B8C8]">
              Capte leads, feche negócios e mantenha o cliente informado até a entrega das chaves.
            </p>
            <div className="mt-6 hidden scale-90 md:block md:scale-100">
              <CrystalSphere empty={false} accent="gold" caption="Veja seu negócio em uma única visão." />
            </div>
          </Reveal>

          <div className="order-1 flex justify-center md:order-2 md:justify-end">
            <CadastroForm />
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

        <LoginFooter />
      </main>
    </>
  );
}
