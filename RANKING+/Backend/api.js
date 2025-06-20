// Estrutura básica de API com Node.js + Express + MySQL

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Conexão com o banco de dados (Google Cloud SQL - IP público)
const db = mysql.createPool({
  host: 'ipbanco',           // IP público da instância
  user: 'user',                  // usuário do banco
  password: 'senha',         // senha do banco
  database: 'banco',          // nome do banco de dados
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ROTAS - Login
app.post('/login', async (req, res) => {
  const { tipoUsuario, cpf, email, senha } = req.body;
  console.log('[LOGIN] Iniciando login:', { tipoUsuario, cpf, email });
  try {
    let user, query, params;
    if (tipoUsuario === 'aluno') {
      query = `SELECT * FROM alunos WHERE ${cpf ? 'matricula = ?' : 'email = ?'}`;
      params = [cpf || email];
      console.log('[LOGIN] Query aluno:', query, params);
    } else if (tipoUsuario === 'professor') {
      query = `SELECT * FROM professores WHERE email = ?`;
      params = [email];
      console.log('[LOGIN] Query professor:', query, params);
    } else {
      console.log('[LOGIN] Tipo de usuário inválido');
      return res.status(400).json({ sucesso: false, mensagem: 'Tipo de usuário inválido.' });
    }

    const [rows] = await db.execute(query, params);
    user = rows[0];
    if (!user) {
      console.log('[LOGIN] Usuário não encontrado');
      return res.status(401).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
    }

if (senha !== user.senha) {
  console.log('[LOGIN] Senha incorreta');
  return res.status(401).json({ sucesso: false, mensagem: 'Senha incorreta.' });
}

    console.log('[LOGIN] Login bem-sucedido:', user.id);
    res.json({ sucesso: true, usuario: { id: user.id, nome: user.nome, tipo: tipoUsuario } });
  } catch (error) {
    console.error('[LOGIN] Erro:', error);
    res.status(500).json({ sucesso: false, mensagem: error.message });
  }
});

// ROTAS de cadastro - Alunos
app.post('/alunos', async (req, res) => {
  console.log('[CADASTRO ALUNO] Dados recebidos:', req.body);
  try {
    const { nome, senha, matricula, email, curso, turno, semestre, campus, idade, cpf, data_nascimento} = req.body;
    const [result] = await db.execute(
      `INSERT INTO alunos (nome, senha, matricula, email, curso, turno, semestre, campus, idade, cpf, data_nascimento)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome, senha, matricula, email, curso, turno, semestre, campus, idade, cpf, data_nascimento]
    );
    

    console.log('[CADASTRO ALUNO] Aluno cadastrado, ID:', result.insertId);
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('[CADASTRO ALUNO] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// // ROTAS de cadastro - Professores
// app.post('/professores', async (req, res) => {
//   console.log('[CADASTRO PROFESSOR] Dados recebidos:', req.body);
//   try {
//     const { nome, senha, email, curso, turno } = req.body;
//     const hashSenha = await bcrypt.hash(senha, 10);
//     const [result] = await db.execute(
//       `INSERT INTO professores (nome, senha, email, curso, turno)
//        VALUES (?, ?, ?, ?, ?)`,
//       [nome, hashSenha, email, curso, turno]
//     );
//     console.log('[CADASTRO PROFESSOR] Professor cadastrado, ID:', result.insertId);
//     res.status(201).json({ id: result.insertId });
//   } catch (error) {
//     console.error('[CADASTRO PROFESSOR] Erro:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// ROTAS - Materias
app.post('/materias', async (req, res) => {
  console.log('[MATERIAS] Dados recebidos:', req.body);
  try {
    const { nome, curso } = req.body;
    const [result] = await db.execute(
      `INSERT INTO materias (nome, curso) VALUES (?, ?)`,
      [nome, curso]
    );
    console.log('[MATERIAS] Matéria cadastrada, ID:', result.insertId);
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('[MATERIAS] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// ROTAS - Associa aluno à matéria
app.post('/alunos/:alunoId/materias/:materiaId', async (req, res) => {
  console.log('[ASSOCIA ALUNO-MATÉRIA] Params:', req.params, 'Body:', req.body);
  try {
    const { alunoId, materiaId } = req.params;
    const { faltas, mencao } = req.body;
    const [result] = await db.execute(
      `INSERT INTO alunos_materias (aluno_id, materia_id, faltas, mencao)
       VALUES (?, ?, ?, ?)`,
      [alunoId, materiaId, faltas, mencao]
    );
    console.log('[ASSOCIA ALUNO-MATÉRIA] Associação criada, ID:', result.insertId);
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('[ASSOCIA ALUNO-MATÉRIA] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// ROTAS - Associa professor à matéria
app.post('/professores/:professorId/materias/:materiaId', async (req, res) => {
  console.log('[ASSOCIA PROFESSOR-MATÉRIA] Params:', req.params);
  try {
    const { professorId, materiaId } = req.params;
    const [result] = await db.execute(
      `INSERT INTO professores_materias (professor_id, materia_id)
       VALUES (?, ?)`,
      [professorId, materiaId]
    );
    console.log('[ASSOCIA PROFESSOR-MATÉRIA] Associação criada, ID:', result.insertId);
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('[ASSOCIA PROFESSOR-MATÉRIA] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint GET para buscar aluno por ID
app.get('/alunos/:id', async (req, res) => {
  console.log('[GET ALUNO] ID:', req.params.id);
  try {
    const [rows] = await db.execute('SELECT * FROM alunos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      console.log('[GET ALUNO] Aluno não encontrado');
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }
    console.log('[GET ALUNO] Aluno encontrado:', rows[0]);
    res.json(rows[0]);
  } catch (error) {
    console.error('[GET ALUNO] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint GET para buscar aluno por ID
app.get('/professores/:id', async (req, res) => {
  console.log('[GET PROFESSOR] ID:', req.params.id);
  try {
    const [rows] = await db.execute('SELECT * FROM professores WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      console.log('[GET PROFESSOR] Professor não encontrado');
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }
    console.log('[GET PROFESSOR] Professor encontrado:', rows[0]);
    res.json(rows[0]);
  } catch (error) {
    console.error('[GET PROFESSOR] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint GET para buscar métricas do aluno
app.get('/alunos/:id/metricas', async (req, res) => {
  console.log('[GET MÉTRICAS] ID:', req.params.id);
  try {
    const [rows] = await db.execute(`
      SELECT 
        ROUND(AVG(
          CASE am.mencao
            WHEN 'MM' THEN 10
            WHEN 'MS' THEN 9
            WHEN 'SS' THEN 8
            WHEN 'MI' THEN 7
            WHEN 'II' THEN 6
            WHEN 'SR' THEN 0
            ELSE 0
          END
        ), 2) AS notas,
        ROUND(100 - (AVG(am.faltas) * 2), 2) AS presenca, 
        ROUND(
          SUM(
            CASE 
              WHEN am.mencao IN ('MM','MS','SS','MI') THEN 1
              ELSE 0
            END
          ) / NULLIF(COUNT(*),0) * 100, 2
        ) AS desempenho
      FROM alunos_materias am
      WHERE am.aluno_id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      console.log('[GET MÉTRICAS] Nenhuma métrica encontrada');
      return res.status(404).json({ error: 'Métricas não encontradas' });
    }
    console.log('[GET MÉTRICAS] Métricas encontradas:', rows[0]);
    res.json(rows[0]);
  } catch (error) {
    console.error('[GET MÉTRICAS] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para buscar horários das matérias do aluno
app.get('/alunos/:id/horarios', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        m.dia,
        m.nome AS materia,
        am.horario,
        am.turma,
        am.faltas,
        m.campus,
        p.nome AS professor
      FROM alunos_materias am
      JOIN materias m ON am.materia_id = m.id
      LEFT JOIN professores_materias pm ON pm.materia_id = m.id
      LEFT JOIN professores p ON pm.professor_id = p.id
      WHERE am.aluno_id = ?
      ORDER BY FIELD(m.dia, 'Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira')
    `, [req.params.id]);

    res.json(rows);
  } catch (error) {
    console.error('[GET HORARIOS] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para buscar faltas_mençoes do aluno
app.get('/alunos/:id/faltas-mencoes', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
        m.nome AS materia, 
        MAX(p.nome) AS professor, 
        am.faltas,
        am.mencao
      FROM alunos_materias am
      JOIN materias m ON am.materia_id = m.id
      LEFT JOIN professores_materias pm ON pm.materia_id = m.id
      LEFT JOIN professores p ON p.id = pm.professor_id
      WHERE am.aluno_id = ?
      GROUP BY m.id, am.faltas, am.mencao`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('[GET FALTAS-MENCOES] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});



app.get('/ranking/alunos', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        a.id,
        a.nome,
        MAX(a.turma) AS turma,
        a.curso,
        ROUND(AVG(
          CASE am.mencao
            WHEN 'MM' THEN 10
            WHEN 'MS' THEN 9
            WHEN 'SS' THEN 8
            WHEN 'MI' THEN 7
            WHEN 'II' THEN 6
            WHEN 'SR' THEN 0
            ELSE 0
          END
        ), 2) AS media_notas
      FROM alunos a
      JOIN alunos_materias am ON am.aluno_id = a.id
      GROUP BY a.id, a.nome, a.curso
      ORDER BY media_notas DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Avaliações por matéria (com troféus)
app.get('/alunos/:id/avaliacoes', async (req, res) => {
  try {
    const [rows] = await db.execute(`
    SELECT 
      m.nome AS materia,
      MAX(am.faltas) AS faltas,
      GROUP_CONCAT(am.mencao SEPARATOR ', ') AS mencoes,
      MAX(am.avaliacao_professor) AS avaliacao_professor
    FROM alunos_materias am
    JOIN materias m ON am.materia_id = m.id
    WHERE am.aluno_id = ?
    GROUP BY m.nome
  `, [req.params.id]);


    res.json(rows);
  } catch (error) {
    console.error('[GET /alunos/:id/avaliacoes] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para listar professores
app.get('/professores', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, nome, email FROM professores');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para listar matérias
app.get('/materias', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, nome FROM materias');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para listar relação professores-materias
app.get('/professores-materias', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT pm.professor_id, pm.materia_id
      FROM professores_materias pm
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000,'0.0.0.0', () => {
  console.log(`Conexão bem sucedida. Servidor rodando na porta ${PORT}`);
});

