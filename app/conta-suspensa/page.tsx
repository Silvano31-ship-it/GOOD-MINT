// app/conta-suspensa/page.tsx — Tela de reativação / fim do teste grátis.
// Chega aqui quem: (a) teve o pagamento recusado (conta suspensa), ou
// (b) o teste grátis de 3 dias acabou e ainda não assinou. Nos dois casos a
// pessoa assina/reativa o cartão direto nesta tela (o formulário posta em
// /api/subscribe, que libera o acesso na hora). É a única tela "logada" fora
// do guard de conta ativa — por isso o pagamento é feito aqui mesmo.
import { redirect } from "next/navigation";
import { getCurrentUser, isTrialExpired } from "@/lib/account-guard";
import { LogoutButton } from "@/components/LogoutButton";
import { Logo } from "@/components/Logo";
import { SubscribeForm } from "@/components/configuracoes/SubscribeForm";

export default async function ContaSuspensaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const suspended = user.account_status === "suspended";
  const trialOver = isTrialExpired(user);
  // Conta ativa / isenta / trial ainda válido → não faz sentido ficar aqui.
  if (!suspended && !trialOver) redirect("/dashboard");

  return (
    <main className="gm-radial flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-4 flex justify-center">
          <Logo />
        </div>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-3xl">
            {suspended ? "⚠️" : "👑"}
          </div>
          <h1 className="text-xl font-bold text-gm-900">
            {suspended ? "Sua conta está suspensa" : "Seu teste grátis terminou"}
          </h1>
          <p className="mt-2 text-sm text-gm-700/70">
            {suspended
              ? "Não conseguimos processar a cobrança do seu plano. Reative seu cartão abaixo para voltar a usar o GOOD MINT."
              : "Você aproveitou os 3 dias de teste 🎉 Para continuar com tudo liberado, assine o Plano Único abaixo — leva menos de 1 minuto."}
          </p>
        </div>

        <div className="mt-6">
          <SubscribeForm />
        </div>

        <div className="mt-4 text-center">
          <LogoutButton className="text-sm text-gm-700/60 hover:text-gm-500" />
        </div>
      </div>
    </main>
  );
}
