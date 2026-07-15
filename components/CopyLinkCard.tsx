// components/CopyLinkCard.tsx — card genérico "copiar link / enviar por
// WhatsApp", reaproveitado pelos Grupos de chat e pelas Reuniões. Mesmo
// padrão do PortalLinkCard.tsx (pós-venda), generalizado.
"use client";

import { useState } from "react";

export function CopyLinkCard({
  path,
  title,
  desc,
  waMessage,
}: {
  path: string;
  title: string;
  desc: string;
  waMessage: string;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${path}` : "";

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const waHref = `https://wa.me/?text=${encodeURIComponent(`${waMessage} ${shareUrl}`)}`;

  return (
    <div className="gm-card p-4">
      <h3 className="font-semibold text-gm-900">{title}</h3>
      <p className="mt-1 text-xs text-gm-700/60">{desc}</p>
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
