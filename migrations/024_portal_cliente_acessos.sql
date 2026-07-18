-- migrations/024_portal_cliente_acessos.sql — contador de acessos e último
-- acesso do portal do cliente (/acompanhar/[token]), pra alimentar a nova
-- página "Portal do Cliente" no menu do corretor. Aditiva/idempotente.

ALTER TABLE post_sale_processes ADD COLUMN IF NOT EXISTS portal_access_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE post_sale_processes ADD COLUMN IF NOT EXISTS portal_last_access_at TIMESTAMPTZ;
