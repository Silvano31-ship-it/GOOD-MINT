// components/pos-venda/QuestionForm.tsx — campo de dúvidas do portal público
// do cliente. Client component só pra dar feedback de "enviado" sem recarregar
// a página inteira.
"use client";

import { useState } from "react";
import { askQuestion } from "@/app/acompanhar/actions";

export function QuestionForm({ token }: { token: string }) {
  const [content, setContent] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    const fd = new FormData();
    fd.set("content", content);
    const result = await askQuestion(token, fd);
    setLoading(false);
    if (result.ok) {
      setSent(true);
      setContent("");
    }
  }

  if (sent) {
    return (
      <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
        ✓ Sua dúvida foi enviada! O corretor vai te responder em breve.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Escreva sua dúvida sobre o processo..."
        className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
      />
      <button
        disabled={loading}
        className="min-h-11 w-full rounded-lg bg-gm-500 py-2 text-sm font-semibold text-white hover:bg-gm-600 disabled:opacity-60"
      >
        {loading ? "Enviando..." : "Enviar dúvida"}
      </button>
    </form>
  );
}
