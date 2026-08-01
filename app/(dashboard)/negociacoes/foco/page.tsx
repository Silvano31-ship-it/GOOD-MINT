// app/(dashboard)/negociacoes/foco/page.tsx — Modo Foco: sessão de 25 min de
// imersão em um único negócio (timer + checklist + atualizar a probabilidade
// no fim, que alimenta o Simulador). Busca as negociações abertas e passa pro
// componente client FocusMode.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { FocusMode } from "@/components/negociacoes/FocusMode";

export default async function FocoPage() {
  const user = await requireActiveAccount();

  const { rows: negotiations } = await db.query<{
    id: string;
    lead_name: string;
    property_address: string | null;
    value_cents: string | null;
    probability: number;
  }>(
    `SELECT n.id, l.name AS lead_name, p.address AS property_address, n.value_cents, n.probability
     FROM negotiations n
     JOIN leads l ON l.id = n.lead_id
     LEFT JOIN properties p ON p.id = n.property_id
     WHERE n.user_id = $1 AND n.status = 'aberta'
     ORDER BY (COALESCE(n.value_cents, 0) * n.probability) DESC`,
    [user.id]
  );

  return (
    <div>
      <Link href="/negociacoes" className="text-sm text-gm-500 hover:underline">← Negociações</Link>
      <PageHeader
        title="Modo Foco"
        subtitle="25 minutos de imersão total em um único negócio — sem dispersão, com um passo a passo pra avançar de verdade."
      />
      <FocusMode negotiations={negotiations} />
    </div>
  );
}
