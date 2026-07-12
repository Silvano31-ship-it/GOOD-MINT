// app/(dashboard)/pos-venda/page.tsx — Tela 12. Pós-Venda — Lista de Clientes.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getPostSales, POST_SALE_STAGES } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/ui";
import { StageProgress } from "@/components/pos-venda/StageProgress";
import { formatDate } from "@/lib/format";

const STALL_DAYS = 5; // alerta de cliente parado (seção 7)

export default async function PosVendaPage() {
  const user = await requireActiveAccount();
  const items = await getPostSales(user.id);

  return (
    <div>
      <PageHeader
        title="Pós-Venda"
        subtitle="Acompanhe cada cliente da documentação até a entrega das chaves. O cliente é avisado automaticamente a cada etapa."
      />

      {items.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Nenhum processo de pós-venda"
          desc="Ao fechar uma negociação, inicie o acompanhamento de pós-venda para manter o cliente informado."
          cta={{ href: "/negociacoes", label: "Ver negociações" }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((ps) => {
            const stalled = Date.now() - new Date(ps.stage_updated_at).getTime() > STALL_DAYS * 86400000
              && ps.current_stage !== "entrega_chaves";
            const stageLabel = POST_SALE_STAGES.find((s) => s.key === ps.current_stage)?.label;
            return (
              <Link key={ps.id} href={`/pos-venda/${ps.id}`} className="gm-card p-5 transition hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gm-900">{ps.lead_name}</h3>
                    <p className="text-xs text-gm-700/60">{ps.property_address ?? "Imóvel não vinculado"}</p>
                  </div>
                  {stalled && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                      ⏳ Parado
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <StageProgress current={ps.current_stage} compact />
                </div>
                <p className="mt-3 text-xs text-gm-700/50">
                  {stageLabel} · atualizado em {formatDate(ps.stage_updated_at)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
