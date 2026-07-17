// app/(dashboard)/ia-chat/actions.ts — server actions do chat livre de IA.
"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { generatePropertyImage, type ImageGenInput } from "@/lib/ai-image";
import { generateChatReply, type ChatMessage } from "@/lib/ai-chat";
import { getAiQuota, logAiUsage } from "@/lib/ai-quota";

async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
}

export async function sendChatMessageAction(
  messages: ChatMessage[]
): Promise<{ ok: boolean; reply?: string; error?: string }> {
  const userId = await requireUserId();
  const quota = await getAiQuota(userId, "texto");
  if (quota.exceeded) {
    return { ok: false, error: "Você atingiu o limite mensal de textos gerados por IA do seu plano." };
  }
  try {
    const reply = await generateChatReply(messages);
    await logAiUsage(userId, "texto");
    return { ok: true, reply };
  } catch (err) {
    console.error("Erro no chat de IA:", err);
    return { ok: false, error: "Não foi possível responder agora. Tente novamente." };
  }
}

export async function generateChatImageAction(
  input: ImageGenInput
): Promise<{ ok: boolean; url?: string; prompt?: string; error?: string }> {
  const userId = await requireUserId();
  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, error: "A geração de imagem por IA ainda não foi configurada nesta conta." };
  }
  const quota = await getAiQuota(userId, "imagem");
  if (quota.exceeded) {
    return { ok: false, error: "Você atingiu o limite mensal de imagens geradas por IA do seu plano." };
  }
  try {
    const { url, prompt } = await generatePropertyImage(input, userId);
    await logAiUsage(userId, "imagem");
    return { ok: true, url, prompt };
  } catch (err) {
    console.error("Erro ao gerar imagem no chat de IA:", err);
    return { ok: false, error: "Não foi possível gerar a imagem agora. Tente novamente." };
  }
}
