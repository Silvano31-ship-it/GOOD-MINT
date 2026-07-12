// app/(dashboard)/configuracoes/plano/page.tsx — Tela 17. Plano e Cobrança.
import Link from "next/link";
import { requireActiveAccount, trialDaysLeft } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { listSubscriptionPayments } from "@/lib/asaas";
import { cancelMySubscription } from "@/app/(dashboard)/actions";
import { PageHeader, Badge } from "@/components/ui";
import { formatBRL, formatDate } from "@/lib/format";
import { SubscribeForm } from "@/components/configuracoes/SubscribeForm";

const STATUS_LABELS: Record<string, string> = {
  trialing: "Em teste grátis", active: "Ativa", past_due: "Pagamento pendente",
  suspended: "Suspensa", canceled: "Cancelada",
};

export default async function PlanoPage() {
  const user = await requireActiveAccount();
  const daysLeft = trialDaysLeft(user);

  const { rows } = await db.query<{
    id: string; status: string; gateway_subscription_id: string | null;
    current_period_end: string | null; card_last4: string | null; card_brand: string | null;
    trial_ends_at: string; plan_code: string; plan_name: string; plan_price_cents: number;
  }>(
    `SELECT s.id, s.status, s.gateway_subscription_id, s.current_period_end,
            s.card_last4, s.card_brand, s.trial_ends_at,
            p.code AS plan_code, p.name AS plan_name, p.price_cents AS plan_price_cents
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     WHERE s.user_id=$1 ORDER BY s.created_at DESC LIMIT 1`,
    [user.id]
  );
  const subscription = rows[0];

  let payments: Awaited<ReturnType<typeof listSubscriptionPayments>> = [];
  if (subscription?.gateway_subscription_id) {
    try {
      payments = await listSubscriptionPayments(subscription.gateway_subscription_id);
    } catch (err) {
      console.error("Erro ao buscar faturas no Asaas:", err);
    }
  }

  const hasCard = !!subscription?.gateway_subscription_id;

  return (
    <div>
      <Link href="/configuracoes" className="text-sm text-gm-500 hover:underline">← Configurações</Link>
      <PageHeader title="Plano e Cobrança" subtitle="Sua assinatura, cartão e histórico de faturas." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="gm-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-gm-500">
                {subscription?.plan_name ?? "—"}
              </div>
              <div className="mt-1 text-2xl font-bold text-gm-900">
                {formatBRL(subscription?.plan_price_cents)}{" "}
                <span className="text-sm font-normal text-gm-700/60">/mês</span>
              </div>
            </div>
            {subscription && <Badge value={subscription.status} label={STATUS_LABELS[subscription.status] ?? subscription.status} />}
          </div>

          {daysLeft !== null && (
            <p className="mt-3 rounded-lg bg-gm-50 px-3 py-2 text-sm text-gm-700">
              🎁 Restam <b>{daysLeft} {daysLeft === 1 ? "dia" : "dias"}</b> de teste grátis.
            </p>
          )}

          {subscription?.card_last4 && (
            <p className="mt-3 text-sm text-gm-700/70">
              💳 Cartão {subscription.card_brand ?? ""} terminando em <b>{subscription.card_last4}</b>
            </p>
          )}

          {subscription && subscription.status !== "canceled" && hasCard && (
            <form action={cancelMySubscription} className="mt-6">
              <button className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                Cancelar assinatura
              </button>
              <p className="mt-2 text-xs text-gm-700/50">
                O cancelamento é imediato e sem multa. Seu acesso permanece até o fim do período já pago.
              </p>
            </form>
          )}

          {subscription?.status === "canceled" && (
            <p className="mt-4 text-sm text-gm-700/60">Assinatura cancelada.</p>
          )}

          {subscription && !hasCard && subscription.status !== "canceled" && (
            <div className="mt-6 border-t border-gm-100 pt-6">
              <h2 className="mb-1 font-semibold text-gm-900">Assinar um plano</h2>
              <p className="mb-4 text-sm text-gm-700/60">
                Você ainda não tem um cartão cadastrado. Escolha um plano e assine
                quando quiser — sem cobrança durante o teste grátis.
              </p>
              <SubscribeForm currentPlanCode={subscription.plan_code} />
            </div>
          )}
        </div>

        <div className="gm-card p-5">
          <h2 className="mb-3 font-semibold text-gm-900">Histórico de faturas</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-gm-700/50">Nenhuma fatura emitida ainda.</p>
          ) : (
            <ul className="space-y-2">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-gm-700/70">{formatDate(p.dueDate)}</span>
                  <span className="font-medium text-gm-900">{formatBRL(Math.round(p.value * 100))}</span>
                  {p.invoiceUrl && (
                    <a href={p.invoiceUrl} target="_blank" rel="noreferrer" className="text-gm-500 hover:underline">
                      Ver
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
