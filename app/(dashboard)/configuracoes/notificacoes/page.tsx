// app/(dashboard)/configuracoes/notificacoes/page.tsx — Tela 18. Configurações — Notificações.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getNotifications } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { PushSetup } from "@/components/PushSetup";

const TYPE_LABELS: Record<string, string> = {
  novo_lead: "🎯 Novo lead",
  tarefa_pendente: "✅ Tarefa pendente",
  pos_venda_parado: "📦 Cliente parado no pós-venda",
  trial_expirando: "🎁 Trial expirando",
};

export default async function NotificacoesPage() {
  const user = await requireActiveAccount();
  const notifications = await getNotifications(user.id);

  return (
    <div>
      <Link href="/configuracoes" className="text-sm text-gm-500 hover:underline">← Configurações</Link>
      <PageHeader title="Notificações" subtitle="Novo lead, tarefa pendente e cliente parado em etapa do pós-venda." />

      <div className="mb-6">
        <PushSetup vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon="🔔" title="Nenhuma notificação" desc="Você será avisado aqui sobre novos leads, tarefas e alertas do pós-venda." />
      ) : (
        <div className="gm-card divide-y divide-gm-50">
          {notifications.map((n) => (
            <div key={n.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${!n.read_at ? "bg-gm-50/50" : ""}`}>
              <div>
                <div className="text-sm font-medium text-gm-900">{TYPE_LABELS[n.type] ?? n.type}</div>
                <div className="text-sm text-gm-700/70">{n.content}</div>
              </div>
              <span className="text-xs text-gm-700/40">{formatDateTime(n.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
