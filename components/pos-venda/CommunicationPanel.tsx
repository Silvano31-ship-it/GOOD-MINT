// components/pos-venda/CommunicationPanel.tsx — nota interna vs mensagem ao cliente.
// Chama a action diretamente (sem <form action=...>) quando o canal é WhatsApp,
// pois precisamos abrir o wa.me numa aba nova a partir do client — mesmo
// padrão de components/SupportForm.tsx.
"use client";

import { useState } from "react";
import type { Communication } from "@/lib/constants";
import { addCommunication } from "@/app/(dashboard)/pos-venda/actions";
import { formatDateTime } from "@/lib/format";

export function CommunicationPanel({ postSaleId, items }: { postSaleId: string; items: Communication[] }) {
  const [kind, setKind] = useState<"nota_interna" | "mensagem_cliente">("nota_interna");
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("kind", kind);
      fd.set("channel", channel);
      fd.set("content", content);
      const result = await addCommunication(postSaleId, fd);
      if (result.waUrl) window.open(result.waUrl, "_blank");
      setContent("");
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="gm-card space-y-3 p-4">
        <div role="radiogroup" aria-label="Tipo" className="flex gap-2 text-sm">
          <label className={`min-h-11 flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center ${kind === "nota_interna" ? "border-gm-500 bg-gm-50" : "border-gm-200"}`}>
            <input type="radio" name="kind" className="sr-only" checked={kind === "nota_interna"} onChange={() => setKind("nota_interna")} />
            Nota interna
          </label>
          <label className={`min-h-11 flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center ${kind === "mensagem_cliente" ? "border-gm-500 bg-gm-50" : "border-gm-200"}`}>
            <input type="radio" name="kind" className="sr-only" checked={kind === "mensagem_cliente"} onChange={() => setKind("mensagem_cliente")} />
            Mensagem ao cliente
          </label>
        </div>

        {kind === "mensagem_cliente" && (
          <div role="radiogroup" aria-label="Canal" className="flex gap-2 text-sm">
            <label className={`min-h-11 flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center ${channel === "email" ? "border-gm-500 bg-gm-50" : "border-gm-200"}`}>
              <input type="radio" name="channel" className="sr-only" checked={channel === "email"} onChange={() => setChannel("email")} />
              📧 E-mail
            </label>
            <label className={`min-h-11 flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center ${channel === "whatsapp" ? "border-gm-500 bg-gm-50" : "border-gm-200"}`}>
              <input type="radio" name="channel" className="sr-only" checked={channel === "whatsapp"} onChange={() => setChannel("whatsapp")} />
              💬 WhatsApp
            </label>
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder={kind === "nota_interna" ? "Anotação só sua sobre este processo..." : "Mensagem que o cliente vai ver..."}
          className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
        />

        <button disabled={loading} className="min-h-11 w-full rounded-lg bg-gm-500 py-2 text-sm font-semibold text-white hover:bg-gm-600 disabled:opacity-60">
          {loading ? "Enviando..." : kind === "mensagem_cliente" && channel === "whatsapp" ? "Salvar e abrir WhatsApp" : "Salvar"}
        </button>
      </form>

      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-gm-700/50">Nenhuma comunicação registrada ainda.</p>}
        {[...items].reverse().map((c) => (
          <div key={c.id} className="rounded-lg bg-gm-50 px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gm-900">
                {c.kind === "mensagem_cliente" ? `Cliente (${c.channel})` : "Nota interna"}
              </span>
              <span className="text-xs text-gm-700/40">{formatDateTime(c.created_at)}</span>
            </div>
            <p className="mt-1 text-gm-700">{c.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
