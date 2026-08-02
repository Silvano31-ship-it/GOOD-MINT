// app/(dashboard)/planilhas/livre/actions.ts — server actions do EXCEL GOOD ✅.
// Criar, salvar (JSONB de conteúdo cru), renomear e apagar planilhas livres.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { CellMap } from "@/lib/excel/engine";

async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
}

export async function createSheet() {
  const userId = await requireUserId();
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO sheets (user_id) VALUES ($1) RETURNING id`,
    [userId]
  );
  revalidatePath("/planilhas/livre");
  redirect(`/planilhas/livre/${rows[0].id}`);
}

export async function saveSheet(id: string, cells: CellMap) {
  const userId = await requireUserId();
  const clean: CellMap = {};
  for (const [k, v] of Object.entries(cells)) {
    if (v !== "" && v != null) clean[k] = v;
  }
  await db.query(
    `UPDATE sheets SET data = $1::jsonb, updated_at = now() WHERE id = $2 AND user_id = $3`,
    [JSON.stringify(clean), id, userId]
  );
}

export async function renameSheet(id: string, name: string) {
  const userId = await requireUserId();
  const n = name.trim().slice(0, 120) || "Nova planilha";
  await db.query(`UPDATE sheets SET name = $1 WHERE id = $2 AND user_id = $3`, [n, id, userId]);
  revalidatePath("/planilhas/livre");
  revalidatePath(`/planilhas/livre/${id}`);
}

export async function deleteSheet(id: string) {
  const userId = await requireUserId();
  await db.query(`DELETE FROM sheets WHERE id = $1 AND user_id = $2`, [id, userId]);
  revalidatePath("/planilhas/livre");
  redirect("/planilhas/livre");
}
