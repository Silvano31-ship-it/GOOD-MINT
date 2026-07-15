// components/conteudo/AiChat.tsx — chat livre de IA (estilo Gemini/ChatGPT)
// pro corretor pedir qualquer coisa relacionada ao trabalho dele. Conversa
// vive só no estado do componente (sem salvar no banco — ver plano).
"use client";

import { useState } from "react";
import { sendChatMessageAction, generateImageAction, type ImageProvider } from "@/app/(dashboard)/conteudo/actions";
import type { AiQuotaStatus } from "@/lib/ai-quota";
import { IMAGE_STYLES, type ImageStyleKey } from "@/lib/constants";

interface ChatItem {
  role: "user" | "assistant";
  /** "imagem" fica de fora do histórico mandado pra Claude — a API exige
   * que as mensagens alternem estritamente user/assistant, e um pedido de
   * imagem (que pode falhar sem nunca gerar uma resposta "assistant") quebra
   * essa alternância se entrar na conversa de texto. */
  kind: "texto" | "imagem";
  content?: string;
  imageUrl?: string;
}

export function AiChat({
  initialTextQuota,
  initialImageQuota,
}: {
  initialTextQuota: AiQuotaStatus;
  initialImageQuota: AiQuotaStatus;
}) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [imageStyle, setImageStyle] = useState<ImageStyleKey>("fotorrealista");
  const [imageProvider, setImageProvider] = useState<ImageProvider>("openai");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textQuota, setTextQuota] = useState(initialTextQuota);
  const [imageQuota, setImageQuota] = useState(initialImageQuota);

  async function handleSendText() {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setInput("");
    const nextItems: ChatItem[] = [...items, { role: "user", kind: "texto", content: text }];
    setItems(nextItems);
    setSending(true);
    try {
      const history = nextItems
        .filter((i) => i.kind === "texto" && i.content)
        .map((i) => ({ role: i.role, content: i.content! }));
      const res = await sendChatMessageAction(history);
      if (!res.ok) {
        setItems((prev) => prev.slice(0, -1));
        setInput(text);
        setError(res.error ?? "Não foi possível responder agora.");
        return;
      }
      setItems((prev) => [...prev, { role: "assistant", kind: "texto", content: res.reply }]);
      setTextQuota((q) => ({ ...q, used: q.used + 1, exceeded: q.limit !== null && q.used + 1 >= q.limit }));
    } finally {
      setSending(false);
    }
  }

  async function handleSendImage() {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setInput("");
    setItems((prev) => [...prev, { role: "user", kind: "imagem", content: `🖼️ ${text}` }]);
    setSending(true);
    try {
      const res = await generateImageAction({ subject: text, style: imageStyle }, imageProvider);
      if (!res.ok) {
        setError(res.error ?? "Não foi possível gerar a imagem agora.");
        return;
      }
      setItems((prev) => [...prev, { role: "assistant", kind: "imagem", imageUrl: res.url }]);
      setImageQuota((q) => ({ ...q, used: q.used + 1, exceeded: q.limit !== null && q.used + 1 >= q.limit }));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="gm-card mx-auto flex max-w-2xl flex-col p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gm-700/60">
        <span>
          Textos: {textQuota.limit === null ? `${textQuota.used} (ilimitado)` : `${textQuota.used}/${textQuota.limit} este mês`}
        </span>
        <span>
          Imagens: {imageQuota.limit === null ? `${imageQuota.used} (ilimitado)` : `${imageQuota.used}/${imageQuota.limit} este mês`}
        </span>
      </div>

      <div className="gm-scroll flex min-h-[320px] flex-col gap-3 overflow-y-auto rounded-lg border border-gm-100 p-3">
        {items.length === 0 && (
          <p className="m-auto max-w-xs text-center text-sm text-gm-700/50">
            Pergunte qualquer coisa relacionada ao seu trabalho de corretor — dicas, mensagens pra clientes, textos, ideias. Ou escreva uma descrição e clique em "Gerar imagem".
          </p>
        )}
        {items.map((item, i) => (
          <div key={i} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                item.role === "user" ? "bg-gm-500 text-white" : "bg-gm-50 text-gm-900"
              }`}
            >
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="rounded-lg" />
              ) : (
                <span className="whitespace-pre-wrap">{item.content}</span>
              )}
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
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={imageProvider}
            onChange={(e) => setImageProvider(e.target.value as ImageProvider)}
            className="rounded-lg border border-gm-200 px-2 py-1.5 text-xs text-gm-700 outline-none focus:border-gm-500"
          >
            <option value="openai">OpenAI (DALL-E)</option>
            <option value="gemini">Google Gemini</option>
          </select>
          <select
            value={imageStyle}
            onChange={(e) => setImageStyle(e.target.value as ImageStyleKey)}
            className="rounded-lg border border-gm-200 px-2 py-1.5 text-xs text-gm-700 outline-none focus:border-gm-500"
          >
            {IMAGE_STYLES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={handleSendImage}
            disabled={sending || !input.trim()}
            className="rounded-lg border border-gm-200 px-3 py-1.5 text-xs font-medium text-gm-700 hover:bg-gm-50 disabled:opacity-60"
          >
            🖼️ Gerar imagem
          </button>
          <button
            onClick={handleSendText}
            disabled={sending || !input.trim()}
            className="ml-auto rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600 disabled:opacity-60"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
