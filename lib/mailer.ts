// lib/mailer.ts
// E-mails transacionais de autenticação e cobrança. Usa a mesma API do Resend
// que lib/resend.ts usa pro pós-venda, mas mantido em arquivo próprio
// (responsabilidade diferente — auth/cobrança vs. pós-venda).

const BASE_URL = "https://api.resend.com";
// Sem domínio próprio verificado no Resend ainda, usamos o remetente de teste
// deles (onboarding@resend.dev) — funciona sem configuração extra, mas só
// entrega pro e-mail cadastrado na conta Resend. Trocar por RESEND_FROM_EMAIL
// assim que um domínio for verificado (ver lib/resend.ts para o mesmo ajuste).
const FROM = process.env.RESEND_FROM_EMAIL ?? "GOOD MINT <onboarding@resend.dev>";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(`[mailer] RESEND_API_KEY não definido — e-mail "${subject}" não enviado.`);
    return;
  }
  try {
    const res = await fetch(`${BASE_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[mailer] Falha ao enviar e-mail "${subject}" (${res.status}): ${text}`);
    }
  } catch (err) {
    console.error(`[mailer] Erro ao enviar e-mail "${subject}":`, err);
  }
}

function wrapEmail(title: string, bodyHtml: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
      <h2 style="color:#1e63c4">${title}</h2>
      ${bodyHtml}
      <p style="margin-top:24px;font-size:12px;color:#888">GOOD MINT · CRM do corretor autônomo</p>
    </div>
  `;
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<void> {
  await sendEmail(
    to,
    "Redefinir sua senha — GOOD MINT",
    wrapEmail(
      "Redefinir sua senha",
      `<p>Olá, ${name}!</p>
       <p>Recebemos um pedido para redefinir a senha da sua conta GOOD MINT. Clique no botão abaixo para criar uma nova senha:</p>
       <p style="margin:24px 0">
         <a href="${resetUrl}" style="background:#1e63c4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Redefinir senha</a>
       </p>
       <p style="font-size:13px;color:#666">Esse link expira em 1 hora. Se você não pediu essa redefinição, pode ignorar este e-mail.</p>`
    )
  );

  if (process.env.NODE_ENV !== "production") {
    console.log(`[mailer/dev] Reset de senha para ${to} (${name}): ${resetUrl}`);
  }
}

/** Enviado ~3 dias antes da próxima cobrança (fim do trial ou renovação mensal). */
export async function sendPaymentReminderEmail(
  to: string,
  name: string,
  planName: string,
  priceFormatted: string,
  dueDateFormatted: string
): Promise<void> {
  await sendEmail(
    to,
    "Sua próxima cobrança está chegando — GOOD MINT",
    wrapEmail(
      "Sua cobrança está chegando ⏳",
      `<p>Olá, ${name}!</p>
       <p>Em breve o cartão cadastrado na sua conta será cobrado:</p>
       <p style="font-size:18px;font-weight:bold;color:#1e63c4">${planName} — ${priceFormatted}</p>
       <p>Data prevista: <b>${dueDateFormatted}</b>.</p>
       <p style="font-size:13px;color:#666">Se quiser trocar o cartão ou o plano antes da cobrança, acesse Configurações → Plano e Cobrança no painel.</p>`
    )
  );
}

/** Enviado quando o Asaas reporta falha/atraso no pagamento e a conta é suspensa. */
export async function sendPaymentFailedEmail(
  to: string,
  name: string,
  manageUrl: string
): Promise<void> {
  await sendEmail(
    to,
    "Não conseguimos processar seu pagamento — GOOD MINT",
    wrapEmail(
      "Seu pagamento não foi aprovado ⚠️",
      `<p>Olá, ${name}!</p>
       <p>Não conseguimos processar a cobrança da sua assinatura GOOD MINT. Por segurança, o acesso à sua conta foi temporariamente suspenso até a regularização.</p>
       <p style="margin:24px 0">
         <a href="${manageUrl}" style="background:#1e63c4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Atualizar forma de pagamento</a>
       </p>
       <p style="font-size:13px;color:#666">Assim que o pagamento for aprovado, seu acesso volta ao normal automaticamente.</p>`
    )
  );
}
