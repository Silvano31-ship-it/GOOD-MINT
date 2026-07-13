// lib/claude-vision.ts
// Validação de legibilidade de documentos via Claude (Messages API, bloco de
// imagem). Escopo deliberadamente pequeno: só avalia se a foto está legível,
// completa e plausível — não é OCR nem extração de campos, que é um projeto
// bem maior. Mesmo formato de lib/asaas.ts (chave em env var, wrapper fetch
// privado, função tipada).

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

function apiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY não definido");
  return key;
}

export interface LegibilityVerdict {
  verdict: "legivel" | "ilegivel" | "suspeito";
  notes: string;
}

const SYSTEM_PROMPT = `Você avalia fotos de documentos enviados por clientes de uma imobiliária.
Responda SOMENTE em JSON no formato {"verdict":"legivel|ilegivel|suspeito","notes":"..."}.
- "legivel": o documento está nítido, completo na foto, sem cortes ou reflexos que impeçam a leitura.
- "ilegivel": a foto está borrada, cortada, escura demais ou incompleta.
- "suspeito": a imagem não parece ser o tipo de documento esperado, ou há sinais de adulteração.
Não tente extrair CPF, nome ou qualquer outro dado do documento — avalie apenas a qualidade/plausibilidade da imagem.
"notes" deve ter no máximo 2 frases, em português, explicando o veredito.`;

async function fetchImageAsBase64(imageUrl: string): Promise<{ data: string; mediaType: string }> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Não foi possível baixar a imagem (${res.status})`);
  const mediaType = res.headers.get("content-type") ?? "image/jpeg";
  const buf = await res.arrayBuffer();
  return { data: Buffer.from(buf).toString("base64"), mediaType };
}

export async function assessDocumentLegibility(imageUrl: string): Promise<LegibilityVerdict> {
  const { data, mediaType } = await fetchImageAsBase64(imageUrl);

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data } },
            { type: "text", text: "Avalie esta foto de documento." },
          ],
        },
      ],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro Claude Vision (${res.status}): ${text}`);
  }

  const json = await res.json();
  const text: string = json?.content?.[0]?.text ?? "{}";
  try {
    const parsed = JSON.parse(text.trim());
    if (parsed.verdict === "legivel" || parsed.verdict === "ilegivel" || parsed.verdict === "suspeito") {
      return { verdict: parsed.verdict, notes: String(parsed.notes ?? "") };
    }
  } catch {
    // resposta fora do formato esperado — cai no fallback abaixo
  }
  return { verdict: "suspeito", notes: "Não foi possível interpretar a avaliação automática." };
}
