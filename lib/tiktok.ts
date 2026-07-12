// lib/tiktok.ts — adapter do TikTok. A API de postagem do TikTok existe, mas
// apps não auditados só publicam como rascunho/privado — por isso o canal
// aparece na UI como "em validação" e essa função nunca chega a chamar a API
// real; ela existe só para o cron ter um formato uniforme de retorno por canal.
export async function publishTiktokPost(): Promise<{ ok: false; reason: string }> {
  return { ok: false, reason: "TikTok em validação técnica — publicação ainda não disponível." };
}
