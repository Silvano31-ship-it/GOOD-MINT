// app/(dashboard)/social/nova/page.tsx — publicar agora ou agendar (E.4).
import { requireActiveAccount } from "@/lib/account-guard";
import { getAiContentItem } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { SocialTabs } from "@/components/social/SocialTabs";
import { NewPostForm } from "@/components/social/NewPostForm";

export default async function NovaPublicacaoPage({
  searchParams,
}: {
  searchParams: { fromContentId?: string };
}) {
  const user = await requireActiveAccount();
  const fromContent = searchParams.fromContentId
    ? await getAiContentItem(user.id, searchParams.fromContentId)
    : null;

  return (
    <div>
      <PageHeader title="Social" subtitle="Conecte seus canais, acompanhe o engajamento e publique." />
      <SocialTabs />
      <div className="gm-card max-w-xl p-6">
        <NewPostForm initialContent={fromContent?.content} initialImageUrl={fromContent?.image_url} />
      </div>
    </div>
  );
}
