// components/pos-venda/StageProgress.tsx — barra de progresso das etapas do pós-venda.
import { POST_SALE_STAGES } from "@/lib/constants";

export function StageProgress({
  current,
  compact = false,
  isFinanced = true,
}: {
  current: string;
  compact?: boolean;
  isFinanced?: boolean;
}) {
  const stages = POST_SALE_STAGES.filter((s) => !("conditional" in s && s.conditional) || isFinanced);
  const idx = stages.findIndex((s) => s.key === current);
  const pct = Math.round(((idx + 1) / stages.length) * 100);

  if (compact) {
    return (
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-gm-700/60">
          <span>{stages[idx]?.label ?? current}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gm-100">
          <div className="h-full rounded-full bg-gm-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  return (
    <ol className="relative flex flex-col gap-0">
      {stages.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <li key={s.key} className="flex items-start gap-3 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  done ? "bg-gm-500 text-white" : active ? "bg-gm-500 text-white ring-4 ring-gm-100" : "bg-gm-100 text-gm-700/50"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              {i < stages.length - 1 && (
                <span className={`mt-1 h-8 w-0.5 ${done ? "bg-gm-500" : "bg-gm-100"}`} />
              )}
            </div>
            <div className="pt-1">
              <div className={`text-sm font-medium ${active ? "text-gm-900" : done ? "text-gm-700" : "text-gm-700/50"}`}>
                {s.label}
              </div>
              {active && <div className="text-xs text-gm-500">Etapa atual</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
