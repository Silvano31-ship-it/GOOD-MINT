// app/(dashboard)/social/atividade/page.tsx — painel de engajamento (E.3).
import { requireActiveAccount } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { SocialTabs } from "@/components/social/SocialTabs";

const KIND_LABEL: Record<string, string> = {
  mensagem: "💬 Mensagem",
  comentario: "🗨️ Comentário",
  curtida: "❤️ Curtida",
  mencao: "📣 Menção",
};

export default async function SocialAtividadePage() {
  const user = await requireActiveAccount();
  const { rows: activity } = await db.query<{
    id: string;
    channel: string;
    kind: string;
    author_name: string | null;
    content: string | null;
    created_at: string;
  }>(
    `SELECT id, channel, kind, author_name, content, created_at
     FROM social_activity WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,
    [user.id]
  );

  return (
    <div>
      <PageHeader title="Social" subtitle="Crie conteúdo com IA agora; acompanhe o engajamento quando conectar suas redes." />
      <SocialTabs />

      <div className="mb-4 rounded-lg border border-gm-100 bg-gm-50 px-4 py-3 text-sm text-gm-700">
        <p>
          <b className="text-green-700">✅ Já funciona:</b> criar posts, legendas e
          imagens com IA na aba <b>Nova publicação</b>.
        </p>
        <p className="mt-1">
          <b className="text-amber-700">⏳ Em breve:</b> conectar Instagram e Facebook
          pra ver o engajamento (mensagens, comentários, curtidas) e publicar direto —
          depende da aprovação da API da Meta, ainda em análise.
        </p>
      </div>

      {activity.length === 0 ? (
        <EmptyState
          icon="📣"
          title="Nenhuma atividade ainda"
          desc="Assim que você conectar Instagram ou Facebook em Configurações → Integrações, novas mensagens, comentários e curtidas aparecem aqui."
        />
      ) : (
        <div className="gm-card divide-y divide-gm-50">
          {activity.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-gm-900">
                  {KIND_LABEL[a.kind] ?? a.kind} {a.author_name ? `de ${a.author_name}` : ""}
                </div>
                {a.content && <div className="text-xs text-gm-700/60">{a.content}</div>}
                <div className="text-xs capitalize text-gm-700/40">{a.channel}</div>
              </div>
              <span className="flex-none text-xs text-gm-700/40">{formatDateTime(a.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
