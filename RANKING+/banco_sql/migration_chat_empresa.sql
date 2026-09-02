-- ============================================================
-- RANKING+ — Migration Chat com Empresa (match mutuo aluno x empresa)
-- Estende o chat existente (aluno<->aluno, aluno<->professor) pra
-- aceitar 'empresa' como participante, e amarra a conversa a uma
-- vaga especifica quando for o caso.
-- Executar no banco: universidade_ranking
-- Data: 27/08/2026
-- ============================================================

ALTER TABLE conversas
  MODIFY COLUMN participante1_tipo ENUM('aluno','professor','empresa') NOT NULL,
  MODIFY COLUMN participante2_tipo ENUM('aluno','professor','empresa') NOT NULL;

-- NULL = conversa sem vaga (aluno<->aluno, aluno<->professor, como sempre foi).
-- Nota: como MySQL trata NULL como distinto na UNIQUE KEY, a unicidade pra
-- pares com vaga_id NULL passa a depender só da checagem da aplicacao
-- (SELECT antes do INSERT em POST /chat/conversas, que ja existia e nao foi
-- alterada) - nao muda nada pro fluxo aluno<->professor ja em producao.
ALTER TABLE conversas
  ADD COLUMN vaga_id INT NULL AFTER participante2_id,
  ADD CONSTRAINT fk_conversas_vaga FOREIGN KEY (vaga_id) REFERENCES empresa_vagas(id) ON DELETE SET NULL;

ALTER TABLE conversas
  DROP INDEX uniq_par,
  ADD UNIQUE KEY uniq_par_vaga (participante1_tipo, participante1_id, participante2_tipo, participante2_id, vaga_id);

ALTER TABLE mensagens
  MODIFY COLUMN remetente_tipo ENUM('aluno','professor','empresa') NOT NULL;
