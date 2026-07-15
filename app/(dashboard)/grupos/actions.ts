// app/(dashboard)/grupos/actions.ts — server actions do Chat em Grupo (lado
// do corretor). O envio/leitura de mensagens em si vive em
// app/api/chat/[code]/messages/route.ts (precisa ser acessível sem sessão,
// pelos convidados — ver middleware.ts).
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { generateInviteCode } from "@/lib/chat-code";

async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
}

export async function createChatGroup(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/grupos");

  let groupId: string | null = null;
  for (let attempt = 0; attempt < 5 && !groupId; attempt++) {
    const code = generateInviteCode();
    try {
      const { rows } = await db.query<{ id: string }>(
        `INSERT INTO chat_groups (user_id, name, invite_code) VALUES ($1,$2,$3) RETURNING id`,
        [userId, name, code]
      );
      groupId = rows[0].id;
    } catch (err: any) {
      if (err.code !== "23505") throw err; // colisão de invite_code: tenta outro código
    }
  }

  revalidatePath("/grupos");
  if (groupId) redirect(`/grupos/${groupId}`);
  redirect("/grupos");
}

export async function deleteChatGroup(groupId: string) {
  const userId = await requireUserId();
  await db.query(`DELETE FROM chat_groups WHERE id=$1 AND user_id=$2`, [groupId, userId]);
  revalidatePath("/grupos");
  redirect("/grupos");
}
