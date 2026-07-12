// app/(dashboard)/imoveis/page.tsx — Tela 10. Imóveis — Lista.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getProperties, getCounts } from "@/lib/data";
import { PageHeader, EmptyState, Badge } from "@/components/ui";
import { UpgradeNotice } from "@/components/UpgradeNotice";
import { formatBRL } from "@/lib/format";

const TYPE_LABELS: Record<string, string> = {
  apartamento: "Apartamento", casa: "Casa", terreno: "Terreno",
  comercial: "Comercial", rural: "Rural", outro: "Outro",
};
const STATUS_LABELS: Record<string, string> = {
  disponivel: "Disponível", reservado: "Reservado", vendido: "Vendido",
  alugado: "Alugado", inativo: "Inativo",
};

export default async function ImoveisPage({ searchParams }: { searchParams: { limite?: string } }) {
  const user = await requireActiveAccount();
  const [properties, counts] = await Promise.all([getProperties(user.id), getCounts(user.id)]);

  return (
    <div>
      <PageHeader
        title="Imóveis"
        subtitle={`${counts.properties}${counts.propertyLimit ? ` / ${counts.propertyLimit}` : ""} imóveis cadastrados`}
        action={
          <Link href="/imoveis/novo" className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">
            + Cadastrar imóvel
          </Link>
        }
      />

      {searchParams.limite && (
        <UpgradeNotice message={`Você atingiu o limite de ${counts.propertyLimit} imóveis do plano MINT Start.`} />
      )}

      {properties.length === 0 ? (
        <EmptyState
          icon="🏠"
          title="Nenhum imóvel cadastrado"
          desc="Adicione os imóveis da sua carteira para vinculá-los às negociações."
          cta={{ href: "/imoveis/novo", label: "Cadastrar primeiro imóvel" }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Link key={p.id} href={`/imoveis/${p.id}`} className="gm-card p-5 transition hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-gm-500">{TYPE_LABELS[p.property_type]}</span>
                <Badge value={p.status} label={STATUS_LABELS[p.status] ?? p.status} />
              </div>
              <h3 className="mt-2 font-semibold text-gm-900">{p.address}</h3>
              <div className="mt-2 flex items-center gap-3 text-sm text-gm-700/70">
                <span className="font-bold text-gm-900">{formatBRL(Number(p.price_cents))}</span>
                {p.area_m2 && <span>· {Number(p.area_m2)} m²</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
