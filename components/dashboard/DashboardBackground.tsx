// components/dashboard/DashboardBackground.tsx — fundo fixo e personalizado do
// Dashboard (foto ou vídeo), atrás do conteúdo, que continua rolando por cima.
// Sem url, não renderiza nada (fundo padrão do dashboard, sem mudança nenhuma).
"use client";

import { useState } from "react";

export function DashboardBackground({
  url,
  type,
}: {
  url: string | null;
  type: "image" | "video" | null;
}) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      {type === "video" ? (
        <video
          key={url}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        >
          <source src={url} />
        </video>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      )}
      <div className="absolute inset-0 bg-black/8" />
    </div>
  );
}
