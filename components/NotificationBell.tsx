// components/NotificationBell.tsx — sino com contador de não lidas +
// toast quando chega notificação nova, enquanto o corretor está com o app
// aberto (o aviso quando o app está fechado já é coberto pelo push real,
// ver components/PushSetup.tsx). Usa polling simples (sem WebSocket/lib
// nova) — consistente com o resto do projeto, que evita dependências extras
// para funcionalidades que um fetch periódico já resolve.
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const POLL_MS = 25000;

interface UnreadItem {
  id: string;
  type: string;
  content: string;
  created_at: string;
  url: string;
}

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [toast, setToast] = useState<UnreadItem | null>(null);
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/notifications/unread", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data: { count: number; latest: UnreadItem[] } = await res.json();
        if (cancelled) return;

        setCount(data.count);

        if (seenIds.current === null) {
          // Primeira leitura: só memoriza o que já existe, sem disparar toast
          // (senão todo mundo levaria um toast de tudo que já estava pendente
          // assim que abrisse o app).
          seenIds.current = new Set(data.latest.map((n) => n.id));
        } else {
          const fresh = data.latest.find((n) => !seenIds.current!.has(n.id));
          if (fresh) {
            seenIds.current.add(fresh.id);
            setToast(fresh);
          }
        }
      } catch {
        // Silencioso — próximo ciclo de polling tenta de novo.
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <>
      <Link
        href="/configuracoes/notificacoes"
        aria-label="Notificações"
        className="relative flex h-9 w-9 flex-none items-center justify-center rounded-full text-lg hover:bg-gm-100"
      >
        🔔
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Link>

      {toast && (
        <div className="fixed bottom-4 right-4 z-[60] w-[calc(100%-2rem)] max-w-sm rounded-xl border border-gm-100 bg-white p-4 shadow-2xl transition-all">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold text-gm-900">🔔 Nova notificação</span>
            <button
              onClick={() => setToast(null)}
              aria-label="Fechar"
              className="text-gm-700/40 hover:text-gm-700"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-sm text-gm-700/80">{toast.content}</p>
          <Link
            href={toast.url}
            onClick={() => setToast(null)}
            className="mt-3 inline-block rounded-lg bg-gm-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gm-600"
          >
            Ver agora →
          </Link>
        </div>
      )}
    </>
  );
}
