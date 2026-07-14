// app/(dashboard)/planilhas/negociacoes/page.tsx — Tela 23. Planilha de Negociações/Pós-Venda.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getNegotiations } from "@/lib/data";
import { NegociacoesPlanilha } from "@/components/planilhas/NegociacoesPlanilha";
import { PlanilhasTabs } from "@/components/planilhas/PlanilhasTabs";
import { PageHeader } from "@/components/ui";

export default async function PlanilhaNegociacoesPage() {
  const user = await requireActiveAccount();
  const negotiations = await getNegotiations(user.id);

  return (
    <div>
      <Link href="/planilhas" className="text-sm text-gm-500 hover:underline">← Planilhas</Link>
      <PageHeader title="Planilha de Negociações / Pós-Venda" subtitle={`${negotiations.length} negociações`} />
      <PlanilhasTabs />
      <NegociacoesPlanilha negotiations={negotiations} />
    </div>
  );
}
