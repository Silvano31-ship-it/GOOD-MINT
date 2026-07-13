// components/ui.tsx — primitivos de UI reutilizados na área logada.
import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gm-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gm-700/60">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  limit,
  icon,
}: {
  label: string;
  value: number;
  limit?: number | null;
  icon: string;
}) {
  const pct = limit ? Math.min(100, Math.round((value / limit) * 100)) : 0;
  return (
    <div className="gm-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gm-700/70">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="mt-2 flex items-end gap-1">
        <span className="text-3xl font-bold text-gm-900">{value}</span>
        {limit != null && <span className="pb-1 text-sm text-gm-700/50">/ {limit}</span>}
      </div>
      {limit != null && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gm-100">
          <div
            className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : "bg-gm-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  desc,
  cta,
}: {
  icon: string;
  title: string;
  desc: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="gm-card flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <h3 className="text-lg font-semibold text-gm-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-gm-700/60">{desc}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-5 rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

const STAGE_COLORS: Record<string, string> = {
  novo_lead: "bg-slate-100 text-slate-700",
  contato_feito: "bg-blue-100 text-blue-700",
  visita_agendada: "bg-indigo-100 text-indigo-700",
  proposta: "bg-amber-100 text-amber-700",
  fechado: "bg-green-100 text-green-700",
  perdido: "bg-red-100 text-red-700",
  disponivel: "bg-green-100 text-green-700",
  reservado: "bg-amber-100 text-amber-700",
  vendido: "bg-blue-100 text-blue-700",
  alugado: "bg-indigo-100 text-indigo-700",
  inativo: "bg-slate-100 text-slate-600",
  aberta: "bg-blue-100 text-blue-700",
  fechada: "bg-green-100 text-green-700",
  perdida: "bg-red-100 text-red-700",
  agendado: "bg-amber-100 text-amber-700",
  publicando: "bg-blue-100 text-blue-700",
  publicado: "bg-green-100 text-green-700",
  falhou: "bg-red-100 text-red-700",
  cancelado: "bg-slate-100 text-slate-600",
  // Pós-venda — 9 etapas do fluxo vigente
  assinatura_contrato: "bg-blue-100 text-blue-700",
  envio_documentos_cartorio: "bg-indigo-100 text-indigo-700",
  validacao_registro: "bg-indigo-100 text-indigo-700",
  liberacao_financiamento: "bg-amber-100 text-amber-700",
  vistoria_imovel: "bg-amber-100 text-amber-700",
  assinatura_escritura: "bg-blue-100 text-blue-700",
  entrega_chaves: "bg-green-100 text-green-700",
  transferencia_contas: "bg-slate-100 text-slate-700",
  pesquisa_satisfacao: "bg-green-100 text-green-700",
};

export const KANBAN_COLORS: Record<string, string> = {
  a_fazer: "bg-slate-100 text-slate-700",
  em_andamento: "bg-blue-100 text-blue-700",
  aguardando_cliente: "bg-amber-100 text-amber-700",
  aguardando_documentos: "bg-amber-100 text-amber-700",
  concluido: "bg-green-100 text-green-700",
};

export function Badge({ value, label }: { value: string; label: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STAGE_COLORS[value] ?? "bg-gm-100 text-gm-700"
      }`}
    >
      {label}
    </span>
  );
}
