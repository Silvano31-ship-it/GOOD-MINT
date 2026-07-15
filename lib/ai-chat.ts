// lib/ai-chat.ts — chat livre de IA pro corretor, dentro do Módulo Conteúdo
// com IA. Mesmo formato de fetch direto de lib/ai-text.ts/lib/claude-vision.ts
// (sem SDK novo) — diferença é o system prompt (assistente de propósito
// geral, não uma legenda estruturada) e o histórico de mensagens.

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

function apiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY não definido");
  return key;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `Você é o assistente de IA do GOOD MINT, um app de CRM para corretores de imóveis autônomos no Brasil. Ajude o corretor com qualquer pedido relacionado ao trabalho dele: escrever mensagens para clientes, legendas e textos para redes sociais, dicas de negociação e vendas, dúvidas sobre o mercado imobiliário, organização do dia a dia, etc.
Responda sempre em português brasileiro, de forma direta e prática, sem enrolação.
Se o pedido não tiver nenhuma relação com o trabalho de corretor de imóveis, responda educadamente que você é focado em ajudar com isso.
Não gere imagens nem diga que vai gerar uma imagem — se o corretor quiser uma imagem, ele usa o botão específico de gerar imagem da tela.`;

// Limite simples de mensagens enviadas à API, pra não deixar o prompt gigante
// numa conversa muito longa.
const MAX_HISTORY = 12;

export async function generateChatReply(messages: ChatMessage[]): Promise<string> {
  const trimmed = messages.slice(-MAX_HISTORY);

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: trimmed.map((m) => ({ role: m.role, content: m.content })),
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro Claude Chat (${res.status}): ${text}`);
  }

  const json = await res.json();
  const text: string = json?.content?.[0]?.text ?? "";
  if (!text.trim()) throw new Error("A IA não retornou nenhuma resposta.");
  return text;
}
