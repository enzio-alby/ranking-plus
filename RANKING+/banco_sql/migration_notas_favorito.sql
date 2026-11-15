-- ============================================================
-- RANKING+ — Migration Notas Privadas do Favorito (empresa)
-- Executar no banco: universidade_ranking
-- Data: 22/08/2026
-- ============================================================
ALTER TABLE empresa_favoritos
  ADD COLUMN notas TEXT NULL AFTER status;
