// app/(dashboard)/imoveis/[id]/page.tsx — Tela 11. Edição de Imóvel.
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveAccount } from "@/lib/account-guard";
import { getProperty } from "@/lib/data";
import { PropertyForm } from "@/components/imoveis/PropertyForm";
import { updateProperty, deactivateProperty } from "@/app/(dashboard)/actions";

export default async function EditImovelPage({ params }: { params: { id: string } }) {
  const user = await requireActiveAccount();
  const property = await getProperty(user.id, params.id);
  if (!property) notFound();

  const save = updateProperty.bind(null, property.id);
  const remove = deactivateProperty.bind(null, property.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/imoveis" className="text-sm text-gm-500 hover:underline">← Voltar</Link>
      <div className="mb-6 mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gm-900">Editar imóvel</h1>
        <Link
          href={`/conteudo/novo?propertyId=${property.id}`}
          className="rounded-lg border border-gm-200 px-3 py-1.5 text-sm font-medium text-gm-700 hover:bg-gm-50"
        >
          📢 Gerar Post
        </Link>
      </div>
      <PropertyForm action={save} property={property} submitLabel="Salvar alterações" />

      <form action={remove} className="mt-4">
        <button className="text-sm text-red-600 hover:underline">Desativar este imóvel</button>
      </form>
    </div>
  );
}
