-- ============================================================
-- RANKING+ — Migration Chamados de Suporte
-- Executar no banco: universidade_ranking
-- Data: 2026-08-21
-- ============================================================

-- A página de suporte (suporte.html) simulava o envio de tickets só no
-- front-end (setTimeout, sem chamada real de API). Esta tabela persiste
-- os chamados de fato, e o backend passa a enviar um e-mail real para
-- admin.rankingplus@gmail.com a cada chamado aberto (via ticket ou via chat).
CREATE TABLE IF NOT EXISTS chamados_suporte (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) NOT NULL,
  categoria   VARCHAR(30)  NOT NULL,
  prioridade  VARCHAR(20)  NOT NULL DEFAULT 'medium',
  assunto     VARCHAR(200) NOT NULL,
  descricao   TEXT         NOT NULL,
  origem      VARCHAR(20)  NOT NULL DEFAULT 'formulario',
  status      VARCHAR(20)  NOT NULL DEFAULT 'aberto',
  criado_em   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
