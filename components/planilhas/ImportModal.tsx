// components/planilhas/ImportModal.tsx — colar dados do Excel/Sheets ou
// escolher um arquivo CSV, com prévia antes de confirmar. Reaproveitado pelas
// planilhas de Leads e Imóveis (Negociações fica de fora — ver plano).
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface ImportField {
  key: string;
  label: string;
  /** Nomes alternativos de cabeçalho aceitos (comparação sem acento/maiúsculas). */
  aliases?: string[];
  required?: boolean;
}

function parseDelimited(text: string): string[][] {
  const delimiter = text.includes("\t") ? "\t" : ",";
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim() !== "");
  return lines.map((line) => {
    const cells: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        cells.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  });
}

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

function normalize(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(DIACRITICS_RE, "");
}

export function ImportModal<R>({
  title,
  fields,
  buildRow,
  onImport,
  onClose,
}: {
  title: string;
  fields: ImportField[];
  buildRow: (values: Record<string, string>) => R | null;
  onImport: (rows: R[]) => Promise<{ imported: number; skipped: number }>;
  onClose: () => void;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; invalid: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const table = text.trim() ? parseDelimited(text) : [];
  const header = table[0] ?? [];
  const dataLines = table.slice(1);

  const columnIndexes = fields.map((field) => {
    const names = [field.label, ...(field.aliases ?? [])].map(normalize);
    return header.findIndex((h) => names.includes(normalize(h)));
  });

  const previewRows: (R | null)[] = dataLines.map((cells) => {
    const values: Record<string, string> = {};
    fields.forEach((field, i) => {
      const cellIndex = columnIndexes[i] >= 0 ? columnIndexes[i] : i;
      values[field.key] = cells[cellIndex] ?? "";
    });
    return buildRow(values);
  });

  const validCount = previewRows.filter(Boolean).length;
  const invalidCount = previewRows.length - validCount;

  async function handleFile(file: File) {
    const content = await file.text();
    setText(content);
    setResult(null);
  }

  async function handleImport() {
    setBusy(true);
    setError(null);
    try {
      const rowsToImport = previewRows.filter((r): r is R => r !== null);
      const res = await onImport(rowsToImport);
      setResult({ ...res, invalid: invalidCount });
      router.refresh();
    } catch {
      setError("Não foi possível importar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gm-900">{title}</h2>
          <button onClick={onClose} className="text-gm-700/50 hover:text-gm-900" aria-label="Fechar">✕</button>
        </div>

        {!result ? (
          <>
            <p className="mb-2 text-sm text-gm-700/70">
              Cole os dados copiados do Excel/Google Sheets, ou escolha um arquivo CSV.
              A primeira linha deve ter os nomes das colunas: {fields.map((f) => f.label).join(", ")}.
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="mb-3 text-sm"
            />
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setResult(null);
              }}
              rows={8}
              placeholder={fields.map((f) => f.label).join("\t")}
              className="w-full rounded-lg border border-gm-200 p-2 font-mono text-xs outline-none focus:border-gm-500"
            />

            {table.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs text-gm-700/60">
                  {validCount} linha(s) reconhecida(s)
                  {invalidCount > 0 && `, ${invalidCount} ignorada(s) por faltar dado obrigatório`}.
                </p>
                <div className="gm-scroll max-h-48 overflow-auto rounded-lg border border-gm-100">
                  <table className="w-full text-xs">
                    <thead className="bg-gm-50 text-left">
                      <tr>
                        {fields.map((f) => (
                          <th key={f.key} className="whitespace-nowrap px-2 py-1.5">{f.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataLines.slice(0, 8).map((cells, i) => (
                        <tr key={i} className={`border-t border-gm-50 ${previewRows[i] ? "" : "bg-red-50/50"}`}>
                          {fields.map((f, fi) => {
                            const idx = columnIndexes[fi] >= 0 ? columnIndexes[fi] : fi;
                            return <td key={f.key} className="whitespace-nowrap px-2 py-1.5">{cells[idx] ?? ""}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gm-700 hover:bg-gm-50">
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={busy || validCount === 0}
                className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600 disabled:opacity-60"
              >
                {busy ? "Importando..." : `Importar ${validCount} registro(s)`}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gm-900">
              ✅ {result.imported} registro(s) importado(s) com sucesso.
              {result.skipped > 0 && ` ${result.skipped} não couberam no limite do seu plano.`}
              {result.invalid > 0 && ` ${result.invalid} linha(s) ignorada(s) por faltar dado obrigatório.`}
            </p>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
