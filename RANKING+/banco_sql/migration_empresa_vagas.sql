-- ============================================================
-- RANKING+ — Migration Vagas da Empresa (múltiplas, além do
-- perfil único de "Interesses de Perfil" já existente)
-- Executar no banco: universidade_ranking
-- Data: 22/08/2026
-- ============================================================
CREATE TABLE empresa_vagas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT NULL,
  area_foco_id INT NULL,
  tipo_vaga_id INT NULL,
  curso_preferido VARCHAR(100) NULL,
  semestre_minimo INT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'aberta',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_empresa_vagas_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  CONSTRAINT fk_empresa_vagas_area FOREIGN KEY (area_foco_id) REFERENCES dom_areas_foco(id),
  CONSTRAINT fk_empresa_vagas_tipo FOREIGN KEY (tipo_vaga_id) REFERENCES dom_tipos_vaga(id)
);
