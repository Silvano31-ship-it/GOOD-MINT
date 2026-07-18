// components/pos-venda/PortalClienteList.tsx — lista de processos de
// pós-venda ativos com acesso ao portal do cliente. Mesmo padrão de copiar
// link/WhatsApp de PortalLinkCard.tsx, agora numa tela dedicada com contador
// de acessos e último acesso (migration 024).
"use client";

import { useState } from "react";
import type { PostSale } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/ui";

export function PortalClienteList({ items }: { items: PostSale[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon="🔗"
        title="Nenhum processo ativo"
        desc="Assim que um pós-venda for iniciado, o link de acompanhamento do cliente aparece aqui."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((ps) => (
        <PortalRow key={ps.id} ps={ps} />
      ))}
    </div>
  );
}

function PortalRow({ ps }: { ps: PostSale }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/acompanhar/${ps.referral_token}` : "";

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const message = `Olá, ${ps.lead_name}! Aqui está o link para acompanhar o andamento do seu processo: ${shareUrl}`;
  const waHref = ps.lead_phone
    ? `https://wa.me/${ps.lead_phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className="gm-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gm-900">{ps.lead_name}</p>
          {ps.property_address && <p className="text-xs text-gm-700/60">{ps.property_address}</p>}
        </div>
        <div className="flex flex-none gap-4 text-right text-xs text-gm-700/60">
          <div>
            <div className="text-lg font-bold text-gm-900">{ps.portal_access_count}</div>
            <div>{ps.portal_access_count === 1 ? "acesso" : "acessos"}</div>
          </div>
          <div>
            <div className="font-medium text-gm-900">
              {ps.portal_last_access_at ? formatDateTime(ps.portal_last_access_at) : "Nunca acessado"}
            </div>
            <div>último acesso</div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input readOnly value={shareUrl} className="flex-1 rounded-lg border border-gm-200 px-3 py-2 text-xs text-gm-700" />
        <button onClick={copyLink} className="min-h-11 flex-none rounded-lg bg-gm-100 px-3 py-2 text-xs font-semibold text-gm-900 hover:bg-gm-200">
          {copied ? "Copiado!" : "Copiar"}
        </button>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 flex-none items-center justify-center gap-1 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          💬 WhatsApp
        </a>
      </div>
    </div>
  );
}
