// app/(dashboard)/configuracoes/notificacoes/page.tsx — Tela 18. Configurações — Notificações.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getNotifications } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/ui";
import { PushSetup } from "@/components/PushSetup";
import { NotificationsList } from "@/components/configuracoes/NotificationsList";

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
        <NotificationsList notifications={notifications} />
      )}
    </div>
  );
}
