// components/relatorio/MetricsCharts.tsx — gráficos de métricas do Relatório
// (Recharts): leads por mês, origem dos leads e comissão por mês. Recebe os
// dados já agregados pelo servidor (lib/data.ts) — o componente só desenha.
"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyCount, OriginCount, MonthlyCommission } from "@/lib/data";
import { formatBRL } from "@/lib/format";

const PIE_COLORS = ["#1e63c4", "#5b9bf0", "#F5C94A", "#22c55e", "#a855f7", "#f97316", "#94a3b8"];

function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
}

export function LeadsByMonthChart({ data }: { data: MonthlyCount[] }) {
  if (data.length === 0) return <EmptyChart text="Sem leads cadastrados nesse período." />;
  const chartData = data.map((d) => ({ month: monthLabel(d.month), Leads: d.count }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="Leads" fill="#1e63c4" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LeadsByOriginChart({ data }: { data: OriginCount[] }) {
  if (data.length === 0) return <EmptyChart text="Sem leads cadastrados nesse período." />;
  const top = data.slice(0, 6);
  const rest = data.slice(6).reduce((sum, d) => sum + d.count, 0);
  const chartData = rest > 0 ? [...top, { origin: "Outros", count: rest }] : top;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={chartData} dataKey="count" nameKey="origin" cx="50%" cy="50%" outerRadius={75} label={(entry) => entry.origin}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CommissionByMonthChart({ data }: { data: MonthlyCommission[] }) {
  if (data.length === 0) return <EmptyChart text="Sem comissões registradas nesse período." />;
  const chartData = data.map((d) => ({ month: monthLabel(d.month), Comissão: d.totalCents / 100 }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatBRL(v * 100)} width={80} />
        <Tooltip formatter={(v) => formatBRL(Number(v) * 100)} />
        <Line type="monotone" dataKey="Comissão" stroke="#F5C94A" strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ text }: { text: string }) {
  return <p className="flex h-[220px] items-center justify-center text-center text-sm text-gm-700/50">{text}</p>;
}
