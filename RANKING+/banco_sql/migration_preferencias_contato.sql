-- ============================================================
-- RANKING+ — Migration Preferências de Contato e Compartilhamento (aluno)
-- Executar no banco: universidade_ranking
-- Data: 21/08/2026
-- ============================================================
ALTER TABLE alunos
  ADD COLUMN permitir_contato TINYINT(1) NOT NULL DEFAULT 1 AFTER permitir_exibicao_ranking,
  ADD COLUMN compartilhar_progresso TINYINT(1) NOT NULL DEFAULT 0 AFTER permitir_contato;
