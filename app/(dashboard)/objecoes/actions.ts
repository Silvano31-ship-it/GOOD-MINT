// app/(dashboard)/objecoes/actions.ts — CRUD do Arquivo de Objeções:
// cadastrar objeção + resposta, marcar que uma resposta "funcionou" (ranqueia
// as mais eficazes) e apagar.
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

export async function createObjection(formData: FormData) {
  const userId = await requireUserId();
  const objection = String(formData.get("objection") ?? "").trim().slice(0, 300);
  const response = String(formData.get("response") ?? "").trim().slice(0, 2000);
  if (!objection || !response) return;

  await db.query(
    `INSERT INTO objections (user_id, objection, response) VALUES ($1, $2, $3)`,
    [userId, objection, response]
  );
  revalidatePath("/objecoes");
}

export async function markObjectionWorked(id: string) {
  const userId = await requireUserId();
  await db.query(
    `UPDATE objections SET times_worked = times_worked + 1 WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  revalidatePath("/objecoes");
}

export async function deleteObjection(id: string) {
  const userId = await requireUserId();
  await db.query(`DELETE FROM objections WHERE id = $1 AND user_id = $2`, [id, userId]);
  revalidatePath("/objecoes");
}
