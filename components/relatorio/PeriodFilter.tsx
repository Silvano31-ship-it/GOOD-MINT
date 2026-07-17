// components/relatorio/PeriodFilter.tsx — pastilhas de período (7/30/90/365
// dias) pro Relatório. Navega via query string (?dias=), a página server
// re-busca os dados agregados pro período escolhido.
"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
  { value: "365", label: "1 ano" },
];

export function PeriodFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("dias") ?? "30";

  return (
    <div className="flex items-center gap-1 rounded-full bg-gm-50 p-1 text-xs font-medium">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => router.push(`/relatorio?dias=${o.value}`)}
          className={`rounded-full px-3 py-1.5 transition ${
            current === o.value ? "bg-gm-500 text-white" : "text-gm-700 hover:bg-gm-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
