// lib/ai-text.ts — geração de legendas/textos pro Módulo Conteúdo com IA.
// Mesmo formato de lib/claude-vision.ts (fetch direto, sem SDK), só que
// texto-a-texto em vez de imagem-a-texto.

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

function apiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY não definido");
  return key;
}

export type ContentTone = "profissional" | "amigavel" | "direto";

export interface CaptionProperty {
  address: string;
  propertyType: string;
  priceCents: number;
  areaM2: number | null;
  description: string | null;
}

export interface CaptionInput {
  contentType: string;
  tone: ContentTone;
  property?: CaptionProperty;
  subject?: string;
}

const TYPE_INSTRUCTIONS: Record<string, string> = {
  imovel_disponivel: "Legenda para divulgar um imóvel disponível para venda/locação. Gancho forte no início, destaque os diferenciais, termine com uma chamada para ação (agendar visita, chamar no WhatsApp). Inclua de 8 a 12 hashtags relevantes de imóveis no final.",
  imovel_vendido: "Legenda comemorando a venda/locação de um imóvel (prova social). Tom de conquista, sem revelar valores exatos se não fornecidos, convidando outras pessoas a procurar o corretor. Inclua algumas hashtags relevantes.",
  dica: "Post com uma dica útil para quem está comprando, vendendo ou alugando um imóvel. Educativo, direto, sem soar como propaganda.",
  institucional: "Post institucional apresentando o trabalho do corretor/imobiliária, reforçando confiança e credibilidade.",
  personalizado: "Post seguindo exatamente o assunto informado, adaptando o tom pedido.",
};

function buildTextPrompt(input: CaptionInput): string {
  let prompt = "Você é um especialista em marketing imobiliário brasileiro. Crie legendas para redes sociais de um corretor de imóveis autônomo.\n\n";

  if (input.property) {
    const p = input.property;
    prompt += `Dados do imóvel:\n- Endereço: ${p.address}\n- Tipo: ${p.propertyType}\n- Valor: ${(p.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
    if (p.areaM2) prompt += `- Área: ${p.areaM2} m²\n`;
    if (p.description) prompt += `- Descrição: ${p.description}\n`;
  } else if (input.subject) {
    prompt += `Assunto: "${input.subject}"\n`;
  }

  prompt += `\n${TYPE_INSTRUCTIONS[input.contentType] ?? TYPE_INSTRUCTIONS.personalizado}\n`;

  if (input.tone === "profissional") prompt += "\nUse linguagem formal e sofisticada.";
  else if (input.tone === "amigavel") prompt += "\nUse linguagem próxima e acolhedora, com emojis moderados.";
  else if (input.tone === "direto") prompt += "\nUse frases curtas, objetivas, sem enrolação.";

  prompt += "\n\nGere em português brasileiro, sem mencionar que foi gerado por IA. Responda SOMENTE em JSON no formato {\"variacoes\":[\"...\",\"...\",\"...\"]} com exatamente 3 variações de legenda.";

  return prompt;
}

export async function generateCaptions(input: CaptionInput): Promise<string[]> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1200,
      messages: [{ role: "user", content: buildTextPrompt(input) }],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro Claude Texto (${res.status}): ${text}`);
  }

  const json = await res.json();
  const text: string = json?.content?.[0]?.text ?? "{}";
  try {
    const parsed = JSON.parse(text.trim());
    if (Array.isArray(parsed.variacoes) && parsed.variacoes.length > 0) {
      return parsed.variacoes.map((v: unknown) => String(v));
    }
  } catch {
    // resposta fora do formato esperado — cai no erro abaixo
  }
  throw new Error("Não foi possível interpretar o texto gerado.");
}
