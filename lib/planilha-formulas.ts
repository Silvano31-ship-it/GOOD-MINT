// lib/planilha-formulas.ts — cálculos automáticos reaproveitados pelas
// planilhas (Leads/Imóveis/Negociações), evitando reimplementar soma/média em
// cada componente. Não é um interpretador de fórmulas livres (SE/PROC) — são
// funções prontas que cobrem os cálculos que hoje já aparecem nos totais.
export function soma<T>(rows: T[], field: (row: T) => number): number {
  return rows.reduce((sum, r) => sum + field(r), 0);
}

export function media<T>(rows: T[], field: (row: T) => number): number {
  if (rows.length === 0) return 0;
  return soma(rows, field) / rows.length;
}

export function contar<T>(rows: T[]): number {
  return rows.length;
}

export function contarSe<T>(rows: T[], predicate: (row: T) => boolean): number {
  return rows.filter(predicate).length;
}
