// app/(dashboard)/social/nova/page.tsx — publicar agora ou agendar (E.4).
import { requireActiveAccount } from "@/lib/account-guard";
import { PageHeader } from "@/components/ui";
import { SocialTabs } from "@/components/social/SocialTabs";
import { NewPostForm } from "@/components/social/NewPostForm";

export default async function NovaPublicacaoPage() {
  await requireActiveAccount();

  return (
    <div>
      <PageHeader title="Social" subtitle="Conecte seus canais, acompanhe o engajamento e publique." />
      <SocialTabs />
      <div className="gm-card max-w-xl p-6">
        <NewPostForm />
      </div>
    </div>
  );
}
