-- ============================================================
-- RANKING+ — Migration Notificações (aluno e empresa)
-- Executar no banco: universidade_ranking
-- Data: 2026-08-21
-- ============================================================

-- Centraliza notificações para os dois lados do Portal de Talentos:
-- aluno é avisado quando uma empresa visualiza seu perfil; empresa é avisada
-- quando surge um aluno novo que bate com os Interesses de Perfil salvos.
-- destinatario_tipo + destinatario_id em vez de FK dupla (aluno/empresa
-- compartilham a mesma tabela, mas são entidades diferentes).
CREATE TABLE IF NOT EXISTS notificacoes (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  destinatario_tipo VARCHAR(10)  NOT NULL,
  destinatario_id   INT          NOT NULL,
  tipo              VARCHAR(40)  NOT NULL,
  titulo            VARCHAR(150) NOT NULL,
  mensagem          VARCHAR(300) NOT NULL,
  referencia_id     INT          NULL,
  lida              TINYINT(1)   NOT NULL DEFAULT 0,
  criado_em         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_destinatario (destinatario_tipo, destinatario_id, lida)
);
