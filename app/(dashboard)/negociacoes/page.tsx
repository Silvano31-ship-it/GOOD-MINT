// app/(dashboard)/negociacoes/page.tsx — Negociações (lista + criar + fechar).
import { requireActiveAccount } from "@/lib/account-guard";
import { getNegotiations, getLeadOptions, getPropertyOptions } from "@/lib/data";
import { PageHeader, EmptyState, Badge } from "@/components/ui";
import { NewNegotiationButton } from "@/components/negociacoes/NewNegotiationButton";
import { CloseNegotiation } from "@/components/negociacoes/CloseNegotiation";
import { DeleteNegotiation } from "@/components/negociacoes/DeleteNegotiation";
import { formatBRL, formatDate } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = { aberta: "Aberta", fechada: "Fechada", perdida: "Perdida" };

export default async function NegociacoesPage() {
  const user = await requireActiveAccount();
  const [negotiations, leads, properties] = await Promise.all([
    getNegotiations(user.id),
    getLeadOptions(user.id),
    getPropertyOptions(user.id),
  ]);

  return (
    <div>
      <PageHeader
        title="Negociações"
        subtitle="Acompanhe cada negócio e feche a venda."
        action={<NewNegotiationButton leads={leads} properties={properties} />}
      />

      {negotiations.length === 0 ? (
        <EmptyState icon="🤝" title="Nenhuma negociação" desc="Crie uma negociação a partir de um lead e acompanhe até o fechamento." />
      ) : (
        <div className="gm-card overflow-hidden">
          <div className="gm-scroll overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gm-50 text-left text-xs uppercase text-gm-700/60">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Imóvel</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {negotiations.map((n) => (
                  <tr key={n.id} className="border-t border-gm-50">
                    <td className="px-4 py-3 font-medium text-gm-900">{n.lead_name}</td>
                    <td className="px-4 py-3 text-gm-700/70">{n.property_address ?? "—"}</td>
                    <td className="px-4 py-3 capitalize text-gm-700/70">{n.negotiation_type}</td>
                    <td className="px-4 py-3">{formatBRL(n.value_cents ? Number(n.value_cents) : null)}</td>
                    <td className="px-4 py-3"><Badge value={n.status} label={STATUS_LABELS[n.status] ?? n.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {n.status === "aberta" ? (
                          <CloseNegotiation negotiationId={n.id} />
                        ) : (
                          <span className="text-xs text-gm-700/40">Fechada em {formatDate(n.closed_at)}</span>
                        )}
                        <DeleteNegotiation negotiationId={n.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
