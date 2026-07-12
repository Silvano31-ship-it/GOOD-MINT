// lib/mailer.ts
// Envio de e-mail — implementação a plugar no provedor escolhido
// (Resend, SendGrid, SES...). Mantido isolado pra trocar de provedor
// sem tocar nas rotas. Credenciais SEMPRE via variável de ambiente.

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<void> {
  // TODO: integrar provedor real (ex: Resend). Enquanto não há provedor,
  // logamos o link no servidor (apenas em desenvolvimento) para permitir teste.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[mailer/dev] Reset de senha para ${to} (${name}): ${resetUrl}`);
  }
}
