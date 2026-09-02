-- ============================================================
-- RANKING+ — Migration Talentos Features (Favoritos/Shortlist)
-- Executar no banco: universidade_ranking
-- Data: 2026-08-21
-- ============================================================

-- Favoritos/Shortlist da empresa — estado (liga/desliga), diferente do log de
-- interações em interacoes_empresas_alunos. UNIQUE em (empresa_id, aluno_id)
-- permite favoritar/desfavoritar sem duplicar linhas.
CREATE TABLE IF NOT EXISTS empresa_favoritos (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  aluno_id   INT NOT NULL,
  criado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_empresa_aluno (empresa_id, aluno_id),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY (aluno_id)   REFERENCES alunos(id)   ON DELETE CASCADE
);
