-- ============================================================
-- RANKING+ — Migration Status de Acompanhamento do Favorito (empresa)
-- Executar no banco: universidade_ranking
-- Data: 2026-08-21
-- ============================================================
ALTER TABLE empresa_favoritos
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'novo' AFTER aluno_id;
