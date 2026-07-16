// app/(dashboard)/configuracoes/pos-venda-etapas/page.tsx — permite o corretor
// renomear os nomes das 9 etapas do Pós-Venda (ver migration 019).
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getPostSaleStageOverrides, resolveStages } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { updatePostSaleStageLabels } from "@/app/(dashboard)/pos-venda/actions";

export default async function PosVendaEtapasPage() {
  const user = await requireActiveAccount();
  const overrides = await getPostSaleStageOverrides(user.id);
  const stages = resolveStages(overrides);

  return (
    <div>
      <Link href="/configuracoes" className="text-sm text-gm-500 hover:underline">← Configurações</Link>
      <PageHeader
        title="Personalizar etapas do Pós-Venda"
        subtitle="Troque o nome de qualquer etapa pelo termo que você usa no dia a dia. Deixe em branco pra usar o nome padrão."
      />

      <form action={updatePostSaleStageLabels} className="gm-card max-w-xl space-y-3 p-6">
        {stages.map((s) => (
          <label key={s.key} className="block">
            <span className="mb-1 block text-xs font-medium text-gm-700/60">
              {s.conditional ? `${s.label} (só aparece em negócios financiados)` : s.label}
            </span>
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
