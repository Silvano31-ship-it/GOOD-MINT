// components/chat/GuestChatEntry.tsx — pede o nome do convidado uma única vez
// (guardado no localStorage do navegador, escopado por código de grupo) e
// depois mostra a conversa.
"use client";

import { useEffect, useState } from "react";
import { ChatThread } from "@/components/chat/ChatThread";

export function GuestChatEntry({ code }: { code: string }) {
  const storageKey = `gm-chat-name-${code}`;
  const [name, setName] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setName(saved);
    setReady(true);
  }, [storageKey]);

  function join(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    localStorage.setItem(storageKey, trimmed);
    setName(trimmed);
  }

  function changeName() {
    localStorage.removeItem(storageKey);
    setDraft("");
    setName(null);
  }

  if (!ready) return null;

  if (!name) {
    return (
      <form onSubmit={join} className="gm-card mx-auto max-w-sm space-y-3 p-6">
        <h2 className="text-center font-semibold text-gm-900">Como podemos te chamar?</h2>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Seu nome"
          autoFocus
          className="w-full rounded-lg border border-gm-200 px-3 py-2 text-center text-sm"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-gm-500 py-2 text-sm font-semibold text-white hover:bg-gm-600"
        >
          Entrar no grupo
        </button>
      </form>
    );
  }

  return (
    <div>
      <p className="mb-3 text-center text-sm text-gm-700/60">
        Você entrou como <b>{name}</b> —{" "}
        <button onClick={changeName} className="text-gm-500 hover:underline">
          trocar nome
        </button>
      </p>
      <ChatThread code={code} viewerName={name} viewerIsOwner={false} />
    </div>
  );
}
