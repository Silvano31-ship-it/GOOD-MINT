// components/reunioes/MeetingEmbed.tsx — encapsula o iframe do Jitsi Meet
// (meet.jit.si, serviço público e gratuito, sem conta/chave necessária). A
// própria interface do Jitsi já traz os controles de câmera, microfone e
// compartilhar tela — não é algo que construímos aqui.
"use client";

export function MeetingEmbed({ roomName }: { roomName: string }) {
  return (
    <iframe
      src={`https://meet.jit.si/${roomName}`}
      allow="camera; microphone; display-capture; fullscreen; autoplay; clipboard-write"
      className="h-screen w-screen border-0"
    />
  );
}
