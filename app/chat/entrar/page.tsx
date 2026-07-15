// app/chat/entrar/page.tsx — entrada pra quem recebeu só o código (não o
// link) de um grupo, ex: ditado por telefone. Fora do route group (dashboard).
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

export default function EntrarNoGrupoPage() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = value.trim();
    if (!raw) return;
    // aceita tanto o código sozinho quanto um link inteiro colado
    const code = raw.includes("/chat/") ? raw.split("/chat/").pop()!.split(/[?#]/)[0] : raw;
    router.push(`/chat/${code.trim().toUpperCase()}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gm-50/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <form onSubmit={onSubmit} className="gm-card space-y-3 p-6">
          <h1 className="text-center text-lg font-semibold text-gm-900">Entrar em um grupo</h1>
          <p className="text-center text-sm text-gm-700/60">Cole o link do convite ou digite o código.</p>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ex: AB3D9F2K"
            autoFocus
            className="w-full rounded-lg border border-gm-200 px-3 py-2 text-center text-sm uppercase"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-gm-500 py-2 text-sm font-semibold text-white hover:bg-gm-600"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
