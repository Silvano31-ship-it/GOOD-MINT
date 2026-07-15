// app/(dashboard)/layout.tsx — layout protegido da área logada.
// Aplica a guarda de conta (suspensa → /conta-suspensa) e mostra o aviso de trial.
import Link from "next/link";
import { requireActiveAccount, trialDaysLeft } from "@/lib/account-guard";
import { Sidebar } from "@/components/Sidebar";
import { DashboardBackground } from "@/components/dashboard/DashboardBackground";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireActiveAccount();
  const daysLeft = trialDaysLeft(user);

  return (
    <div
      className="flex min-h-screen flex-col bg-gm-50/40 md:flex-row"
      data-gm-bg={user.background_url ? "true" : undefined}
    >
      <DashboardBackground url={user.background_url} type={user.background_type} />
      <Sidebar transparent={!!user.background_url} />
      <main className="flex-1">
        {user.ai_unlimited ? (
          <div className="mx-4 mt-4 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-red-400/70 bg-white/90 px-4 py-2.5 text-center text-sm text-gm-900 shadow-sm backdrop-blur-sm md:mx-8">
            <span>✨ <b>Conta ilimitada</b> — acesso total, sem limites de plano.</span>
          </div>
        ) : daysLeft !== null && daysLeft <= 3 ? (
          <div className="mx-4 mt-4 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-red-400/70 bg-white/90 px-4 py-2.5 text-center text-sm text-gm-900 shadow-sm backdrop-blur-sm md:mx-8">
            <span>
              🎁 Teste grátis: <b>{daysLeft} {daysLeft === 1 ? "dia restante" : "dias restantes"}</b>.
              Sua assinatura começa depois disso.
            </span>
            <Link href="/configuracoes/plano" className="font-semibold text-gm-500 hover:underline">
              Gerenciar plano
            </Link>
          </div>
        ) : user.account_status === "active" && user.plan_name ? (
          <div className="mx-4 mt-4 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-red-400/70 bg-white/90 px-4 py-2.5 text-center text-sm text-gm-900 shadow-sm backdrop-blur-sm md:mx-8">
            <span>✅ Plano atual: <b>{user.plan_name}</b></span>
            <Link href="/configuracoes/plano" className="font-semibold text-gm-500 hover:underline">
              Gerenciar plano
            </Link>
          </div>
        ) : null}
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
        <footer className="px-4 pb-6 text-center text-xs text-gm-700/40 md:px-8">
          GOOD MINT · CRM do corretor autônomo
        </footer>
      </main>
    </div>
  );
}
