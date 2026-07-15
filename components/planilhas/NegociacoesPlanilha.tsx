// components/planilhas/NegociacoesPlanilha.tsx — ver LeadsPlanilha.tsx.
"use client";

import { type Negotiation, COMMISSION_RATE } from "@/lib/constants";
import { DataTable, type Column } from "@/components/planilhas/DataTable";
import { BarBreakdown } from "@/components/planilhas/BarBreakdown";
import { formatBRL, formatDate } from "@/lib/format";
import { soma, media, contar, contarSe } from "@/lib/planilha-formulas";
import { updateNegotiationValue, updateNegotiationStatus, bulkDeleteNegotiations } from "@/app/(dashboard)/actions";

const STATUS_LABELS: Record<string, string> = { aberta: "Aberta", fechada: "Fechada", perdida: "Perdida" };
const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));

function closedThisMonth(n: Negotiation): boolean {
  if (n.status !== "fechada" || !n.closed_at) return false;
  const closed = new Date(n.closed_at);
  const now = new Date();
  return closed.getFullYear() === now.getFullYear() && closed.getMonth() === now.getMonth();
}

export function NegociacoesPlanilha({ negotiations }: { negotiations: Negotiation[] }) {
  const columns: Column<Negotiation>[] = [
    { key: "lead_name", label: "Cliente", csvValue: (n) => n.lead_name },
    { key: "property_address", label: "Imóvel", csvValue: (n) => n.property_address ?? "" },
    { key: "negotiation_type", label: "Tipo", render: (n) => (n.negotiation_type === "venda" ? "Venda" : "Aluguel"), csvValue: (n) => n.negotiation_type },
    {
      key: "value_cents",
      label: "Valor",
      render: (n) => formatBRL(n.value_cents ? Number(n.value_cents) : null),
      sortValue: (n) => Number(n.value_cents ?? 0),
      csvValue: (n) => formatBRL(n.value_cents ? Number(n.value_cents) : null),
      editable: { type: "number", editValue: (n) => String(Number(n.value_cents ?? 0) / 100), onSave: updateNegotiationValue },
    },
    {
      key: "status",
      label: "Status",
      render: (n) => STATUS_LABELS[n.status] ?? n.status,
      csvValue: (n) => STATUS_LABELS[n.status] ?? n.status,
      editable: { type: "select", options: STATUS_OPTIONS, editValue: (n) => n.status, onSave: updateNegotiationStatus },
      filterable: true,
    },
    { key: "closed_at", label: "Fechada em", render: (n) => formatDate(n.closed_at), sortValue: (n) => n.closed_at ?? "", csvValue: (n) => formatDate(n.closed_at) },
  ];

  const byStatus = STATUS_OPTIONS.map((o) => ({
    label: o.label,
    value: negotiations.filter((n) => n.status === o.value).length,
  }));

  return (
    <div className="space-y-5">
      <BarBreakdown title="Negociações por status" items={byStatus} />
      <DataTable
        rows={negotiations}
        columns={columns}
        filename="negociacoes"
        selectable
        footerStats={(rows) => {
          const valueOf = (n: Negotiation) => Number(n.value_cents ?? 0);
          const total = soma(rows, valueOf);
          return [
            { label: "Total", value: String(contar(rows)) },
            { label: "Valor total", value: formatBRL(total) },
            { label: "Comissão estimada (6%)", value: formatBRL(Math.round(total * COMMISSION_RATE)) },
            { label: "Média", value: formatBRL(Math.round(media(rows, valueOf))) },
            { label: "Fechadas este mês", value: String(contarSe(rows, closedThisMonth)) },
          ];
        }}
        dedupe={{
          keyOf: (n) => `${n.lead_name.trim().toLowerCase()}|${(n.property_address ?? "").trim().toLowerCase()}|${n.negotiation_type}`,
          onRemove: bulkDeleteNegotiations,
        }}
        bulkActions={{ exportSelected: true }}
      />
    </div>
  );
}
