-- ============================================================
-- RANKING+ — Migration Chat: excluir conversa só para quem excluiu
-- Executar no banco: universidade_ranking
-- Data: 22/09/2026 (item 3, feedback Caio — issue #91 / Sprint 2)
--
-- Antes: DELETE /chat/conversas/:id apagava mensagens e a conversa pros
-- dois participantes. Agora só marca "oculta pra mim" — o outro lado
-- continua vendo tudo, e a conversa reaparece pra quem excluiu se
-- chegar mensagem nova (ver filtro em GET /chat/conversas/participante).
-- ============================================================

ALTER TABLE conversas
  ADD COLUMN oculta_p1_desde TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN oculta_p2_desde TIMESTAMP NULL DEFAULT NULL;
