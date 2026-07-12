// lib/db.ts
// Pool de conexão Postgres compartilhado (padrão para Next.js App Router).
// DATABASE_URL vem de variável de ambiente — nunca hardcoded (seção 12 da spec).
// Em produção usamos o Postgres gerenciado do Supabase (connection pooler).

import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

export const db =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    // Supabase/managed Postgres exige SSL. `rejectUnauthorized: false` é
    // aceitável para o pooler gerenciado (certificado da própria Supabase).
    ssl: process.env.PGSSL === "disable" ? undefined : { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") global._pgPool = db;
