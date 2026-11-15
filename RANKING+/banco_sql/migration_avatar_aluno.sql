-- ============================================================
-- RANKING+ — Migration Avatar Real do Aluno (upload)
-- Executar no banco: universidade_ranking
-- Data: 2026-08-21
-- ============================================================
-- Guardado como base64 (MEDIUMTEXT) em vez de arquivo em disco — evita
-- gerenciar pasta de uploads/estáticos; a imagem já é redimensionada
-- pro lado do cliente antes do envio, então o payload fica pequeno.
ALTER TABLE alunos
  ADD COLUMN avatar_base64 MEDIUMTEXT NULL DEFAULT NULL AFTER linkedin;
