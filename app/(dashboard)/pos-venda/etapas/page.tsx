// app/(dashboard)/pos-venda/etapas/page.tsx — 3ª aba do Pós-Venda: permite o
// corretor renomear os nomes das 9 etapas do processo (ver migration 019).
import { requireActiveAccount } from "@/lib/account-guard";
import { getPostSaleStageOverrides, resolveStages } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { PosVendaTabs } from "@/components/pos-venda/PosVendaTabs";
import { SubmitButton } from "@/components/SubmitButton";
import { updatePostSaleStageLabels } from "@/app/(dashboard)/pos-venda/actions";

export default async function PosVendaEtapasPage({
  searchParams,
}: {
  searchParams: { salvo?: string };
}) {
  const user = await requireActiveAccount();
  const overrides = await getPostSaleStageOverrides(user.id);
  const stages = resolveStages(overrides);

  return (
    <div>
      <PageHeader
        title="Pós-Venda"
        subtitle="Acompanhe cada cliente da assinatura do contrato até a pesquisa de satisfação."
      />
      <PosVendaTabs />

      <h2 className="mb-1 text-lg font-semibold text-gm-900">Personalizar etapas</h2>
      <p className="mb-4 text-sm text-gm-700/60">
        Troque o nome de qualquer etapa pelo termo que você usa no dia a dia. Deixe em branco pra usar o nome padrão.
      </p>

      {searchParams.salvo === "1" && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
          ✓ Nomes das etapas salvos com sucesso.
        </div>
      )}

      <form action={updatePostSaleStageLabels} className="gm-card max-w-xl space-y-3 p-6">
        {stages.map((s) => (
          <label key={s.key} className="block">
            <span className="mb-1 block text-xs font-medium text-gm-700/60">{s.label}</span>
            <input
              name={`label_${s.key}`}
              defaultValue={s.label}
              maxLength={60}
              className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
            />
          </label>
        ))}
        <SubmitButton>Salvar nomes das etapas</SubmitButton>
      </form>
    </div>
  );
}
