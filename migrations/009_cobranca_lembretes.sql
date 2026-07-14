-- 009_cobranca_lembretes.sql
-- Lembrete de cobrança por e-mail (~3 dias antes do fim do trial ou da
-- renovação mensal) + aviso de falha de pagamento. A coluna abaixo evita
-- reenviar o mesmo lembrete várias vezes dentro do mesmo ciclo de cobrança.
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_reminder_sent_at TIMESTAMPTZ;
