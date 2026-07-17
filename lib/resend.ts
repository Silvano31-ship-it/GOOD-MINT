// lib/resend.ts
// Cliente da API do Resend (e-mail transacional) — mesmo formato de lib/asaas.ts:
// chave em variável de ambiente, um wrapper fetch privado, funções tipadas.
// Usado só pelo módulo de pós-venda (avanço de etapa, lembrete de prazo,
// e-mail de "parabéns" na etapa final). lib/mailer.ts continua cuidando só
// do reset de senha — responsabilidade diferente, não vale unificar.

const BASE_URL = "https://api.resend.com";
// Sem domínio próprio verificado no Resend ainda, usamos o remetente de teste
// deles (onboarding@resend.dev) — funciona sem configuração extra, mas só
// entrega pro e-mail cadastrado na conta Resend. Trocar por RESEND_FROM_EMAIL
// assim que um domínio for verificado.
const FROM = process.env.RESEND_FROM_EMAIL ?? "GOOD MINT <onboarding@resend.dev>";

function apiKey(): string {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY não definido");
  return key;
}

async function resendFetch<T>(
  path: string,
  init?: Omit<RequestInit, "body"> & { body?: unknown }
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    method: init?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = data?.message ?? `Erro Resend (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  await resendFetch("/emails", {
    method: "POST",
    body: { from: FROM, to, subject, html },
  });
}

function wrapEmail(title: string, bodyHtml: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
      <h2 style="color:#0d7a4f">${title}</h2>
      ${bodyHtml}
      <p style="margin-top:24px;font-size:12px;color:#888">GOOD MINT · CRM do corretor autônomo</p>
    </div>
  `;
}

export async function sendStageCompleteEmail(
  to: string,
  clientName: string,
  stageLabel: string,
  brokerName: string,
  portalUrl: string
): Promise<void> {
  await sendEmail(
    to,
    `Atualização do seu processo: ${stageLabel}`,
    wrapEmail(
      "Seu processo avançou! 🎉",
      `<p>Olá, ${clientName}!</p>
       <p>Seu corretor <b>${brokerName}</b> atualizou o andamento da sua compra/aluguel:</p>
       <p style="font-size:18px;font-weight:bold;color:#0d7a4f">${stageLabel}</p>
       <p><a href="${portalUrl}" style="color:#0d7a4f">Acompanhe todo o andamento aqui</a></p>`
    )
  );
}

export async function sendDeadlineReminderEmail(
  to: string,
  clientName: string,
  stageLabel: string,
  dueDate: string
): Promise<void> {
  await sendEmail(
    to,
    `Lembrete: prazo se aproximando`,
    wrapEmail(
      "Um prazo está chegando ⏳",
      `<p>Olá, ${clientName}!</p>
       <p>A etapa <b>${stageLabel}</b> tem um prazo previsto para <b>${dueDate}</b>. Fique atento(a).</p>`
    )
  );
}

/** Avisa o CORRETOR (não o cliente) por e-mail quando o cliente manda uma
 * dúvida pelo portal — fallback pra quando ele não está com o app aberto
 * (o push cobre o celular; o e-mail cobre quem ainda não ativou o push). */
export async function sendNewQuestionEmail(
  to: string,
  brokerName: string,
  leadName: string,
  question: string,
  dashboardUrl: string
): Promise<void> {
  await sendEmail(
    to,
    `Nova dúvida de ${leadName} no portal de acompanhamento`,
    wrapEmail(
      "Você recebeu uma nova dúvida 💬",
      `<p>Olá, ${brokerName}!</p>
       <p><b>${leadName}</b> escreveu isto no portal de acompanhamento:</p>
       <p style="padding:12px;background:#f5f5f5;border-radius:6px;font-style:italic">"${question}"</p>
       <p><a href="${dashboardUrl}" style="color:#0d7a4f">Responder no GOOD MINT</a></p>`
    )
  );
}

/** E-mail disparado por uma automação do corretor (ver Módulo Automações) —
 * a mensagem em si é escrita pelo próprio corretor ao criar a regra. */
export async function sendAutomationEmail(
  to: string,
  brokerName: string,
  leadName: string,
  customMessage: string,
  leadUrl: string
): Promise<void> {
  await sendEmail(
    to,
    `⚡ Automação: ${leadName} precisa de atenção`,
    wrapEmail(
      "Uma automação foi disparada ⚡",
      `<p>Olá, ${brokerName}!</p>
       <p>Sua automação disparou para o lead <b>${leadName}</b>:</p>
       <p style="padding:12px;background:#f5f5f5;border-radius:6px;font-style:italic">"${customMessage}"</p>
       <p><a href="${leadUrl}" style="color:#0d7a4f">Ver lead</a></p>`
    )
  );
}

export async function sendCongratsEmail(
  to: string,
  clientName: string,
  portalUrl: string
): Promise<void> {
  await sendEmail(
    to,
    `Parabéns! Seu processo foi concluído 🎉`,
    wrapEmail(
      "Parabéns pela conquista!",
      `<p>Olá, ${clientName}!</p>
       <p>Seu processo de pós-venda foi concluído com sucesso. Foi um prazer acompanhar você até aqui!</p>
       <p><a href="${portalUrl}" style="color:#0d7a4f">Ver o resumo completo</a></p>
       <p>Conhece alguém que também está buscando um imóvel? Pergunte ao seu corretor sobre o programa de indicação.</p>`
    )
  );
}
