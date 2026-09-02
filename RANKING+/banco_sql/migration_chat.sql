-- ============================================================
-- RANKING+ — Migration Chat (aluno<->aluno, aluno<->professor)
-- Executar no banco: universidade_ranking
-- Data: 22/08/2026
-- ============================================================

CREATE TABLE mensagem_anexos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome_original VARCHAR(255) NOT NULL,
  caminho_arquivo VARCHAR(255) NOT NULL,
  iv VARCHAR(32) NOT NULL,
  auth_tag VARCHAR(32) NOT NULL,
  tamanho_bytes INT NOT NULL,
  expira_em TIMESTAMP NOT NULL,
  removido_em TIMESTAMP NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conversas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participante1_tipo ENUM('aluno','professor') NOT NULL,
  participante1_id INT NOT NULL,
  participante2_tipo ENUM('aluno','professor') NOT NULL,
  participante2_id INT NOT NULL,
  ultima_mensagem_em TIMESTAMP NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_par (participante1_tipo, participante1_id, participante2_tipo, participante2_id)
);

CREATE TABLE mensagens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversa_id INT NOT NULL,
  remetente_tipo ENUM('aluno','professor') NOT NULL,
  remetente_id INT NOT NULL,
  texto_cifrado TEXT NULL,
  iv VARCHAR(32) NULL,
  auth_tag VARCHAR(32) NULL,
  anexo_id INT NULL,
  lida TINYINT(1) NOT NULL DEFAULT 0,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversa_id) REFERENCES conversas(id) ON DELETE CASCADE,
  FOREIGN KEY (anexo_id) REFERENCES mensagem_anexos(id) ON DELETE SET NULL,
  INDEX idx_conversa (conversa_id, criado_em)
);
