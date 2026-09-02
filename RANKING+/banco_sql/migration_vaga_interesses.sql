-- ============================================================
-- RANKING+ — Migration Vaga Interesses (aluno -> vaga especifica)
-- Espelha empresa_favoritos, so que do lado do aluno e por vaga,
-- nao por empresa inteira. Base do chat por match mutuo.
-- Executar no banco: universidade_ranking
-- Data: 27/08/2026
-- ============================================================
CREATE TABLE IF NOT EXISTS vaga_interesses (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  vaga_id    INT NOT NULL,
  aluno_id   INT NOT NULL,
  criado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_vaga_aluno (vaga_id, aluno_id),
  FOREIGN KEY (vaga_id)  REFERENCES empresa_vagas(id) ON DELETE CASCADE,
  FOREIGN KEY (aluno_id) REFERENCES alunos(id)         ON DELETE CASCADE
);
