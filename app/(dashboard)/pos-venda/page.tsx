// app/(dashboard)/pos-venda/page.tsx — Pós-Venda — quadro Kanban (agrupado por
// kanban_status, coluna operacional separada da etapa linear).
import { requireActiveAccount } from "@/lib/account-guard";
import { getPostSales } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/ui";
import { PosVendaTabs } from "@/components/pos-venda/PosVendaTabs";
import { KanbanBoard } from "@/components/pos-venda/KanbanBoard";

export default async function PosVendaPage() {
  const user = await requireActiveAccount();
  const items = await getPostSales(user.id);

  return (
    <div>
      <PageHeader
        title="Pós-Venda"
        subtitle="Acompanhe cada cliente da assinatura do contrato até a pesquisa de satisfação."
      />
      <PosVendaTabs />

      {items.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Nenhum processo de pós-venda"
          desc="Ao fechar uma negociação, inicie o acompanhamento de pós-venda para manter o cliente informado."
          cta={{ href: "/negociacoes", label: "Ver negociações" }}
        />
      ) : (
        <KanbanBoard items={items} />
      )}
    </div>
  );
}
