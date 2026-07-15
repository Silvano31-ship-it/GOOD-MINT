// app/(dashboard)/configuracoes/fundo/page.tsx — Personalizar Fundo, subpágina
// própria (mesma estrutura das outras seções de Configurações).
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { PageHeader } from "@/components/ui";
import { BackgroundSelector } from "@/components/dashboard/BackgroundSelector";

export default async function PersonalizarFundoPage() {
  const user = await requireActiveAccount();

  return (
    <div>
      <Link href="/configuracoes" className="text-sm text-gm-500 hover:underline">← Configurações</Link>
      <PageHeader title="Personalizar Fundo" subtitle="Foto ou vídeo de fundo do seu Dashboard." />

      <div className="max-w-xl">
        <BackgroundSelector currentUrl={user.background_url} currentType={user.background_type} />
      </div>
    </div>
  );
}
