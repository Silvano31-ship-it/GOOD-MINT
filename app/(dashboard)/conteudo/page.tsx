// app/(dashboard)/conteudo/page.tsx — galeria do Módulo Conteúdo com IA.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getAiContent } from "@/lib/data";
import { getAiQuota } from "@/lib/ai-quota";
import { AI_CONTENT_TYPES, type AiContent } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/ui";
import { deleteAiContent } from "@/app/(dashboard)/conteudo/actions";

function typeLabel(key: string): string {
  return AI_CONTENT_TYPES.find((t) => t.key === key)?.label ?? key;
}

function snippet(content: string): string {
  const clean = content.trim();
  return clean.length > 140 ? clean.slice(0, 140) + "…" : clean;
}

function QuotaBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit === null ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  return (
    <div className="gm-card p-4">
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-gm-900">{label}</span>
        <span className="text-gm-700/60">{limit === null ? `${used} (ilimitado)` : `${used}/${limit} este mês`}</span>
      </div>
      {limit !== null && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-gm-100">
          <div className="h-full rounded-full bg-gm-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export default async function ConteudoPage() {
  const user = await requireActiveAccount();
  const [items, textQuota] = await Promise.all([
    getAiContent(user.id),
    getAiQuota(user.id, "texto"),
  ]);

  return (
    <div>
      <PageHeader
        title="IA GOOD | Conteúdo"
        subtitle="Gere legendas prontas para suas redes sociais em poucos passos."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/conteudo/chat" className="rounded-lg border border-gm-200 px-4 py-2 text-sm font-medium text-gm-700 hover:bg-gm-50">
              💬 Conversar com a IA
            </Link>
            <Link href="/conteudo/novo" className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">
              + Novo conteúdo
            </Link>
          </div>
        }
      />

      <div className="mb-6">
        <QuotaBar label="Textos gerados por IA" used={textQuota.used} limit={textQuota.limit} />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="🪄"
          title="Nenhum conteúdo gerado ainda"
          desc="Crie sua primeira legenda com ajuda da IA."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c: AiContent) => (
            <div key={c.id} className="gm-card overflow-hidden">
              {c.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image_url} alt="" className="h-36 w-full object-cover" />
              )}
              <div className="p-4">
                <span className="rounded bg-gm-50 px-1.5 py-0.5 text-[11px] font-medium text-gm-500">{typeLabel(c.content_type)}</span>
                <p className="mt-2 line-clamp-3 text-sm text-gm-700/80">{snippet(c.content)}</p>
                <div className="mt-2 text-xs text-gm-700/40">{formatDateTime(c.created_at)}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/social/nova?fromContentId=${c.id}`}
                    className="rounded-lg bg-gm-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gm-600"
                  >
                    Usar em publicação
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await deleteAiContent(c.id);
                    }}
                  >
                    <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                      Excluir
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
