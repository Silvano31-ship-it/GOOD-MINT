// lib/mailer.ts
// Envio de e-mail transacional de autenticação (reset de senha). Usa a mesma
// API do Resend que lib/resend.ts usa pro pós-venda, mas mantido em arquivo
// próprio (responsabilidade diferente — auth vs. pós-venda).

const BASE_URL = "https://api.resend.com";
const FROM = process.env.RESEND_FROM_EMAIL ?? "GOOD MINT <naoresponda@goodmint.app>";

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[mailer] RESEND_API_KEY não definido — e-mail de reset não enviado.");
    return;
  }

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
      <h2 style="color:#1e63c4">Redefinir sua senha</h2>
      <p>Olá, ${name}!</p>
      <p>Recebemos um pedido para redefinir a senha da sua conta GOOD MINT. Clique no botão abaixo para criar uma nova senha:</p>
      <p style="margin:24px 0">
        <a href="${resetUrl}" style="background:#1e63c4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Redefinir senha</a>
      </p>
      <p style="font-size:13px;color:#666">Esse link expira em 1 hora. Se você não pediu essa redefinição, pode ignorar este e-mail.</p>
      <p style="margin-top:24px;font-size:12px;color:#888">GOOD MINT · CRM do corretor autônomo</p>
    </div>
  `;

  try {
    const res = await fetch(`${BASE_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM,
        to,
        subject: "Redefinir sua senha — GOOD MINT",
        html,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[mailer] Falha ao enviar e-mail de reset (${res.status}): ${text}`);
    }
  } catch (err) {
    console.error("[mailer] Erro ao enviar e-mail de reset:", err);
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`[mailer/dev] Reset de senha para ${to} (${name}): ${resetUrl}`);
  }
}
