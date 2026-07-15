// app/sala/[code]/page.tsx — sala de videochamada (link mágico, sem login).
// Fora do route group (dashboard): sem sidebar, sem sessão. Corretor e
// convidados usam exatamente esta mesma página/link. Escopado só pelo
// room_code — mesmo padrão de app/acompanhar/[token]/ e app/chat/[code]/.
import { notFound } from "next/navigation";
import { getMeetingByCode } from "@/lib/data";
import { MeetingEmbed } from "@/components/reunioes/MeetingEmbed";

export default async function SalaPage({ params }: { params: { code: string } }) {
  const meeting = await getMeetingByCode(params.code);
  if (!meeting) notFound();

  return <MeetingEmbed roomName={`goodmint-${meeting.roomCode}`} />;
}
