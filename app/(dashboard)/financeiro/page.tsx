// app/(dashboard)/financeiro/page.tsx — Financeiro: lista de comissões,
// totalizadores e cadastro (manual ou pré-preenchido a partir de uma
// negociação fechada, ver "💰 Registrar comissão" em Negociações).
import { requireActiveAccount } from "@/lib/account-guard";
import { getCommissions } from "@/lib/data";
import { COMMISSION_RATE } from "@/lib/constants";
import { PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { CommissionsList } from "@/components/financeiro/CommissionsList";
import { createCommission } from "@/app/(dashboard)/actions";
import { formatBRL } from "@/lib/format";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: { negotiation_id?: string; client?: string; value?: string; address?: string };
}) {
  const user = await requireActiveAccount();
  const commissions = await getCommissions(user.id);

  const totals = commissions.reduce(
    (acc, c) => {
      const cents = Number(c.commission_cents);
      acc.total += cents;
      if (c.status === "pago") acc.pago += cents;
      if (c.status === "a_receber") acc.aReceber += cents;
      return acc;
    },
    { total: 0, pago: 0, aReceber: 0 }
  );

  const prefillValue = searchParams.value ? (Number(searchParams.value) / 100).toFixed(2) : "";

  return (
    <div>
      <PageHeader title="Financeiro" subtitle="Suas comissões: quanto já ganhou e quanto ainda vai receber." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="gm-card p-4">
          <div className="text-xs font-medium text-gm-700/60">Total em comissões</div>
          <div className="mt-1 text-2xl font-bold text-gm-900">{formatBRL(totals.total)}</div>
        </div>
        <div className="gm-card p-4">
          <div className="text-xs font-medium text-gm-700/60">A receber</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{formatBRL(totals.aReceber)}</div>
        </div>
        <div className="gm-card p-4">
          <div className="text-xs font-medium text-gm-700/60">Já pago</div>
          <div className="mt-1 text-2xl font-bold text-green-600">{formatBRL(totals.pago)}</div>
        </div>
      </div>

      <details className="gm-card mb-6 p-5" open={Boolean(searchParams.negotiation_id)}>
        <summary className="cursor-pointer font-semibold text-gm-900">+ Nova comissão</summary>
        <form action={createCommission} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="negotiation_id" value={searchParams.negotiation_id ?? ""} />
          <input
            name="client_name"
            required
            placeholder="Nome do cliente *"
            defaultValue={searchParams.client ?? ""}
            className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="property_address"
            placeholder="Endereço do imóvel (opcional)"
            defaultValue={searchParams.address ?? ""}
            className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="sale_value"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="Valor da venda (R$) *"
            defaultValue={prefillValue}
            className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
          />
          <input
            name="commission_percent"
            type="number"
            step="0.1"
            min="0"
            max="100"
            defaultValue={COMMISSION_RATE * 100}
            placeholder="% Comissão"
            className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
          />
          <select name="status" defaultValue="a_receber" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm">
            <option value="a_receber">A receber</option>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
          </select>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-gm-700/60">Data da venda</span>
            <input name="sale_date" type="date" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-gm-700/60">Data prevista de pagamento</span>
            <input name="expected_payment_date" type="date" className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm" />
          </label>
          <div className="sm:col-span-2">
            <SubmitButton>Adicionar comissão</SubmitButton>
          </div>
        </form>
      </details>

      <CommissionsList commissions={commissions} />
    </div>
  );
}
