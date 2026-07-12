// lib/format.ts — helpers de formatação (moeda, data, telefone).

export function formatBRL(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function onlyDigits(v: string): string {
  return (v ?? "").replace(/\D/g, "");
}

/** Data ISO (YYYY-MM-DD) daqui a N dias — usado no nextDueDate do Asaas. */
export function isoDatePlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
