// components/EmojiPicker.tsx — seletor de emoji do Dashboard. Bottom-sheet no
// mobile, painel centralizado no desktop. Grade agrupada + campo livre para
// qualquer emoji do teclado. Salva imediatamente via PATCH /api/profile.
"use client";

import { useState } from "react";
import { EMOJI_GROUPS } from "@/lib/constants";

export function EmojiPicker({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (emoji: string) => void;
}) {
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(emoji: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboard_emoji: emoji }),
      });
      if (res.ok) {
        onSelect(emoji);
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gm-900">Escolha seu emoji</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gm-700/60 hover:bg-gm-50"
          >
            ✕
          </button>
        </div>

        <div className="max-h-80 space-y-4 overflow-y-auto">
          {Object.entries(EMOJI_GROUPS).map(([group, emojis]) => (
            <div key={group}>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gm-700/50">
                {group}
              </div>
              <div className="grid grid-cols-6 gap-2">
                {emojis.map((e) => (
                  <button
                    key={e}
                    disabled={saving}
                    onClick={() => save(e)}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-2xl transition hover:bg-gm-50 disabled:opacity-50"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-gm-100 pt-4">
          <label className="mb-1 block text-sm font-medium text-gm-900" htmlFor="custom-emoji">
            Ou digite/cole qualquer emoji
          </label>
          <div className="flex gap-2">
            <input
              id="custom-emoji"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              maxLength={8}
              placeholder="😀"
              className="min-h-11 w-full rounded-lg border border-gm-200 px-3 py-2 text-lg"
            />
            <button
              disabled={!custom.trim() || saving}
              onClick={() => save(custom.trim())}
              className="min-h-11 flex-none rounded-lg bg-gm-500 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
