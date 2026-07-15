// app/(dashboard)/notas/page.tsx — lista de notas (bloco de rascunho).
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getNotes } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/ui";
import { createNote } from "@/app/(dashboard)/notas/actions";

function snippet(content: string | null): string {
  if (!content) return "Sem conteúdo ainda.";
  const clean = content.trim();
  return clean.length > 120 ? clean.slice(0, 120) + "…" : clean || "Sem conteúdo ainda.";
}

export default async function NotasPage() {
  const user = await requireActiveAccount();
  const notes = await getNotes(user.id);

  return (
    <div>
      <PageHeader
        title="Notas"
        subtitle="Rascunhos rápidos, com foto/vídeo e exportação em PDF."
        action={
          <form action={createNote}>
            <button className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">
              + Nova nota
            </button>
          </form>
        }
      />

      {notes.length === 0 ? (
        <EmptyState
          icon="📝"
          title="Nenhuma nota ainda"
          desc="Crie sua primeira nota pra guardar um rascunho, foto ou vídeo rápido."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n) => (
            <Link key={n.id} href={`/notas/${n.id}`} className="gm-card p-4 transition hover:-translate-y-0.5">
              <div className="font-semibold text-gm-900">{n.title}</div>
              <p className="mt-1 line-clamp-3 text-sm text-gm-700/60">{snippet(n.content)}</p>
              <div className="mt-3 text-xs text-gm-700/40">{formatDateTime(n.updated_at)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
