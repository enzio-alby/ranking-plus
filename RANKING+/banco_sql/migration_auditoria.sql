-- Migration: trilha de auditoria imutável (RF018 / RNF009) e alertas de anomalia (RF019)
-- Aplicar com: mysql --default-character-set=utf8mb4 universidade_ranking < migration_auditoria.sql
-- Idempotente: pode rodar mais de uma vez.

CREATE TABLE IF NOT EXISTS auditoria_eventos (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  criado_em      DATETIME(3)     NOT NULL,
  tipo           VARCHAR(40)     NOT NULL,            -- nota_alterada, matricula_criada, login, impersonacao
  ator_tipo      VARCHAR(20)     NOT NULL,            -- professor, admin, aluno, empresa, sistema
  ator_id        VARCHAR(40)     NULL,
  ator_nome      VARCHAR(150)    NULL,
  entidade       VARCHAR(40)     NOT NULL,            -- boletim, sessao, aluno, professor, empresa
  entidade_id    VARCHAR(80)     NULL,
  aluno_id       INT             NULL,                -- aluno afetado (quando houver)
  disciplina_id  INT             NULL,
  dados_antes    LONGTEXT        NULL,                -- JSON em texto (preserva exatamente o que entrou no hash)
  dados_depois   LONGTEXT        NULL,
  ip             VARCHAR(64)     NULL,                -- anonimizado (NULL) após o prazo de retenção
  user_agent     VARCHAR(255)    NULL,                -- idem
  hash_anterior  CHAR(64)        NOT NULL,
  hash           CHAR(64)        NOT NULL,
  PRIMARY KEY (id),
  KEY idx_aud_criado (criado_em),
  KEY idx_aud_ator (ator_tipo, ator_id, criado_em),
  KEY idx_aud_aluno (aluno_id, criado_em),
  KEY idx_aud_tipo (tipo, criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alertas_seguranca (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  criado_em     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  regra         VARCHAR(40)     NOT NULL,             -- ALT_RAPIDAS_PROFESSOR, ALT_MESMO_ALUNO, IPS_DISTINTOS
  severidade    VARCHAR(10)     NOT NULL DEFAULT 'media',
  ator_tipo     VARCHAR(20)     NULL,
  ator_id       VARCHAR(40)     NULL,
  aluno_id      INT             NULL,
  descricao     VARCHAR(400)    NOT NULL,
  evidencia     LONGTEXT        NULL,
  status        VARCHAR(12)     NOT NULL DEFAULT 'aberto',   -- aberto | resolvido
  resolvido_em  DATETIME(3)     NULL,
  resolvido_por VARCHAR(150)    NULL,
  PRIMARY KEY (id),
  KEY idx_alerta_status (status, criado_em),
  KEY idx_alerta_ator (regra, ator_tipo, ator_id, criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TRIGGER IF EXISTS trg_auditoria_no_update;
DROP TRIGGER IF EXISTS trg_auditoria_no_delete;

DELIMITER $$

-- Imutável: a única alteração permitida é anonimizar ip/user_agent (retenção de 90 dias, LGPD).
CREATE TRIGGER trg_auditoria_no_update BEFORE UPDATE ON auditoria_eventos
FOR EACH ROW
BEGIN
  IF NOT (
        NEW.ip IS NULL AND NEW.user_agent IS NULL
    AND NEW.id            <=> OLD.id
    AND NEW.criado_em     <=> OLD.criado_em
    AND NEW.tipo          <=> OLD.tipo
    AND NEW.ator_tipo     <=> OLD.ator_tipo
    AND NEW.ator_id       <=> OLD.ator_id
    AND NEW.ator_nome     <=> OLD.ator_nome
    AND NEW.entidade      <=> OLD.entidade
    AND NEW.entidade_id   <=> OLD.entidade_id
    AND NEW.aluno_id      <=> OLD.aluno_id
    AND NEW.disciplina_id <=> OLD.disciplina_id
    AND NEW.dados_antes   <=> OLD.dados_antes
    AND NEW.dados_depois  <=> OLD.dados_depois
    AND NEW.hash_anterior <=> OLD.hash_anterior
    AND NEW.hash          <=> OLD.hash
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'auditoria_eventos e imutavel: so e permitido anonimizar ip e user_agent';
  END IF;
END$$

CREATE TRIGGER trg_auditoria_no_delete BEFORE DELETE ON auditoria_eventos
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'auditoria_eventos e imutavel: exclusao nao permitida';
END$$

DELIMITER ;
