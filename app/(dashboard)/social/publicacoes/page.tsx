// app/(dashboard)/social/publicacoes/page.tsx — lista com filtro de status + cancelar.
import { requireActiveAccount } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { PageHeader, EmptyState, Badge } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { SocialTabs } from "@/components/social/SocialTabs";
import { cancelScheduledPost } from "@/app/(dashboard)/actions";

const STATUS_LABELS: Record<string, string> = {
  agendado: "Agendado",
  publicando: "Publicando",
  publicado: "Publicado",
  falhou: "Falhou",
  cancelado: "Cancelado",
};

export default async function PublicacoesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const user = await requireActiveAccount();
  const status = searchParams.status;

  const { rows: posts } = await db.query<{
    id: string;
    content: string;
    channels: string[];
    status: string;
    scheduled_for: string | null;
    published_at: string | null;
    error: string | null;
    created_at: string;
  }>(
    status
      ? `SELECT id, content, channels, status, scheduled_for, published_at, error, created_at
         FROM scheduled_posts WHERE user_id=$1 AND status=$2 ORDER BY created_at DESC`
      : `SELECT id, content, channels, status, scheduled_for, published_at, error, created_at
         FROM scheduled_posts WHERE user_id=$1 ORDER BY created_at DESC`,
    status ? [user.id, status] : [user.id]
  );

  return (
    <div>
      <PageHeader title="Social" subtitle="Conecte seus canais, acompanhe o engajamento e publique." />
      <SocialTabs />

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {["", "agendado", "publicado", "falhou"].map((s) => (
          <a
            key={s || "todos"}
            href={s ? `/social/publicacoes?status=${s}` : "/social/publicacoes"}
            className={`min-h-8 rounded-full px-3 py-1 font-medium ${
              status === s || (!status && !s) ? "bg-gm-500 text-white" : "bg-gm-100 text-gm-700/70"
            }`}
          >
            {s ? STATUS_LABELS[s] : "Todos"}
          </a>
        ))}
      </div>

      {posts.length === 0 ? (
        <EmptyState icon="🗓️" title="Nenhuma publicação ainda" desc="Crie uma nova publicação em 'Nova publicação'." />
      ) : (
        <div className="gm-card divide-y divide-gm-50">
          {posts.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gm-900">{p.content}</div>
                <div className="text-xs text-gm-700/50">
                  {p.channels.join(", ")} ·{" "}
                  {p.status === "agendado" && p.scheduled_for
                    ? `agendado para ${formatDateTime(p.scheduled_for)}`
                    : p.published_at
                    ? formatDateTime(p.published_at)
                    : formatDateTime(p.created_at)}
                </div>
                {p.error && <div className="text-xs text-red-600">{p.error}</div>}
              </div>
              <div className="flex items-center gap-2">
                <Badge value={p.status} label={STATUS_LABELS[p.status] ?? p.status} />
                {p.status === "agendado" && (
                  <form action={cancelScheduledPost.bind(null, p.id)}>
                    <button className="min-h-8 rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                      Cancelar
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
