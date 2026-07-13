// components/pos-venda/FunnelChart.tsx — funil do pós-venda em barras
// horizontais puro SVG/CSS (sem lib de gráfico), mesma linguagem visual do
// StageProgress (bg-gm-500 sobre bg-gm-100).
export function FunnelChart({ data }: { data: { key: string; label: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.key} className="flex items-center gap-3">
          <span className="w-40 flex-none truncate text-xs text-gm-700/70" title={d.label}>{d.label}</span>
          <div className="h-5 flex-1 overflow-hidden rounded-full bg-gm-100">
            <div
              className="h-full rounded-full bg-gm-500 transition-all"
              style={{ width: `${Math.round((d.count / max) * 100)}%` }}
            />
          </div>
          <span className="w-6 flex-none text-right text-xs font-semibold text-gm-900">{d.count}</span>
        </div>
      ))}
    </div>
  );
}
