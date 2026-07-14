// components/pos-venda/PortalLinkCard.tsx — link de acompanhamento (/acompanhar/[token])
// pro cliente. Mesmo padrão de ReferralPanel.tsx (copiar link), mais um botão
// de WhatsApp com o link já embutido na mensagem.
"use client";

import { useState } from "react";

export function PortalLinkCard({
  referralToken,
  leadName,
  leadPhone,
}: {
  referralToken: string;
  leadName: string;
  leadPhone: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/acompanhar/${referralToken}` : "";

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const message = `Olá, ${leadName}! Aqui está o link para acompanhar o andamento do seu processo: ${shareUrl}`;
  const waHref = leadPhone
    ? `https://wa.me/${leadPhone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className="gm-card p-4">
      <h3 className="font-semibold text-gm-900">🔗 Portal do cliente</h3>
      <p className="mt-1 text-xs text-gm-700/60">
        O cliente acompanha o processo sem precisar de login.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <input readOnly value={shareUrl} className="flex-1 rounded-lg border border-gm-200 px-3 py-2 text-xs text-gm-700" />
        <button onClick={copyLink} className="min-h-11 flex-none rounded-lg bg-gm-100 px-3 py-2 text-xs font-semibold text-gm-900 hover:bg-gm-200">
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        💬 Enviar por WhatsApp
      </a>
    </div>
  );
}
