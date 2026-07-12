// app/(dashboard)/mensagens/page.tsx — Tela 14. Central de Mensagens (caixa unificada).
// Fase 1 do lançamento (seção 10 da spec): só WhatsApp é viável tecnicamente
// sem depender da aprovação de negócio da Meta. Enquanto nenhum canal está
// conectado, mostramos o estado vazio real (sem conversa fictícia).
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export default async function MensagensPage() {
  const user = await requireActiveAccount();

  const { rows: channels } = await db.query<{ channel: string; status: string }>(
    `SELECT channel, status FROM channel_integrations WHERE user_id = $1`,
    [user.id]
  );
  const hasConnected = channels.some((c) => c.status === "conectado");

  const { rows: conversations } = await db.query(
    `SELECT c.id, c.channel, c.contact_name, c.contact_external_id, c.last_message_at,
            l.name AS lead_name
     FROM conversations c
     LEFT JOIN leads l ON l.id = c.lead_id
     WHERE c.user_id = $1
     ORDER BY c.last_message_at DESC NULLS LAST
     LIMIT 50`,
    [user.id]
  );

  return (
    <div>
      <PageHeader
        title="Central de Mensagens"
        subtitle="Caixa unificada — WhatsApp, Instagram, Facebook e TikTok."
        action={
          <Link href="/configuracoes/integracoes" className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">
            ⚙ Configurar canais
          </Link>
        }
      />

      {!hasConnected && (
        <div className="mb-6 rounded-xl border border-gm-200 bg-gm-50 px-4 py-3 text-sm text-gm-700">
          📡 Nenhum canal conectado ainda. Conecte seu WhatsApp Business em{" "}
          <Link href="/configuracoes/integracoes" className="font-semibold text-gm-500 hover:underline">
            Configurações → Integrações
          </Link>{" "}
          para começar a receber mensagens aqui.
        </div>
      )}

      {conversations.length === 0 ? (
        <EmptyState
          icon="💬"
          title="Nenhuma conversa ainda"
          desc="Assim que um lead ou cliente escrever em um canal conectado, a conversa aparece aqui — vinculada automaticamente ao contato certo."
        />
      ) : (
        <div className="gm-card divide-y divide-gm-50">
          {conversations.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="font-medium text-gm-900">{c.lead_name ?? c.contact_name ?? c.contact_external_id}</div>
                <div className="text-xs text-gm-700/50 capitalize">{c.channel}</div>
              </div>
              <span className="text-xs text-gm-700/40">{formatDateTime(c.last_message_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
