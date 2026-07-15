// components/chat/ChatThread.tsx — conversa do grupo, reaproveitada tanto
// pelo painel do corretor quanto pela página pública do convidado. Sem
// nenhuma infraestrutura de tempo real no projeto (sem ws/socket.io/pusher),
// então a atualização é por polling (a cada ~4s) via
// app/api/chat/[code]/messages/route.ts.
"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  senderName: string;
  isOwner: boolean;
  content: string;
  createdAt: string;
}

export function ChatThread({
  code,
  viewerName,
  viewerIsOwner,
}: {
  code: string;
  viewerName: string;
  viewerIsOwner: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/chat/${code}/messages`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch {
      // silencioso — a próxima consulta (poucos segundos depois) tenta de novo
    }
  }

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/${code}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderName: viewerName, content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Não foi possível enviar.");
        return;
      }
      setText("");
      await fetchMessages();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[60vh] flex-col overflow-hidden rounded-xl border border-gm-100 bg-white">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-gm-700/50">Nenhuma mensagem ainda. Diga oi! 👋</p>
        )}
        {messages.map((m) => {
          const mine = viewerIsOwner ? m.isOwner : !m.isOwner && m.senderName === viewerName;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? "bg-gm-500 text-white" : "bg-gm-50 text-gm-900"
                }`}
              >
                {!mine && (
                  <div className="mb-0.5 text-xs font-semibold opacity-70">
                    {m.senderName}
                    {m.isOwner ? " (corretor)" : ""}
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-gm-100 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite uma mensagem..."
          className="flex-1 rounded-full border border-gm-200 px-4 py-2 text-sm outline-none focus:border-gm-500"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          aria-label="Enviar"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gm-500 text-white disabled:opacity-60"
        >
          ➤
        </button>
      </form>
      {error && <p className="px-3 pb-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
