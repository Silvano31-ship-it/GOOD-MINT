// components/planilhas/ImoveisPlanilha.tsx — ver LeadsPlanilha.tsx: as colunas
// (com funções render/csvValue/sortValue) precisam ser montadas do lado do
// client, já que DataTable é "use client" e não pode receber funções comuns
// (só Server Actions) como prop vindo de uma Server Component.
"use client";

import Link from "next/link";
import { type Property } from "@/lib/constants";
import { DataTable, type Column } from "@/components/planilhas/DataTable";
import { formatBRL } from "@/lib/format";
import {
  updatePropertyAddress,
  updatePropertyPrice,
  updatePropertyType,
  updatePropertyStatus,
  bulkDeleteProperties,
  duplicateProperties,
} from "@/app/(dashboard)/actions";

const TYPE_LABELS: Record<string, string> = { apartamento: "Apartamento", casa: "Casa", terreno: "Terreno", comercial: "Comercial", rural: "Rural", outro: "Outro" };
const STATUS_LABELS: Record<string, string> = { disponivel: "Disponível", reservado: "Reservado", vendido: "Vendido", alugado: "Alugado", inativo: "Inativo" };
const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));
const COMMISSION_RATE = 0.06;

export function ImoveisPlanilha({ properties }: { properties: Property[] }) {
  const columns: Column<Property>[] = [
    {
      key: "address",
      label: "Endereço",
      render: (p) => <Link href={`/imoveis/${p.id}`} className="font-medium text-gm-500 hover:underline">{p.address}</Link>,
      csvValue: (p) => p.address,
      editable: { type: "text", onSave: updatePropertyAddress },
    },
    {
      key: "property_type",
      label: "Tipo",
      render: (p) => TYPE_LABELS[p.property_type] ?? p.property_type,
      csvValue: (p) => TYPE_LABELS[p.property_type] ?? p.property_type,
      editable: { type: "select", options: TYPE_OPTIONS, editValue: (p) => p.property_type, onSave: updatePropertyType },
    },
    {
      key: "price_cents",
      label: "Valor",
      render: (p) => (
        <span className={p.status === "vendido" ? "text-gm-700/40 line-through" : ""}>{formatBRL(Number(p.price_cents))}</span>
      ),
      sortValue: (p) => Number(p.price_cents),
      csvValue: (p) => formatBRL(Number(p.price_cents)),
      editable: { type: "number", editValue: (p) => String(Number(p.price_cents) / 100), onSave: updatePropertyPrice },
    },
    {
      key: "status",
      label: "Status",
      render: (p) => STATUS_LABELS[p.status] ?? p.status,
      csvValue: (p) => STATUS_LABELS[p.status] ?? p.status,
      editable: { type: "select", options: STATUS_OPTIONS, editValue: (p) => p.status, onSave: updatePropertyStatus },
    },
  ];

  return (
    <DataTable
      rows={properties}
      columns={columns}
      filename="imoveis"
      selectable
      rowClassName={(p) => (p.status === "vendido" ? "bg-green-50" : "")}
      footerStats={(rows) => {
        const total = rows.reduce((sum, p) => sum + Number(p.price_cents), 0);
        return [
          { label: "Total de imóveis", value: String(rows.length) },
          { label: "Valor total", value: formatBRL(total) },
          { label: "Comissão estimada (6%)", value: formatBRL(Math.round(total * COMMISSION_RATE)) },
          { label: "Média por item", value: formatBRL(rows.length ? Math.round(total / rows.length) : 0) },
        ];
      }}
      bulkActions={{
        exportSelected: true,
        onDelete: bulkDeleteProperties,
        onDuplicate: duplicateProperties,
      }}
    />
  );
}
