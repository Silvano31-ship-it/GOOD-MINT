-- 008_pos_venda_duvida_cliente.sql
-- Portal do cliente (/acompanhar/[token]) ganha um campo de dúvidas: o
-- cliente escreve uma mensagem que aparece pro corretor na linha do tempo do
-- processo, como um terceiro tipo de comunicação (ao lado de nota interna e
-- mensagem ao cliente).
DO $$ BEGIN
  ALTER TABLE post_sale_communications DROP CONSTRAINT post_sale_communications_kind_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
ALTER TABLE post_sale_communications ADD CONSTRAINT post_sale_communications_kind_check
  CHECK (kind IN ('nota_interna','mensagem_cliente','duvida_cliente'));
