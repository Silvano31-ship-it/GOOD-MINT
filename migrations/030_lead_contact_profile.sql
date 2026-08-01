-- migrations/030_lead_contact_profile.sql — Rastreador de Silêncio: cada lead
-- ganha um "perfil de contato" (paciente ou incisivo) que ajusta o limiar de
-- alerta de silêncio e o tom da mensagem de reativação sugerida.
-- Aditiva/idempotente — leads existentes assumem 'paciente'.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_profile TEXT NOT NULL DEFAULT 'paciente';
