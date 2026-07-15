// app/(dashboard)/reunioes/page.tsx — lista de reuniões (link de videochamada).
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { CopyLinkCard } from "@/components/CopyLinkCard";
import { createMeeting, deleteMeeting } from "@/app/(dashboard)/reunioes/actions";

export default async function ReunioesPage() {
  const user = await requireActiveAccount();
  const { rows: meetings } = await db.query<{ id: string; title: string; room_code: string; created_at: string }>(
    `SELECT id, title, room_code, created_at FROM meetings WHERE user_id=$1 ORDER BY created_at DESC`,
    [user.id]
  );

  return (
    <div>
      <PageHeader title="Reuniões" subtitle="Gere um link de videochamada e mande pra quem for entrar." />

      <form action={createMeeting} className="gm-card mb-6 flex flex-wrap items-end gap-3 p-4">
        <label className="flex-1 min-w-[200px]">
          <span className="mb-1 block text-sm font-medium text-gm-900">Título da reunião</span>
          <input
            name="title"
            required
            placeholder="Ex: Visita ao apto 302"
            className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
          />
        </label>
        <SubmitButton>+ Nova reunião</SubmitButton>
      </form>

      {meetings.length === 0 ? (
        <EmptyState icon="🎥" title="Nenhuma reunião ainda" desc="Crie uma reunião pra gerar um link de videochamada com compartilhar tela." />
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => (
            <div key={m.id} className="gm-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-gm-900">{m.title}</div>
                  <div className="text-xs text-gm-700/40">Criada em {formatDateTime(m.created_at)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/sala/${m.room_code}`}
                    target="_blank"
                    className="rounded-lg bg-gm-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gm-600"
                  >
                    Entrar
                  </Link>
                  <form action={deleteMeeting.bind(null, m.id)}>
                    <button className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
                      Excluir
                    </button>
                  </form>
                </div>
              </div>
              <div className="mt-3">
                <CopyLinkCard
                  path={`/sala/${m.room_code}`}
                  title="🔗 Link da reunião"
                  desc="Câmera, microfone e compartilhar tela ficam disponíveis dentro da sala."
                  waMessage={`Entra na nossa reunião "${m.title}":`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
