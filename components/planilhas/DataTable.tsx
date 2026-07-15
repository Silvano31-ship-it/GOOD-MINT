// components/planilhas/DataTable.tsx — tabela com ordenação, busca, export CSV,
// edição inline, seleção em massa e formatação condicional (Super Planilha).
// Todas as props novas (editable, selectable, rowClassName, footerStats,
// bulkActions) são opcionais — quem só usa busca/ordenação/CSV continua
// funcionando sem mudar nada.
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export interface EditableConfig<T> {
  type: "text" | "number" | "select";
  options?: { value: string; label: string }[];
  /** Valor cru pra preencher o input ao entrar em modo de edição (padrão: String(row[key])). */
  editValue?: (row: T) => string;
  /** (id, novoValor) — assinatura compatível com server actions passadas
   * diretamente (sem closures inline), ex.: updateLeadName. */
  onSave: (id: string, value: string) => Promise<void>;
}

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  csvValue?: (row: T) => string;
  editable?: EditableConfig<T>;
  /** Mostra um <select> de filtro no toolbar pra essa coluna. Opções vêm de
   * `editable.options` quando existir, senão dos valores distintos nos dados. */
  filterable?: boolean;
}

export interface BulkActions<T> {
  onDelete?: (ids: string[]) => Promise<void>;
  onDuplicate?: (ids: string[]) => Promise<void>;
  stageOptions?: { value: string; label: string }[];
  stageLabel?: string;
  onChangeStage?: (ids: string[], stage: string) => Promise<void>;
  /** Se true, mostra "Exportar selecionados" reaproveitando a lógica de CSV. */
  exportSelected?: boolean;
}

export interface DedupeConfig<T> {
  /** Chave de comparação — linhas com a mesma chave são consideradas duplicadas. */
  keyOf: (row: T) => string;
  /** Recebe os ids das linhas duplicadas a remover (mantém a primeira de cada grupo). */
  onRemove: (ids: string[]) => Promise<void>;
}

function EditableCell<T>({
  row,
  column,
  display,
}: {
  row: T;
  column: Column<T>;
  display: React.ReactNode;
}) {
  const router = useRouter();
  const editable = column.editable!;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(nextValue: string) {
    setSaving(true);
    setError(null);
    try {
      await editable.onSave((row as any).id, nextValue);
      setEditing(false);
      router.refresh();
    } catch {
      setError("Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (editable.type === "select") {
    const current = editable.editValue ? editable.editValue(row) : String((row as any)[column.key] ?? "");
    return (
      <select
        defaultValue={current}
        disabled={saving}
        onChange={(e) => save(e.target.value)}
        className="min-h-9 rounded-lg border border-gm-200 bg-white px-2 py-1 text-sm outline-none focus:border-gm-500 disabled:opacity-60"
      >
        {editable.options?.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(editable.editValue ? editable.editValue(row) : String((row as any)[column.key] ?? ""));
          setEditing(true);
        }}
        className="group flex min-h-9 items-center gap-1.5 rounded-lg px-1 text-left hover:bg-gm-50"
        title="Editar"
      >
        {display}
        <span className="text-xs text-gm-700/30 opacity-0 group-hover:opacity-100">✏️</span>
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        autoFocus
        type={editable.type === "number" ? "number" : "text"}
        value={value}
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => save(value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save(value);
          if (e.key === "Escape") setEditing(false);
        }}
        className="min-h-9 w-32 rounded-lg border border-gm-500 px-2 py-1 text-sm outline-none"
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  filename,
  selectable = false,
  rowClassName,
  footerStats,
  bulkActions,
  dedupe,
  mobileCard,
}: {
  rows: T[];
  columns: Column<T>[];
  filename: string;
  selectable?: boolean;
  rowClassName?: (row: T) => string;
  footerStats?: (rows: T[]) => { label: string; value: string }[];
  bulkActions?: BulkActions<T>;
  dedupe?: DedupeConfig<T>;
  /** Renderização opcional em cards empilhados pro celular (some com a
   * rolagem horizontal da tabela nessa faixa). Quando ausente, comportamento
   * idêntico ao de antes — só rolagem horizontal em qualquer tamanho de tela. */
  mobileCard?: (row: T, helpers: { selected: boolean; toggleSelect: () => void }) => React.ReactNode;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [dedupeBusy, setDedupeBusy] = useState(false);

  const filterableColumns = useMemo(() => columns.filter((c) => c.filterable), [columns]);

  const filtered = useMemo(() => {
    let list = rows;

    const activeFilters = Object.entries(columnFilters).filter(([, v]) => v);
    if (activeFilters.length > 0) {
      list = list.filter((r) =>
        activeFilters.every(([key, value]) => String((r as any)[key] ?? "") === value)
      );
    }

    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((r) =>
      columns.some((c) => {
        const v = c.csvValue ? c.csvValue(r) : String((r as any)[c.key] ?? "");
        return v.toLowerCase().includes(q);
      })
    );
  }, [rows, query, columns, columnFilters]);

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

  function csvFrom(list: T[], suffix = "") {
    const header = columns.map((c) => `"${c.label}"`).join(",");
    const lines = list.map((r) =>
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
    a.download = `${filename}${suffix}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleRow(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((s) => (s.size === sorted.length ? new Set() : new Set(sorted.map((r) => r.id))));
  }

  async function runBulk(action: (ids: string[]) => Promise<void>) {
    setBulkBusy(true);
    try {
      await action(Array.from(selected));
      setSelected(new Set());
      router.refresh();
    } finally {
      setBulkBusy(false);
    }
  }

  const selectedRows = sorted.filter((r) => selected.has(r.id));
  const stats = footerStats?.(sorted);

  async function handleRemoveDuplicates() {
    if (!dedupe) return;
    const seen = new Set<string>();
    const duplicateIds: string[] = [];
    // `rows` vem do banco em ordem "mais recente primeiro" — percorremos ao
    // contrário pra manter a ocorrência mais antiga de cada grupo.
    for (const row of [...rows].reverse()) {
      const key = dedupe.keyOf(row);
      if (!key) continue;
      if (seen.has(key)) {
        duplicateIds.push(row.id);
      } else {
        seen.add(key);
      }
    }
    if (duplicateIds.length === 0) {
      alert("Nenhum duplicado encontrado.");
      return;
    }
    if (!confirm(`Encontrei ${duplicateIds.length} registro(s) duplicado(s). Remover, mantendo o mais antigo de cada?`)) {
      return;
    }
    setDedupeBusy(true);
    try {
      await dedupe.onRemove(duplicateIds);
      router.refresh();
    } finally {
      setDedupeBusy(false);
    }
  }

  return (
    <div className="gm-card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-gm-50 p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar..."
          className="w-56 rounded-lg border border-gm-200 px-3 py-1.5 text-sm outline-none focus:border-gm-500"
        />
        {filterableColumns.map((c) => {
          const options =
            c.editable?.options ??
            Array.from(new Set(rows.map((r) => String((r as any)[c.key] ?? "")).filter(Boolean))).map((v) => ({
              value: v,
              label: v,
            }));
          return (
            <select
              key={c.key}
              value={columnFilters[c.key] ?? ""}
              onChange={(e) => setColumnFilters((f) => ({ ...f, [c.key]: e.target.value }))}
              className="rounded-lg border border-gm-200 px-2 py-1.5 text-sm text-gm-700 outline-none focus:border-gm-500"
            >
              <option value="">{c.label}: todos</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          );
        })}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {dedupe && (
            <button
              onClick={handleRemoveDuplicates}
              disabled={dedupeBusy}
              className="rounded-lg border border-gm-200 px-3 py-1.5 text-sm font-medium text-gm-700 hover:bg-gm-50 disabled:opacity-60"
            >
              🧹 Remover duplicados
            </button>
          )}
          <button
            onClick={() => csvFrom(sorted)}
            className="rounded-lg border border-gm-200 px-3 py-1.5 text-sm font-medium text-gm-700 hover:bg-gm-50"
          >
            ⬇ Exportar CSV
          </button>
        </div>
      </div>
      <div className={`gm-scroll overflow-x-auto ${mobileCard ? "hidden sm:block" : ""}`}>
        <table className="w-full text-sm">
          <thead className="bg-gm-50 text-left text-xs uppercase text-gm-700/60">
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={sorted.length > 0 && selected.size === sorted.length}
                    onChange={toggleAll}
                    aria-label="Selecionar todos"
                    className="h-4 w-4"
                  />
                </th>
              )}
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
              <tr
                key={row.id}
                className={`border-t border-gm-50 hover:bg-gm-50/50 ${rowClassName?.(row) ?? ""}`}
              >
                {selectable && (
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                      aria-label="Selecionar linha"
                      className="h-4 w-4"
                    />
                  </td>
                )}
                {columns.map((c) => {
                  const display = c.render ? c.render(row) : String((row as any)[c.key] ?? "—");
                  return (
                    <td key={c.key} className="whitespace-nowrap px-4 py-2.5 text-gm-900">
                      {c.editable ? <EditableCell row={row} column={c} display={display} /> : display}
                    </td>
                  );
                })}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-10 text-center text-gm-700/40">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mobileCard && (
        <div className="divide-y divide-gm-50 sm:hidden">
          {sorted.map((row) => (
            <div key={row.id}>
              {mobileCard(row, { selected: selected.has(row.id), toggleSelect: () => toggleRow(row.id) })}
            </div>
          ))}
          {sorted.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-gm-700/40">Nenhum registro encontrado.</div>
          )}
        </div>
      )}

      {stats && stats.length > 0 && (
        <div className="flex flex-wrap gap-6 border-t border-gm-50 bg-gm-50/60 px-4 py-3 text-xs text-gm-700">
          {stats.map((s) => (
            <div key={s.label}>
              <span className="text-gm-700/50">{s.label}: </span>
              <span className="font-semibold text-gm-900">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {selectable && selected.size > 0 && bulkActions && (
        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-gm-100 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(10,37,64,0.06)]">
          <span className="text-xs font-medium text-gm-700">{selected.size} selecionado(s)</span>
          {bulkActions.exportSelected && (
            <button
              disabled={bulkBusy}
              onClick={() => csvFrom(selectedRows, "-selecionados")}
              className="min-h-9 rounded-lg border border-gm-200 px-3 py-1.5 text-xs font-medium text-gm-700 hover:bg-gm-50 disabled:opacity-60"
            >
              📤 Exportar selecionados
            </button>
          )}
          {bulkActions.onDuplicate && (
            <button
              disabled={bulkBusy}
              onClick={() => runBulk(bulkActions.onDuplicate!)}
              className="min-h-9 rounded-lg border border-gm-200 px-3 py-1.5 text-xs font-medium text-gm-700 hover:bg-gm-50 disabled:opacity-60"
            >
              📋 Duplicar
            </button>
          )}
          {bulkActions.onChangeStage && bulkActions.stageOptions && (
            <select
              disabled={bulkBusy}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) runBulk((ids) => bulkActions.onChangeStage!(ids, e.target.value));
                e.target.value = "";
              }}
              className="min-h-9 rounded-lg border border-gm-200 px-2 py-1.5 text-xs disabled:opacity-60"
            >
              <option value="" disabled>🚀 {bulkActions.stageLabel ?? "Mover etapa"}...</option>
              {bulkActions.stageOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
          {bulkActions.onDelete && (
            <button
              disabled={bulkBusy}
              onClick={() => {
                if (confirm(`Excluir ${selected.size} registro(s)? Essa ação não pode ser desfeita.`)) {
                  runBulk(bulkActions.onDelete!);
                }
              }}
              className="min-h-9 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              🗑️ Excluir
            </button>
          )}
        </div>
      )}
    </div>
  );
}
