// app/(dashboard)/planilhas/leads/page.tsx — Tela 21. Planilha de Leads.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getLeads, LEAD_STAGES, type Lead } from "@/lib/data";
import { DataTable, type Column } from "@/components/planilhas/DataTable";
import { PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format";

export default async function PlanilhaLeadsPage() {
  const user = await requireActiveAccount();
  const leads = await getLeads(user.id);
  const stageLabel = (k: string) => LEAD_STAGES.find((s) => s.key === k)?.label ?? k;

  const columns: Column<Lead>[] = [
    { key: "name", label: "Nome", render: (l) => <Link href={`/leads/${l.id}`} className="font-medium text-gm-500 hover:underline">{l.name}</Link>, csvValue: (l) => l.name },
    { key: "phone", label: "Telefone", csvValue: (l) => l.phone ?? "" },
    { key: "origin", label: "Origem", csvValue: (l) => l.origin ?? "" },
    { key: "funnel_stage", label: "Etapa", render: (l) => stageLabel(l.funnel_stage), csvValue: (l) => stageLabel(l.funnel_stage) },
    { key: "last_contact_at", label: "Último contato", render: (l) => formatDate(l.last_contact_at), sortValue: (l) => l.last_contact_at ?? "", csvValue: (l) => formatDate(l.last_contact_at) },
  ];

  return (
    <div>
      <Link href="/planilhas" className="text-sm text-gm-500 hover:underline">← Planilhas</Link>
      <PageHeader title="Planilha de Leads" subtitle={`${leads.length} leads cadastrados`} />
      <DataTable rows={leads} columns={columns} filename="leads" />
    </div>
  );
}
