
// app/(dashboard)/portal-cliente/page.tsx — lista dos processos de pós-venda
// ativos (mesma definição de "ativo" usada no dashboard de pós-venda:
// current_stage <> 'pesquisa_satisfacao') com o link de acompanhamento de
// cada cliente, contador de acessos e último acesso.
import { requireActiveAccount } from "@/lib/account-guard";
import { getPostSales } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { PortalClienteList } from "@/components/pos-venda/PortalClienteList";

export default async function PortalClientePage() {
  const user = await requireActiveAccount();
  const postSales = await getPostSales(user.id);
  const active = postSales.filter((ps) => ps.current_stage !== "pesquisa_satisfacao");

  return (
    <div>
      <PageHeader
        title="Portal do Cliente"
        subtitle="Link de acompanhamento sem login de cada cliente em pós-venda — copie, envie por WhatsApp e veja quem já acessou."
      />
      <PortalClienteList items={active} />
    </div>
  );
}
-- migrations/024_portal_cliente_acessos.sql — contador de acessos e último
-- acesso do portal do cliente (/acompanhar/[token]), pra alimentar a nova
-- página "Portal do Cliente" no menu do corretor. Aditiva/idempotente.

ALTER TABLE post_sale_processes ADD COLUMN IF NOT EXISTS portal_access_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE post_sale_processes ADD COLUMN IF NOT EXISTS portal_last_access_at TIMESTAMPTZ;
