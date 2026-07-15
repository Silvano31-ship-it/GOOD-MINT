// components/planilhas/LeadsPlanilha.tsx — monta as colunas (com render/csvValue/
// sortValue, que são funções comuns, não Server Actions) do lado do client.
// Precisa existir separado da page.tsx: DataTable é "use client", e uma Server
// Component não pode passar funções comuns (só Server Actions) como prop pra
// um Client Component — só os dados brutos (leads) cruzam essa fronteira.
"use client";

import { useState } from "react";
import Link from "next/link";
import { LEAD_STAGES, isStale, type Lead } from "@/lib/constants";
import { DataTable, type Column } from "@/components/planilhas/DataTable";
import { BarBreakdown } from "@/components/planilhas/BarBreakdown";
import { ImportModal, type ImportField } from "@/components/planilhas/ImportModal";
import { formatDate, formatBRL, onlyDigits } from "@/lib/format";
import { contar, contarSe, soma, media } from "@/lib/planilha-formulas";
import {
  updateLeadName,
  updateLeadPhone,
  updateLeadOrigin,
  updateLeadStageField,
  updateLeadEstimatedValue,
  bulkDeleteLeads,
  duplicateLeads,
  bulkUpdateLeadStage,
  importLeads,
} from "@/app/(dashboard)/actions";

interface ImportLeadRow {
  name: string;
  phone?: string;
  email?: string;
  origin?: string;
}

const IMPORT_FIELDS: ImportField[] = [
  { key: "name", label: "Nome", required: true },
  { key: "phone", label: "Telefone", aliases: ["telefone"] },
  { key: "email", label: "E-mail", aliases: ["email"] },
  { key: "origin", label: "Origem", aliases: ["origem"] },
];

function buildImportRow(values: Record<string, string>): ImportLeadRow | null {
  if (!values.name?.trim()) return null;
  return { name: values.name, phone: values.phone, email: values.email, origin: values.origin };
}

const COMMON_ORIGINS = ["Indicação", "Redes sociais", "Site/Portal imobiliário", "Anúncio pago", "Placa/Rua", "Outro"];

export function LeadsPlanilha({ leads }: { leads: Lead[] }) {
  const [importing, setImporting] = useState(false);
  const stageLabel = (k: string) => LEAD_STAGES.find((s) => s.key === k)?.label ?? k;
  const stageOptions = LEAD_STAGES.map((s) => ({ value: s.key, label: s.label }));
  // Lista fixa + qualquer valor de origem já salvo em texto livre (dados antigos),
  // pra não "sumir" nem trocar silenciosamente o valor de um lead existente.
  const existingOrigins = Array.from(new Set(leads.map((l) => l.origin).filter(Boolean))) as string[];
  const originOptions = [
    { value: "", label: "—" },
    ...Array.from(new Set([...COMMON_ORIGINS, ...existingOrigins])).map((o) => ({ value: o, label: o })),
  ];

  const columns: Column<Lead>[] = [
    {
      key: "name",
      label: "Nome",
      render: (l) => <Link href={`/leads/${l.id}`} className="font-medium text-gm-500 hover:underline">{l.name}</Link>,
      csvValue: (l) => l.name,
      editable: { type: "text", onSave: updateLeadName },
    },
    {
      key: "phone",
      label: "Telefone",
      csvValue: (l) => l.phone ?? "",
      editable: { type: "text", editValue: (l) => l.phone ?? "", onSave: updateLeadPhone },
    },
    {
      key: "whatsapp",
      label: "",
      render: (l) =>
        l.phone ? (
          <a
            href={`https://wa.me/${l.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir no WhatsApp"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366]/10 text-sm hover:bg-[#25D366]/20"
          >
            💬
          </a>
        ) : null,
      csvValue: () => "",
    },
    {
      key: "origin",
      label: "Origem",
      csvValue: (l) => l.origin ?? "",
      editable: { type: "select", options: originOptions, editValue: (l) => l.origin ?? "", onSave: updateLeadOrigin },
      filterable: true,
    },
    {
      key: "funnel_stage",
      label: "Etapa",
      render: (l) => stageLabel(l.funnel_stage),
      csvValue: (l) => stageLabel(l.funnel_stage),
      editable: { type: "select", options: stageOptions, editValue: (l) => l.funnel_stage, onSave: updateLeadStageField },
      filterable: true,
    },
    { key: "last_contact_at", label: "Último contato", render: (l) => formatDate(l.last_contact_at), sortValue: (l) => l.last_contact_at ?? "", csvValue: (l) => formatDate(l.last_contact_at) },
    {
      key: "estimated_value_cents",
      label: "Valor estimado",
      render: (l) => formatBRL(l.estimated_value_cents ? Number(l.estimated_value_cents) : null),
      sortValue: (l) => Number(l.estimated_value_cents ?? 0),
      csvValue: (l) => formatBRL(l.estimated_value_cents ? Number(l.estimated_value_cents) : null),
      editable: {
        type: "number",
        editValue: (l) => (l.estimated_value_cents ? String(Number(l.estimated_value_cents) / 100) : ""),
        onSave: updateLeadEstimatedValue,
      },
    },
  ];

  const byStage = LEAD_STAGES.map((s) => ({
    label: s.label,
    value: leads.filter((l) => l.funnel_stage === s.key).length,
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
        <ImportModal<ImportLeadRow>
          title="Importar leads"
          fields={IMPORT_FIELDS}
          buildRow={buildImportRow}
          onImport={importLeads}
          onClose={() => setImporting(false)}
        />
      )}
      <BarBreakdown title="Leads por etapa" items={byStage} />
      <DataTable
        rows={leads}
        columns={columns}
        filename="leads"
        selectable
        rowClassName={(l) => (isStale(l) ? "bg-amber-50" : "")}
        footerStats={(rows) => {
          const valueOf = (l: Lead) => Number(l.estimated_value_cents ?? 0);
          return [
            { label: "Total de registros", value: String(contar(rows)) },
            { label: "Leads parados", value: String(contarSe(rows, isStale)) },
            { label: "Valor estimado total", value: formatBRL(soma(rows, valueOf)) },
            { label: "Valor estimado médio", value: formatBRL(Math.round(media(rows, valueOf))) },
          ];
        }}
        dedupe={{
          keyOf: (l) => `${l.name.trim().toLowerCase()}|${onlyDigits(l.phone ?? "")}`,
          onRemove: bulkDeleteLeads,
        }}
        bulkActions={{
          exportSelected: true,
          onDelete: bulkDeleteLeads,
          onDuplicate: duplicateLeads,
          stageOptions,
          stageLabel: "Mover etapa",
          onChangeStage: bulkUpdateLeadStage,
        }}
        mobileCard={(l, { selected, toggleSelect }) => (
          <div className={`flex items-start gap-3 px-4 py-3 ${isStale(l) ? "bg-amber-50" : ""}`}>
            <input
              type="checkbox"
              checked={selected}
              onChange={toggleSelect}
              aria-label="Selecionar lead"
              className="mt-1 h-4 w-4 flex-none"
            />
            <Link href={`/leads/${l.id}`} className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-gm-900">{l.name}</span>
                {l.phone && (
                  <a
                    href={`https://wa.me/${l.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Abrir no WhatsApp"
                    className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#25D366]/10 text-sm"
                  >
                    💬
                  </a>
                )}
              </div>
              {l.phone && <div className="mt-0.5 text-xs text-gm-700/60">{l.phone}</div>}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-gm-50 px-1.5 py-0.5 text-[11px] text-gm-700">{stageLabel(l.funnel_stage)}</span>
                {l.origin && <span className="rounded bg-gm-50 px-1.5 py-0.5 text-[11px] text-gm-500">{l.origin}</span>}
                {isStale(l) && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                    ⏰ Atrasado
                  </span>
                )}
              </div>
              {l.estimated_value_cents && (
                <div className="mt-1 text-xs font-medium text-gm-500">
                  {formatBRL(Number(l.estimated_value_cents))}
                </div>
              )}
            </Link>
          </div>
        )}
      />
    </div>
  );
}
