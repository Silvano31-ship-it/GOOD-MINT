// app/(dashboard)/configuracoes/integracoes/page.tsx — Tela 15. Configuração de Integrações.
// Seção 10 da spec: Fase 1 do lançamento cobre só WhatsApp (canal mais
// viável tecnicamente); Instagram/Facebook dependem de aprovação de negócio
// da Meta, e TikTok depende de validação técnica da API. Refletimos isso
// honestamente na UI em vez de simular uma conexão que não existe.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { requestChannelConnection } from "@/app/(dashboard)/actions";
import { PageHeader } from "@/components/ui";

const CHANNELS = [
  { key: "whatsapp", icon: "💬", name: "WhatsApp Business", available: true, note: "Canal prioritário — mais viável tecnicamente (janela de 24h de atendimento)." },
  { key: "instagram", icon: "📷", name: "Instagram", available: false, note: "Aguardando aprovação de negócio da Meta (Fase 2)." },
  { key: "facebook", icon: "📘", name: "Facebook Messenger", available: false, note: "Aguardando aprovação de negócio da Meta (Fase 2)." },
  { key: "tiktok", icon: "🎵", name: "TikTok", available: false, note: "Sujeito à validação técnica da API para terceiros." },
];

export default async function IntegracoesPage() {
  const user = await requireActiveAccount();
  const { rows } = await db.query<{ channel: string; status: string }>(
    `SELECT channel, status FROM channel_integrations WHERE user_id=$1`,
    [user.id]
  );
  const statusByChannel = Object.fromEntries(rows.map((r) => [r.channel, r.status]));

  return (
    <div>
      <Link href="/configuracoes" className="text-sm text-gm-500 hover:underline">← Configurações</Link>
      <PageHeader title="Integrações" subtitle="Conecte suas contas oficiais para centralizar as conversas na Central de Mensagens." />

      <div className="space-y-3">
        {CHANNELS.map((c) => {
          const status = statusByChannel[c.key];
          return (
            <div key={c.key} className="gm-card flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <div className="font-medium text-gm-900">{c.name}</div>
                  <div className="text-xs text-gm-700/50">{c.note}</div>
                </div>
              </div>
              {c.available ? (
                status ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                    Aguardando reconexão
                  </span>
                ) : (
                  <form action={requestChannelConnection.bind(null, c.key)}>
                    <button className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">
                      Conectar
                    </button>
                  </form>
                )
              ) : (
                <span className="rounded-full bg-gm-100 px-3 py-1 text-xs font-medium text-gm-700/60">Em breve</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
