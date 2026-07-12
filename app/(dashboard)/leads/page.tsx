// app/(dashboard)/leads/page.tsx — Tela 8. Leads — Funil Kanban.
import { requireActiveAccount } from "@/lib/account-guard";
import { getLeads, getCounts } from "@/lib/data";
import { KanbanBoard } from "@/components/leads/KanbanBoard";
import { NewLeadButton } from "@/components/leads/NewLeadButton";
import { PageHeader, EmptyState } from "@/components/ui";
import { UpgradeNotice } from "@/components/UpgradeNotice";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { limite?: string };
}) {
  const user = await requireActiveAccount();
  const [leads, counts] = await Promise.all([getLeads(user.id), getCounts(user.id)]);

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle={`${counts.leadsActive}${counts.leadLimit ? ` / ${counts.leadLimit}` : ""} leads ativos · arraste os cards entre as etapas`}
        action={<NewLeadButton />}
      />

      {searchParams.limite && (
        <UpgradeNotice
          message={`Você atingiu o limite de ${counts.leadLimit} leads ativos do plano MINT Start.`}
        />
      )}

      {leads.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="Nenhum lead ainda"
          desc="Cadastre seu primeiro contato e comece a organizar seu funil de vendas."
        />
      ) : (
        <KanbanBoard initialLeads={leads} />
      )}
    </div>
  );
}
