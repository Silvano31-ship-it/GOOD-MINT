// app/(dashboard)/grupos/[id]/page.tsx — conversa do grupo, lado do corretor.
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveAccount } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { CopyLinkCard } from "@/components/CopyLinkCard";
import { ChatThread } from "@/components/chat/ChatThread";
import { deleteChatGroup } from "@/app/(dashboard)/grupos/actions";

export default async function GrupoPage({ params }: { params: { id: string } }) {
  const user = await requireActiveAccount();
  const { rows } = await db.query<{ id: string; name: string; invite_code: string }>(
    `SELECT id, name, invite_code FROM chat_groups WHERE id=$1 AND user_id=$2`,
    [params.id, user.id]
  );
  const group = rows[0];
  if (!group) notFound();

  const deleteGroupWithId = deleteChatGroup.bind(null, group.id);

  return (
    <div>
      <Link href="/grupos" className="text-sm text-gm-500 hover:underline">← Grupos</Link>
      <PageHeader title={group.name} subtitle="Sem lista fechada de membros — quem tem o link/código atual consegue entrar." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChatThread code={group.invite_code} viewerName={user.full_name} viewerIsOwner />
        </div>

        <div className="space-y-4">
          <CopyLinkCard
            path={`/chat/${group.invite_code}`}
            title="🔗 Convidar pra este grupo"
            desc={`Ou peça pra digitar o código ${group.invite_code} em /chat/entrar`}
            waMessage={`Entra no nosso grupo "${group.name}" no GOOD MINT:`}
          />
          <form action={deleteGroupWithId}>
            <button className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
              Excluir grupo
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
