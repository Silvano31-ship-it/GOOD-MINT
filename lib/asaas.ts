// lib/asaas.ts
// Cliente da API do Asaas (gateway de pagamento — Pix, boleto, cartão).
// Chave e ambiente vêm de variável de ambiente (seção 12 da spec — nunca hardcoded).
//
// Fluxo de trial (seção 11): no cadastro do cartão (tela 5) criamos o cliente
// e uma assinatura recorrente com `nextDueDate` = fim do trial. O Asaas tokeniza
// o cartão e só cobra na data do vencimento (fim dos 3 dias). A confirmação
// chega por webhook, que muda a conta de `trialing` → `active`.

const ASAAS_ENV = process.env.ASAAS_ENV ?? "sandbox";
const BASE_URL =
  ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

function apiKey(): string {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("ASAAS_API_KEY não definido");
  return key;
}

async function asaasFetch<T>(
  path: string,
  init?: Omit<RequestInit, "body"> & { body?: unknown }
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    method: init?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey(),
      "User-Agent": "GoodMint",
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg =
      data?.errors?.[0]?.description ?? `Erro Asaas (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

// ----- Tipos -----
export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  status: string;
  creditCard?: { creditCardBrand?: string; creditCardNumber?: string };
}

export interface CreditCardInput {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface CardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
}

// ----- Operações -----

export async function createCustomer(input: {
  name: string;
  cpfCnpj: string;
  email: string;
  mobilePhone: string;
}): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: input,
  });
}

/**
 * Cria assinatura mensal recorrente cobrando no cartão.
 * `nextDueDate` = data da primeira cobrança (fim do trial). O Asaas tokeniza
 * o cartão; nós guardamos apenas os últimos 4 dígitos e a bandeira.
 */
export async function createCreditCardSubscription(input: {
  customer: string;
  value: number; // em reais (ex: 19.9)
  nextDueDate: string; // YYYY-MM-DD
  description: string;
  creditCard: CreditCardInput;
  holderInfo: CardHolderInfo;
  remoteIp: string;
}): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: {
      customer: input.customer,
      billingType: "CREDIT_CARD",
      cycle: "MONTHLY",
      value: input.value,
      nextDueDate: input.nextDueDate,
      description: input.description,
      creditCard: {
        holderName: input.creditCard.holderName,
        number: input.creditCard.number.replace(/\s/g, ""),
        expiryMonth: input.creditCard.expiryMonth,
        expiryYear: input.creditCard.expiryYear,
        ccv: input.creditCard.ccv,
      },
      creditCardHolderInfo: {
        name: input.holderInfo.name,
        email: input.holderInfo.email,
        cpfCnpj: input.holderInfo.cpfCnpj,
        postalCode: input.holderInfo.postalCode,
        addressNumber: input.holderInfo.addressNumber,
        phone: input.holderInfo.phone,
      },
      remoteIp: input.remoteIp,
    },
  });
}

export async function getSubscription(id: string): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/subscriptions/${id}`);
}

export async function cancelSubscription(id: string): Promise<{ deleted: boolean }> {
  return asaasFetch<{ deleted: boolean }>(`/subscriptions/${id}`, {
    method: "DELETE",
  });
}

export interface AsaasPayment {
  id: string;
  subscription?: string;
  value: number;
  status: string;
  dueDate: string;
  paymentDate?: string;
  invoiceUrl?: string;
}

export async function listSubscriptionPayments(
  subscriptionId: string
): Promise<AsaasPayment[]> {
  const res = await asaasFetch<{ data: AsaasPayment[] }>(
    `/subscriptions/${subscriptionId}/payments`
  );
  return res.data ?? [];
}

export { ASAAS_ENV, BASE_URL };
