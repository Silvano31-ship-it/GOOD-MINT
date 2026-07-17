// lib/google-calendar.ts — cliente OAuth 2.0 + Calendar API do Google, no
// mesmo estilo de lib/meta.ts (fetch direto, sem SDK, sem tocar no banco —
// quem orquestra com o banco é app/(dashboard)/actions.ts).

const OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";

function clientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error("GOOGLE_CLIENT_ID não definido");
  return id;
}

function clientSecret(): string {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) throw new Error("GOOGLE_CLIENT_SECRET não definido");
  return secret;
}

/** True se as credenciais do OAuth do Google estiverem configuradas (usado
 * pela UI pra degradar graciosamente enquanto não estiverem). */
export function isGoogleCalendarConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** URL de início do fluxo OAuth. access_type=offline + prompt=consent
 * garantem que a gente sempre recebe um refresh_token, mesmo se o corretor
 * já tiver autorizado o app antes. */
export function buildOAuthUrl(redirectUri: string, state: string): string {
  const url = new URL(OAUTH_URL);
  url.searchParams.set("client_id", clientId());
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("scope", "https://www.googleapis.com/auth/calendar.events");
  url.searchParams.set("state", state);
  return url.toString();
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description ?? `Erro Google OAuth (${res.status})`);
  return data;
}

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description ?? `Erro ao renovar token do Google (${res.status})`);
  return data;
}

export interface CalendarEventInput {
  title: string;
  startISO: string; // data+hora local, ex.: "2026-07-20T14:00:00"
  durationMinutes: number;
}

async function calendarFetch<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${CALENDAR_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data?.error?.message ?? `Erro Google Calendar (${res.status})`);
  return data as T;
}

function toEventBody(input: CalendarEventInput) {
  const start = new Date(input.startISO);
  const end = new Date(start.getTime() + input.durationMinutes * 60000);
  const timeZone = "America/Sao_Paulo";
  return {
    summary: input.title,
    start: { dateTime: start.toISOString(), timeZone },
    end: { dateTime: end.toISOString(), timeZone },
  };
}

export async function createCalendarEvent(accessToken: string, input: CalendarEventInput): Promise<{ id: string }> {
  return calendarFetch<{ id: string }>(accessToken, "/calendars/primary/events", {
    method: "POST",
    body: JSON.stringify(toEventBody(input)),
  });
}

export async function updateCalendarEvent(accessToken: string, eventId: string, input: CalendarEventInput): Promise<void> {
  await calendarFetch(accessToken, `/calendars/primary/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(toEventBody(input)),
  });
}

export async function deleteCalendarEvent(accessToken: string, eventId: string): Promise<void> {
  await fetch(`${CALENDAR_BASE}/calendars/primary/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
}
