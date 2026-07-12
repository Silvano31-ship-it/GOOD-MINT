// components/DashboardGreeting.tsx — saudação por hora do dia + emoji clicável
// e animado (mesma animação do BrokerEmoji). Abre o EmojiPicker para trocar,
// atualiza na hora sem recarregar (estado local + PATCH /api/profile).
"use client";

import { useState } from "react";
import { EmojiPicker } from "./EmojiPicker";

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function DashboardGreeting({
  fullName,
  initialEmoji,
}: {
  fullName: string;
  initialEmoji: string;
}) {
  const [emoji, setEmoji] = useState(initialEmoji);
  const [pickerOpen, setPickerOpen] = useState(false);
  const firstName = fullName.split(" ")[0];

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-gm-900">
        {timeGreeting()}, {firstName}{" "}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label="Escolher emoji"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-gm-50"
        >
          <span className="gm-broker-emoji text-2xl">{emoji}</span>
        </button>
      </h1>
      <p className="mt-1 text-sm text-gm-700/60">
        Este é o resumo do seu negócio. Sua bola de cristal ganha vida conforme
        você cadastra leads, imóveis e negociações.
      </p>
      {pickerOpen && (
        <EmojiPicker onClose={() => setPickerOpen(false)} onSelect={setEmoji} />
      )}
    </div>
  );
}
