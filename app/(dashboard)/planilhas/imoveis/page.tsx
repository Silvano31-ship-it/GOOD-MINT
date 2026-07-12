// app/(dashboard)/planilhas/imoveis/page.tsx — Tela 22. Planilha de Imóveis.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getProperties, type Property } from "@/lib/data";
import { DataTable, type Column } from "@/components/planilhas/DataTable";
import { PageHeader } from "@/components/ui";
import { formatBRL } from "@/lib/format";

const TYPE_LABELS: Record<string, string> = { apartamento: "Apartamento", casa: "Casa", terreno: "Terreno", comercial: "Comercial", rural: "Rural", outro: "Outro" };
const STATUS_LABELS: Record<string, string> = { disponivel: "Disponível", reservado: "Reservado", vendido: "Vendido", alugado: "Alugado", inativo: "Inativo" };

export default async function PlanilhaImoveisPage() {
  const user = await requireActiveAccount();
  const properties = await getProperties(user.id);

  const columns: Column<Property>[] = [
    { key: "address", label: "Endereço", render: (p) => <Link href={`/imoveis/${p.id}`} className="font-medium text-gm-500 hover:underline">{p.address}</Link>, csvValue: (p) => p.address },
    { key: "property_type", label: "Tipo", render: (p) => TYPE_LABELS[p.property_type] ?? p.property_type, csvValue: (p) => TYPE_LABELS[p.property_type] ?? p.property_type },
    { key: "price_cents", label: "Valor", render: (p) => formatBRL(Number(p.price_cents)), sortValue: (p) => Number(p.price_cents), csvValue: (p) => formatBRL(Number(p.price_cents)) },
    { key: "status", label: "Status", render: (p) => STATUS_LABELS[p.status] ?? p.status, csvValue: (p) => STATUS_LABELS[p.status] ?? p.status },
  ];

  return (
    <div>
      <Link href="/planilhas" className="text-sm text-gm-500 hover:underline">← Planilhas</Link>
      <PageHeader title="Planilha de Imóveis" subtitle={`${properties.length} imóveis cadastrados`} />
      <DataTable rows={properties} columns={columns} filename="imoveis" />
    </div>
  );
}
