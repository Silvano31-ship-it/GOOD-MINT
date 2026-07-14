// components/LeadMessageTool.tsx — ícone de WhatsApp + gerador de mensagem-
// modelo por etapa do funil (texto pronto pra editar, não é gerado por IA).
"use client";

import { useState } from "react";
import { LEAD_MESSAGE_TEMPLATES } from "@/lib/constants";

export function LeadMessageTool({
  phone,
  leadName,
  brokerName,
  funnelStage,
}: {
  phone: string | null;
  leadName: string;
  brokerName: string;
  funnelStage: string;
}) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);

  function generate() {
    const template = LEAD_MESSAGE_TEMPLATES[funnelStage] ?? LEAD_MESSAGE_TEMPLATES.novo_lead;
    setText(template.replace("{nome}", leadName.split(" ")[0]).replace("{corretor}", brokerName));
    setOpen(true);
  }

  function copy() {
    navigator.clipboard.writeText(text);
  }

  function openWhatsApp() {
    if (!digits) return;
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {digits && (
          <a
            href={`https://wa.me/${digits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          >
            💬 WhatsApp
          </a>
        )}
        <button
          type="button"
          onClick={generate}
          className="min-h-9 rounded-lg border border-gm-200 px-3 py-1.5 text-xs font-medium text-gm-700 hover:bg-gm-50"
        >
          ✨ Gerar mensagem
        </button>
      </div>

      {open && (
        <div className="gm-card space-y-2 p-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="min-h-9 rounded-lg border border-gm-200 px-3 py-1.5 text-xs font-medium text-gm-700 hover:bg-gm-50"
            >
              📋 Copiar
            </button>
            {digits && (
              <button
                type="button"
                onClick={openWhatsApp}
                className="min-h-9 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                Abrir no WhatsApp
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
