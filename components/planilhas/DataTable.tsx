// components/planilhas/DataTable.tsx — tabela simples com ordenação, busca e
// export CSV (seção 7.1 da spec). Sem gráficos/widgets — só a tabela.
"use client";

import { useMemo, useState } from "react";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  csvValue?: (row: T) => string;
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  filename,
}: {
  rows: T[];
  columns: Column<T>[];
  filename: string;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => {
        const v = c.csvValue ? c.csvValue(r) : String((r as any)[c.key] ?? "");
        return v.toLowerCase().includes(q);
      })
    );
  }, [rows, query, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    return [...filtered].sort((a, b) => {
      const av = col.sortValue ? col.sortValue(a) : String((a as any)[sortKey] ?? "");
      const bv = col.sortValue ? col.sortValue(b) : String((b as any)[sortKey] ?? "");
      if (av < bv) return -1 * sortDir;
      if (av > bv) return 1 * sortDir;
      return 0;
    });
  }, [filtered, sortKey, sortDir, columns]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  function exportCsv() {
    const header = columns.map((c) => `"${c.label}"`).join(",");
    const lines = sorted.map((r) =>
      columns
        .map((c) => {
          const v = c.csvValue ? c.csvValue(r) : String((r as any)[c.key] ?? "");
          return `"${v.replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="gm-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gm-50 p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar..."
          className="w-56 rounded-lg border border-gm-200 px-3 py-1.5 text-sm outline-none focus:border-gm-500"
        />
        <button
          onClick={exportCsv}
          className="rounded-lg border border-gm-200 px-3 py-1.5 text-sm font-medium text-gm-700 hover:bg-gm-50"
        >
          ⬇ Exportar CSV
        </button>
      </div>
      <div className="gm-scroll overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gm-50 text-left text-xs uppercase text-gm-700/60">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className="cursor-pointer select-none whitespace-nowrap px-4 py-3 hover:text-gm-500"
                >
                  {c.label} {sortKey === c.key && (sortDir === 1 ? "↑" : "↓")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.id} className="border-t border-gm-50 hover:bg-gm-50/50">
                {columns.map((c) => (
                  <td key={c.key} className="whitespace-nowrap px-4 py-2.5 text-gm-900">
                    {c.render ? c.render(row) : String((row as any)[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-gm-700/40">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
