// app/(dashboard)/pos-venda/page.tsx — Pós-Venda — quadro Kanban (agrupado por
// kanban_status, coluna operacional separada da etapa linear).
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getPostSales, POST_SALE_STAGES } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/ui";
import { PosVendaTabs } from "@/components/pos-venda/PosVendaTabs";
import { KanbanBoard } from "@/components/pos-venda/KanbanBoard";
import { formatDateTime } from "@/lib/format";

const RISK_DAYS = 7;

export default async function PosVendaPage() {
  const user = await requireActiveAccount();
  const items = await getPostSales(user.id);
  const stageLabel = (k: string) => POST_SALE_STAGES.find((s) => s.key === k)?.label ?? k;

  const active = items.filter((i) => i.current_stage !== "pesquisa_satisfacao");
  const riskCutoff = Date.now() - RISK_DAYS * 86400000;
  const atRisk = active.filter((i) => new Date(i.stage_updated_at).getTime() < riskCutoff);
  const waitingClient = active.filter(
    (i) => i.kanban_status === "aguardando_cliente" || i.kanban_status === "aguardando_documentos"
  );
  const readyForKeys = active.filter((i) => i.current_stage === "entrega_chaves");

  return (
    <div>
      <PageHeader
        title="Pós-Venda"
        subtitle="Acompanhe cada cliente da assinatura do contrato até a pesquisa de satisfação."
      />
      <PosVendaTabs />

      {items.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Nenhum processo de pós-venda"
          desc="Ao fechar uma negociação, inicie o acompanhamento de pós-venda para manter o cliente informado."
          cta={{ href: "/negociacoes", label: "Ver negociações" }}
        />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatusCard
              icon="🚨"
              label="Em risco"
              hint={`Parados há mais de ${RISK_DAYS} dias`}
              value={atRisk.length}
              tone="red"
            />
            <StatusCard
              icon="⏳"
              label="Aguardando cliente"
              hint="Documentos pendentes do cliente"
              value={waitingClient.length}
              tone="amber"
            />
            <StatusCard
              icon="🔑"
              label="Prontos para chaves"
              hint="Na etapa de entrega"
              value={readyForKeys.length}
              tone="green"
            />
          </div>

          <KanbanBoard items={items} />

          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gm-700/50">
              Processos ativos
            </h2>
            <div className="gm-card gm-scroll overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gm-50 text-left text-xs uppercase text-gm-700/60">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Imóvel</th>
                    <th className="px-4 py-3">Etapa atual</th>
                    <th className="px-4 py-3">Última atualização</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((i) => (
                    <tr key={i.id} className="border-t border-gm-50 hover:bg-gm-50/50">
                      <td className="whitespace-nowrap px-4 py-2.5 text-gm-900">{i.lead_name}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-gm-700/70">{i.property_address ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-gm-700/70">{stageLabel(i.current_stage)}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-gm-700/70">{formatDateTime(i.stage_updated_at)}</td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <Link href={`/pos-venda/${i.id}`} className="text-gm-500 hover:underline">Ver</Link>
                      </td>
                    </tr>
                  ))}
                  {active.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gm-700/40">
                        Nenhum processo ativo no momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const TONE_STYLES: Record<string, string> = {
  red: "border-red-200 bg-red-50",
  amber: "border-amber-200 bg-amber-50",
  green: "border-green-200 bg-green-50",
};

function StatusCard({
  icon,
  label,
  hint,
  value,
  tone,
}: {
  icon: string;
  label: string;
  hint: string;
  value: number;
  tone: "red" | "amber" | "green";
}) {
  return (
    <div className={`rounded-2xl border p-5 ${TONE_STYLES[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gm-700/80">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="mt-2 text-3xl font-bold text-gm-900">{value}</div>
      <div className="mt-1 text-xs text-gm-700/50">{hint}</div>
    </div>
  );
}
