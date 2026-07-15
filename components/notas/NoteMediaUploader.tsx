// components/notas/NoteMediaUploader.tsx — anexos (foto/vídeo) de uma nota.
// Mesmo padrão de upload por fetch+FormData do BackgroundSelector.tsx.
"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { NoteMedia } from "@/lib/constants";
import { deleteNoteMedia } from "@/app/(dashboard)/notas/actions";

const MAX_BYTES = 4 * 1024 * 1024;

export function NoteMediaUploader({ noteId, media }: { noteId: string; media: NoteMedia[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > MAX_BYTES) {
      setError("O arquivo deve ter no máximo 4 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/notas/${noteId}/media`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar o arquivo.");
        return;
      }
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onRemove(mediaId: string) {
    setRemovingId(mediaId);
    startTransition(async () => {
      await deleteNoteMedia(mediaId);
      setRemovingId(null);
      router.refresh();
    });
  }

  return (
    <div>
      {media.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {media.map((m) => (
            <div key={m.id} className="group relative aspect-square overflow-hidden rounded-lg border border-gm-100 bg-gm-50">
              {m.media_type === "video" ? (
                <video src={m.url} muted className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => onRemove(m.id)}
                disabled={pending && removingId === m.id}
                aria-label="Remover anexo"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-60"
              >
                {pending && removingId === m.id ? "…" : "✕"}
              </button>
            </div>
          ))}
        </div>
      )}

      <label htmlFor="note-media-input" className="cursor-pointer text-sm font-semibold text-gm-500 hover:underline">
        {loading ? "Enviando..." : "+ Adicionar foto/vídeo"}
      </label>
      <input
        id="note-media-input"
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
        className="sr-only"
        onChange={onFileChange}
        disabled={loading}
      />
      <p className="mt-1 text-xs text-gm-700/50">Foto ou vídeo curto, até 4 MB por arquivo.</p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
