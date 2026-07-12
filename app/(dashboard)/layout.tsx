// app/(dashboard)/layout.tsx — layout protegido da área logada.
// Aplica a guarda de conta (suspensa → /conta-suspensa) e mostra o aviso de trial.
import Link from "next/link";
import { requireActiveAccount, trialDaysLeft } from "@/lib/account-guard";
import { Sidebar } from "@/components/Sidebar";
import { SUPPORT_PHONE_DISPLAY } from "@/lib/constants";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireActiveAccount();
  const daysLeft = trialDaysLeft(user);

  return (
    <div className="flex min-h-screen flex-col bg-gm-50/40 md:flex-row">
      <Sidebar userName={user.full_name} avatarUrl={user.avatar_url} />
      <main className="flex-1">
        {daysLeft !== null && (
          <div className="flex flex-wrap items-center justify-center gap-2 bg-gm-900 px-4 py-2 text-center text-sm text-white">
            <span>
              🎁 Teste grátis: <b>{daysLeft} {daysLeft === 1 ? "dia restante" : "dias restantes"}</b>.
              Sua assinatura começa depois disso.
            </span>
            <Link href="/configuracoes/plano" className="font-semibold text-gm-300 hover:underline">
              Gerenciar plano
            </Link>
          </div>
        )}
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
        <footer className="px-4 pb-6 text-center text-xs text-gm-700/40 md:px-8">
          GOOD MINT · CRM do corretor autônomo · Suporte: {SUPPORT_PHONE_DISPLAY}
        </footer>
      </main>
    </div>
  );
}
