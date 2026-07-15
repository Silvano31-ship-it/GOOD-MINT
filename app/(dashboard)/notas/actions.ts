// app/(dashboard)/notas/actions.ts — server actions do módulo de Notas.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
}

/** Cria uma nota em branco e manda pro editor — mesmo padrão de createProperty. */
export async function createNote() {
  const userId = await requireUserId();
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO notes (user_id, title) VALUES ($1, 'Sem título') RETURNING id`,
    [userId]
  );
  revalidatePath("/notas");
  redirect(`/notas/${rows[0].id}`);
}

export async function updateNote(noteId: string, formData: FormData) {
  const userId = await requireUserId();
  const title = String(formData.get("title") ?? "").trim() || "Sem título";
  const content = String(formData.get("content") ?? "");
  await db.query(
    `UPDATE notes SET title=$1, content=$2, updated_at=now() WHERE id=$3 AND user_id=$4`,
    [title, content, noteId, userId]
  );
  revalidatePath("/notas");
  revalidatePath(`/notas/${noteId}`);
}

/** Sem is_active em notes — exclusão é definitiva, mesmo padrão de
 * bulkDeleteNegotiations (tabela sem soft-delete). */
export async function deleteNote(noteId: string) {
  const userId = await requireUserId();
  await db.query(`DELETE FROM notes WHERE id=$1 AND user_id=$2`, [noteId, userId]);
  revalidatePath("/notas");
  redirect("/notas");
}

export async function deleteNoteMedia(mediaId: string) {
  const userId = await requireUserId();
  const { rows } = await db.query<{ note_id: string }>(
    `DELETE FROM note_media nm USING notes n
     WHERE nm.id = $1 AND nm.note_id = n.id AND n.user_id = $2
     RETURNING nm.note_id`,
    [mediaId, userId]
  );
  if (rows[0]) revalidatePath(`/notas/${rows[0].note_id}`);
}
