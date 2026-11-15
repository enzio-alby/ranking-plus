-- ============================================================
-- RANKING+ — Migration Área de Interesse do Aluno
-- Executar no banco: universidade_ranking
-- Data: 2026-08-21
-- ============================================================

-- Área de trabalho de interesse do aluno, reaproveitando o mesmo domínio
-- (dom_areas_foco) já usado pelas empresas em empresa_interesses.area_foco_id.
-- Fica em perfil_profissional (não em alunos) porque é dado do Perfil
-- Profissional/ATS, editável a qualquer momento pelo aluno.
-- Observação: "ADD COLUMN IF NOT EXISTS ... AFTER" deu erro de sintaxe neste
-- MySQL 8.4.3 (via mysql.exe do Laragon) — funcionou sem o IF NOT EXISTS.
-- Rodar as duas linhas abaixo só uma vez (a segunda falha se a constraint já existir).
ALTER TABLE perfil_profissional
  ADD COLUMN area_interesse_id INT DEFAULT NULL AFTER resumo;

ALTER TABLE perfil_profissional
  ADD CONSTRAINT fk_pp_area_interesse
  FOREIGN KEY (area_interesse_id) REFERENCES dom_areas_foco(id) ON DELETE SET NULL;
