-- ============================================================
-- RANKING+ — Migration: Certificações e Cursos Complementares
-- Banco: universidade_ranking  |  MySQL 8.4.3  |  HeidiSQL 12.8
-- Data: 2026-05-26
-- ============================================================
-- SEGURO: IF NOT EXISTS garante que rodar duas vezes não dá erro
-- NÃO altera nenhuma tabela existente, nenhum dado é perdido
-- ============================================================

USE `universidade_ranking`;

CREATE TABLE IF NOT EXISTS `pp_certificacoes` (
  `id`           int          NOT NULL AUTO_INCREMENT,
  `aluno_id`     int          NOT NULL,
  `nome`         varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `instituicao`  varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_emissao` varchar(50)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `aluno_id` (`aluno_id`),
  CONSTRAINT `pp_certificacoes_ibfk_1`
    FOREIGN KEY (`aluno_id`) REFERENCES `alunos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificação (execute separado para confirmar):
-- DESCRIBE pp_certificacoes;
-- SHOW CREATE TABLE pp_certificacoes;
