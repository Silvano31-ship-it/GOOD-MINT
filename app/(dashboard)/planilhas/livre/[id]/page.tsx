// app/(dashboard)/planilhas/livre/[id]/page.tsx — editor de uma planilha do
// EXCEL GOOD ✅. Carrega o conteúdo cru (JSONB) e renderiza a grade.
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveAccount } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { Spreadsheet } from "@/components/excel/Spreadsheet";
import { SheetHeader } from "@/components/excel/SheetHeader";
import type { CellMap } from "@/lib/excel/engine";

export default async function SheetEditorPage({ params }: { params: { id: string } }) {
  const user = await requireActiveAccount();
  const { rows } = await db.query<{ id: string; name: string; data: CellMap }>(
    `SELECT id, name, data FROM sheets WHERE id = $1 AND user_id = $2`,
    [params.id, user.id]
  );
  const sheet = rows[0];
  if (!sheet) notFound();

  return (
    <div>
      <Link href="/planilhas/livre" className="text-sm text-gm-500 hover:underline">← EXCEL GOOD ✅</Link>
      <div className="mt-2">
        <SheetHeader id={sheet.id} name={sheet.name} />
      </div>
      <Spreadsheet sheetId={sheet.id} initialCells={sheet.data ?? {}} />
    </div>
  );
}
