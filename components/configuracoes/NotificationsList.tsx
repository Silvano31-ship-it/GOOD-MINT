// components/configuracoes/NotificationsList.tsx — lista de notificações com
// filtro (todas/não lidas + tipo) e marcar como lida ao abrir. Filtro é
// aplicado no navegador (no máximo 50 itens, ver getNotifications) — não
// precisa de mais uma consulta ao banco só pra isso.
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Notification } from "@/lib/constants";
import { notificationUrl } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { markNotificationRead } from "@/app/(dashboard)/actions";

const TYPE_LABELS: Record<string, string> = {
  novo_lead: "🎯 Novo lead",
  tarefa_pendente: "✅ Tarefa pendente",
  pos_venda_parado: "📦 Cliente parado no pós-venda",
  duvida_cliente: "💬 Dúvida do cliente",
  trial_expirando: "🎁 Trial expirando",
};

export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  const [filter, setFilter] = useState<"todas" | "nao_lidas">("todas");
  const [type, setType] = useState<string>("todas");
  const [, startTransition] = useTransition();
  const router = useRouter();

  const types = useMemo(
    () => Array.from(new Set(notifications.map((n) => n.type))),
    [notifications]
  );

  const filtered = notifications.filter((n) => {
    if (filter === "nao_lidas" && n.read_at) return false;
    if (type !== "todas" && n.type !== type) return false;
    return true;
  });

  function open(n: Notification) {
    if (!n.read_at) {
      startTransition(async () => {
        await markNotificationRead(n.id);
      });
    }
    router.push(notificationUrl(n.type, n.related_id));
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "todas" | "nao_lidas")}
          className="min-h-9 rounded-lg border border-gm-200 px-2 py-1 text-sm"
        >
          <option value="todas">Todas</option>
          <option value="nao_lidas">Só não lidas</option>
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="min-h-9 rounded-lg border border-gm-200 px-2 py-1 text-sm"
        >
          <option value="todas">Todos os tipos</option>
          {types.map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="gm-card p-6 text-center text-sm text-gm-700/50">Nenhuma notificação com esse filtro.</p>
      ) : (
        <div className="gm-card divide-y divide-gm-50">
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => open(n)}
              className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gm-50 ${!n.read_at ? "bg-gm-50/50" : ""}`}
            >
              <div>
                <div className="text-sm font-medium text-gm-900">{TYPE_LABELS[n.type] ?? n.type}</div>
                <div className="text-sm text-gm-700/70">{n.content}</div>
              </div>
              <span className="flex-none text-xs text-gm-700/40">{formatDateTime(n.created_at)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
