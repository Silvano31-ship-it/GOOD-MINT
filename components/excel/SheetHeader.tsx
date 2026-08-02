// components/excel/SheetHeader.tsx — cabeçalho do editor do EXCEL GOOD ✅:
// nome editável (salva ao sair do campo) e botão de apagar.
"use client";

import { useState, useTransition } from "react";
import { renameSheet, deleteSheet } from "@/app/(dashboard)/planilhas/livre/actions";

export function SheetHeader({ id, name }: { id: string; name: string }) {
  const [value, setValue] = useState(name);
  const [, startTransition] = useTransition();

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => { if (value.trim() && value !== name) startTransition(() => renameSheet(id, value)); }}
        className="rounded-lg border border-transparent px-2 py-1 text-lg font-bold text-gm-900 hover:border-gm-200 focus:border-gm-300 focus:outline-none"
      />
      <button
        onClick={() => {
          if (confirm("Apagar esta planilha? Essa ação não pode ser desfeita.")) {
            startTransition(() => deleteSheet(id));
          }
        }}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
      >
        🗑️ Apagar
      </button>
    </div>
  );
}
