-- ============================================================
-- RANKING+ — Migration Notificação de Mudança de Posição no Ranking
-- Executar no banco: universidade_ranking
-- Data: 2026-08-21
-- ============================================================
ALTER TABLE alunos
  ADD COLUMN ultima_posicao_ranking INT NULL DEFAULT NULL AFTER permitir_exibicao_ranking;
