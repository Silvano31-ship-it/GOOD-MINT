// app/(dashboard)/ia-chat/page.tsx — chat livre de IA (Gemini-like), tela
// independente (o antigo Módulo "IA GOOD | Conteúdo" foi removido).
import { requireActiveAccount } from "@/lib/account-guard";
import { getAiQuota } from "@/lib/ai-quota";
import { PageHeader } from "@/components/ui";
import { AiChat } from "@/components/ia-chat/AiChat";

export const maxDuration = 60;

export default async function IaChatPage() {
  const user = await requireActiveAccount();
  const [textQuota, imageQuota] = await Promise.all([
    getAiQuota(user.id, "texto"),
    getAiQuota(user.id, "imagem"),
  ]);

  return (
    <div>
      <PageHeader title="Assistente de IA" subtitle="Pergunte qualquer coisa relacionada ao seu trabalho de corretor, ou peça uma imagem." />
      <AiChat initialTextQuota={textQuota} initialImageQuota={imageQuota} />
    </div>
  );
}
