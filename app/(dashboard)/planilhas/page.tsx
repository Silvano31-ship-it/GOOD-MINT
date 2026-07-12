// app/(dashboard)/planilhas/page.tsx — hub das 3 planilhas (telas 21-23).
import Link from "next/link";
import { PageHeader } from "@/components/ui";

const SHEETS = [
  { href: "/planilhas/leads", icon: "🎯", title: "Leads", desc: "Nome, telefone, origem, etapa, último contato" },
  { href: "/planilhas/imoveis", icon: "🏠", title: "Imóveis", desc: "Endereço, tipo, valor, status" },
  { href: "/planilhas/negociacoes", icon: "🤝", title: "Negociações / Pós-Venda", desc: "Cliente, etapa atual, última atualização" },
];

export default function PlanilhasHome() {
  return (
    <div>
      <PageHeader title="Planilhas" subtitle="Visão em tabela — leitura rápida, sem gráficos ou painéis complexos." />
      <div className="grid gap-4 sm:grid-cols-3">
        {SHEETS.map((s) => (
          <Link key={s.href} href={s.href} className="gm-card p-5 transition hover:-translate-y-0.5">
            <div className="text-2xl">{s.icon}</div>
            <div className="mt-2 font-semibold text-gm-900">{s.title}</div>
            <div className="text-sm text-gm-700/60">{s.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
