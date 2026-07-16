-- 017_notifications_related.sql — liga a notificação à entidade de origem
-- (lead/tarefa/processo de pós-venda/assinatura), pra poder checar
-- "já avisei sobre isso?" antes de gerar uma nova notificação repetida.

ALTER TABLE notifications ADD COLUMN related_id UUID;
