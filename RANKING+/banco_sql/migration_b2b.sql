-- ============================================================
-- RANKING+ — Migration B2B (Portal de Talentos Corporativo)
-- Executar no banco: universidade_ranking
-- Data: 2026-04-09
-- ============================================================

-- 1. TABELAS DE DOMÍNIO (dropdowns fixos) ----------------------

CREATE TABLE IF NOT EXISTS dom_setores (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL
);
INSERT IGNORE INTO dom_setores (nome) VALUES
  ('Tecnologia da Informação (TI)'),('Finanças'),('Saúde'),
  ('Educação'),('Engenharia'),('Varejo e E-commerce'),
  ('Telecomunicações'),('Energia'),('Consultoria'),
  ('Serviços Financeiros'),('Governo e Setor Público'),('Outros');

CREATE TABLE IF NOT EXISTS dom_areas_foco (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL
);
INSERT IGNORE INTO dom_areas_foco (nome) VALUES
  ('Backend'),('Frontend'),('Full Stack'),('Mobile'),
  ('DevOps e SRE'),('Data Science'),('Machine Learning / IA'),
  ('Segurança da Informação'),('UX / Design'),
  ('Gestão de Projetos'),('Análise de Dados'),
  ('Cloud Computing'),('Outros');

CREATE TABLE IF NOT EXISTS dom_tipos_vaga (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL
);
INSERT IGNORE INTO dom_tipos_vaga (nome) VALUES
  ('Estágio'),('Trainee'),('Efetivo - Júnior'),
  ('Efetivo - Pleno'),('PJ'),('Freela / Projeto');

-- 2. EMPRESAS --------------------------------------------------

CREATE TABLE IF NOT EXISTS empresas (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  razao_social       VARCHAR(200) NOT NULL,
  nome_fantasia      VARCHAR(200),
  cnpj               VARCHAR(20)  UNIQUE NOT NULL,
  setor_id           INT,
  email_corporativo  VARCHAR(200) UNIQUE NOT NULL,
  telefone           VARCHAR(20),
  site_empresa       VARCHAR(300),
  linkedin_empresa   VARCHAR(300),
  senha              VARCHAR(255) NOT NULL,
  verificada         TINYINT DEFAULT 0,
  criado_em          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (setor_id) REFERENCES dom_setores(id)
);

CREATE TABLE IF NOT EXISTS empresa_interesses (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id       INT NOT NULL,
  area_foco_id     INT,
  tipo_vaga_id     INT,
  curso_preferido  VARCHAR(200),
  semestre_minimo  INT DEFAULT 1,
  FOREIGN KEY (empresa_id)   REFERENCES empresas(id)       ON DELETE CASCADE,
  FOREIGN KEY (area_foco_id) REFERENCES dom_areas_foco(id),
  FOREIGN KEY (tipo_vaga_id) REFERENCES dom_tipos_vaga(id)
);

-- 3. INTERAÇÕES (rastreio de visualizações) --------------------

CREATE TABLE IF NOT EXISTS interacoes_empresas_alunos (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id       INT NOT NULL,
  aluno_id         INT NOT NULL,
  tipo_interacao   VARCHAR(50) DEFAULT 'VISUALIZACAO',
  data_interacao   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY (aluno_id)   REFERENCES alunos(id)   ON DELETE CASCADE
);

-- 4. COLUNA nota_participacao no boletim (se ainda não existir)
ALTER TABLE boletim ADD COLUMN IF NOT EXISTS nota_participacao DECIMAL(4,1) DEFAULT NULL;
