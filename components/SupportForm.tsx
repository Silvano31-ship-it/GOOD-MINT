// components/SupportForm.tsx — categorias de suporte + envio pelo WhatsApp.
// Chama a server action diretamente (sem <form action=...>) porque precisamos
// do retorno (waUrl) para abrir o WhatsApp numa aba nova a partir do client.
"use client";

import { useState } from "react";
import { createSupportTicket } from "@/app/(dashboard)/actions";

const CATEGORIES = [
  { value: "Pagamento e plano", icon: "💳", hint: "Cobrança, cartão, trial, upgrade" },
  { value: "Problema técnico", icon: "🐞", hint: "Erro na tela, algo não carrega ou não salva" },
  { value: "Central de Mensagens", icon: "💬", hint: "Canais, bots, WhatsApp/Instagram/OLX" },
  { value: "Sugestão de melhoria", icon: "💡", hint: "Ideia de funcionalidade nova" },
  { value: "Dúvida de uso", icon: "❓", hint: "Como fazer algo no sistema" },
  { value: "Urgente", icon: "🚨", hint: "Sistema fora do ar ou impedindo o trabalho" },
];

export function SupportForm() {
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("category", category);
      fd.set("description", description);
      const { waUrl } = await createSupportTicket(fd);
      window.open(waUrl, "_blank");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div role="radiogroup" aria-label="Categoria do problema" className="grid gap-2 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <label
            key={c.value}
            className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition ${
              category === c.value
                ? "border-gm-500 bg-gm-50 ring-1 ring-gm-500"
                : "border-gm-200 hover:border-gm-300"
            }`}
          >
            <input
              type="radio"
              name="category"
              value={c.value}
              checked={category === c.value}
              onChange={() => setCategory(c.value)}
              className="mt-0.5 accent-gm-500"
            />
            <span>
              <span className="block font-medium text-gm-900">{c.icon} {c.value}</span>
              <span className="block text-xs text-gm-700/60">{c.hint}</span>
            </span>
          </label>
        ))}
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gm-900">Descreva a situação (opcional)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Conte um pouco mais para agilizar o atendimento."
          className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="min-h-11 w-full rounded-lg bg-[#25D366] py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Abrindo..." : "💬 Falar com o suporte no WhatsApp"}
      </button>
    </form>
  );
}
