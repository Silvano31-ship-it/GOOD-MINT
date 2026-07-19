// app/(dashboard)/social/disparo/page.tsx — Disparo WhatsApp: mensagem-modelo
// personalizada ({nome}) enviada em fila pros leads selecionados, um toque por
// lead (semi-automático via wa.me — envio 100% automático depende da API
// oficial do WhatsApp Business, pendente de aprovação da Meta).
import { requireActiveAccount } from "@/lib/account-guard";
import { getLeads } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { DisparoWhatsApp } from "@/components/social/DisparoWhatsApp";

export default async function DisparoPage() {
  const user = await requireActiveAccount();
  const leads = await getLeads(user.id);
  const withPhone = leads
    .filter((l) => l.phone && l.phone.trim())
    .map((l) => ({ id: l.id, name: l.name, phone: l.phone as string, funnel_stage: l.funnel_stage }));

  return (
    <div>
      <PageHeader
        title="Disparo WhatsApp"
        subtitle="Selecione os leads, escreva uma mensagem-modelo e envie um a um com um toque — já personalizada com o nome de cada um."
      />
      <DisparoWhatsApp leads={withPhone} />
    </div>
  );
}
