// components/financeiro/CommissionsList.tsx — lista de comissões com troca
// de status inline e remoção. Filtro simples por status (aplicado no
// navegador — mesma lógica de components/configuracoes/NotificationsList.tsx).
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Commission, CommissionStatus } from "@/lib/constants";
import { COMMISSION_STATUS_LABELS } from "@/lib/constants";
import { formatBRL, formatDate } from "@/lib/format";
import { updateCommissionStatus, deleteCommission } from "@/app/(dashboard)/actions";
import { EmptyState } from "@/components/ui";

const STATUS_BADGE: Record<CommissionStatus, string> = {
  pago: "bg-green-50 text-green-700 border-green-200",
  a_receber: "bg-amber-50 text-amber-700 border-amber-200",
  pendente: "bg-gm-50 text-gm-700 border-gm-200",
};

export function CommissionsList({ commissions }: { commissions: Commission[] }) {
  const [filter, setFilter] = useState<"todas" | CommissionStatus>("todas");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = commissions.filter((c) => filter === "todas" || c.status === filter);

  function changeStatus(id: string, status: CommissionStatus) {
    startTransition(async () => {
      await updateCommissionStatus(id, status);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm("Remover esta comissão? Essa ação não pode ser desfeita.")) return;
    startTransition(async () => {
      await deleteCommission(id);
      router.refresh();
    });
  }

  if (commissions.length === 0) {
    return <EmptyState icon="💰" title="Nenhuma comissão registrada" desc="Adicione uma comissão acima, ou registre direto de uma negociação fechada." />;
  }

  return (
    <div>
      <div className="mb-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "todas" | CommissionStatus)}
          className="min-h-9 rounded-lg border border-gm-200 px-2 py-1 text-sm"
        >
          <option value="todas">Todos os status</option>
          <option value="a_receber">A receber</option>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
        </select>
      </div>

      <div className="gm-card overflow-hidden">
        <div className="gm-scroll overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gm-50 text-left text-xs uppercase text-gm-700/60">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Imóvel</th>
                <th className="px-4 py-3">Valor da venda</th>
                <th className="px-4 py-3">%</th>
                <th className="px-4 py-3">Comissão</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-gm-50">
                  <td className="px-4 py-3 font-medium text-gm-900">{c.client_name}</td>
                  <td className="px-4 py-3 text-gm-700/70">{c.property_address ?? "—"}</td>
                  <td className="px-4 py-3">{formatBRL(Number(c.sale_value_cents))}</td>
                  <td className="px-4 py-3">{Number(c.commission_percent)}%</td>
                  <td className="px-4 py-3 font-semibold text-gm-900">{formatBRL(Number(c.commission_cents))}</td>
                  <td className="px-4 py-3">
                    <select
                      value={c.status}
                      disabled={pending}
                      onChange={(e) => changeStatus(c.id, e.target.value as CommissionStatus)}
                      className={`rounded-full border px-2 py-1 text-xs font-semibold ${STATUS_BADGE[c.status]}`}
                    >
                      <option value="a_receber">{COMMISSION_STATUS_LABELS.a_receber}</option>
                      <option value="pendente">{COMMISSION_STATUS_LABELS.pendente}</option>
                      <option value="pago">{COMMISSION_STATUS_LABELS.pago}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => remove(c.id)}
                      disabled={pending}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
