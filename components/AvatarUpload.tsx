// components/AvatarUpload.tsx — upload de foto de perfil com preview circular.
// Se não houver foto (ou o upload falhar), mostra as iniciais do nome num
// círculo azul (mesmo padrão usado no Sidebar).
"use client";

import { useRef, useState } from "react";
import { getInitials } from "@/lib/constants";

export function AvatarUpload({
  fullName,
  initialUrl,
}: {
  fullName: string;
  initialUrl: string | null;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar a foto.");
        return;
      }
      setUrl(data.url);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="relative flex h-16 w-16 min-h-11 min-w-11 flex-none items-center justify-center overflow-hidden rounded-full bg-gm-500 text-lg font-semibold text-white ring-2 ring-gm-100 transition hover:opacity-90 disabled:opacity-60"
        aria-label="Alterar foto de perfil"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          getInitials(fullName)
        )}
      </button>
      <div>
        <label htmlFor="avatar-input" className="cursor-pointer text-sm font-semibold text-gm-500 hover:underline">
          {loading ? "Enviando..." : "Alterar foto"}
        </label>
        <input
          id="avatar-input"
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="sr-only"
          onChange={onFileChange}
          disabled={loading}
        />
        <p className="text-xs text-gm-700/50">JPG ou PNG, até 2 MB.</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
