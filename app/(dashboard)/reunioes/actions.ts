// app/(dashboard)/reunioes/actions.ts — server actions do módulo de Reuniões
// (gera um link de videochamada via Jitsi Meet — ver app/sala/[code]/page.tsx).
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

export async function createMeeting(formData: FormData) {
  const userId = await requireUserId();
  const title = String(formData.get("title") ?? "").trim() || "Reunião";
  await db.query(`INSERT INTO meetings (user_id, title) VALUES ($1,$2)`, [userId, title]);
  revalidatePath("/reunioes");
}

export async function deleteMeeting(meetingId: string) {
  const userId = await requireUserId();
  await db.query(`DELETE FROM meetings WHERE id=$1 AND user_id=$2`, [meetingId, userId]);
  revalidatePath("/reunioes");
}
