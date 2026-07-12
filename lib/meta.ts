// lib/meta.ts — cliente da Graph API do Meta (Facebook/Instagram), no mesmo
// estilo de lib/asaas.ts. Cobre OAuth (Facebook Login for Business), leitura
// de conta conectada e publicação (Facebook Pages API / Instagram Content
// Publishing API). Depende de um App aprovado no Meta for Developers — sem
// isso, o fluxo OAuth chega até a tela de consentimento do próprio Meta e
// para lá (erro "app não está ativo"), o que é esperado e não é bug nosso.
import crypto from "crypto";

const GRAPH_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;

function appId(): string {
  const id = process.env.META_APP_ID;
  if (!id) throw new Error("META_APP_ID não definido");
  return id;
}

function appSecret(): string {
  const secret = process.env.META_APP_SECRET;
  if (!secret) throw new Error("META_APP_SECRET não definido");
  return secret;
}

/** True se as credenciais do App Meta estiverem configuradas (usado pela UI
 * para degradar graciosamente enquanto o App não existir/estiver aprovado). */
export function isMetaConfigured(): boolean {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

async function metaFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message ?? `Erro Meta (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

/** URL de início do fluxo OAuth (Facebook Login for Business). */
export function buildOAuthUrl(redirectUri: string, state: string): string {
  const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
  url.searchParams.set("client_id", appId());
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set(
    "scope",
    "pages_show_list,pages_manage_posts,pages_manage_engagement,instagram_basic,instagram_manage_comments,instagram_content_publish"
  );
  url.searchParams.set("response_type", "code");
  return url.toString();
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<{ access_token: string }> {
  return metaFetch<{ access_token: string }>("/oauth/access_token", {
    client_id: appId(),
    client_secret: appSecret(),
    redirect_uri: redirectUri,
    code,
  });
}

export async function getLongLivedToken(shortToken: string): Promise<{ access_token: string }> {
  return metaFetch<{ access_token: string }>("/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: appId(),
    client_secret: appSecret(),
    fb_exchange_token: shortToken,
  });
}

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  picture?: { data?: { url?: string } };
  instagram_business_account?: { id: string };
}

/** Lista as Páginas do Facebook que o usuário administra (com token de Página). */
export async function listPages(userToken: string): Promise<MetaPage[]> {
  const res = await metaFetch<{ data: MetaPage[] }>("/me/accounts", {
    fields: "id,name,access_token,picture,instagram_business_account",
    access_token: userToken,
  });
  return res.data ?? [];
}

export async function publishFacebookPost(input: {
  pageId: string;
  pageToken: string;
  message: string;
  imageUrl?: string;
}): Promise<{ id: string }> {
  const path = input.imageUrl ? `/${input.pageId}/photos` : `/${input.pageId}/feed`;
  const url = new URL(`${BASE_URL}${path}`);
  const body = new URLSearchParams({
    access_token: input.pageToken,
    ...(input.imageUrl ? { url: input.imageUrl, caption: input.message } : { message: input.message }),
  });
  const res = await fetch(url.toString(), { method: "POST", body, cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `Erro ao publicar no Facebook (${res.status})`);
  return { id: data.id ?? data.post_id };
}

export async function publishInstagramPost(input: {
  igUserId: string;
  pageToken: string;
  imageUrl: string;
  caption: string;
}): Promise<{ id: string }> {
  // Passo 1: criar o container de mídia
  const containerUrl = new URL(`${BASE_URL}/${input.igUserId}/media`);
  const containerRes = await fetch(containerUrl.toString(), {
    method: "POST",
    body: new URLSearchParams({
      image_url: input.imageUrl,
      caption: input.caption,
      access_token: input.pageToken,
    }),
    cache: "no-store",
  });
  const container = await containerRes.json();
  if (!containerRes.ok) {
    throw new Error(container?.error?.message ?? `Erro ao criar mídia no Instagram (${containerRes.status})`);
  }

  // Passo 2: publicar o container
  const publishUrl = new URL(`${BASE_URL}/${input.igUserId}/media_publish`);
  const publishRes = await fetch(publishUrl.toString(), {
    method: "POST",
    body: new URLSearchParams({ creation_id: container.id, access_token: input.pageToken }),
    cache: "no-store",
  });
  const published = await publishRes.json();
  if (!publishRes.ok) {
    throw new Error(published?.error?.message ?? `Erro ao publicar no Instagram (${publishRes.status})`);
  }
  return { id: published.id };
}

/** Valida a assinatura HMAC-SHA256 do webhook (header X-Hub-Signature-256). */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", appSecret()).update(rawBody).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}
