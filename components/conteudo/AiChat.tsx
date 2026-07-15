// components/conteudo/AiChat.tsx — chat livre de IA (estilo Gemini/ChatGPT)
// pro corretor pedir qualquer coisa relacionada ao trabalho dele. Conversa
// vive só no estado do componente (sem salvar no banco — ver plano).
"use client";

import { useState } from "react";
import { sendChatMessageAction, generateImageAction } from "@/app/(dashboard)/conteudo/actions";
import type { AiQuotaStatus } from "@/lib/ai-quota";
import { IMAGE_STYLES, type ImageStyleKey } from "@/lib/constants";

interface ChatItem {
  role: "user" | "assistant";
  /** "imagem" fica de fora do histórico mandado pra Claude — a API exige
   * que as mensagens alternem estritamente user/assistant, e um pedido de
   * imagem (que pode falhar sem nunca gerar uma resposta "assistant") quebra
   * essa alternância se entrar na conversa de texto. */
  kind: "texto" | "imagem";
  content?: string;
  imageUrl?: string;
}

export function AiChat({
  initialTextQuota,
  initialImageQuota,
}: {
  initialTextQuota: AiQuotaStatus;
  initialImageQuota: AiQuotaStatus;
}) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [imageStyle, setImageStyle] = useState<ImageStyleKey>("fotorrealista");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textQuota, setTextQuota] = useState(initialTextQuota);
  const [imageQuota, setImageQuota] = useState(initialImageQuota);

  async function handleSendText() {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setInput("");
    const nextItems: ChatItem[] = [...items, { role: "user", kind: "texto", content: text }];
    setItems(nextItems);
    setSending(true);
    try {
      const history = nextItems
        .filter((i) => i.kind === "texto" && i.content)
        .map((i) => ({ role: i.role, content: i.content! }));
      const res = await sendChatMessageAction(history);
      if (!res.ok) {
        // Desfaz a mensagem otimista — se ela ficasse sem resposta no
        // histórico, a próxima tentativa mandaria duas mensagens "user"
        // seguidas pra Claude, que exige alternância estrita e rejeitaria.
        setItems((prev) => prev.slice(0, -1));
        setInput(text);
        setError(res.error ?? "Não foi possível responder agora.");
        return;
      }
      setItems((prev) => [...prev, { role: "assistant", kind: "texto", content: res.reply }]);
      setTextQuota((q) => ({ ...q, used: q.used + 1, exceeded: q.limit !== null && q.used + 1 >= q.limit }));
    } finally {
      setSending(false);
    }
  }

  async function handleSendImage() {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setInput("");
    setItems((prev) => [...prev, { role: "user", kind: "imagem", content: `🖼️ ${text}` }]);
    setSending(true);
    try {
      const res = await generateImageAction({ subject: text, style: imageStyle });
      if (!res.ok) {
        setError(res.error ?? "Não foi possível gerar a imagem agora.");
        return;
      }
      setItems((prev) => [...prev, { role: "assistant", kind: "imagem", imageUrl: res.url }]);
      setImageQuota((q) => ({ ...q, used: q.used + 1, exceeded: q.limit !== null && q.used + 1 >= q.limit }));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="gm-card mx-auto flex max-w-2xl flex-col p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gm-700/60">
        <span>
          Textos: {textQuota.limit === null ? `${textQuota.used} (ilimitado)` : `${textQuota.used}/${textQuota.limit} este mês`}
        </span>
        <span>
          Imagens: {imageQuota.limit === null ? `${imageQuota.used} (ilimitado)` : `${imageQuota.used}/${imageQuota.limit} este mês`}
        </span>
      </div>

      <div className="gm-scroll flex min-h-[320px] flex-col gap-3 overflow-y-auto rounded-lg border border-gm-100 p-3">
        {items.length === 0 && (
          <p className="m-auto max-w-xs text-center text-sm text-gm-700/50">
            Pergunte qualquer coisa relacionada ao seu trabalho de corretor — dicas, mensagens pra clientes, textos, ideias. Ou escreva uma descrição e clique em "Gerar imagem".
          </p>
        )}
        {items.map((item, i) => (
          <div key={i} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                item.role === "user" ? "bg-gm-500 text-white" : "bg-gm-50 text-gm-900"
              }`}
            >
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="rounded-lg" />
              ) : (
                <span className="whitespace-pre-wrap">{item.content}</span>
              )}
            </div>
          </div>
        ))}
        {sending && <div className="text-xs text-gm-700/40">Pensando...</div>}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 space-y-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          placeholder="Escreva sua pergunta ou pedido..."
          className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm outline-none focus:border-gm-500"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={imageStyle}
            onChange={(e) => setImageStyle(e.target.value as ImageStyleKey)}
            className="rounded-lg border border-gm-200 px-2 py-1.5 text-xs text-gm-700 outline-none focus:border-gm-500"
          >
            {IMAGE_STYLES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={handleSendImage}
            disabled={sending || !input.trim()}
            className="rounded-lg border border-gm-200 px-3 py-1.5 text-xs font-medium text-gm-700 hover:bg-gm-50 disabled:opacity-60"
          >
            🖼️ Gerar imagem
          </button>
          <button
            onClick={handleSendText}
            disabled={sending || !input.trim()}
            className="ml-auto rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600 disabled:opacity-60"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
cat > 'lib/ai-image.ts' <<'GMEOF'
// lib/ai-image.ts — geração de imagem de imóvel pro Módulo Conteúdo com IA,
// via OpenAI (DALL-E 3, fetch direto, sem instalar o pacote `openai` — mesmo
// estilo minimalista de lib/claude-vision.ts). Resultado sobe pro Vercel Blob
// (mesmo `put()` de app/api/social/image/route.ts), não pro Supabase Storage.

import { put } from "@vercel/blob";
import { IMAGE_STYLES, type ImageStyleKey } from "@/lib/constants";

const API_URL = "https://api.openai.com/v1/images/generations";
const MODEL = "dall-e-3";

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
      size: "1792x1024",
      quality: "hd",
      n: 1,
      response_format: "b64_json",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro DALL-E (${res.status}): ${text}`);
  }

  const json = await res.json();
  const b64: string | undefined = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("A OpenAI não retornou a imagem gerada.");

  const bytes = Buffer.from(b64, "base64");
  const blob = await put(`conteudo-ia/${userId}-${Date.now()}.png`, bytes, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/png",
  });

  return { url: blob.url, prompt };
}
GMEOF

cat > 'lib/ai-image-gemini.ts' <<'GMEOF'
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
GMEOF

cat > '.env.example' <<'GMEOF'
# ==========================================================================
# GOOD MINT — variáveis de ambiente
# Copie para .env.local e preencha. NUNCA commite .env.local (seção 12 da spec).
# ==========================================================================

# ----- Banco de dados (Postgres — use o do Supabase) -----
# Supabase: Project Settings -> Database -> Connection string -> "Transaction pooler"
# Ex: postgresql://postgres.<ref>:<senha>@aws-0-<regiao>.pooler.supabase.com:6543/postgres
DATABASE_URL=

# ----- Sessão (JWT) -----
# Gere com: openssl rand -hex 64
SESSION_SECRET=

# ----- Asaas (pagamento recorrente) -----
# Painel Asaas -> Integrações -> Chaves de API
ASAAS_API_KEY=
# "sandbox" para testes, "production" para valer
ASAAS_ENV=sandbox
# Segredo que VOCÊ define e cola no painel Asaas -> Integrações -> Webhooks
ASAAS_WEBHOOK_TOKEN=

# ----- Upload de arquivos (foto de perfil, imagens de publicação) -----
# Vercel -> Storage -> Blob -> criar store -> a variável abaixo é preenchida automaticamente
# ao conectar o Blob store ao projeto (ou copie manualmente em Storage -> .env.local)
BLOB_READ_WRITE_TOKEN=

# ----- Meta (Instagram/Facebook — Módulo Social) -----
# developers.facebook.com -> seu App -> Configurações básicas
META_APP_ID=
META_APP_SECRET=
# Você define esse valor e cola na configuração do Webhook do seu App no Meta
META_WEBHOOK_VERIFY_TOKEN=

# ----- Cron (publicações agendadas + lembretes de pós-venda) -----
# Você define esse valor; usado para validar chamadas do cron da Vercel
CRON_SECRET=

# ----- Resend (e-mail transacional do módulo de Pós-Venda) -----
# resend.com -> API Keys
RESEND_API_KEY=
# Precisa ser um domínio verificado no Resend (ou use o padrão de testes deles)
RESEND_FROM_EMAIL="GOOD MINT <naoresponda@goodmint.app>"

# ----- Anthropic (validação de legibilidade de documentos + textos do Módulo Conteúdo com IA) -----
# console.anthropic.com -> API Keys
ANTHROPIC_API_KEY=

# ----- OpenAI (geração de imagens — Módulo Conteúdo com IA) -----
# platform.openai.com -> API Keys. Sem essa chave, a geração de texto do
# módulo continua funcionando normalmente — só a etapa de gerar imagem fica
# indisponível (mostra um aviso em vez de travar).
OPENAI_API_KEY=

# ----- Google Gemini (geração de imagens — segunda opção no Módulo Conteúdo com IA) -----
# aistudio.google.com/apikey -> Create API key. Opcional — o corretor escolhe
# na tela se quer gerar a imagem pela OpenAI ou pela Gemini.
GEMINI_API_KEY=

# ----- App -----
# URL pública (dev: http://localhost:3000 | prod: https://seu-app.vercel.app)
APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GMEOF

cat > 'app/(dashboard)/conteudo/actions.ts' <<'GMEOF'
// app/(dashboard)/conteudo/actions.ts — server actions do Módulo Conteúdo com IA.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { generateCaptions, type CaptionInput } from "@/lib/ai-text";
import { generatePropertyImage, type ImageGenInput } from "@/lib/ai-image";
import { generatePropertyImageGemini } from "@/lib/ai-image-gemini";
import { generateChatReply, type ChatMessage } from "@/lib/ai-chat";
import { getAiQuota, logAiUsage } from "@/lib/ai-quota";

export type ImageProvider = "openai" | "gemini";

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
  input: ImageGenInput,
  provider: ImageProvider = "openai"
): Promise<{ ok: boolean; url?: string; prompt?: string; error?: string }> {
  const userId = await requireUserId();
  if (provider === "gemini" && !process.env.GEMINI_API_KEY) {
    return { ok: false, error: "A geração de imagem pela Gemini ainda não foi configurada nesta conta." };
  }
  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    return { ok: false, error: "A geração de imagem pela OpenAI ainda não foi configurada nesta conta." };
  }
  const quota = await getAiQuota(userId, "imagem");
  if (quota.exceeded) {
    return { ok: false, error: "Você atingiu o limite mensal de imagens geradas por IA do seu plano." };
  }
  try {
    const { url, prompt } =
      provider === "gemini"
        ? await generatePropertyImageGemini(input, userId)
        : await generatePropertyImage(input, userId);
    await logAiUsage(userId, "imagem");
    return { ok: true, url, prompt };
  } catch (err) {
    console.error("Erro ao gerar imagem:", err);
    return { ok: false, error: "Não foi possível gerar a imagem agora. Tente novamente." };
  }
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
GMEOF
