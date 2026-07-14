// app/(dashboard)/configuracoes/fundo/page.tsx — Personalizar Fundo do Dashboard.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { PageHeader } from "@/components/ui";
import { BackgroundSelector } from "@/components/dashboard/BackgroundSelector";

export default async function FundoPage() {
  const user = await requireActiveAccount();

  return (
    <div>
      <Link href="/configuracoes" className="text-sm text-gm-500 hover:underline">← Configurações</Link>
      <PageHeader title="Personalizar Fundo" subtitle="Escolha uma foto ou vídeo pra usar como fundo do seu Dashboard." />

      <div className="max-w-xl">
        <BackgroundSelector currentUrl={user.background_url} currentType={user.background_type} />
      </div>
    </div>
  );
}
