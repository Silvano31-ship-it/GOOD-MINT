// app/conta-suspensa/page.tsx — Tela 19. Conta Suspensa (falha de pagamento).
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/account-guard";
import { LogoutButton } from "@/components/LogoutButton";
import { Logo } from "@/components/Logo";

export default async function ContaSuspensaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Se a conta não está suspensa, não faz sentido ficar aqui.
  if (user.account_status !== "suspended") redirect("/dashboard");

  return (
    <main className="gm-radial flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mb-4 flex justify-center">
          <Logo />
        </div>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-3xl">
          ⚠️
        </div>
        <h1 className="text-xl font-bold text-gm-900">Sua conta está suspensa</h1>
        <p className="mt-2 text-sm text-gm-700/70">
          Não conseguimos processar a cobrança do seu plano. Atualize seu cartão
          para reativar o acesso a todos os recursos do GOOD MINT.
        </p>
        <Link
          href="/configuracoes/plano"
          className="mt-6 block rounded-xl bg-gm-500 py-3 font-semibold text-white hover:bg-gm-600"
        >
          Atualizar forma de pagamento
        </Link>
        <div className="mt-4">
          <LogoutButton className="text-sm text-gm-700/60 hover:text-gm-500" />
        </div>
      </div>
    </main>
  );
}
