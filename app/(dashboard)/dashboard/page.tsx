// app/(dashboard)/dashboard/page.tsx — Tela 7. Dashboard — Home.
// Fica só com a saudação e as ações rápidas — bola de cristal, contadores,
// funil, metas e o resto viraram a tela "Relatório | GOOD 🟢"
// (ver app/(dashboard)/relatorio/page.tsx), pra deixar isso aqui limpo.
// As ações rápidas agora são personalizáveis (ver QuickActionsCustom).
import { redirect } from "next/navigation";
import { requireActiveAccount } from "@/lib/account-guard";
import { DashboardGreeting } from "@/components/DashboardGreeting";
import { QuickActionsCustom } from "@/components/dashboard/QuickActionsCustom";

export default async function DashboardHome() {
  const user = await requireActiveAccount();
  if (!user.onboarding_done) redirect("/onboarding");

  return (
    <div className="space-y-8">
      <DashboardGreeting fullName={user.full_name} initialEmoji={user.dashboard_emoji} />
      <QuickActionsCustom />
    </div>
  );
}
