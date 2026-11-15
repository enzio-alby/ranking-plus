-- ============================================================
-- RANKING+ — Migration Perfil do Professor (dados editáveis reais)
-- Executar no banco: universidade_ranking
-- Data: 22/08/2026
-- ============================================================
ALTER TABLE professores
  ADD COLUMN telefone VARCHAR(20) NULL AFTER campus,
  ADD COLUMN titulacao VARCHAR(30) NULL AFTER telefone,
  ADD COLUMN area_atuacao VARCHAR(100) NULL AFTER titulacao,
  ADD COLUMN idioma_preferido VARCHAR(10) NOT NULL DEFAULT 'pt-BR' AFTER area_atuacao,
  ADD COLUMN notif_notas TINYINT(1) NOT NULL DEFAULT 1 AFTER idioma_preferido,
  ADD COLUMN notif_faltas TINYINT(1) NOT NULL DEFAULT 1 AFTER notif_notas,
  ADD COLUMN notif_ranking TINYINT(1) NOT NULL DEFAULT 0 AFTER notif_faltas,
  ADD COLUMN notif_eventos TINYINT(1) NOT NULL DEFAULT 1 AFTER notif_ranking;
