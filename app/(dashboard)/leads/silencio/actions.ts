// app/(dashboard)/leads/silencio/actions.ts — ações do Rastreador de Silêncio:
// mudar o perfil de contato do lead (paciente/incisivo) e registrar um contato
// (zera o silêncio, atualizando last_contact_at).
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const PROFILES = new Set(["paciente", "incisivo"]);

export async function setContactProfile(leadId: string, profile: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  const p = PROFILES.has(profile) ? profile : "paciente";
  await db.query(
    `UPDATE leads SET contact_profile = $1 WHERE id = $2 AND user_id = $3`,
    [p, leadId, session.userId]
  );
  revalidatePath("/leads/silencio");
}

export async function markContacted(leadId: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  await db.query(
    `UPDATE leads SET last_contact_at = now() WHERE id = $1 AND user_id = $2`,
    [leadId, session.userId]
  );
  revalidatePath("/leads/silencio");
}
