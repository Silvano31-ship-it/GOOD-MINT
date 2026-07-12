// components/social/NewPostForm.tsx — texto + imagem + canais + publicar/agendar.
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/app/(dashboard)/actions";

const CHANNEL_OPTIONS = [
  { key: "instagram", label: "Instagram", disabled: false },
  { key: "facebook", label: "Facebook", disabled: false },
  { key: "tiktok", label: "TikTok (em validação)", disabled: true },
];

export function NewPostForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [channels, setChannels] = useState<string[]>([]);
  const [mode, setMode] = useState<"agora" | "agendar">("agora");
  const [scheduledFor, setScheduledFor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleChannel(key: string) {
    setChannels((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  }

  async function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/social/image", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar a imagem.");
        return;
      }
      setImageUrl(data.url);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("content", content);
      if (imageUrl) fd.set("image_url", imageUrl);
      channels.forEach((c) => fd.append("channels", c));
      fd.set("mode", mode);
      if (mode === "agendar") fd.set("scheduled_for", scheduledFor);

      const result = await createPost(fd);
      if (!result.ok) {
        setError(result.error ?? "Não foi possível publicar.");
        return;
      }
      router.push("/social/publicacoes");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gm-900">Texto</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          required
          className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
        />
      </label>

      <div>
        <span className="mb-1 block text-sm font-medium text-gm-900">Imagem (opcional)</span>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="mb-2 h-32 w-32 rounded-lg object-cover" />
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={onImageChange}
          disabled={uploading}
          className="text-sm"
        />
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-gm-900">Canais</span>
        <div className="flex flex-wrap gap-2">
          {CHANNEL_OPTIONS.map((c) => (
            <label
              key={c.key}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                c.disabled ? "cursor-not-allowed opacity-50" : ""
              } ${channels.includes(c.key) ? "border-gm-500 bg-gm-50" : "border-gm-200"}`}
            >
              <input
                type="checkbox"
                disabled={c.disabled}
                checked={channels.includes(c.key)}
                onChange={() => toggleChannel(c.key)}
                className="accent-gm-500"
              />
              {c.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-gm-900">Quando publicar</span>
        <div className="flex gap-2">
          <label className="flex min-h-11 items-center gap-1.5 text-sm">
            <input type="radio" checked={mode === "agora"} onChange={() => setMode("agora")} className="accent-gm-500" />
            Publicar agora
          </label>
          <label className="flex min-h-11 items-center gap-1.5 text-sm">
            <input type="radio" checked={mode === "agendar"} onChange={() => setMode("agendar")} className="accent-gm-500" />
            Agendar
          </label>
        </div>
        {mode === "agendar" && (
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            required
            className="mt-2 min-h-11 rounded-lg border border-gm-200 px-3 py-2 text-sm"
          />
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || uploading}
        className="min-h-11 w-full rounded-lg bg-gm-500 py-2.5 font-semibold text-white transition hover:bg-gm-600 disabled:opacity-60"
      >
        {loading ? "Enviando..." : mode === "agendar" ? "Agendar publicação" : "Publicar agora"}
      </button>
    </form>
  );
}
