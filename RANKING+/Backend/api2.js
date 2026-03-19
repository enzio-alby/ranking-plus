// Estrutura de API com Node.js + Express + MySQL

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Configurações do Banco (Google Cloud SQL - IP público) com o banco universidade_ranking
const dbConfig = {
  host: 'IP', // IP do Cloud SQL
  user: 'user1',
  password: 'senha', // Senha 
  database: 'universidade_ranking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// ---  (log) ---
console.log('--------------------------------------');
console.log('TENTANDO CONECTAR NO BANCO COM:');
console.log('User:', dbConfig.user);
console.log('Senha:', dbConfig.password);
console.log('Host:', dbConfig.host);
console.log('--------------------------------------');

const db = mysql.createPool(dbConfig);

// --- LOGIN ---
app.post('/login', async (req, res) => {
  const { tipoUsuario, identificador, senha } = req.body; // identificador pode ser email ou matricula
  console.log('[LOGIN] Tentativa:', { tipoUsuario, identificador });
  
  try {
    let query, params;
    
    if (tipoUsuario === 'aluno') {
      // Busca por Email OU Matrícula
      query = `SELECT * FROM alunos WHERE email = ? OR matricula = ?`;
      params = [identificador, identificador];
    } else if (tipoUsuario === 'professor') {
      query = `SELECT * FROM professores WHERE email = ?`;
      params = [identificador];
    } else {
      return res.status(400).json({ sucesso: false, mensagem: 'Tipo inválido.' });
    }

    const [rows] = await db.execute(query, params);
    const user = rows[0];

    if (!user || user.senha !== senha) { // Nota: Em produção, use bcrypt para comparar senhas!
      return res.status(401).json({ sucesso: false, mensagem: 'Credenciais inválidas.' });
    }

    res.json({ sucesso: true, usuario: { id: user.id, nome: user.nome, tipo: tipoUsuario } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

// --- ROTAS DE ALUNOS ---

// Cadastro Completo de Aluno
app.post('/alunos', async (req, res) => {
  try {
    // Pegando TODOS os campos novos
    const { 
      nome, senha, matricula, email, curso, telefone, idade, turno, 
      cpf, data_nascimento, campus, semestre, periodo_curso, data_matricula 
    } = req.body;

    const [result] = await db.execute(
      `INSERT INTO alunos (
        nome, senha, matricula, email, curso, telefone, idade, turno, 
        cpf, data_nascimento, campus, semestre_atual, periodo_curso, data_matricula, situacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ativo')`,
      [nome, senha, matricula, email, curso, telefone, idade, turno, cpf, data_nascimento, campus, semestre, periodo_curso, data_matricula]
    );

    res.status(201).json({ id: result.insertId, mensagem: 'Aluno cadastrado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar Perfil Completo do Aluno
app.get('/alunos/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM alunos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Aluno não encontrado' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ROTAS DE DISCIPLINAS E BOLETIM ---

// Cadastrar Disciplina (Vinculada a um Professor)
app.post('/disciplinas', async (req, res) => {
  try {
    const { nome_materia, professor_id, sala, dia_semana, horario, campus } = req.body;
    
    const [result] = await db.execute(
      `INSERT INTO disciplinas (nome_materia, professor_id, sala, dia_semana, horario, campus) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nome_materia, professor_id, sala, dia_semana, horario, campus]
    );
    
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Matricular Aluno em Disciplina (Criar Boletim)
app.post('/boletim', async (req, res) => {
  try {
    const { aluno_id, disciplina_id } = req.body;
    // Inicia com 0 faltas e sem menção
    const [result] = await db.execute(
      `INSERT INTO boletim (aluno_id, disciplina_id, faltas, atividades_entregues) VALUES (?, ?, 0, 0)`,
      [aluno_id, disciplina_id]
    );
    res.status(201).json({ id: result.insertId, mensagem: 'Matrícula realizada!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROTA PODEROSA: Buscar Boletim Completo com Detalhes da Matéria
// Traz: Matéria, Professor, Sala, Horário, Notas, Faltas, Menção
app.get('/alunos/:id/boletim-detalhado', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        d.nome_materia,
        d.sala,
        d.dia_semana,
        d.horario,
        p.nome AS nome_professor,
        b.mencao,
        b.faltas,
        b.nota_avaliacao,
        b.atividades_entregues
      FROM boletim b
      JOIN disciplinas d ON b.disciplina_id = d.id
      LEFT JOIN professores p ON d.professor_id = p.id
      WHERE b.aluno_id = ?
    `, [req.params.id]);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Métricas Gerais do Aluno (Média de notas, Presença)
app.get('/alunos/:id/metricas', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        ROUND(AVG(
          CASE mencao
            WHEN 'SS' THEN 10 WHEN 'MS' THEN 8.5 WHEN 'MM' THEN 6.5
            WHEN 'MI' THEN 4 WHEN 'II' THEN 2 ELSE 0
          END
        ), 1) AS media_geral,
        SUM(atividades_entregues) AS total_atividades,
        SUM(faltas) AS total_faltas
      FROM boletim
      WHERE aluno_id = ?
    `, [req.params.id]);

    const metricas = rows[0];
    // Exemplo simples de cálculo de presença (base 100% - 2% por falta)
    metricas.presenca_geral = Math.max(0, 100 - (metricas.total_faltas * 2));
    
    res.json(metricas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ranking Geral
app.get('/ranking', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        a.id, 
        a.nome, 
        a.curso,
        ROUND(AVG(
          CASE b.mencao
            WHEN 'SS' THEN 10 WHEN 'MS' THEN 9 WHEN 'MM' THEN 7
            WHEN 'MI' THEN 5 ELSE 0
          END
        ), 2) AS pontuacao
      FROM alunos a
      JOIN boletim b ON a.id = b.aluno_id
      GROUP BY a.id, a.nome, a.curso
      ORDER BY pontuacao DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (error) {
    console.error("Erro no Ranking:", error); // Adiciona log para vermos o erro real
    res.status(500).json({ error: error.message });
  }
});

// Listar Professores
app.get('/professores', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, nome, email, campus FROM professores');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
