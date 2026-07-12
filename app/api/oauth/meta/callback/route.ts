// app/api/oauth/meta/callback/route.ts — GET
// Callback do Facebook Login for Business. Troca o `code` por token, resolve
// a Página/conta do Instagram vinculada e salva em channel_integrations.
// Requer sessão ativa (o fluxo começa dentro do app, logado) — coberto pelo
// middleware normal, nenhum bypass necessário aqui.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exchangeCodeForToken, getLongLivedToken, listPages } from "@/lib/meta";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // "{userId}:{channel}"
  const redirectTo = new URL("/configuracoes/integracoes", url.origin);

  if (!code || !state) {
    redirectTo.searchParams.set("erro", "1");
    return NextResponse.redirect(redirectTo);
  }

  const [userId, channel] = state.split(":");
  if (!userId || (channel !== "instagram" && channel !== "facebook")) {
    redirectTo.searchParams.set("erro", "1");
    return NextResponse.redirect(redirectTo);
  }

  try {
    const redirectUri = `${process.env.APP_URL}/api/oauth/meta/callback`;
    const shortToken = await exchangeCodeForToken(code, redirectUri);
    const longToken = await getLongLivedToken(shortToken.access_token);
    const pages = await listPages(longToken.access_token);
    const page = pages[0]; // MVP: primeira Página administrada pelo usuário

    if (!page) {
      redirectTo.searchParams.set("erro", "sem_pagina");
      return NextResponse.redirect(redirectTo);
    }

    const isInstagram = channel === "instagram";
    const accountId = isInstagram ? page.instagram_business_account?.id : page.id;
    if (!accountId) {
      redirectTo.searchParams.set("erro", isInstagram ? "sem_instagram_business" : "sem_pagina");
      return NextResponse.redirect(redirectTo);
    }

    await db.query(
      `INSERT INTO channel_integrations
         (user_id, channel, status, external_account_id, access_token_encrypted,
          external_account_name, external_account_photo_url, connected_at)
       VALUES ($1,$2,'conectado',$3,$4,$5,$6,now())
       ON CONFLICT (user_id, channel) DO UPDATE SET
         status='conectado', external_account_id=$3, access_token_encrypted=$4,
         external_account_name=$5, external_account_photo_url=$6, connected_at=now()`,
      [userId, channel, accountId, page.access_token, page.name, page.picture?.data?.url ?? null]
    );

    redirectTo.searchParams.set("conectado", "1");
    return NextResponse.redirect(redirectTo);
  } catch (err) {
    console.error("Erro no callback OAuth do Meta:", err);
    redirectTo.searchParams.set("erro", "1");
    return NextResponse.redirect(redirectTo);
  }
}
