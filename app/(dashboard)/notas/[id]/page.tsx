// app/(dashboard)/notas/[id]/page.tsx — editor de uma nota.
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveAccount } from "@/lib/account-guard";
import { getNote } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { NoteMediaUploader } from "@/components/notas/NoteMediaUploader";
import { updateNote, deleteNote } from "@/app/(dashboard)/notas/actions";

export default async function NotaPage({ params }: { params: { id: string } }) {
  const user = await requireActiveAccount();
  const note = await getNote(user.id, params.id);
  if (!note) notFound();

  const updateNoteWithId = updateNote.bind(null, note.id);
  const deleteNoteWithId = deleteNote.bind(null, note.id);

  return (
    <div>
      <Link href="/notas" className="text-sm text-gm-500 hover:underline">← Notas</Link>
      <PageHeader
        title="Editar nota"
        action={
          <a
            href={`/api/notas/${note.id}/pdf`}
            className="rounded-lg border border-gm-200 px-3 py-1.5 text-sm font-medium text-gm-700 hover:bg-gm-50"
          >
            ⬇ Baixar PDF
          </a>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <form action={updateNoteWithId} className="gm-card space-y-3 p-6 lg:col-span-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gm-900">Título</span>
            <input
              name="title"
              defaultValue={note.title}
              className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gm-900">Texto</span>
            <textarea
              name="content"
              defaultValue={note.content ?? ""}
              rows={12}
              placeholder="Escreva sua nota aqui..."
              className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
            />
          </label>
          <SubmitButton>Salvar nota</SubmitButton>
        </form>

        <div className="space-y-4">
          <div className="gm-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-gm-900">Anexos</h2>
            <NoteMediaUploader noteId={note.id} media={note.media} />
          </div>
          <form action={deleteNoteWithId}>
            <button className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
              Excluir nota
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
