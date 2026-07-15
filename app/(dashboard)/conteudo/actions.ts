// app/(dashboard)/conteudo/actions.ts — server actions do Módulo Conteúdo com IA.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { generateCaptions, type CaptionInput } from "@/lib/ai-text";
import { generatePropertyImage, type ImageGenInput } from "@/lib/ai-image";
import { getAiQuota, logAiUsage } from "@/lib/ai-quota";

async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
}

export async function generateCaptionsAction(
  input: CaptionInput
): Promise<{ ok: boolean; captions?: string[]; error?: string }> {
  const userId = await requireUserId();
  const quota = await getAiQuota(userId, "texto");
  if (quota.exceeded) {
    return { ok: false, error: "Você atingiu o limite mensal de textos gerados por IA do seu plano." };
  }
  try {
    const captions = await generateCaptions(input);
    await logAiUsage(userId, "texto");
    return { ok: true, captions };
  } catch (err) {
    console.error("Erro ao gerar legenda:", err);
    return { ok: false, error: "Não foi possível gerar o texto agora. Tente novamente." };
  }
}

export async function generateImageAction(
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
    console.error("Erro ao gerar imagem:", err);
    return { ok: false, error: "Não foi possível gerar a imagem agora. Tente novamente." };
  }
}

export async function saveAiContent(data: {
  propertyId: string | null;
  contentType: string;
  title: string | null;
  content: string;
  tone: string | null;
  imageUrl: string | null;
  imagePrompt: string | null;
  imageStyle: string | null;
  postTip: string | null;
}): Promise<{ id: string }> {
  const userId = await requireUserId();
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO ai_content
       (user_id, property_id, content_type, title, content, tone, image_url, image_prompt, image_style, post_tip)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id`,
    [
      userId,
      data.propertyId,
      data.contentType,
      data.title,
      data.content,
      data.tone,
      data.imageUrl,
      data.imagePrompt,
      data.imageStyle,
      data.postTip,
    ]
  );
  revalidatePath("/conteudo");
  return { id: rows[0].id };
}

export async function deleteAiContent(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.query(`DELETE FROM ai_content WHERE id=$1 AND user_id=$2`, [id, userId]);
  revalidatePath("/conteudo");
}
