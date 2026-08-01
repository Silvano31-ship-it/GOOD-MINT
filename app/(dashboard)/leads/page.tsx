// app/(dashboard)/leads/page.tsx — Tela 8. Leads — Funil Kanban.
import Link from "next/link";
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
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/leads/silencio"
              className="rounded-lg border border-gm-200 px-4 py-2 text-sm font-semibold text-gm-700 hover:bg-gm-50"
            >
              🤫 Rastreador
            </Link>
            <NewLeadButton />
          </div>
        }
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
