// app/acompanhar/actions.ts — ações do portal público do cliente. Escopadas
// exclusivamente pelo token (nunca por user_id/sessão — essa rota não tem login).
"use server";

import { revalidatePath } from "next/cache";
import { submitPortalQuestion } from "@/lib/data";

export async function askQuestion(token: string, formData: FormData) {
  const content = String(formData.get("content") ?? "");
  const ok = await submitPortalQuestion(token, content);
  if (ok) revalidatePath(`/acompanhar/${token}`);
  return { ok };
}
