// components/conteudo/AiChat.tsx — chat livre de IA (estilo Gemini/ChatGPT)
// pro corretor pedir qualquer coisa relacionada ao trabalho dele. Conversa
// vive só no estado do componente (sem salvar no banco — ver plano).
"use client";

import { useState } from "react";
import { sendChatMessageAction } from "@/app/(dashboard)/conteudo/actions";
import type { AiQuotaStatus } from "@/lib/ai-quota";

interface ChatItem {
  role: "user" | "assistant";
  content: string;
}

export function AiChat({ initialTextQuota }: { initialTextQuota: AiQuotaStatus }) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textQuota, setTextQuota] = useState(initialTextQuota);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setInput("");
    const nextItems: ChatItem[] = [...items, { role: "user", content: text }];
    setItems(nextItems);
    setSending(true);
    try {
      const res = await sendChatMessageAction(nextItems);
      if (!res.ok) {
        // Desfaz a mensagem otimista — se ela ficasse sem resposta no
        // histórico, a próxima tentativa mandaria duas mensagens "user"
        // seguidas pra Claude, que exige alternância estrita e rejeitaria.
        setItems((prev) => prev.slice(0, -1));
        setInput(text);
        setError(res.error ?? "Não foi possível responder agora.");
        return;
      }
      setItems((prev) => [...prev, { role: "assistant", content: res.reply! }]);
      setTextQuota((q) => ({ ...q, used: q.used + 1, exceeded: q.limit !== null && q.used + 1 >= q.limit }));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="gm-card mx-auto flex max-w-2xl flex-col p-4">
      <div className="mb-3 text-xs text-gm-700/60">
        Textos: {textQuota.limit === null ? `${textQuota.used} (ilimitado)` : `${textQuota.used}/${textQuota.limit} este mês`}
      </div>

      <div className="gm-scroll flex min-h-[320px] flex-col gap-3 overflow-y-auto rounded-lg border border-gm-100 p-3">
        {items.length === 0 && (
          <p className="m-auto max-w-xs text-center text-sm text-gm-700/50">
            Pergunte qualquer coisa relacionada ao seu trabalho de corretor — dicas, mensagens pra clientes, textos, ideias.
          </p>
        )}
        {items.map((item, i) => (
          <div key={i} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                item.role === "user" ? "bg-gm-500 text-white" : "bg-gm-50 text-gm-900"
              }`}
            >
              <span className="whitespace-pre-wrap">{item.content}</span>
            </div>
          </div>
        ))}
        {sending && <div className="text-xs text-gm-700/40">Pensando...</div>}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 space-y-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          placeholder="Escreva sua pergunta ou pedido..."
          className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm outline-none focus:border-gm-500"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="w-full rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600 disabled:opacity-60"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
