-- ============================================================
-- RANKING+ — Migration Registro Real do Aceite dos Termos (LGPD)
-- Executar no banco: universidade_ranking
-- Data: 2026-08-21
-- ============================================================

-- O checkbox "Li e aceito os termos de uso" no cadastro (index.html) já
-- bloqueava o envio do formulário (HTML5 required), mas o valor marcado
-- nunca era lido nem enviado ao backend — a tabela alunos não tinha
-- nenhum registro do aceite. Isso não atende à LGPD Art. 8º §1º, que exige
-- que o controlador seja capaz de comprovar que o consentimento foi dado.
ALTER TABLE alunos
  ADD COLUMN termos_aceitos_em TIMESTAMP NULL DEFAULT NULL AFTER situacao;
