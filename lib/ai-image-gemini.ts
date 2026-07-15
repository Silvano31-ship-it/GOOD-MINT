// lib/ai-image-gemini.ts — geração de imagem de imóvel via Google Gemini
// (Imagen 3, fetch direto, sem SDK). Segunda opção de provedor além da OpenAI
// (lib/ai-image.ts) — o corretor escolhe qual usar na tela.

import { put } from "@vercel/blob";
import { buildImagePrompt, type ImageGenInput } from "@/lib/ai-image";

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict";

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY não definido");
  return key;
}

export async function generatePropertyImageGemini(input: ImageGenInput, userId: string): Promise<{ url: string; prompt: string }> {
  const prompt = buildImagePrompt(input);

  const res = await fetch(`${API_URL}?key=${apiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: "16:9" },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro Gemini (${res.status}): ${text}`);
  }

  const json = await res.json();
  const b64: string | undefined = json?.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error("A Gemini não retornou a imagem gerada.");

  const bytes = Buffer.from(b64, "base64");
  const blob = await put(`conteudo-ia/${userId}-${Date.now()}.png`, bytes, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/png",
  });

  return { url: blob.url, prompt };
}
