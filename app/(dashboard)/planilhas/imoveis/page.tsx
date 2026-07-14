// app/(dashboard)/planilhas/imoveis/page.tsx — Tela 22. Planilha de Imóveis.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getProperties } from "@/lib/data";
import { ImoveisPlanilha } from "@/components/planilhas/ImoveisPlanilha";
import { PlanilhasTabs } from "@/components/planilhas/PlanilhasTabs";
import { PageHeader } from "@/components/ui";

export default async function PlanilhaImoveisPage() {
  const user = await requireActiveAccount();
  const properties = await getProperties(user.id);

  return (
    <div>
      <Link href="/planilhas" className="text-sm text-gm-500 hover:underline">← Planilhas</Link>
      <PageHeader title="Planilha de Imóveis" subtitle={`${properties.length} imóveis cadastrados`} />
      <PlanilhasTabs />
      <ImoveisPlanilha properties={properties} />
    </div>
  );
}
