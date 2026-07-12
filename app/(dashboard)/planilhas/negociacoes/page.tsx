// app/(dashboard)/planilhas/negociacoes/page.tsx — Tela 23. Planilha de Negociações/Pós-Venda.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getNegotiations, type Negotiation } from "@/lib/data";
import { DataTable, type Column } from "@/components/planilhas/DataTable";
import { PageHeader } from "@/components/ui";
import { formatBRL, formatDate } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = { aberta: "Aberta", fechada: "Fechada", perdida: "Perdida" };

export default async function PlanilhaNegociacoesPage() {
  const user = await requireActiveAccount();
  const negotiations = await getNegotiations(user.id);

  const columns: Column<Negotiation>[] = [
    { key: "lead_name", label: "Cliente", csvValue: (n) => n.lead_name },
    { key: "property_address", label: "Imóvel", csvValue: (n) => n.property_address ?? "" },
    { key: "negotiation_type", label: "Tipo", render: (n) => (n.negotiation_type === "venda" ? "Venda" : "Aluguel"), csvValue: (n) => n.negotiation_type },
    { key: "value_cents", label: "Valor", render: (n) => formatBRL(n.value_cents ? Number(n.value_cents) : null), sortValue: (n) => Number(n.value_cents ?? 0), csvValue: (n) => formatBRL(n.value_cents ? Number(n.value_cents) : null) },
    { key: "status", label: "Status", render: (n) => STATUS_LABELS[n.status] ?? n.status, csvValue: (n) => STATUS_LABELS[n.status] ?? n.status },
    { key: "closed_at", label: "Fechada em", render: (n) => formatDate(n.closed_at), sortValue: (n) => n.closed_at ?? "", csvValue: (n) => formatDate(n.closed_at) },
  ];

  return (
    <div>
      <Link href="/planilhas" className="text-sm text-gm-500 hover:underline">← Planilhas</Link>
      <PageHeader title="Planilha de Negociações / Pós-Venda" subtitle={`${negotiations.length} negociações`} />
      <DataTable rows={negotiations} columns={columns} filename="negociacoes" />
    </div>
  );
}
