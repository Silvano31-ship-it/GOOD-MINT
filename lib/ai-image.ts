// lib/ai-image.ts — geração de imagem de imóvel pro Módulo Conteúdo com IA,
// via OpenAI (gpt-image-1, fetch direto, sem instalar o pacote `openai` —
// mesmo estilo minimalista de lib/claude-vision.ts). Resultado sobe pro
// Vercel Blob (mesmo `put()` de app/api/social/image/route.ts), não pro
// Supabase Storage.

import { put } from "@vercel/blob";
import { IMAGE_STYLES, type ImageStyleKey } from "@/lib/constants";

const API_URL = "https://api.openai.com/v1/images/generations";
const MODEL = "gpt-image-1";

function apiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY não definido");
  return key;
}

export interface ImageGenProperty {
  address: string;
  propertyType: string;
  description: string | null;
}

export interface ImageGenInput {
  property?: ImageGenProperty;
  subject?: string;
  style: ImageStyleKey;
}

export function buildImagePrompt(input: ImageGenInput): string {
  const styleFragment = IMAGE_STYLES.find((s) => s.key === input.style)?.promptFragment ?? IMAGE_STYLES[0].promptFragment;
  let subject: string;
  if (input.property) {
    subject = `um imóvel do tipo ${input.property.propertyType}${input.property.description ? `, com estas características: ${input.property.description}` : ""}`;
  } else {
    subject = input.subject || "um imóvel residencial";
  }
  return `Imagem de capa para redes sociais de uma imobiliária, mostrando ${subject}. Estilo: ${styleFragment}. 16:9, alta qualidade, sem texto sobreposto, sem marca d'água, sem pessoas reconhecíveis, foco no imóvel.`;
}

export async function generatePropertyImage(input: ImageGenInput, userId: string): Promise<{ url: string; prompt: string }> {
  const prompt = buildImagePrompt(input);

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      size: "1536x1024",
      quality: "high",
      n: 1,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro DALL-E (${res.status}): ${text}`);
  }

  const json = await res.json();
  const item = json?.data?.[0];
  let bytes: Buffer;
  if (item?.b64_json) {
    bytes = Buffer.from(item.b64_json, "base64");
  } else if (item?.url) {
    const imgRes = await fetch(item.url);
    bytes = Buffer.from(await imgRes.arrayBuffer());
  } else {
    throw new Error("A OpenAI não retornou a imagem gerada.");
  }
  const blob = await put(`conteudo-ia/${userId}-${Date.now()}.png`, bytes, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/png",
  });

  return { url: blob.url, prompt };
}
