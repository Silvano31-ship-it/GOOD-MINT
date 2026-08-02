// components/excel/Spreadsheet.tsx — grade do EXCEL GOOD ✅. Célula ativa, caixa
// de nome, barra de fórmulas, edição inline, navegação por teclado, alça de
// preenchimento (arrastar), copiar/colar com ajuste de referências, F4 e
// autosave (debounce). Cálculo pelo motor lib/excel/engine.ts.
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  computeAll, cellName, numToCol, adjustFormula, cycleRefMode,
  type CellMap,
} from "@/lib/excel/engine";
import { saveSheet } from "@/app/(dashboard)/planilhas/livre/actions";

const COLS = 20;   // A..T
const ROWS = 50;

interface Pos { c: number; r: number }

export function Spreadsheet({ sheetId, initialCells }: { sheetId: string; initialCells: CellMap }) {
  const [cells, setCells] = useState<CellMap>(initialCells);
  const [active, setActive] = useState<Pos>({ c: 0, r: 0 });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [savedAt, setSavedAt] = useState<"idle" | "saving" | "saved">("idle");
  const [fillTo, setFillTo] = useState<Pos | null>(null);
  const clip = useRef<{ raw: string; c: number; r: number } | null>(null);
  const filling = useRef(false);
  const barRef = useRef<HTMLInputElement>(null);
  const inlineRef = useRef<HTMLInputElement>(null);

  const computed = useMemo(() => computeAll(cells), [cells]);
  const activeRef = cellName(active.c, active.r);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    setSavedAt("saving");
    const t = setTimeout(async () => {
      await saveSheet(sheetId, cells);
      setSavedAt("saved");
    }, 800);
    return () => clearTimeout(t);
  }, [cells, sheetId]);

  const rawOf = (c: number, r: number) => cells[cellName(c, r)] ?? "";
  const dispOf = (c: number, r: number) => {
    const ref = cellName(c, r);
    const raw = cells[ref] ?? "";
    if (raw === "") return "";
    return computed[ref]?.display ?? raw;
  };

  const commit = useCallback((value: string, move: "down" | "right" | "none") => {
    setCells((prev) => {
      const next = { ...prev };
      const ref = cellName(active.c, active.r);
      if (value === "") delete next[ref];
      else next[ref] = value;
      return next;
    });
    setEditing(false);
    setActive((a) => {
      if (move === "down") return { c: a.c, r: Math.min(ROWS - 1, a.r + 1) };
      if (move === "right") return { c: Math.min(COLS - 1, a.c + 1), r: a.r };
      return a;
    });
  }, [active]);

  const startEdit = useCallback((initial?: string) => {
    setDraft(initial !== undefined ? initial : rawOf(active.c, active.r));
    setEditing(true);
    setTimeout(() => inlineRef.current?.focus(), 0);
  }, [active, cells]);

  function onGridKey(e: React.KeyboardEvent) {
    if (editing) return;
    const k = e.key;
    if (k === "ArrowDown") { e.preventDefault(); setActive((a) => ({ ...a, r: Math.min(ROWS - 1, a.r + 1) })); }
    else if (k === "ArrowUp") { e.preventDefault(); setActive((a) => ({ ...a, r: Math.max(0, a.r - 1) })); }
    else if (k === "ArrowRight") { e.preventDefault(); setActive((a) => ({ ...a, c: Math.min(COLS - 1, a.c + 1) })); }
    else if (k === "ArrowLeft") { e.preventDefault(); setActive((a) => ({ ...a, c: Math.max(0, a.c - 1) })); }
    else if (k === "Tab") { e.preventDefault(); setActive((a) => ({ ...a, c: Math.min(COLS - 1, a.c + 1) })); }
    else if (k === "Enter" || k === "F2") { e.preventDefault(); startEdit(); }
    else if (k === "Delete" || k === "Backspace") { e.preventDefault(); commit("", "none"); }
    else if ((e.ctrlKey || e.metaKey) && (k === "c" || k === "C")) {
      clip.current = { raw: rawOf(active.c, active.r), c: active.c, r: active.r };
    }
    else if ((e.ctrlKey || e.metaKey) && (k === "v" || k === "V")) {
      e.preventDefault();
      if (clip.current) {
        const src = clip.current;
        const val = adjustFormula(src.raw, active.c - src.c, active.r - src.r);
        commit(val, "none");
      }
    }
    else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      startEdit(k);
    }
  }

  function onInlineKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); commit(draft, "down"); }
    else if (e.key === "Tab") { e.preventDefault(); commit(draft, "right"); }
    else if (e.key === "Escape") { e.preventDefault(); setEditing(false); }
    else if (e.key === "F4") { e.preventDefault(); applyF4(inlineRef.current); }
  }

  function applyF4(input: HTMLInputElement | null) {
    if (!input) return;
    const pos = input.selectionStart ?? draft.length;
    const m = /(\$?[A-Za-z]+\$?\d+)$/.exec(draft.slice(0, pos));
    if (!m) return;
    const start = pos - m[1].length;
    const cycled = cycleRefMode(m[1]);
    const next = draft.slice(0, start) + cycled + draft.slice(pos);
    setDraft(next);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + cycled.length, start + cycled.length);
    }, 0);
  }

  useEffect(() => {
    function up() {
      if (filling.current && fillTo) applyFill(active, fillTo);
      filling.current = false;
      setFillTo(null);
    }
    document.addEventListener("mouseup", up);
    return () => document.removeEventListener("mouseup", up);
  }, [active, fillTo]); // eslint-disable-line react-hooks/exhaustive-deps

  function applyFill(from: Pos, to: Pos) {
    const srcRaw = rawOf(from.c, from.r);
    setCells((prev) => {
      const next = { ...prev };
      const dCol = to.c - from.c, dRow = to.r - from.r;
      const list: Pos[] = [];
      if (Math.abs(dRow) >= Math.abs(dCol)) {
        const step = dRow >= 0 ? 1 : -1;
        for (let r = from.r + step; r !== to.r + step; r += step) list.push({ c: from.c, r });
      } else {
        const step = dCol >= 0 ? 1 : -1;
        for (let c = from.c + step; c !== to.c + step; c += step) list.push({ c, r: from.r });
      }
      for (const p of list) {
        const val = adjustFormula(srcRaw, p.c - from.c, p.r - from.r);
        const ref = cellName(p.c, p.r);
        if (val === "") delete next[ref];
        else next[ref] = val;
      }
      return next;
    });
  }

  const inFillPreview = (c: number, r: number) => {
    if (!fillTo) return false;
    if (Math.abs(fillTo.r - active.r) >= Math.abs(fillTo.c - active.c)) {
      return c === active.c && between(r, active.r, fillTo.r);
    }
    return r === active.r && between(c, active.c, fillTo.c);
  };

  return (
    <div>
      <div className="mb-3 flex items-stretch gap-2">
        <div className="flex w-16 flex-none items-center justify-center rounded-lg border border-gm-200 bg-gm-50 text-sm font-semibold text-gm-900">
          {activeRef}
        </div>
        <div className="flex flex-1 items-center gap-1 rounded-lg border border-gm-200 bg-white px-2">
          <span className="text-gm-700/40">ƒ</span>
          <input
            ref={barRef}
            value={editing ? draft : rawOf(active.c, active.r)}
            onChange={(e) => { if (!editing) setEditing(true); setDraft(e.target.value); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commit(draft, "down"); }
              else if (e.key === "F4") { e.preventDefault(); applyF4(barRef.current); }
              else if (e.key === "Escape") { setEditing(false); }
            }}
            placeholder="Digite um valor ou fórmula (ex: =SOMA(A1:A3))"
            className="w-full py-2 text-sm outline-none"
          />
        </div>
        <div className="flex w-20 flex-none items-center justify-center text-xs text-gm-700/40">
          {savedAt === "saving" ? "Salvando…" : savedAt === "saved" ? "Salvo ✓" : ""}
        </div>
      </div>

      <div className="gm-scroll overflow-auto rounded-lg border border-gm-200" style={{ maxHeight: "70vh" }}>
        <table
          className="border-collapse select-none text-sm"
          tabIndex={0}
          onKeyDown={onGridKey}
          style={{ outline: "none" }}
        >
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 w-10 border border-gm-200 bg-gm-100" />
              {Array.from({ length: COLS }, (_, c) => (
                <th key={c} className="sticky top-0 z-10 min-w-[84px] border border-gm-200 bg-gm-100 px-2 py-1 text-xs font-semibold text-gm-700">
                  {numToCol(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, r) => (
              <tr key={r}>
                <th className="sticky left-0 z-10 w-10 border border-gm-200 bg-gm-100 px-1 text-xs font-semibold text-gm-700">
                  {r + 1}
                </th>
                {Array.from({ length: COLS }, (_, c) => {
                  const isActive = active.c === c && active.r === r;
                  const ref = cellName(c, r);
                  const err = computed[ref]?.error;
                  const preview = inFillPreview(c, r);
                  return (
                    <td
                      key={c}
                      onMouseDown={() => { if (!filling.current) { if (editing) commit(draft, "none"); setActive({ c, r }); } }}
                      onDoubleClick={() => startEdit()}
                      onMouseEnter={() => { if (filling.current) setFillTo({ c, r }); }}
                      className={`relative h-8 border border-gm-100 px-2 ${
                        err ? "text-red-600" : "text-gm-900"
                      } ${isActive ? "outline outline-2 -outline-offset-2 outline-gm-500" : ""} ${
                        preview ? "bg-gm-500/10" : ""
                      }`}
                      style={{ minWidth: 84, maxWidth: 220 }}
                    >
                      {isActive && editing ? (
                        <input
                          ref={inlineRef}
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={onInlineKey}
                          onBlur={() => editing && commit(draft, "none")}
                          className="absolute inset-0 z-10 w-full border-2 border-gm-500 px-2 text-sm outline-none"
                        />
                      ) : (
                        <span className="block truncate">{dispOf(c, r)}</span>
                      )}
                      {isActive && !editing && (
                        <span
                          onMouseDown={(e) => { e.stopPropagation(); filling.current = true; setFillTo({ c, r }); }}
                          className="absolute -bottom-[3px] -right-[3px] z-20 h-2 w-2 cursor-crosshair bg-gm-500"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gm-700/50">
        Dica: clique numa célula e digite. Fórmulas começam com <b>=</b> e usam <b>;</b> entre argumentos
        (ex.: <code>=SE(A1&gt;10;&quot;Alto&quot;;&quot;Baixo&quot;)</code>). Arraste o quadradinho no canto da célula pra copiar.
        No teclado: <b>F4</b> alterna A1/$A$1, <b>Ctrl+C/V</b> copia e cola ajustando referências.
      </p>
    </div>
  );
}

function between(x: number, a: number, b: number) {
  return x >= Math.min(a, b) && x <= Math.max(a, b);
}
