// app/(dashboard)/conteudo/chat/page.tsx — chat livre de IA (Gemini-like).
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { getAiQuota } from "@/lib/ai-quota";
import { PageHeader } from "@/components/ui";
import { AiChat } from "@/components/conteudo/AiChat";

export const maxDuration = 60;

export default async function ConteudoChatPage() {
  const user = await requireActiveAccount();
  const textQuota = await getAiQuota(user.id, "texto");

  return (
    <div>
      <Link href="/conteudo" className="text-sm text-gm-500 hover:underline">← IA GOOD | Conteúdo</Link>
      <PageHeader title="Conversar com a IA" subtitle="Pergunte qualquer coisa relacionada ao seu trabalho de corretor." />
      <AiChat initialTextQuota={textQuota} />
    </div>
  );
}
