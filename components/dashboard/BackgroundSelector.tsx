// components/dashboard/BackgroundSelector.tsx — upload/restauração do fundo
// personalizado do Dashboard, em Configurações. Mesmo padrão de estado do
// AvatarUpload.tsx (upload por fetch+FormData pra API route própria).
"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetDashboardBackground } from "@/app/(dashboard)/actions";

const MAX_BYTES = 4 * 1024 * 1024;

export function BackgroundSelector({
  currentUrl,
  currentType,
}: {
  currentUrl: string | null;
  currentType: "image" | "video" | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(currentUrl);
  const [type, setType] = useState(currentType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
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
      const res = await fetch("/api/dashboard/background", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar o arquivo.");
        return;
      }
      setUrl(data.url);
      setType(data.type);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onReset() {
    setError(null);
    startTransition(async () => {
      await resetDashboardBackground();
      setUrl(null);
      setType(null);
      router.refresh();
    });
  }

  return (
    <div className="gm-card p-4">
      <h2 className="mb-1 text-sm font-semibold text-gm-900">🖼️ Personalizar Fundo</h2>
      <p className="mb-3 text-xs text-gm-700/60">
        Suba uma foto ou um vídeo curto (até 4 MB) pra usar como fundo do seu Dashboard.
      </p>

      <div className="mb-3 flex h-20 w-full items-center justify-center overflow-hidden rounded-lg border border-gm-200 bg-gm-50">
        {url ? (
          type === "video" ? (
            <video src={url} muted className="h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          )
        ) : (
          <span className="text-xs text-gm-700/50">Fundo padrão (nenhum personalizado)</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor="dashboard-bg-input"
          className="cursor-pointer text-sm font-semibold text-gm-500 hover:underline"
        >
          {loading ? "Enviando..." : "Selecionar vídeo/foto"}
        </label>
        <input
          id="dashboard-bg-input"
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          className="sr-only"
          onChange={onFileChange}
          disabled={loading}
        />
        {url && (
          <button
            type="button"
            onClick={onReset}
            disabled={pending}
            className="text-sm font-medium text-gm-700/70 hover:text-gm-900 disabled:opacity-60"
          >
            Restaurar padrão
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-gm-700/50">Formatos: JPG, PNG, WEBP, MP4, WEBM.</p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
