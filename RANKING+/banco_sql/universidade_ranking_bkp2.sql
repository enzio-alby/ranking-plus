-- --------------------------------------------------------
-- Servidor:                     127.0.0.1
-- Versão do servidor:           8.4.3 - MySQL Community Server - GPL
-- OS do Servidor:               Win64
-- HeidiSQL Versão:              12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Copiando estrutura do banco de dados para universidade_ranking
CREATE DATABASE IF NOT EXISTS `universidade_ranking` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `universidade_ranking`;

-- Copiando estrutura para tabela universidade_ranking.administradores
CREATE TABLE IF NOT EXISTS `administradores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela universidade_ranking.administradores: ~1 rows (aproximadamente)
INSERT INTO `administradores` (`id`, `nome`, `email`, `senha`, `criado_em`) VALUES
	(1, 'Enzio (Admin)', 'admin.rankingplus@gmail.com', 'rankingplus001', '2026-04-12 17:23:49');

-- Copiando estrutura para tabela universidade_ranking.alunos
CREATE TABLE IF NOT EXISTS `alunos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `matricula` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `curso` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idade` int DEFAULT NULL,
  `turno` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cpf` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `campus` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `semestre_atual` int DEFAULT NULL,
  `periodo_curso` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_matricula` date DEFAULT NULL,
  `situacao` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contato_emergencia_nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contato_emergencia_telefone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contato_emergencia_parentesco` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contato_emergencia_email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `endereco_rua` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `endereco_numero` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `endereco_complemento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `endereco_bairro` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `endereco_cep` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `endereco_cidade` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `endereco_estado` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permitir_exibicao_ranking` tinyint(1) DEFAULT '1',
  `github` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `linkedin` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `matricula` (`matricula`),
  UNIQUE KEY `cpf` (`cpf`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela universidade_ranking.alunos: ~22 rows (aproximadamente)
INSERT INTO `alunos` (`id`, `nome`, `senha`, `matricula`, `email`, `curso`, `telefone`, `idade`, `turno`, `cpf`, `data_nascimento`, `campus`, `semestre_atual`, `periodo_curso`, `data_matricula`, `situacao`, `contato_emergencia_nome`, `contato_emergencia_telefone`, `contato_emergencia_parentesco`, `contato_emergencia_email`, `endereco_rua`, `endereco_numero`, `endereco_complemento`, `endereco_bairro`, `endereco_cep`, `endereco_cidade`, `endereco_estado`, `permitir_exibicao_ranking`, `github`, `linkedin`) VALUES
	(1, 'Ana Silva', 'senha123', '2023001', 'ana.silva@uni.edu', 'Ciência da Computação', '(61) 99999-0001', 20, 'Noturno', '111.222.333-01', '2004-05-12', 'Asa Norte', 3, '2026.1', '2023-02-01', 'Ativo', 'Maria Silva', '(61) 98888-0001', 'Mãe', 'maria.silva@email.com', 'SQN 202 Bloco A', '10', 'Apto 101', 'Asa Norte', '70832-010', 'Brasília', 'DF', 1, '', ''),
	(2, 'Bruno Costa', 'senha123', '2023002', 'bruno.costa@uni.edu', 'Sistemas de Informação', '(61) 99999-0002', 21, 'Noturno', '222.333.444-02', '2003-08-20', 'Asa Norte', 4, '2026.1', '2022-08-01', 'Ativo', 'Roberto Costa', '(61) 98888-0002', 'Pai', 'roberto.costa@email.com', 'QNA 15', '5', 'Casa', 'Taguatinga', '72110-015', 'Brasília', 'DF', 1, '', ''),
	(3, 'Carla Oliveira', 'senha123', '2023003', 'carla.oliv@uni.edu', 'Engenharia de Software', '(61) 99999-0003', 19, 'Matutino', '333.444.555-03', '2005-01-15', 'Taguatinga', 2, '2026.1', '2023-08-01', 'Ativo', 'Lucas Oliveira', '(61) 98888-0003', 'Irmão', 'lucas.oliveira@email.com', 'EQSW 103 Bloco B', '103', 'Apto 202', 'Setor Sudoeste', '70670-422', 'Brasília', 'DF', 0, '', ''),
	(4, 'Daniel Santos', 'senha123', '2023004', 'daniel.santos@uni.edu', 'Ciência da Computação', '(61) 99999-0004', 22, 'Noturno', '444.555.666-04', '2002-11-30', 'Asa Norte', 5, '2026.1', '2022-02-01', 'Ativo', 'Fernanda Santos', '(61) 98888-0004', 'Esposa', 'fernanda.santos@email.com', 'Rua 12 Norte', '14', 'Edifício Solar', 'Águas Claras', '71909-540', 'Brasília', 'DF', 1, '', ''),
	(5, 'Eduarda Lima', 'senha123', '2023005', 'duda.lima@uni.edu', 'Sistemas de Informação', '(61) 99999-0005', 20, 'Vespertino', '555.666.777-05', '2004-03-10', 'Taguatinga', 3, '2026.1', '2023-02-01', 'Trancado', 'Sônia Lima', '(61) 98888-0005', 'Mãe', 'sonia.lima@email.com', 'SQS 305 Bloco C', '11', 'Apto 404', 'Asa Sul', '70330-100', 'Brasília', 'DF', 0, '', ''),
	(6, 'Felipe Rocha', 'senha123', '2023006', 'felipe.rocha@uni.edu', 'Ciência da Computação', '(61) 99999-0006', 23, 'Noturno', '666.777.888-06', '2001-07-22', 'Asa Norte', 6, '2026.1', '2021-08-01', 'Ativo', 'Carlos Rocha', '(61) 98888-0006', 'Pai', 'carlos.rocha@email.com', 'QSB 12', '3', '', 'Taguatinga Sul', '72015-120', 'Brasília', 'DF', 1, '', ''),
	(7, 'Gabriela Martins', 'senha123', '2023007', 'gabi.martins@uni.edu', 'Engenharia de Software', '(61) 99999-0007', 20, 'Noturno', '777.888.999-07', '2004-09-05', 'Asa Norte', 3, '2026.1', '2023-02-01', 'Ativo', 'Teresa Martins', '(61) 98888-0007', 'Avó', 'teresa.martins@email.com', 'Quadra 204 Sul', 'Lote 2', 'Apto 301', 'Águas Claras', '71920-540', 'Brasília', 'DF', 1, '', ''),
	(8, 'Henrique Alves', 'senha123', '2023008', 'henrique.alves@uni.edu', 'Ciência da Computação', '(61) 99999-0008', 19, 'Matutino', '888.999.000-08', '2005-02-18', 'Taguatinga', 1, '2026.1', '2026-02-01', 'Trancado', 'João Alves', '(61) 98888-0008', 'Pai', 'joao.alves@email.com', 'SQN 410 Bloco E', '5', 'Apto 102', 'Asa Norte', '70862-050', 'Brasília', 'DF', 1, '', ''),
	(9, 'Isabela Ferreira', 'senha123', '2023009', 'isa.ferreira@uni.edu', 'Sistemas de Informação', '(61) 99999-0009', 21, 'Noturno', '999.000.111-09', '2003-12-25', 'Asa Norte', 4, '2026.1', '2022-08-01', 'Ativo', 'Paula Ferreira', '(61) 98888-0009', 'Mãe', 'paula.ferreira@email.com', 'QE 30 Conjunto F', '12', 'Casa', 'Guará II', '71060-030', 'Brasília', 'DF', 1, '', ''),
	(10, 'João Pedro', 'senha123', '2023010', 'joao.pedro@uni.edu', 'Engenharia de Software', '(61) 99999-0010', 22, 'Noturno', '000.111.222-10', '2002-06-14', 'Asa Norte', 5, '2026.1', '2022-02-01', 'Ativo', 'Marcos Pedro', '(61) 98888-0010', 'Irmão', 'marcos.pedro@email.com', 'Rua das Pitangueiras', 'Lote 5', 'Apto 1001', 'Águas Claras', '71936-250', 'Brasília', 'DF', 1, '', ''),
	(11, 'Lucas Almeida', 'senha123', '2023011', 'lucas.almeida@uni.edu', 'Sistemas de Informação', '(61) 99999-0011', 21, 'Matutino', '111.000.222-11', '2003-04-10', 'Taguatinga', 4, '2026.1', '2022-08-01', 'Ativo', 'Laura Almeida', '(61) 98888-0011', 'Mãe', 'laura.almeida@email.com', 'SQS 106 Bloco C', '106', 'Apto 205', 'Asa Sul', '70345-030', 'Brasília', 'DF', 1, '', ''),
	(12, 'Mariana Costa', 'senha123', '2023012', 'mariana.costa@uni.edu', 'Engenharia de Software', '(61) 99999-0012', 20, 'Noturno', '222.111.333-12', '2004-09-15', 'Asa Norte', 3, '2026.1', '2023-02-01', 'Ativo', 'Ricardo Costa', '(61) 98888-0012', 'Pai', 'ricardo.costa@email.com', 'QNL 22 Conjunto A', '14', 'Casa', 'Taguatinga Norte', '72151-220', 'Brasília', 'DF', 1, '', ''),
	(13, 'Pedro Henrique', 'senha123', '2023013', 'pedro.henrique@uni.edu', 'Ciência da Computação', '(61) 99999-0013', 24, 'Noturno', '333.222.444-13', '2000-12-05', 'Asa Norte', 7, '2026.1', '2020-08-01', 'Ativo', 'Sandra Henrique', '(61) 98888-0013', 'Mãe', 'sandra.henrique@email.com', 'Rua Copaíba', '1', 'Apto 502', 'Águas Claras', '71931-000', 'Brasília', 'DF', 1, '', ''),
	(14, 'Sofia Ribeiro', 'senha123', '2023014', 'sofia.ribeiro@uni.edu', 'Sistemas de Informação', '(61) 99999-0014', 19, 'Vespertino', '444.333.555-14', '2005-02-28', 'Taguatinga', 2, '2026.1', '2023-08-01', 'Ativo', 'Tiago Ribeiro', '(61) 98888-0014', 'Irmão', 'tiago.ribeiro@email.com', 'SQN 315 Bloco D', '315', 'Apto 304', 'Asa Norte', '70874-040', 'Brasília', 'DF', 1, '', ''),
	(15, 'Thiago Martins', 'senha123', '2023015', 'thiago.martins@uni.edu', 'Ciência da Computação', '(61) 99999-0015', 22, 'Matutino', '555.444.666-15', '2002-07-20', 'Taguatinga', 5, '2026.1', '2022-02-01', 'Trancado', 'Helena Martins', '(61) 98888-0015', 'Esposa', 'helena.martins@email.com', 'QSC 19', '2', 'Casa', 'Taguatinga Sul', '72016-190', 'Brasília', 'DF', 1, '', ''),
	(16, 'Beatriz Souza', 'senha123', '2023016', 'beatriz.souza@uni.edu', 'Engenharia de Software', '(61) 99999-0016', 21, 'Noturno', '666.555.777-16', '2003-11-11', 'Asa Norte', 4, '2026.1', '2022-08-01', 'Ativo', 'Antônio Souza', '(61) 98888-0016', 'Avô', 'antonio.souza@email.com', 'SHVP Rua 4', 'Chácara 12', 'Lote 3', 'Vicente Pires', '72005-230', 'Brasília', 'DF', 1, '', ''),
	(17, 'Rafael Gomes', 'senha123', '2023017', 'rafael.gomes@uni.edu', 'Ciência da Computação', '(61) 99999-0017', 20, 'Noturno', '777.666.888-17', '2004-03-25', 'Asa Norte', 3, '2026.1', '2023-02-01', 'Ativo', 'Cláudia Gomes', '(61) 98888-0017', 'Mãe', 'claudia.gomes@email.com', 'QNO 14 Conjunto A', '12', 'Casa', 'Ceilândia', '72225-141', 'Brasília', 'DF', 0, '', ''),
	(18, 'Camila Lima', 'senha123', '2023018', 'camila.lima@uni.edu', 'Sistemas de Informação', '(61) 99999-0018', 23, 'Matutino', '888.777.999-18', '2001-05-08', 'Taguatinga', 6, '2026.1', '2021-08-01', 'Ativo', 'Fernando Lima', '(61) 98888-0018', 'Pai', 'fernando.lima@email.com', 'SQSW 304 Bloco F', '304', 'Apto 603', 'Setor Sudoeste', '70673-406', 'Brasília', 'DF', 1, '', ''),
	(19, 'Vitor Mendes', 'senha123', '2023019', 'vitor.mendes@uni.edu', 'Engenharia de Software', '(61) 99999-0019', 19, 'Noturno', '999.888.000-19', '2005-10-10', 'Asa Norte', 1, '2026.1', '2024-02-01', 'Ativo', 'Juliana Mendes', '(61) 98888-0019', 'Irmã', 'juliana.mendes@email.com', 'QNE 15', 'Lote 4', '', 'Taguatinga Norte', '72125-150', 'Brasília', 'DF', 1, '', ''),
	(20, 'Leticia Araujo', 'senha123', '2023020', 'leticia.araujo@uni.edu', 'Ciência da Computação', '(61) 99999-0020', 22, 'Noturno', '101.999.111-20', '2002-01-30', 'Asa Norte', 5, '2026.1', '2022-02-01', 'Ativo', 'Marcelo Araujo', '(61) 98888-0020', 'Marido', 'marcelo.araujo@email.com', 'Rua Manacá', 'Lote 2', 'Apto 101', 'Águas Claras', '71936-500', 'Brasília', 'DF', 0, '', ''),
	(21, 'Enzio Albéfaro da Silva', 'senha123', '22303511', 'enzioalbefaro@gmail.com', 'Ciência da Computação', '(61) 99631-5265', 25, 'Noturno', '054.913.761-08', '2000-12-05', 'Taguatinga', 7, '2026.2', '2023-02-01', 'Ativo', 'Maria de Lourdes', '(61) 98590-8199', 'Mãe', NULL, 'SHSN ch 128 Conj D', '21', NULL, 'Setor Habitacional Sol Nascente', '72236-800', 'Brasília', 'DF', 1, 'https://github.com/enzio-alby', 'https://www.linkedin.com/in/enzio-alby/'),
	(22, 'Joao Victor Monteiro', 'senha123', '22303954', 'joaovictor.monteiro@sempreceub.com', 'Ciência da Computação', NULL, NULL, 'Noturno', NULL, NULL, 'Taguatinga', 7, '2026.2', '2023-02-01', 'Ativo', NULL, NULL, NULL, 'joaovictor-monteiro@hotmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 'https://github.com/JoaovictorDr', 'https://www.linkedin.com/in/joao-victor-monteiro-821480275');

-- Copiando estrutura para tabela universidade_ranking.boletim
CREATE TABLE IF NOT EXISTS `boletim` (
  `id` int NOT NULL AUTO_INCREMENT,
  `aluno_id` int DEFAULT NULL,
  `disciplina_id` int DEFAULT NULL,
  `faltas` int DEFAULT '0',
  `mencao` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nota_avaliacao` decimal(4,2) DEFAULT NULL,
  `data_avaliacao` date DEFAULT NULL,
  `atividades_entregues` int DEFAULT NULL,
  `participacao_nota` decimal(4,2) DEFAULT NULL,
  `semestre_cursado` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '2026.1',
  PRIMARY KEY (`id`),
  KEY `aluno_id` (`aluno_id`),
  KEY `disciplina_id` (`disciplina_id`),
  CONSTRAINT `boletim_ibfk_1` FOREIGN KEY (`aluno_id`) REFERENCES `alunos` (`id`),
  CONSTRAINT `boletim_ibfk_2` FOREIGN KEY (`disciplina_id`) REFERENCES `disciplinas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela universidade_ranking.boletim: ~54 rows (aproximadamente)
INSERT INTO `boletim` (`id`, `aluno_id`, `disciplina_id`, `faltas`, `mencao`, `nota_avaliacao`, `data_avaliacao`, `atividades_entregues`, `participacao_nota`, `semestre_cursado`) VALUES
	(1, 1, 1, 2, 'SS', 9.50, '2026-04-10', 10, 10.00, '2026.1'),
	(2, 1, 2, 0, 'MS', 8.50, '2026-04-12', 9, 9.00, '2026.1'),
	(3, 1, 6, 0, 'SS', 10.00, '2026-04-15', 10, 10.00, '2026.1'),
	(4, 2, 2, 4, 'MM', 6.50, '2026-04-12', 6, 7.50, '2026.1'),
	(5, 2, 4, 2, 'MS', 8.00, '2026-04-15', 8, 8.00, '2026.1'),
	(6, 2, 7, 6, 'MM', 5.50, '2026-04-18', 5, 6.00, '2026.1'),
	(7, 3, 3, 0, 'SS', 10.00, '2026-04-11', 10, 10.00, '2026.1'),
	(8, 3, 8, 2, 'MS', 8.50, '2026-04-14', 9, 8.50, '2026.1'),
	(9, 4, 1, 8, 'MI', 4.00, '2026-04-10', 4, 5.00, '2026.1'),
	(10, 4, 4, 2, 'MM', 6.00, '2026-04-15', 7, 7.00, '2026.1'),
	(11, 4, 9, 0, 'MS', 8.00, '2026-04-20', 8, 8.00, '2026.1'),
	(12, 5, 5, 0, 'SR', 0.00, NULL, 0, 0.00, '2026.1'),
	(13, 5, 10, 0, 'SR', 0.00, NULL, 0, 0.00, '2026.1'),
	(14, 6, 1, 0, 'SS', 9.80, '2026-04-10', 10, 10.00, '2026.1'),
	(15, 6, 4, 0, 'SS', 9.50, '2026-04-15', 10, 9.50, '2026.1'),
	(16, 6, 6, 2, 'MS', 8.80, '2026-04-15', 9, 9.00, '2026.1'),
	(17, 7, 2, 4, 'MM', 6.80, '2026-04-12', 7, 8.00, '2026.1'),
	(18, 7, 9, 0, 'SS', 9.50, '2026-04-20', 10, 10.00, '2026.1'),
	(19, 8, 3, 0, 'MS', 7.50, '2026-04-11', 8, 8.50, '2026.1'),
	(20, 8, 8, 2, 'MM', 6.50, '2026-04-14', 6, 7.00, '2026.1'),
	(21, 9, 2, 0, 'SS', 9.20, '2026-04-12', 9, 9.50, '2026.1'),
	(22, 9, 7, 2, 'MS', 8.00, '2026-04-18', 8, 8.50, '2026.1'),
	(23, 10, 1, 2, 'MM', 6.00, '2026-04-10', 5, 6.00, '2026.1'),
	(24, 10, 5, 6, 'II', 2.00, '2026-04-14', 1, 3.00, '2026.1'),
	(25, 11, 2, 0, 'SS', 9.50, '2026-04-12', 10, 10.00, '2026.1'),
	(26, 11, 5, 2, 'MS', 8.50, '2026-04-14', 9, 9.00, '2026.1'),
	(27, 12, 3, 0, 'SS', 10.00, '2026-04-11', 10, 10.00, '2026.1'),
	(28, 12, 10, 0, 'SS', 9.80, '2026-04-16', 10, 10.00, '2026.1'),
	(29, 13, 4, 4, 'MM', 6.50, '2026-04-15', 7, 7.50, '2026.1'),
	(30, 13, 6, 2, 'MS', 7.80, '2026-04-15', 8, 8.00, '2026.1'),
	(31, 14, 1, 8, 'MI', 4.50, '2026-04-10', 4, 5.00, '2026.1'),
	(32, 14, 8, 4, 'MM', 6.00, '2026-04-14', 6, 6.50, '2026.1'),
	(33, 15, 7, 0, 'SR', 0.00, NULL, 0, 0.00, '2026.1'),
	(34, 15, 2, 0, 'SR', 0.00, NULL, 0, 0.00, '2026.1'),
	(35, 16, 3, 2, 'MS', 8.20, '2026-04-11', 9, 8.50, '2026.1'),
	(36, 16, 9, 0, 'SS', 9.50, '2026-04-20', 10, 10.00, '2026.1'),
	(37, 17, 1, 0, 'SS', 10.00, '2026-04-10', 10, 10.00, '2026.1'),
	(38, 17, 4, 0, 'SS', 9.80, '2026-04-15', 10, 10.00, '2026.1'),
	(39, 18, 2, 4, 'MM', 6.80, '2026-04-12', 7, 7.00, '2026.1'),
	(40, 18, 7, 2, 'MS', 7.50, '2026-04-18', 8, 8.00, '2026.1'),
	(41, 19, 1, 2, 'MS', 8.50, '2026-04-10', 9, 9.00, '2026.1'),
	(42, 20, 6, 0, 'SS', 9.50, '2026-04-15', 10, 9.50, '2026.1'),
	(43, 20, 4, 2, 'MS', 8.80, '2026-04-15', 9, 9.00, '2026.1'),
	(44, 21, 1, 0, 'SS', 9.50, '2023-06-15', 10, 10.00, '2023.1'),
	(45, 21, 8, 2, 'MS', 8.20, '2023-06-18', 9, 8.50, '2023.1'),
	(46, 21, 2, 4, 'MS', 8.80, '2023-11-20', 10, 9.00, '2023.2'),
	(47, 21, 3, 0, 'SS', 10.00, '2023-11-25', 10, 10.00, '2023.2'),
	(48, 21, 5, 2, 'SS', 9.20, '2024-06-10', 9, 9.50, '2024.1'),
	(49, 21, 7, 0, 'SS', 9.80, '2024-06-12', 10, 10.00, '2024.1'),
	(50, 21, 6, 2, 'MS', 8.50, '2024-11-15', 8, 9.00, '2024.2'),
	(51, 21, 9, 0, 'SS', 10.00, '2024-11-18', 10, 10.00, '2024.2'),
	(52, 21, 10, 0, 'SS', 9.60, '2025-06-20', 10, 10.00, '2025.1'),
	(53, 21, 4, 0, 'SS', 9.90, '2025-11-22', 10, 10.00, '2025.2'),
	(54, 21, 1, 0, 'SS', 10.00, '2026-04-10', 5, 10.00, '2026.1');

-- Copiando estrutura para tabela universidade_ranking.disciplinas
CREATE TABLE IF NOT EXISTS `disciplinas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome_materia` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `professor_id` int DEFAULT NULL,
  `sala` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dia_semana` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `horario` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `campus` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `professor_id` (`professor_id`),
  CONSTRAINT `disciplinas_ibfk_1` FOREIGN KEY (`professor_id`) REFERENCES `professores` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela universidade_ranking.disciplinas: ~10 rows (aproximadamente)
INSERT INTO `disciplinas` (`id`, `nome_materia`, `professor_id`, `sala`, `dia_semana`, `horario`, `campus`) VALUES
	(1, 'Algoritmos e Estruturas de Dados', 1, 'Lab 101', 'Segunda-feira', '19:00', 'Asa Norte'),
	(2, 'Banco de Dados Relacional', 2, 'Lab 204', 'Terça-feira', '19:00', 'Asa Norte'),
	(3, 'Engenharia de Software', 3, 'Sala 305', 'Quarta-feira', '08:00', 'Taguatinga'),
	(4, 'Inteligência Artificial', 4, 'Lab 102', 'Quinta-feira', '20:50', 'Asa Norte'),
	(5, 'Redes de Computadores', 5, 'Sala 110', 'Sexta-feira', '14:00', 'Taguatinga'),
	(6, 'Compiladores', 1, 'Lab 103', 'Quarta-feira', '20:50', 'Asa Norte'),
	(7, 'Sistemas Operacionais', 2, 'Lab 205', 'Quinta-feira', '19:00', 'Asa Norte'),
	(8, 'Matemática Discreta', 3, 'Sala 301', 'Segunda-feira', '10:00', 'Taguatinga'),
	(9, 'Ética e Computação', 4, 'Sala 105', 'Sexta-feira', '19:00', 'Asa Norte'),
	(10, 'Gestão de Projetos de TI', 5, 'Sala 112', 'Terça-feira', '16:00', 'Taguatinga');

-- Copiando estrutura para tabela universidade_ranking.dom_areas_foco
CREATE TABLE IF NOT EXISTS `dom_areas_foco` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela universidade_ranking.dom_areas_foco: ~10 rows (aproximadamente)
INSERT INTO `dom_areas_foco` (`id`, `nome`) VALUES
	(1, 'Backend (Java, Node.js, Python, C#)'),
	(2, 'Frontend (React, Angular, Vue)'),
	(3, 'Full Stack'),
	(4, 'Ciência de Dados (Data Science) e Analytics'),
	(5, 'Engenharia de Dados'),
	(6, 'Inteligência Artificial (IA) / Machine Learning'),
	(7, 'Cloud Computing / Infraestrutura'),
	(8, 'DevOps e SRE'),
	(9, 'Segurança da Informação (Cybersecurity)'),
	(10, 'UI/UX Design');

-- Copiando estrutura para tabela universidade_ranking.dom_setores
CREATE TABLE IF NOT EXISTS `dom_setores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela universidade_ranking.dom_setores: ~9 rows (aproximadamente)
INSERT INTO `dom_setores` (`id`, `nome`) VALUES
	(1, 'Tecnologia da Informação (TI)'),
	(2, 'Finanças, Bancos e Fintechs'),
	(3, 'Saúde e Healthtechs'),
	(4, 'Varejo e E-commerce'),
	(5, 'Educação e Edtechs'),
	(6, 'Consultoria e Auditoria'),
	(7, 'Logística e Supply Chain'),
	(8, 'Agronegócio (Agrotech)'),
	(9, 'Indústria e Manufatura');

-- Copiando estrutura para tabela universidade_ranking.dom_tipos_vaga
CREATE TABLE IF NOT EXISTS `dom_tipos_vaga` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela universidade_ranking.dom_tipos_vaga: ~6 rows (aproximadamente)
INSERT INTO `dom_tipos_vaga` (`id`, `nome`) VALUES
	(1, 'Estágio'),
	(2, 'Trainee'),
	(3, 'Efetivo - Júnior'),
	(4, 'Efetivo - Pleno'),
	(5, 'Pessoa Jurídica (PJ)'),
	(6, 'Freelancer / Projeto Específico');

-- Copiando estrutura para tabela universidade_ranking.empresas
CREATE TABLE IF NOT EXISTS `empresas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `razao_social` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome_fantasia` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cnpj` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `setor_id` int DEFAULT NULL,
  `email_corporativo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `site_empresa` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linkedin_empresa` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `senha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `verificada` tinyint(1) DEFAULT '0',
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cnpj` (`cnpj`),
  UNIQUE KEY `email_corporativo` (`email_corporativo`),
  KEY `setor_id` (`setor_id`),
  CONSTRAINT `empresas_ibfk_1` FOREIGN KEY (`setor_id`) REFERENCES `dom_setores` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela universidade_ranking.empresas: ~1 rows (aproximadamente)
INSERT INTO `empresas` (`id`, `razao_social`, `nome_fantasia`, `cnpj`, `setor_id`, `email_corporativo`, `telefone`, `site_empresa`, `linkedin_empresa`, `senha`, `verificada`, `criado_em`) VALUES
	(1, 'Tech Solutions Brasil LTDA', 'Tech Solutions', '12.345.678/0001-90', NULL, 'recrutamento@techsolutions.com.br', '(11) 3333-4444', 'https://www.techsolutions.com.br', NULL, 'senha123', 1, '2026-04-09 05:27:20');

-- Copiando estrutura para tabela universidade_ranking.empresa_interesses
CREATE TABLE IF NOT EXISTS `empresa_interesses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL,
  `area_foco_id` int DEFAULT NULL,
  `tipo_vaga_id` int DEFAULT NULL,
  `curso_preferido` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `semestre_minimo` int DEFAULT NULL,
  `atualizado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  KEY `area_foco_id` (`area_foco_id`),
  KEY `tipo_vaga_id` (`tipo_vaga_id`),
  CONSTRAINT `empresa_interesses_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `empresa_interesses_ibfk_2` FOREIGN KEY (`area_foco_id`) REFERENCES `dom_areas_foco` (`id`),
  CONSTRAINT `empresa_interesses_ibfk_3` FOREIGN KEY (`tipo_vaga_id`) REFERENCES `dom_tipos_vaga` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela universidade_ranking.empresa_interesses: ~1 rows (aproximadamente)
INSERT INTO `empresa_interesses` (`id`, `empresa_id`, `area_foco_id`, `tipo_vaga_id`, `curso_preferido`, `semestre_minimo`, `atualizado_em`) VALUES
	(1, 1, NULL, NULL, 'Ciência da Computação', 5, '2026-04-09 05:27:20');

-- Copiando estrutura para tabela universidade_ranking.interacoes_empresas_alunos
CREATE TABLE IF NOT EXISTS `interacoes_empresas_alunos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL,
  `aluno_id` int NOT NULL,
  `tipo_interacao` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'VISUALIZACAO',
  `data_interacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  KEY `aluno_id` (`aluno_id`),
  CONSTRAINT `interacoes_empresas_alunos_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `interacoes_empresas_alunos_ibfk_2` FOREIGN KEY (`aluno_id`) REFERENCES `alunos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela universidade_ranking.interacoes_empresas_alunos: ~18 rows (aproximadamente)
INSERT INTO `interacoes_empresas_alunos` (`id`, `empresa_id`, `aluno_id`, `tipo_interacao`, `data_interacao`) VALUES
	(1, 1, 21, 'VISUALIZACAO', '2026-04-09 05:27:20'),
	(2, 1, 21, 'CLIQUE_GITHUB', '2026-04-09 05:27:20'),
	(3, 1, 21, 'VISUALIZACAO', '2026-04-10 04:04:20'),
	(4, 1, 21, 'VISUALIZACAO', '2026-04-10 04:04:20'),
	(5, 1, 21, 'VISUALIZACAO', '2026-04-10 04:04:57'),
	(6, 1, 21, 'CLIQUE_GITHUB', '2026-04-10 04:06:00'),
	(7, 1, 21, 'CLIQUE_LINKEDIN', '2026-04-10 04:06:04'),
	(8, 1, 19, 'VISUALIZACAO', '2026-04-10 04:06:09'),
	(9, 1, 12, 'VISUALIZACAO', '2026-04-10 04:06:13'),
	(10, 1, 1, 'VISUALIZACAO', '2026-04-10 04:06:47'),
	(11, 1, 2, 'VISUALIZACAO', '2026-04-12 07:07:00'),
	(12, 1, 2, 'VISUALIZACAO', '2026-04-12 07:07:00'),
	(13, 1, 21, 'VISUALIZACAO', '2026-04-12 07:07:03'),
	(14, 1, 21, 'VISUALIZACAO', '2026-04-12 19:26:53'),
	(15, 1, 21, 'VISUALIZACAO', '2026-04-12 19:26:53'),
	(16, 1, 21, 'CLIQUE_GITHUB', '2026-04-12 19:26:57'),
	(17, 1, 21, 'VISUALIZACAO', '2026-04-12 19:48:44'),
	(18, 1, 21, 'VISUALIZACAO', '2026-04-12 19:48:44');

-- Copiando estrutura para tabela universidade_ranking.perfil_profissional
CREATE TABLE IF NOT EXISTS `perfil_profissional` (
  `aluno_id` int NOT NULL,
  `resumo` text COLLATE utf8mb4_unicode_ci,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`aluno_id`),
  CONSTRAINT `perfil_profissional_ibfk_1` FOREIGN KEY (`aluno_id`) REFERENCES `alunos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela universidade_ranking.perfil_profissional: ~1 rows (aproximadamente)
INSERT INTO `perfil_profissional` (`aluno_id`, `resumo`, `updated_at`) VALUES
	(21, 'Atualmente graduando 7° em Ciência da Computação no UniCeub e atuando/expandindo meu conhecimento na área de Cloud e DevOps. Analista de Infraestrutura de TI Júnior com cerca de 2 anos de experiência em ambientes corporativos, atuando com administração de sistemas, middleware Oracle e suporte a ambientes Linux e Windows. Experiência no atendimento e resolução de incidentes, análise de causa raiz, automação de rotinas operacionais e apoio à sustentação de ambientes críticos. Possuo conhecimentos em Cloud Computing, com certificações AWS Cloud Foundation e Google Cloud Foundations. Conhecimentos em Linux, Windows, GCP, Shellscript, Python, HTML, PHP e Linux(RH124). Além disso, em design web, criação de logos, edição de vídeos e modelagem 3D(Cinema 4D). Proativo, organizado e colaborativo, com facilidade para trabalhar em equipes multidisciplinares, boa comunicação e forte interesse em evolução nas áreas de Infraestrutura, Cloud, DevOps e SRE, buscando constantemente aprimorar conhecimentos técnicos e contribuir para a estabilidade e eficiência dos ambientes de TI.', '2026-05-10 20:08:11');

-- Copiando estrutura para tabela universidade_ranking.pp_experiencias
CREATE TABLE IF NOT EXISTS `pp_experiencias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `aluno_id` int NOT NULL,
  `empresa` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cargo` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `periodo_inicio` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `periodo_fim` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `aluno_id` (`aluno_id`),
  CONSTRAINT `pp_experiencias_ibfk_1` FOREIGN KEY (`aluno_id`) REFERENCES `alunos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela universidade_ranking.pp_experiencias: ~8 rows (aproximadamente)
INSERT INTO `pp_experiencias` (`id`, `aluno_id`, `empresa`, `cargo`, `periodo_inicio`, `periodo_fim`, `descricao`) VALUES
	(9, 21, 'ORAEX CLOUD CONSULTING', 'Analista de Infraestrutura Junior II', 'maio de 2026', 'Present', '- Provisionamento de Infraestrutura: Instalação e configuração de ambientes de QA, incluindo configuração de recursos (CPU/RAM) de sistemas e aplicações. - Automação com Ansible: Desenvolvimento de automações via YAML no Ansible Tower para padronização de configurações e deploys. - Modernização de Sistemas: Execução de projetos de upgrade de RHEL 7 para RHEL 8, garantindo segurança e compatibilidade. - Observabilidade e Segurança: Monitoramento proativo via Zabbix/Grafana e remediação de vulnerabilidades com foco em conformidade e CyberArk. - Mentoria Técnica: Referência para o time em incidentes críticos e'),
	(10, 21, 'ORAEX CLOUD CONSULTING', 'Analista de Infraestrutura Junior I', 'fevereiro de 2025', 'Present', 'Principais atividades incluem: - Criação, manutenção e otimização de scripts para automatizar processos e gerenciar ambientes Linux, Windows e Middleware. - Implementação e administração de soluções baseadas em OpenShift, com ênfase na gestão de containers e aplicações em ambientes escaláveis e de alta disponibilidade. - Inicio do Desenvolvimento e gerenciamento de playbooks no Ansible para configuração, orquestração e remediação de sistemas. - Inicio do aprendizado e aplicação de conceitos de containers (Docker) e orquestração com Kubernetes, visando modernizar e aprimorar práticas de DevOps. - Colaboração com equipes multidisciplinares para garantir segurança, eficiência e automação ao longo do ciclo de vida do desenvolvimento de software (SDLC). - Identificação e remediação de vulnerabilidades em sistemas, utilizando ferramentas e práticas modernas de DevOps. - Monitoramento e análise proativa de ambientes com ferramentas como Zabbix e Grafana, prevenindo falhas e otimizando desempenho. >Plataformas e ferramentas utilizadas: Docker, Kubernetes, OpenShift, Ansible Tower, Autotask, Service Now, Zabbix, Grafana, SGS, Jira, Atlassian,'),
	(11, 21, 'ORAEX CLOUD CONSULTING', 'Analista de Infraestrutura DevOps', 'março de 2024', 'Present', 'Implementação de práticas de DevOps para gestão de vulnerabilidades em ambientes Linux, Windows e Middleware. Junto ao desenvolvimento e manutenção das ferramentas de automação para escaneamento e remediação de vulnerabilidades. Colaboração com equipes multidisciplinares para garantir a implementação das melhores práticas de segurança ao longo do Software Development Cycle. Monitoramento de tendências e incidentes de segurança para identificar proativamente vulnerabilidades e ameaças. Realização de avaliações e tratativas de risco e priorização de vulnerabilidades com base em gravidade e impacto. Plataformas utilizados para realização de tratativas DevOps: Autotask, Service Now, Zabbix, Grafana, SGS, Jira, Atlassian, 3CX, CyberArk, Microsoft 365, Slack, Teams, Ansible Tower.'),
	(12, 21, 'Moni Imóveis', 'Auxiliar administrativo', 'fevereiro de 2023', 'abril de 2023', 'Setor de Vendas de imóveis Atividades realizadas: Controle de anúncios dos imóveis anunciados, contato com corretores e fotógrafos dos imóveis, criação de planilhas e relatórios de vendas, atendimento de ligações. Plataformas utilizados para registros, acompanhamentos de demanda: InGaia(Kenlo), Gmail, Phone Track e SmBot.'),
	(13, 21, 'Thaís Imobiliária', 'Assistente administrativo', 'outubro de 2020', 'julho de 2022', 'Setor de Vendas de imóveis Atividades realizadas: Controle de anúncios dos imóveis anunciados, contato com corretores e fotógrafos dos imóveis, lançamento de notas no sistema, criação de planilhas e relatórios de vendas, atendimento presencial, upload de contratos para assinatura digital(docusign), cadastro dos clientes e negócios no sistema(Sankhya), análise de documentação para emissão de todos os tipos de contratos de compra e venda(Cessão de direito, à vista, financiamento, cessão de direito, permuta, FGTS), elaboração de recibos, proporcional, troca de titularidade, posse e entrega de chaves, baixa contratual de imóveis vendidos, lançamento de prazo para o acompanhamento do pós-venda e agendamento de escrituras. Plataformas utilizados para registros, acompanhamentos de demanda, arquivamento de documentação e assinatura digital:: Sankhya, Blip, InGaia(Kenlo), Go to, DocuSign, Bitrix, Coalize, Gmail e 5andar(contato com o inquilino via chat).'),
	(14, 21, 'Osteofix - Produtos para saúde', 'Auxiliar de produção', 'maio de 2019', 'agosto de 2019', 'Responsável por realizar o acabamento em Biomodelos impressos em ABS e PLA, acabamento, polimento, anodização em peças de Titânio e alumínio por meio de micro retifica e politriz de bancada industria. Plataformas utilizados para acompanhamentos de demanda, comunicação interna: Trello, Gmail.'),
	(15, 21, 'Comercial NG', 'Repositor', 'fevereiro de 2019', 'maio de 2019', 'Atendimento e auxílio aos clientes pessoalmente e telefone, demonstração de produto, organização, reposição dos produtos e controle de estoque.'),
	(16, 21, 'Codevasf', 'Assistente administrativo de escritório', 'novembro de 2016', 'novembro de 2018', 'Entrega e recebimento de documentos; Atendimento de telefone; Digitalização de documentos; Arquivar pastas; Anexar documentos nas pastas corretas;');

-- Copiando estrutura para tabela universidade_ranking.pp_formacoes
CREATE TABLE IF NOT EXISTS `pp_formacoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `aluno_id` int NOT NULL,
  `curso` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instituicao` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `periodo_inicio` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `periodo_fim` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `aluno_id` (`aluno_id`),
  CONSTRAINT `pp_formacoes_ibfk_1` FOREIGN KEY (`aluno_id`) REFERENCES `alunos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela universidade_ranking.pp_formacoes: ~3 rows (aproximadamente)
INSERT INTO `pp_formacoes` (`id`, `aluno_id`, `curso`, `instituicao`, `periodo_inicio`, `periodo_fim`) VALUES
	(4, 21, 'Bacharelado, Ciência da Computação', 'UniCEUB - Centro Universitário de Brasília', NULL, '2026'),
	(5, 21, 'Assistente administrativo, Administração e Negócios', 'CESAM-DF', NULL, NULL),
	(6, 21, 'Ensino Médio Completo', 'CEMTN', NULL, '2018');

-- Copiando estrutura para tabela universidade_ranking.pp_habilidades
CREATE TABLE IF NOT EXISTS `pp_habilidades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `aluno_id` int NOT NULL,
  `habilidade` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `aluno_id` (`aluno_id`),
  CONSTRAINT `pp_habilidades_ibfk_1` FOREIGN KEY (`aluno_id`) REFERENCES `alunos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela universidade_ranking.pp_habilidades: ~12 rows (aproximadamente)
INSERT INTO `pp_habilidades` (`id`, `aluno_id`, `habilidade`) VALUES
	(15, 21, 'WebLogic'),
	(16, 21, 'Ansible Tower'),
	(17, 21, 'Infrastructure Provisioning'),
	(18, 21, 'Web Designer'),
	(19, 21, 'Red Hat System Administration I'),
	(20, 21, '(RH124) - Ver. 9.0'),
	(21, 21, 'AWS Academy Graduate - AWS'),
	(22, 21, 'Academy Cloud Foundations'),
	(23, 21, 'Comunicação Escrita'),
	(24, 21, 'Postura e Imagem Profissional'),
	(25, 21, 'Enzio Albéfaro'),
	(26, 21, 'Analista de Infra DevSecOps | AWS GCP| Back-End | Graduando');

-- Copiando estrutura para tabela universidade_ranking.pp_idiomas
CREATE TABLE IF NOT EXISTS `pp_idiomas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `aluno_id` int NOT NULL,
  `idioma` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nivel` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `aluno_id` (`aluno_id`),
  CONSTRAINT `pp_idiomas_ibfk_1` FOREIGN KEY (`aluno_id`) REFERENCES `alunos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela universidade_ranking.pp_idiomas: ~1 rows (aproximadamente)
INSERT INTO `pp_idiomas` (`id`, `aluno_id`, `idioma`, `nivel`) VALUES
	(2, 21, 'Português', 'Nativo');

-- Copiando estrutura para tabela universidade_ranking.professores
CREATE TABLE IF NOT EXISTS `professores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idade` int DEFAULT NULL,
  `turno` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `campus` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela universidade_ranking.professores: ~5 rows (aproximadamente)
INSERT INTO `professores` (`id`, `nome`, `email`, `senha`, `idade`, `turno`, `campus`) VALUES
	(1, 'Roberto Campos', 'roberto.campos@uni.edu', 'r123', 45, 'Noturno', 'Asa Norte'),
	(2, 'Amanda Souza', 'amanda.souza@uni.edu', 'a123', 38, 'Noturno', 'Asa Norte'),
	(3, 'Paulo Freire', 'paulo.freire@uni.edu', 'p123', 50, 'Matutino', 'Taguatinga'),
	(4, 'Carla Dias', 'carla.dias@uni.edu', 'c123', 32, 'Noturno', 'Asa Norte'),
	(5, 'Jorge Amado', 'jorge.amado@uni.edu', 'j123', 60, 'Vespertino', 'Taguatinga');

-- Copiando estrutura para tabela universidade_ranking.projetos_aluno
CREATE TABLE IF NOT EXISTS `projetos_aluno` (
  `id` int NOT NULL AUTO_INCREMENT,
  `aluno_id` int NOT NULL,
  `titulo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_conclusao` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `aluno_id` (`aluno_id`),
  CONSTRAINT `projetos_aluno_ibfk_1` FOREIGN KEY (`aluno_id`) REFERENCES `alunos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela universidade_ranking.projetos_aluno: ~2 rows (aproximadamente)
INSERT INTO `projetos_aluno` (`id`, `aluno_id`, `titulo`, `descricao`, `data_conclusao`) VALUES
	(1, 21, 'Automação de Infraestrutura com Ansible', 'Projeto focado em provisionamento automatizado de servidores e configuração de ambientes utilizando Ansible e scripts de automação.', NULL),
	(2, 21, 'Deploy e Arquitetura em Cloud (AWS/GCP)', 'Implementação de esteira CI/CD para aplicações conteinerizadas, garantindo alta disponibilidade na nuvem e práticas de DevOps.', NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
