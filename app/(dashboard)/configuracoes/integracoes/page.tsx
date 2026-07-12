// app/(dashboard)/configuracoes/integracoes/page.tsx — Tela 15. Configuração de Integrações.
// WhatsApp usa o fluxo de intenção de conexão (ver requestChannelConnection).
// Instagram/Facebook usam OAuth real do Meta (lib/meta.ts) — mas só ficam
// disponíveis se META_APP_ID/META_APP_SECRET estiverem configurados; sem
// isso, mostramos tudo como indisponível em vez de um botão que vai falhar.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { isMetaConfigured } from "@/lib/meta";
import { requestChannelConnection, startMetaOAuth, toggleAutoReply } from "@/app/(dashboard)/actions";
import { PageHeader } from "@/components/ui";

const metaReady = isMetaConfigured();

const CHANNELS = [
  { key: "whatsapp", icon: "💬", name: "WhatsApp Business", kind: "intent" as const, note: "Canal prioritário — mais viável tecnicamente (janela de 24h de atendimento)." },
  { key: "instagram", icon: "📷", name: "Instagram", kind: "oauth" as const, note: "Disponibilidade sujeita à aprovação da Meta." },
  { key: "facebook", icon: "📘", name: "Facebook", kind: "oauth" as const, note: "Disponibilidade sujeita à aprovação da Meta." },
  { key: "tiktok", icon: "🎵", name: "TikTok", kind: "unavailable" as const, note: "Sujeito à validação técnica da API para terceiros." },
];

export default async function IntegracoesPage({
  searchParams,
}: {
  searchParams: { conectado?: string; erro?: string };
}) {
  const user = await requireActiveAccount();
  const { rows } = await db.query<{
    channel: string;
    status: string;
    auto_reply_enabled: boolean;
    external_account_name: string | null;
  }>(
    `SELECT channel, status, auto_reply_enabled, external_account_name FROM channel_integrations WHERE user_id=$1`,
    [user.id]
  );
  const byChannel = Object.fromEntries(rows.map((r) => [r.channel, r]));

  return (
    <div>
      <Link href="/configuracoes" className="text-sm text-gm-500 hover:underline">← Configurações</Link>
      <PageHeader title="Integrações" subtitle="Conecte suas contas oficiais para centralizar as conversas na Central de Mensagens." />

      {searchParams.conectado && (
        <div className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">✓ Canal conectado com sucesso.</div>
      )}
      {searchParams.erro && (
        <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Não foi possível conectar agora. Se sua conta ainda não foi aprovada pela Meta, isso é esperado.
        </div>
      )}

      <div className="space-y-3">
        {CHANNELS.map((c) => {
          const integration = byChannel[c.key];
          const oauthAvailable = c.kind === "oauth" && metaReady;

          return (
            <div key={c.key} className="gm-card flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <div className="font-medium text-gm-900">
                    {c.name}
                    {integration?.external_account_name ? ` — ${integration.external_account_name}` : ""}
                  </div>
                  <div className="text-xs text-gm-700/50">{c.note}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {c.kind === "unavailable" && (
                  <span className="rounded-full bg-gm-100 px-3 py-1 text-xs font-medium text-gm-700/60">Em breve</span>
                )}

                {c.kind === "intent" &&
                  (integration ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                      Aguardando reconexão
                    </span>
                  ) : (
                    <form action={requestChannelConnection.bind(null, c.key)}>
                      <button className="min-h-11 rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">
                        Conectar
                      </button>
                    </form>
                  ))}

                {c.kind === "oauth" &&
                  (!oauthAvailable ? (
                    <span className="rounded-full bg-gm-100 px-3 py-1 text-xs font-medium text-gm-700/60">
                      Aguardando aprovação da Meta
                    </span>
                  ) : integration?.status === "conectado" ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Conectado</span>
                  ) : integration?.status === "token_expirado" ? (
                    <form action={startMetaOAuth.bind(null, c.key as "instagram" | "facebook")}>
                      <button className="min-h-11 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
                        Reconectar
                      </button>
                    </form>
                  ) : (
                    <form action={startMetaOAuth.bind(null, c.key as "instagram" | "facebook")}>
                      <button className="min-h-11 rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">
                        Conectar
                      </button>
                    </form>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      <ToggleAutoReplyRow channels={rows} />
    </div>
  );
}

// Toggle real de "resposta automática" — server action via <form>, já que o
// checkbox acima é só ilustrativo (checkboxes não disparam server actions
// onChange diretamente em componentes de servidor). Lista compacta abaixo dos
// cards para canais já conectados.
function ToggleAutoReplyRow({
  channels,
}: {
  channels: { channel: string; status: string; auto_reply_enabled: boolean }[];
}) {
  const connected = channels.filter((c) => c.status === "conectado");
  if (connected.length === 0) return null;
  return (
    <div className="mt-6 gm-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-gm-900">Resposta automática por canal</h2>
      <div className="space-y-2">
        {connected.map((c) => (
          <form
            key={c.channel}
            action={toggleAutoReply.bind(null, c.channel, !c.auto_reply_enabled)}
            className="flex items-center justify-between gap-3"
          >
            <span className="text-sm capitalize text-gm-700">{c.channel}</span>
            <button
              type="submit"
              className={`min-h-8 rounded-full px-3 py-1 text-xs font-semibold transition ${
                c.auto_reply_enabled ? "bg-green-100 text-green-700" : "bg-gm-100 text-gm-700/60"
              }`}
            >
              {c.auto_reply_enabled ? "Ativada — toque para desativar" : "Desativada — toque para ativar"}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
