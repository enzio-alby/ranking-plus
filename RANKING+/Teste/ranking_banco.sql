-- 1. SELEÇÃO DO BANCO DE DADOS EXISTENTE
USE universidade_ranking;

-- 2. CRIAÇÃO DAS TABELAS (Estrutura Nova e Mais Completa)

-- Tabela de Professores
-- Adicionei "codigo_professor" e "campus" que faltavam na sua lógica antiga
CREATE TABLE IF NOT EXISTS professores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    codigo_professor VARCHAR(20), 
    idade INT,
    turno VARCHAR(20),
    campus VARCHAR(50)
);

-- Tabela de Disciplinas (Substitui a antiga "materias")
-- Agora vincula direto ao professor (1 professor por turma) e tem sala/horário
CREATE TABLE IF NOT EXISTS disciplinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_materia VARCHAR(100) NOT NULL,
    professor_id INT,
    sala VARCHAR(20),
    dia_semana VARCHAR(20),
    horario VARCHAR(20),
    campus VARCHAR(50),
    FOREIGN KEY (professor_id) REFERENCES professores(id)
);

-- Tabela de Alunos
-- Adicionei todos os campos extras que você pediu (CPF, Data Nascimento, etc)
CREATE TABLE IF NOT EXISTS alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    matricula VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    curso VARCHAR(100),
    telefone VARCHAR(20),
    idade INT,
    turno VARCHAR(20),
    cpf VARCHAR(14) UNIQUE,
    data_nascimento DATE,
    campus VARCHAR(50),
    semestre_atual INT,
    periodo_curso VARCHAR(20),
    data_matricula DATE,
    situacao VARCHAR(20)
);

-- Tabela Boletim (Substitui "alunos_materias")
-- Guarda as notas, faltas e menção do aluno naquela disciplina
CREATE TABLE IF NOT EXISTS boletim (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT,
    disciplina_id INT,
    faltas INT DEFAULT 0,
    mencao VARCHAR(5),
    nota_avaliacao DECIMAL(4,2),
    data_avaliacao DATE,
    atividades_entregues INT,
    participacao_nota DECIMAL(4,2),
    FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id)
);

-----------------------------------------
-- 3. INSERÇÃO DE DADOS DE TESTE
-----------------------------------------

-- 1. INSERINDO 5 PROFESSORES
INSERT INTO professores (nome, email, codigo_professor, idade, turno, campus) VALUES
('Dr. Roberto Campos', 'roberto.campos@uni.edu', 'PROF001', 45, 'Noturno', 'Asa Norte'),
('Dra. Amanda Souza', 'amanda.souza@uni.edu', 'PROF002', 38, 'Noturno', 'Asa Norte'),
('Msc. Paulo Freire', 'paulo.freire@uni.edu', 'PROF003', 50, 'Matutino', 'Taguatinga'),
('Dra. Carla Dias', 'carla.dias@uni.edu', 'PROF004', 32, 'Noturno', 'Asa Norte'),
('Dr. Jorge Amado', 'jorge.amado@uni.edu', 'PROF005', 60, 'Vespertino', 'Taguatinga');

-- 2. INSERINDO 10 DISCIPLINAS (Vinculando aos professores acima)
INSERT INTO disciplinas (nome_materia, professor_id, sala, dia_semana, horario, campus) VALUES
('Algoritmos e Estruturas de Dados', 1, 'Lab 101', 'Segunda-feira', '19:00', 'Asa Norte'),
('Banco de Dados Relacional', 2, 'Lab 204', 'Terça-feira', '19:00', 'Asa Norte'),
('Engenharia de Software', 3, 'Sala 305', 'Quarta-feira', '08:00', 'Taguatinga'),
('Inteligência Artificial', 4, 'Lab 102', 'Quinta-feira', '20:50', 'Asa Norte'),
('Redes de Computadores', 5, 'Sala 110', 'Sexta-feira', '14:00', 'Taguatinga'),
('Compiladores', 1, 'Lab 103', 'Quarta-feira', '20:50', 'Asa Norte'),
('Sistemas Operacionais', 2, 'Lab 205', 'Quinta-feira', '19:00', 'Asa Norte'),
('Matemática Discreta', 3, 'Sala 301', 'Segunda-feira', '10:00', 'Taguatinga'),
('Ética e Computação', 4, 'Sala 105', 'Sexta-feira', '19:00', 'Asa Norte'),
('Gestão de Projetos de TI', 5, 'Sala 112', 'Terça-feira', '16:00', 'Taguatinga');

-- 3. INSERINDO 10 ALUNOS
INSERT INTO alunos (nome, senha, matricula, email, curso, telefone, idade, turno, cpf, data_nascimento, campus, semestre_atual, periodo_curso, data_matricula, situacao) VALUES
('Ana Silva', 'senha123', '2023001', 'ana.silva@uni.edu', 'Ciência da Computação', '(61) 99999-0001', 20, 'Noturno', '111.222.333-01', '2004-05-12', 'Asa Norte', 3, '2024.1', '2023-02-01', 'Ativo'),
('Bruno Costa', 'senha123', '2023002', 'bruno.costa@uni.edu', 'Sistemas de Informação', '(61) 99999-0002', 21, 'Noturno', '222.333.444-02', '2003-08-20', 'Asa Norte', 4, '2024.1', '2022-08-01', 'Ativo'),
('Carla Oliveira', 'senha123', '2023003', 'carla.oliv@uni.edu', 'Engenharia de Software', '(61) 99999-0003', 19, 'Matutino', '333.444.555-03', '2005-01-15', 'Taguatinga', 2, '2024.1', '2023-08-01', 'Ativo'),
('Daniel Santos', 'senha123', '2023004', 'daniel.santos@uni.edu', 'Ciência da Computação', '(61) 99999-0004', 22, 'Noturno', '444.555.666-04', '2002-11-30', 'Asa Norte', 5, '2024.1', '2022-02-01', 'Ativo'),
('Eduarda Lima', 'senha123', '2023005', 'duda.lima@uni.edu', 'Sistemas de Informação', '(61) 99999-0005', 20, 'Vespertino', '555.666.777-05', '2004-03-10', 'Taguatinga', 3, '2024.1', '2023-02-01', 'Trancado'),
('Felipe Rocha', 'senha123', '2023006', 'felipe.rocha@uni.edu', 'Ciência da Computação', '(61) 99999-0006', 23, 'Noturno', '666.777.888-06', '2001-07-22', 'Asa Norte', 6, '2024.1', '2021-08-01', 'Ativo'),
('Gabriela Martins', 'senha123', '2023007', 'gabi.martins@uni.edu', 'Engenharia de Software', '(61) 99999-0007', 20, 'Noturno', '777.888.999-07', '2004-09-05', 'Asa Norte', 3, '2024.1', '2023-02-01', 'Ativo'),
('Henrique Alves', 'senha123', '2023008', 'henrique.alves@uni.edu', 'Ciência da Computação', '(61) 99999-0008', 19, 'Matutino', '888.999.000-08', '2005-02-18', 'Taguatinga', 1, '2024.1', '2024-02-01', 'Ativo'),
('Isabela Ferreira', 'senha123', '2023009', 'isa.ferreira@uni.edu', 'Sistemas de Informação', '(61) 99999-0009', 21, 'Noturno', '999.000.111-09', '2003-12-25', 'Asa Norte', 4, '2024.1', '2022-08-01', 'Ativo'),
('João Pedro', 'senha123', '2023010', 'joao.pedro@uni.edu', 'Engenharia de Software', '(61) 99999-0010', 22, 'Noturno', '000.111.222-10', '2002-06-14', 'Asa Norte', 5, '2024.1', '2022-02-01', 'Ativo');

-- 4. INSERINDO DADOS NO BOLETIM (Vinculando Alunos às Disciplinas)
-- Distribuindo notas, faltas e menções para popular a API de "Boletim Detalhado" e "Ranking"

-- Ana Silva (Destaque)
INSERT INTO boletim (aluno_id, disciplina_id, faltas, mencao, nota_avaliacao, data_avaliacao, atividades_entregues, participacao_nota) VALUES
(1, 1, 2, 'SS', 9.5, '2024-04-10', 10, 10.0), -- Algoritmos
(1, 2, 0, 'MS', 8.5, '2024-04-12', 9, 9.0),  -- BD Relacional
(1, 6, 0, 'SS', 10.0, '2024-04-15', 10, 10.0); -- Compiladores

-- Bruno Costa (Aluno mediano)
INSERT INTO boletim (aluno_id, disciplina_id, faltas, mencao, nota_avaliacao, data_avaliacao, atividades_entregues, participacao_nota) VALUES
(2, 2, 4, 'MM', 6.5, '2024-04-12', 6, 7.5),  -- BD Relacional
(2, 4, 2, 'MS', 8.0, '2024-04-15', 8, 8.0),  -- IA
(2, 7, 6, 'MM', 5.5, '2024-04-18', 5, 6.0);  -- Sistemas Operacionais

-- Carla Oliveira (Eng. Software matutino)
INSERT INTO boletim (aluno_id, disciplina_id, faltas, mencao, nota_avaliacao, data_avaliacao, atividades_entregues, participacao_nota) VALUES
(3, 3, 0, 'SS', 10.0, '2024-04-11', 10, 10.0), -- Eng. Software
(3, 8, 2, 'MS', 8.5, '2024-04-14', 9, 8.5);  -- Matemática Discreta

-- Daniel Santos (Algumas dificuldades)
INSERT INTO boletim (aluno_id, disciplina_id, faltas, mencao, nota_avaliacao, data_avaliacao, atividades_entregues, participacao_nota) VALUES
(4, 1, 8, 'MI', 4.0, '2024-04-10', 4, 5.0),  -- Algoritmos
(4, 4, 2, 'MM', 6.0, '2024-04-15', 7, 7.0),  -- IA
(4, 9, 0, 'MS', 8.0, '2024-04-20', 8, 8.0);  -- Ética

-- Eduarda Lima (Trancada em algumas matérias)
INSERT INTO boletim (aluno_id, disciplina_id, faltas, mencao, nota_avaliacao, data_avaliacao, atividades_entregues, participacao_nota) VALUES
(5, 5, 0, 'SR', 0.0, NULL, 0, 0.0), -- Redes (Sem Rendimento/Trancado)
(5, 10, 0, 'SR', 0.0, NULL, 0, 0.0); -- Gestão de Projetos

-- Felipe Rocha (Veterano, boas notas)
INSERT INTO boletim (aluno_id, disciplina_id, faltas, mencao, nota_avaliacao, data_avaliacao, atividades_entregues, participacao_nota) VALUES
(6, 1, 0, 'SS', 9.8, '2024-04-10', 10, 10.0), -- Algoritmos
(6, 4, 0, 'SS', 9.5, '2024-04-15', 10, 9.5), -- IA
(6, 6, 2, 'MS', 8.8, '2024-04-15', 9, 9.0);  -- Compiladores

-- Gabriela Martins
INSERT INTO boletim (aluno_id, disciplina_id, faltas, mencao, nota_avaliacao, data_avaliacao, atividades_entregues, participacao_nota) VALUES
(7, 2, 4, 'MM', 6.8, '2024-04-12', 7, 8.0), -- BD Relacional
(7, 9, 0, 'SS', 9.5, '2024-04-20', 10, 10.0); -- Ética

-- Henrique Alves (Calouro)
INSERT INTO boletim (aluno_id, disciplina_id, faltas, mencao, nota_avaliacao, data_avaliacao, atividades_entregues, participacao_nota) VALUES
(8, 3, 0, 'MS', 7.5, '2024-04-11', 8, 8.5), -- Eng. Software
(8, 8, 2, 'MM', 6.5, '2024-04-14', 6, 7.0); -- Matemática Discreta

-- Isabela Ferreira
INSERT INTO boletim (aluno_id, disciplina_id, faltas, mencao, nota_avaliacao, data_avaliacao, atividades_entregues, participacao_nota) VALUES
(9, 2, 0, 'SS', 9.2, '2024-04-12', 9, 9.5), -- BD Relacional
(9, 7, 2, 'MS', 8.0, '2024-04-18', 8, 8.5); -- Sistemas Operacionais

-- João Pedro (Dificuldades em Redes)
INSERT INTO boletim (aluno_id, disciplina_id, faltas, mencao, nota_avaliacao, data_avaliacao, atividades_entregues, participacao_nota) VALUES
(10, 1, 2, 'MM', 6.0, '2024-04-10', 5, 6.0), -- Algoritmos
(10, 5, 6, 'II', 2.0, '2024-04-14', 1, 3.0); -- Redes (Insuficiente)
