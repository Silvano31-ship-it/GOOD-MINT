// components/pos-venda/ReferralPanel.tsx — "Solicitar Indicação": gera o link
// público /indicar/[token] e mostra o histórico de indicações do processo.
"use client";

import { useState } from "react";
import type { Referral } from "@/lib/constants";
import { requestReferral, updateReferralStatus } from "@/app/(dashboard)/pos-venda/actions";

const STATUS_LABEL: Record<string, string> = {
  enviado: "Enviado",
  contatado: "Contatado",
  virou_lead: "Virou Lead",
  recompensado: "Recompensado",
};

export function ReferralPanel({
  postSaleId,
  referralToken,
  referrals,
}: {
  postSaleId: string;
  referralToken: string;
  referrals: Referral[];
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/indicar/${referralToken}` : "";

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="gm-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gm-900">🎁 Solicitar Indicação</h3>
        <button onClick={() => setOpen((v) => !v)} className="text-xs text-gm-500 hover:underline">
          {open ? "Fechar" : "Abrir"}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <input readOnly value={shareUrl} className="flex-1 rounded-lg border border-gm-200 px-3 py-2 text-xs text-gm-700" />
            <button onClick={copyLink} className="min-h-11 rounded-lg bg-gm-500 px-3 py-2 text-xs font-semibold text-white hover:bg-gm-600">
              {copied ? "Copiado!" : "Copiar link"}
            </button>
          </div>

          <form action={requestReferral.bind(null, postSaleId)} className="space-y-2">
            <input name="referred_name" placeholder="Nome de quem foi indicado (opcional)" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
            <input name="referred_phone" placeholder="Telefone (opcional)" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
            <input name="reward_description" placeholder="Recompensa oferecida (ex.: R$200 de desconto)" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
            <button className="min-h-11 w-full rounded-lg bg-gm-100 py-2 text-sm font-medium text-gm-900 hover:bg-gm-200">
              Registrar indicação
            </button>
          </form>

          {referrals.length > 0 && (
            <div className="space-y-1.5 border-t border-gm-50 pt-2">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-gm-700">{r.referred_name ?? "Indicação sem nome"}</span>
                  <span className="rounded-full bg-gm-100 px-2 py-0.5 font-medium text-gm-700">
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                  {r.status !== "recompensado" && (
                    <form action={updateReferralStatus.bind(null, r.id, "recompensado")}>
                      <button className="text-gm-500 hover:underline">Marcar recompensado</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
