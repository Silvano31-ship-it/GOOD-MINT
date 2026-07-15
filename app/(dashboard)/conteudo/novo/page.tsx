// app/(dashboard)/conteudo/novo/page.tsx — assistente de geração de conteúdo.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getProperties } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { ConteudoWizard } from "@/components/conteudo/ConteudoWizard";

// Geração de imagem por IA (DALL-E) pode levar 10-20s — evita timeout da
// Server Action nesse período.
export const maxDuration = 60;

export default async function NovoConteudoPage({
  searchParams,
}: {
  searchParams: { propertyId?: string };
}) {
  const user = await requireActiveAccount();
  const properties = await getProperties(user.id);

  return (
    <div>
      <Link href="/conteudo" className="text-sm text-gm-500 hover:underline">← Conteúdo com IA</Link>
      <PageHeader title="Novo conteúdo" subtitle="Gere uma legenda e, se quiser, uma imagem para o seu post." />
      <ConteudoWizard properties={properties} initialPropertyId={searchParams.propertyId ?? null} />
    </div>
  );
}
