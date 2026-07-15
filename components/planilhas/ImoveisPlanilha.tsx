// components/planilhas/ImoveisPlanilha.tsx — ver LeadsPlanilha.tsx: as colunas
// (com funções render/csvValue/sortValue) precisam ser montadas do lado do
// client, já que DataTable é "use client" e não pode receber funções comuns
// (só Server Actions) como prop vindo de uma Server Component.
"use client";

import { useState } from "react";
import Link from "next/link";
import { type Property, COMMISSION_RATE } from "@/lib/constants";
import { DataTable, type Column } from "@/components/planilhas/DataTable";
import { BarBreakdown } from "@/components/planilhas/BarBreakdown";
import { ImportModal, type ImportField } from "@/components/planilhas/ImportModal";
import { formatBRL } from "@/lib/format";
import { soma, media, contar } from "@/lib/planilha-formulas";
import {
  updatePropertyAddress,
  updatePropertyPrice,
  updatePropertyType,
  updatePropertyStatus,
  bulkDeleteProperties,
  duplicateProperties,
  importProperties,
} from "@/app/(dashboard)/actions";

const TYPE_LABELS: Record<string, string> = { apartamento: "Apartamento", casa: "Casa", terreno: "Terreno", comercial: "Comercial", rural: "Rural", outro: "Outro" };
const STATUS_LABELS: Record<string, string> = { disponivel: "Disponível", reservado: "Reservado", vendido: "Vendido", alugado: "Alugado", inativo: "Inativo" };
const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));
const TYPE_LABEL_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(TYPE_LABELS).map(([key, label]) => [label.toLowerCase(), key])
);
const STATUS_LABEL_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_LABELS).map(([key, label]) => [label.toLowerCase(), key])
);

interface ImportPropertyRow {
  address: string;
  property_type?: string;
  price_cents?: number;
  area_m2?: string;
  status?: string;
}

const IMPORT_FIELDS: ImportField[] = [
  { key: "address", label: "Endereço", required: true },
  { key: "property_type", label: "Tipo" },
  { key: "price_cents", label: "Valor" },
  { key: "area_m2", label: "Área (m²)" },
  { key: "status", label: "Status" },
];

/** Aceita tanto "350000" quanto "R$ 350.000,00" (o formato que sai do próprio
 * CSV exportado — assim exportar → editar no Excel → importar funciona). */
function parseCurrencyToCents(raw: string): number {
  const cleaned = raw.replace(/[^\d,.-]/g, "");
  if (!cleaned) return 0;
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  const n = Number(normalized);
  return isNaN(n) ? 0 : Math.round(n * 100);
}

function buildImportRow(values: Record<string, string>): ImportPropertyRow | null {
  if (!values.address?.trim()) return null;
  const typeKey = values.property_type ? TYPE_LABEL_TO_KEY[values.property_type.trim().toLowerCase()] ?? values.property_type.trim().toLowerCase() : undefined;
  const statusKey = values.status ? STATUS_LABEL_TO_KEY[values.status.trim().toLowerCase()] ?? values.status.trim().toLowerCase() : undefined;
  return {
    address: values.address,
    property_type: typeKey,
    price_cents: values.price_cents ? parseCurrencyToCents(values.price_cents) : undefined,
    area_m2: values.area_m2,
    status: statusKey,
  };
}

export function ImoveisPlanilha({ properties }: { properties: Property[] }) {
  const [importing, setImporting] = useState(false);
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
      filterable: true,
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
      filterable: true,
    },
  ];

  const byStatus = STATUS_OPTIONS.map((o) => ({
    label: o.label,
    value: properties.filter((p) => p.status === o.value).length,
  }));

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={() => setImporting(true)}
          className="rounded-lg border border-gm-200 px-3 py-1.5 text-sm font-medium text-gm-700 hover:bg-gm-50"
        >
          ⬆ Importar
        </button>
      </div>
      {importing && (
        <ImportModal<ImportPropertyRow>
          title="Importar imóveis"
          fields={IMPORT_FIELDS}
          buildRow={buildImportRow}
          onImport={importProperties}
          onClose={() => setImporting(false)}
        />
      )}
      <BarBreakdown title="Imóveis por status" items={byStatus} />
      <DataTable
        rows={properties}
        columns={columns}
        filename="imoveis"
        selectable
        rowClassName={(p) => (p.status === "vendido" ? "bg-green-50" : "")}
        footerStats={(rows) => {
          const priceOf = (p: Property) => Number(p.price_cents);
          const total = soma(rows, priceOf);
          return [
            { label: "Total de imóveis", value: String(contar(rows)) },
            { label: "Valor total", value: formatBRL(total) },
            { label: "Comissão estimada (6%)", value: formatBRL(Math.round(total * COMMISSION_RATE)) },
            { label: "Média por item", value: formatBRL(Math.round(media(rows, priceOf))) },
          ];
        }}
        dedupe={{
          keyOf: (p) => p.address.trim().toLowerCase(),
          onRemove: bulkDeleteProperties,
        }}
        bulkActions={{
          exportSelected: true,
          onDelete: bulkDeleteProperties,
          onDuplicate: duplicateProperties,
        }}
      />
    </div>
  );
}
