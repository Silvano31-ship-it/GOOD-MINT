// app/chat/[code]/page.tsx — chat do convidado (link mágico, sem login).
// Fora do route group (dashboard): sem sidebar, sem sessão. Escopado só pelo
// invite_code — mesmo padrão de app/acompanhar/[token]/.
import { notFound } from "next/navigation";
import { getChatGroupByCode } from "@/lib/data";
import { Logo } from "@/components/Logo";
import { GuestChatEntry } from "@/components/chat/GuestChatEntry";

export default async function ChatConvidadoPage({ params }: { params: { code: string } }) {
  const group = await getChatGroupByCode(params.code.toUpperCase());
  if (!group) notFound();

  return (
    <div className="min-h-screen bg-gm-50/40 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-4 flex justify-center">
          <Logo />
        </div>
        <h1 className="mb-4 text-center text-lg font-semibold text-gm-900">{group.name}</h1>
        <GuestChatEntry code={group.inviteCode} />
      </div>
    </div>
  );
}
