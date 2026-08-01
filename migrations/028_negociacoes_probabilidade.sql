-- migrations/028_negociacoes_probabilidade.sql — Simulador de Comissão
-- Preditiva: cada negociação aberta ganha uma probabilidade de fechamento
-- (10/25/50/75/90%), usada pra projetar comissão ponderada e o gap de meta.
-- Aditiva/idempotente — negociações existentes assumem 50%.

ALTER TABLE negotiations ADD COLUMN IF NOT EXISTS probability INTEGER NOT NULL DEFAULT 50;
