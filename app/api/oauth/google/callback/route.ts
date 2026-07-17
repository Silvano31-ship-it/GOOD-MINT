// app/api/oauth/google/callback/route.ts — GET
// Callback do OAuth do Google Calendar. Troca o `code` por tokens e salva a
// conexão. Mesmo padrão de app/api/oauth/meta/callback/route.ts.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exchangeCodeForTokens } from "@/lib/google-calendar";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // userId
  const redirectTo = new URL("/agenda", url.origin);

  if (!code || !state) {
    redirectTo.searchParams.set("erro", "1");
    return NextResponse.redirect(redirectTo);
  }

  try {
    const redirectUri = `${process.env.APP_URL}/api/oauth/google/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    if (!tokens.refresh_token) {
      redirectTo.searchParams.set("erro", "sem_refresh_token");
      return NextResponse.redirect(redirectTo);
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    await db.query(
      `INSERT INTO google_calendar_connections (user_id, access_token, refresh_token, token_expires_at, connected_at)
       VALUES ($1,$2,$3,$4,now())
       ON CONFLICT (user_id) DO UPDATE SET
         access_token=$2, refresh_token=$3, token_expires_at=$4, connected_at=now()`,
      [state, tokens.access_token, tokens.refresh_token, expiresAt.toISOString()]
    );

    redirectTo.searchParams.set("conectado", "1");
    return NextResponse.redirect(redirectTo);
  } catch (err) {
    console.error("Erro no callback OAuth do Google:", err);
    redirectTo.searchParams.set("erro", "1");
    return NextResponse.redirect(redirectTo);
  }
}
