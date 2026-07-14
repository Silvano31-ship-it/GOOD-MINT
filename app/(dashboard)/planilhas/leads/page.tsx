// app/(dashboard)/planilhas/leads/page.tsx — Tela 21. Planilha de Leads.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getLeads, LEAD_STAGES, type Lead } from "@/lib/data";
import { DataTable, type Column } from "@/components/planilhas/DataTable";
import { PlanilhasTabs } from "@/components/planilhas/PlanilhasTabs";
import { PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format";
import {
  updateLeadName,
  updateLeadPhone,
  updateLeadOrigin,
  updateLeadStageField,
  bulkDeleteLeads,
  duplicateLeads,
  bulkUpdateLeadStage,
} from "@/app/(dashboard)/actions";

const STALL_DAYS = 5;

export default async function PlanilhaLeadsPage() {
  const user = await requireActiveAccount();
  const leads = await getLeads(user.id);
  const stageLabel = (k: string) => LEAD_STAGES.find((s) => s.key === k)?.label ?? k;
  const stageOptions = LEAD_STAGES.map((s) => ({ value: s.key, label: s.label }));

  function isStale(l: Lead): boolean {
    if (l.funnel_stage === "fechado" || l.funnel_stage === "perdido") return false;
    if (!l.last_contact_at) return true;
    return Date.now() - new Date(l.last_contact_at).getTime() > STALL_DAYS * 86400000;
  }

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
      editable: { type: "text", editValue: (l) => l.origin ?? "", onSave: updateLeadOrigin },
    },
    {
      key: "funnel_stage",
      label: "Etapa",
      render: (l) => stageLabel(l.funnel_stage),
      csvValue: (l) => stageLabel(l.funnel_stage),
      editable: { type: "select", options: stageOptions, editValue: (l) => l.funnel_stage, onSave: updateLeadStageField },
    },
    { key: "last_contact_at", label: "Último contato", render: (l) => formatDate(l.last_contact_at), sortValue: (l) => l.last_contact_at ?? "", csvValue: (l) => formatDate(l.last_contact_at) },
  ];

  return (
    <div>
      <Link href="/planilhas" className="text-sm text-gm-500 hover:underline">← Planilhas</Link>
      <PageHeader title="Planilha de Leads" subtitle={`${leads.length} leads cadastrados`} />
      <PlanilhasTabs />
      <DataTable
        rows={leads}
        columns={columns}
        filename="leads"
        selectable
        rowClassName={(l) => (isStale(l) ? "bg-amber-50" : "")}
        footerStats={(rows) => [{ label: "Total de registros", value: String(rows.length) }]}
        bulkActions={{
          exportSelected: true,
          onDelete: bulkDeleteLeads,
          onDuplicate: duplicateLeads,
          stageOptions,
          stageLabel: "Mover etapa",
          onChangeStage: bulkUpdateLeadStage,
        }}
      />
    </div>
  );
}
