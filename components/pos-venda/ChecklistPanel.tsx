// components/pos-venda/ChecklistPanel.tsx — checklist de documentos do pós-venda.
"use client";

import { useState } from "react";
import type { ChecklistItem } from "@/lib/constants";
import { CHECKLIST_DOCUMENT_TYPES } from "@/lib/constants";
import {
  addChecklistItem,
  updateChecklistItemStatus,
  removeChecklistItem,
} from "@/app/(dashboard)/pos-venda/actions";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  enviado: "Enviado",
  validado: "Validado",
  rejeitado: "Rejeitado",
};

const STATUS_COLOR: Record<string, string> = {
  pendente: "bg-slate-100 text-slate-700",
  enviado: "bg-blue-100 text-blue-700",
  validado: "bg-green-100 text-green-700",
  rejeitado: "bg-red-100 text-red-700",
};

const VERDICT_LABEL: Record<string, string> = {
  legivel: "✅ Legível",
  ilegivel: "⚠️ Ilegível",
  suspeito: "❓ Suspeito",
};

export function ChecklistPanel({ postSaleId, items }: { postSaleId: string; items: ChecklistItem[] }) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const total = items.length;
  const done = items.filter((i) => i.status === "validado").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  async function handleUpload(itemId: string, file: File) {
    setUploadingId(itemId);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("item_id", itemId);
      await fetch(`/api/pos-venda/${postSaleId}/documentos`, { method: "POST", body: fd });
      window.location.reload();
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-gm-700/60">
          <span>{done} de {total} documentos validados</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gm-100">
          <div className="h-full rounded-full bg-gm-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-sm text-gm-700/50">Nenhum item no checklist ainda. Adicione abaixo.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="gm-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-medium text-gm-900">
                  {item.label} {item.is_required && <span className="text-red-500">*</span>}
                </div>
                {item.ai_verdict && (
                  <div className="mt-0.5 text-xs text-gm-700/60">
                    {VERDICT_LABEL[item.ai_verdict] ?? item.ai_verdict}
                    {item.ai_notes && ` — ${item.ai_notes}`}
                  </div>
                )}
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[item.status] ?? ""}`}>
                {STATUS_LABEL[item.status] ?? item.status}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {item.file_url && (
                <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gm-500 hover:underline">
                  Ver arquivo enviado
                </a>
              )}
              <label className="min-h-11 cursor-pointer rounded-lg border border-gm-200 px-3 py-1.5 text-xs font-medium text-gm-700 hover:bg-gm-50">
                {uploadingId === item.id ? "Enviando..." : item.file_url ? "Reenviar arquivo" : "Enviar arquivo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="hidden"
                  disabled={uploadingId === item.id}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(item.id, file);
                  }}
                />
              </label>
              {item.status !== "validado" && item.file_url && (
                <form action={updateChecklistItemStatus.bind(null, item.id, postSaleId, "validado")}>
                  <button className="min-h-11 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600">
                    Marcar validado
                  </button>
                </form>
              )}
              <form action={removeChecklistItem.bind(null, item.id, postSaleId)}>
                <button className="min-h-11 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">
                  Remover
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <form action={addChecklistItem.bind(null, postSaleId)} className="gm-card flex flex-wrap items-end gap-2 p-4">
        <label className="min-w-[160px] flex-1">
          <span className="mb-1 block text-xs font-medium text-gm-900">Tipo de documento</span>
          <select name="document_type" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm">
            {CHECKLIST_DOCUMENT_TYPES.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </label>
        <label className="min-w-[160px] flex-1">
          <span className="mb-1 block text-xs font-medium text-gm-900">Descrição</span>
          <input name="label" required placeholder="Ex.: RG do comprador" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
        </label>
        <label className="flex items-center gap-2 pb-2 text-xs text-gm-700">
          <input type="checkbox" name="is_required" defaultChecked className="h-4 w-4" />
          Obrigatório
        </label>
        <button className="min-h-11 rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">
          Adicionar
        </button>
      </form>
    </div>
  );
}
