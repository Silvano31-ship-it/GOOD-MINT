// app/(dashboard)/planilhas/leads/page.tsx — Tela 21. Planilha de Leads.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getLeads } from "@/lib/data";
import { LeadsPlanilha } from "@/components/planilhas/LeadsPlanilha";
import { PlanilhasTabs } from "@/components/planilhas/PlanilhasTabs";
import { PageHeader } from "@/components/ui";

export default async function PlanilhaLeadsPage() {
  const user = await requireActiveAccount();
  const leads = await getLeads(user.id);

  return (
    <div>
      <Link href="/planilhas" className="text-sm text-gm-500 hover:underline">← Planilhas</Link>
      <PageHeader title="Planilha de Leads" subtitle={`${leads.length} leads cadastrados`} />
      <PlanilhasTabs />
      <LeadsPlanilha leads={leads} />
    </div>
  );
}
