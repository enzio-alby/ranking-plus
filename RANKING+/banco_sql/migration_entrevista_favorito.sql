-- ============================================================
-- RANKING+ — Migration Registro de Entrevista (empresa_favoritos)
-- Executar no banco: universidade_ranking
-- Data: 22/08/2026
-- ============================================================
ALTER TABLE empresa_favoritos
  ADD COLUMN entrevista_data_hora DATETIME NULL AFTER notas,
  ADD COLUMN entrevista_observacao TEXT NULL AFTER entrevista_data_hora;
