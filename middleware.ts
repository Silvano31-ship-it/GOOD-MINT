// middleware.ts (raiz do projeto)
// Protege toda a área logada. Sem sessão → /login.
// O status da conta (suspensa) é checado no layout do dashboard (server
// component) via requireActiveAccount — o middleware Edge só valida o JWT.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";

const PUBLIC_PATHS = [
  "/", // landing page
  "/login",
  "/cadastro",
  "/recuperar-senha",
  "/termos",
  "/privacidade",
  "/acompanhar", // portal do cliente (link mágico, sem login)
  "/indicar", // formulário público de indicação de clientes
  "/chat", // chat em grupo — convidado entra por link/código, sem login
  "/sala", // sala de videochamada — corretor e convidados, sem login
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    isPublic(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/chat") || // mensagens do chat em grupo — convidado não tem sessão
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
