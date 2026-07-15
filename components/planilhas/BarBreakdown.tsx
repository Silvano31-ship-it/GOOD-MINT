// components/planilhas/BarBreakdown.tsx — resumo visual em barras horizontais,
// mesmo padrão já usado no "Funil de leads" do Dashboard e no UsageBar de
// Configurações → Plano. Sem biblioteca de gráfico — só div + Tailwind.
export function BarBreakdown({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="gm-card p-5">
      <h2 className="mb-3 text-sm font-semibold text-gm-900">📊 {title}</h2>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-gm-700/70">{item.label}</span>
              <span className="font-medium text-gm-900">{item.value}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gm-100">
              <div
                className="h-full rounded-full bg-gm-500"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
        {items.every((i) => i.value === 0) && (
          <p className="text-xs text-gm-700/40">Sem dados suficientes ainda.</p>
        )}
      </div>
    </div>
  );
}
