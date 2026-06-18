// Estrutura de API com Node.js + Express + MySQL

const express    = require('express');
const path       = require('path');
const mysql      = require('mysql2/promise');
const nodemailer = require('nodemailer');
const multer     = require('multer');
const pdfParse   = require('pdf-parse');
const app  = express();

// Multer armazena o PDF do LinkedIn em memória (sem gravar em disco)
const _pdfUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const PORT = 4000;

// ─── CONFIGURAÇÃO DE E-MAIL (2FA) ────────────────────────────────────────────
// Para Gmail, gere um "App Password" (Senha de app) em:
const SMTP_USER = process.env.SMTP_USER || 'admin.rankingplus@gmail.com';  // ex: seuemail@gmail.com
const SMTP_PASS = process.env.SMTP_PASS || 'onxj repv qpzt ndem';  // ex: abcd efgh ijkl mnop

// DEV_MODE: sem credenciais configuradas, o OTP é impresso no console do servidor
const DEV_MODE = !SMTP_USER;

const _mailer = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:   587,
  secure: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS }
});

// Sessões OTP em memória  →  tempToken : { otp, usuarioId, tipo, nome, email, expiry }
const _otpSessions = new Map();

function _gerarOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function _mascarEmail(email) {
  if (!email) return '***@***.***';
  const [user, domain] = email.split('@');
  const vis = user.length > 2
    ? user[0] + '*'.repeat(Math.min(user.length - 2, 4)) + user[user.length - 1]
    : user[0] + '***';
  return `${vis}@${domain}`;
}

function _emailOtpHtml(nome, otp) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border-radius:8px;border:1px solid #e0e0e0;">
      <h2 style="color:#020122;margin-bottom:4px;">Ranking+</h2>
      <hr style="border-color:#eee;">
      <p>Olá, <strong>${nome}</strong>!</p>
      <p>Seu código de verificação de acesso é:</p>
      <div style="text-align:center;margin:28px 0;">
        <span style="display:inline-block;font-size:2.4rem;font-weight:bold;letter-spacing:0.45em;
                     color:#F4442E;background:#f8f8f8;padding:14px 28px;border-radius:8px;
                     border:2px dashed #F4442E;">${otp}</span>
      </div>
      <p style="color:#555;font-size:14px;">Este código expira em <strong>10 minutos</strong>.</p>
      <p style="color:#999;font-size:12px;">Se você não tentou fazer login, ignore este e-mail.</p>
    </div>
  `;
}

async function _enviarOtpEmail(email, nome, otp) {
  if (DEV_MODE) {
    _logOtpConsole(email, otp);
    return;
  }
  try {
    await _mailer.sendMail({
      from:    `"Ranking+" <${SMTP_USER}>`,
      to:      email,
      subject: `${otp} é seu código de verificação — Ranking+`,
      html:    _emailOtpHtml(nome, otp)
    });
    console.log(`[2FA EMAIL] Código enviado para ${email}`);
  } catch (err) {
    // Falha no SMTP — exibe no console para não bloquear o login
    console.error('[2FA EMAIL] Falha no envio, usando console como fallback:', err.message);
    _logOtpConsole(email, otp);
  }
}

function _logOtpConsole(email, otp) {
  console.log('\n╔══════════════════════════════════╗');
  console.log(`║  2FA OTP para ${email}`);
  console.log(`║  Código: ${otp}`);
  console.log('╚══════════════════════════════════╝\n');
}

app.use(express.json());

// Serve arquivos estáticos da raiz do projeto (html, css, js, images)
// Acesse via http://localhost:4000/html/areaaluno.html — necessário para VLibras funcionar
app.use(express.static(path.join(__dirname, '..')));

// CORS manual — garante cabeçalhos em toda resposta, inclusive erros e preflight
// Necessário porque file:// envia Origin: null, que o cors() padrão rejeita
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();
  console.log(`[${req.method}] ${req.path}`); // log de toda requisição que chega no Express
  next();
});

// Configurações do Banco LOCAL (Laragon / XAMPP)
const dbConfig = {
  host: 'localhost',      // Aponta para a sua própria máquina
  user: 'root',           // Usuário padrão do Laragon/MySQL local
  password: '',           // A senha padrão do Laragon é vazia (deixe assim '')
  database: 'universidade_ranking', // O banco que criamos no HeidiSQL
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// --- PROVA REAL (log) ---
console.log('--------------------------------------');
console.log('TENTANDO CONECTAR NO BANCO LOCAL COM:');
console.log('User:', dbConfig.user);
console.log('Senha:', dbConfig.password === '' ? '(vazia)' : '***');
console.log('Host:', dbConfig.host);
console.log('Banco:', dbConfig.database);
console.log('--------------------------------------');

const db = mysql.createPool(dbConfig);

// --- ROTAS DE LOGIN ---
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

    if (!user.email) {
      return res.status(400).json({ sucesso: false, mensagem: 'Conta sem e-mail cadastrado. Contate o suporte.' });
    }

    // Gera OTP e sessão temporária
    const otp        = _gerarOtp();
    const tempToken  = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const expiry     = Date.now() + 10 * 60 * 1000; // 10 min

    _otpSessions.set(tempToken, {
      otp, usuarioId: user.id, tipo: tipoUsuario,
      nome: user.nome, email: user.email, expiry
    });

    await _enviarOtpEmail(user.email, user.nome, otp);

    res.json({
      sucesso:         true,
      requerOTP:       true,
      tempToken,
      emailMascarado:  _mascarEmail(user.email)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

// POST /verificar-otp — valida o código e retorna sessão
app.post('/verificar-otp', async (req, res) => {
  const { tempToken, codigo } = req.body;
  if (!tempToken || !codigo) {
    return res.status(400).json({ sucesso: false, mensagem: 'Token e código são obrigatórios.' });
  }
  const sessao = _otpSessions.get(tempToken);
  if (!sessao) {
    return res.status(401).json({ sucesso: false, mensagem: 'Sessão expirada. Faça login novamente.' });
  }
  if (Date.now() > sessao.expiry) {
    _otpSessions.delete(tempToken);
    return res.status(401).json({ sucesso: false, mensagem: 'Código expirado. Faça login novamente.' });
  }
  if (codigo.trim() !== sessao.otp) {
    return res.status(401).json({ sucesso: false, mensagem: 'Código inválido.' });
  }
  _otpSessions.delete(tempToken);
  console.log(`[2FA OK] ${sessao.tipo} #${sessao.usuarioId} (${sessao.nome})`);
  res.json({ sucesso: true, usuario: { id: sessao.usuarioId, nome: sessao.nome, tipo: sessao.tipo } });
});

// POST /reenviar-otp — gera novo código para a mesma sessão
app.post('/reenviar-otp', async (req, res) => {
  const { tempToken } = req.body;
  if (!tempToken) {
    return res.status(400).json({ sucesso: false, mensagem: 'Token ausente.' });
  }
  const sessao = _otpSessions.get(tempToken);
  if (!sessao || Date.now() > sessao.expiry) {
    _otpSessions.delete(tempToken);
    return res.status(401).json({ sucesso: false, mensagem: 'Sessão expirada. Faça login novamente.' });
  }
  sessao.otp    = _gerarOtp();
  sessao.expiry = Date.now() + 10 * 60 * 1000;
  await _enviarOtpEmail(sessao.email, sessao.nome, sessao.otp);
  res.json({ sucesso: true, mensagem: 'Novo código enviado com sucesso.' });
});

// --- ROTAS DE ALUNOS ---

// Cadastro Completo de Aluno
app.post('/alunos', async (req, res) => {
  try {
    const {
      nome, senha, matricula, email, curso,
      telefone, turno, cpf, data_nascimento,
      campus, semestre, periodo_curso, data_matricula,
      github, linkedin
    } = req.body;

    // Normaliza undefined → null para o mysql2 não reclamar
    const n = v => (v === undefined || v === '') ? null : v;

    const [result] = await db.execute(
      `INSERT INTO alunos (
        nome, senha, matricula, email, curso, telefone, turno,
        cpf, data_nascimento, campus, semestre_atual, periodo_curso,
        data_matricula, github, linkedin, situacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ativo')`,
      [n(nome), n(senha), n(matricula), n(email), n(curso),
       n(telefone), n(turno), n(cpf), n(data_nascimento),
       n(campus), n(semestre), n(periodo_curso), n(data_matricula),
       n(github), n(linkedin)]
    );

    res.status(201).json({ id: result.insertId, mensagem: 'Aluno cadastrado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar dados do Aluno (inclui mostrar_no_ranking)
app.put('/alunos/:id', async (req, res) => {
  try {
    const allowed = ['nome','email','telefone','data_nascimento','permitir_exibicao_ranking','semestre_atual',
                     'turno','campus','endereco_rua','endereco_numero','endereco_complemento',
                     'endereco_bairro','endereco_cep','endereco_cidade','endereco_estado',
                     'contato_emergencia_nome','contato_emergencia_telefone',
                     'contato_emergencia_parentesco','contato_emergencia_email',
                     'github','linkedin'];
    const sets = [];
    const vals = [];
    for (const field of allowed) {
      if (field in req.body) {
        sets.push(`${field} = ?`);
        vals.push(req.body[field]);
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    vals.push(req.params.id);
    await db.execute(`UPDATE alunos SET ${sets.join(', ')} WHERE id = ?`, vals);
    res.json({ mensagem: 'Aluno atualizado com sucesso.' });
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

// Métricas Gerais do Aluno (Média de notas, Presença, total de atividades entregues)
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
        COALESCE(a.permitir_exibicao_ranking, 1) AS permitir_exibicao_ranking,
        ROUND(AVG(
          CASE b.mencao
            WHEN 'SS' THEN 10 WHEN 'MS' THEN 9 WHEN 'MM' THEN 7
            WHEN 'MI' THEN 5 ELSE 0
          END
        ), 2) AS pontuacao
      FROM alunos a
      JOIN boletim b ON a.id = b.aluno_id
      GROUP BY a.id, a.nome, a.curso, a.permitir_exibicao_ranking
      ORDER BY 
        pontuacao DESC, 
        SUM(b.faltas) ASC, 
        SUM(b.atividades_entregues) DESC, 
        a.nome ASC
      LIMIT 50
    `);
    res.json(rows);
  } catch (error) {
    console.error("Erro no Ranking:", error); // Adiciona log para vermos o erro real
    res.status(500).json({ error: error.message });
  }
});

// Ranking detalhado com filtros opcionais (?curso=&semestre=&disciplina_id=)
app.get('/ranking/detalhado', async (req, res) => {
  try {
    const { curso, semestre, disciplina_id } = req.query;
    const conditions = [];
    const params = [];

    if (curso)        { conditions.push('a.curso = ?');           params.push(curso); }
    if (semestre)     { conditions.push('a.semestre_atual = ?');  params.push(semestre); }
    if (disciplina_id){ conditions.push('b.disciplina_id = ?');   params.push(disciplina_id); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [rows] = await db.execute(`
      SELECT
        a.id,
        a.nome,
        a.curso,
        a.semestre_atual,
        COALESCE(a.permitir_exibicao_ranking, 1) AS permitir_exibicao_ranking,
        ROUND(AVG(
          CASE b.mencao
            WHEN 'SS' THEN 10 WHEN 'MS' THEN 9 WHEN 'MM' THEN 7
            WHEN 'MI' THEN 5 ELSE 0
          END
        ), 2) AS pontuacao,
        GREATEST(0, ROUND(100 - SUM(b.faltas) * 2, 0)) AS frequencia,
        SUM(b.atividades_entregues) AS total_atividades
      FROM alunos a
      JOIN boletim b ON a.id = b.aluno_id
      ${where}
      GROUP BY a.id, a.nome, a.curso, a.semestre_atual, a.permitir_exibicao_ranking
      ORDER BY 
        pontuacao DESC,
        frequencia DESC,
        total_atividades DESC,
        a.nome ASC
    `, params);

    res.json({ total: rows.length, alunos: rows });
  } catch (error) {
    console.error('Erro no Ranking Detalhado:', error);
    res.status(500).json({ error: error.message });
  }
});

// Filtros disponíveis (cursos, semestres, disciplinas)
app.get('/filtros', async (req, res) => {
  try {
    const [cursos]      = await db.execute('SELECT DISTINCT curso FROM alunos WHERE curso IS NOT NULL ORDER BY curso');
    const [semestres]   = await db.execute('SELECT DISTINCT semestre_atual FROM alunos WHERE semestre_atual IS NOT NULL ORDER BY semestre_atual');
    const [disciplinas] = await db.execute('SELECT id, nome_materia FROM disciplinas ORDER BY nome_materia');
    res.json({
      cursos:      cursos.map(r => r.curso),
      semestres:   semestres.map(r => r.semestre_atual),
      disciplinas
    });
  } catch (error) {
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

// Buscar Professor por ID
app.get('/professores/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM professores WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Professor não encontrado' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disciplinas do professor (turmas)
app.get('/professores/:id/disciplinas', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        d.id,
        d.nome_materia,
        d.sala,
        d.dia_semana,
        d.horario,
        d.campus,
        COUNT(DISTINCT b.aluno_id) AS total_alunos
      FROM disciplinas d
      LEFT JOIN boletim b ON b.disciplina_id = d.id
      WHERE d.professor_id = ?
      GROUP BY d.id, d.nome_materia, d.sala, d.dia_semana, d.horario, d.campus
      ORDER BY d.nome_materia
    `, [req.params.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alunos de uma disciplina específica do professor
app.get('/professores/:profId/disciplinas/:discId/alunos', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        a.id,
        a.nome,
        a.curso,
        a.matricula,
        a.semestre_atual,
        b.mencao,
        b.faltas,
        b.nota_avaliacao,
        b.atividades_entregues,
        GREATEST(0, 100 - b.faltas * 2) AS frequencia
      FROM boletim b
      JOIN alunos a ON b.aluno_id = a.id
      JOIN disciplinas d ON b.disciplina_id = d.id
      WHERE b.disciplina_id = ? AND d.professor_id = ?
      ORDER BY b.mencao ASC, a.nome ASC
    `, [req.params.discId, req.params.profId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Todos os alunos do professor (todas as disciplinas)
app.get('/professores/:id/alunos', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT DISTINCT
        a.id,
        a.nome,
        a.curso,
        a.matricula,
        a.semestre_atual,
        a.situacao,
        GROUP_CONCAT(DISTINCT d.nome_materia ORDER BY d.nome_materia SEPARATOR ', ') AS disciplinas,
        ROUND(AVG(
          CASE b.mencao
            WHEN 'SS' THEN 10 WHEN 'MS' THEN 9 WHEN 'MM' THEN 7
            WHEN 'MI' THEN 5 ELSE 0
          END
        ), 1) AS media,
        GREATEST(0, ROUND(100 - AVG(b.faltas) * 2, 0)) AS frequencia,
        SUM(b.atividades_entregues) AS atividades_entregues
      FROM boletim b
      JOIN alunos a ON b.aluno_id = a.id
      JOIN disciplinas d ON b.disciplina_id = d.id
      WHERE d.professor_id = ?
      GROUP BY a.id, a.nome, a.curso, a.matricula, a.semestre_atual, a.situacao
      ORDER BY a.nome
    `, [req.params.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estatísticas do professor para o dashboard
app.get('/professores/:id/stats', async (req, res) => {
  try {
    const [discRows] = await db.execute(
      'SELECT COUNT(*) AS total FROM disciplinas WHERE professor_id = ?', [req.params.id]
    );
    const [alunosRows] = await db.execute(`
      SELECT COUNT(DISTINCT b.aluno_id) AS total
      FROM boletim b
      JOIN disciplinas d ON b.disciplina_id = d.id
      WHERE d.professor_id = ?
    `, [req.params.id]);
    const [mediaRows] = await db.execute(`
      SELECT
        ROUND(AVG(
          CASE b.mencao
            WHEN 'SS' THEN 10 WHEN 'MS' THEN 9 WHEN 'MM' THEN 7
            WHEN 'MI' THEN 5 ELSE 0
          END
        ), 1) AS media_geral,
        GREATEST(0, ROUND(100 - AVG(b.faltas) * 2, 0)) AS presenca_media
      FROM boletim b
      JOIN disciplinas d ON b.disciplina_id = d.id
      WHERE d.professor_id = ?
    `, [req.params.id]);
    res.json({
      turmas:        discRows[0].total,
      alunos:        alunosRows[0].total,
      media_geral:   mediaRows[0].media_geral   ?? '—',
      presenca_media: mediaRows[0].presenca_media ?? '—'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── STATS POR DISCIPLINA (para gráficos do dashboard do professor) ─────────
app.get('/professores/:id/disciplinas/stats', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        d.id,
        d.nome_materia,
        COUNT(b.aluno_id)  AS total_alunos,
        ROUND(AVG(
          CASE b.mencao
            WHEN 'SS' THEN 10 WHEN 'MS' THEN 9 WHEN 'MM' THEN 7
            WHEN 'MI' THEN 5  WHEN 'II' THEN 2  ELSE 0
          END
        ), 1) AS media,
        GREATEST(0, ROUND(100 - AVG(b.faltas) * 2, 0)) AS frequencia,
        SUM(CASE WHEN b.mencao = 'SS' THEN 1 ELSE 0 END) AS cnt_ss,
        SUM(CASE WHEN b.mencao = 'MS' THEN 1 ELSE 0 END) AS cnt_ms,
        SUM(CASE WHEN b.mencao = 'MM' THEN 1 ELSE 0 END) AS cnt_mm,
        SUM(CASE WHEN b.mencao = 'MI' THEN 1 ELSE 0 END) AS cnt_mi,
        SUM(CASE WHEN b.mencao = 'II' THEN 1 ELSE 0 END) AS cnt_ii
      FROM disciplinas d
      LEFT JOIN boletim b ON d.id = b.disciplina_id
      WHERE d.professor_id = ?
      GROUP BY d.id, d.nome_materia
      ORDER BY d.nome_materia
    `, [req.params.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PERFIL PROFISSIONAL DO ALUNO (GitHub + LinkedIn) ────────────────────────
app.get('/alunos/:id/profissional', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT nome, curso, github, linkedin FROM alunos WHERE id = ?', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Aluno não encontrado' });
    const aluno = rows[0];

    // ── GitHub: busca repositórios públicos ───────────────────────────────
    let repos = [];
    if (aluno.github) {
      // Extrai username da URL (https://github.com/user) ou usa como username direto
      const ghUser = aluno.github.replace(/\/$/, '').split('/').pop();
      try {
        const ghRes = await fetch(
          `https://api.github.com/users/${ghUser}/repos?sort=updated&per_page=3`,
          { headers: { 'User-Agent': 'RankingPlus/1.0', 'Accept': 'application/vnd.github.v3+json' } }
        );
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          repos = ghData.map(r => ({
            nome:       r.name,
            descricao:  r.description || 'Sem descrição',
            linguagem:  r.language || 'N/A',
            stars:      r.stargazers_count,
            url:        r.html_url,
            atualizado: r.updated_at
          }));
        }
      } catch(_) { /* GitHub offline ou username inválido */ }
    }

    // ── LinkedIn: mock baseado no curso ───────────────────────────────────
    const resumoMap = {
      'Ciência da Computação':            'Estudante apaixonado por algoritmos, estruturas de dados e desenvolvimento de software.',
      'Engenharia de Software':           'Focado em boas práticas de engenharia, testes e entrega de software de qualidade.',
      'Sistemas de Informação':           'Interessado em integração entre tecnologia e negócios, com foco em análise de sistemas.',
      'Análise e Desenvolvimento de Sistemas': 'Desenvolvedor Full Stack em formação, com experiência em projetos práticos.',
      'Redes de Computadores':            'Especialista em infraestrutura, segurança de redes e protocolos de comunicação.',
      'Inteligência Artificial':          'Entusiasta de Machine Learning, Deep Learning e aplicações de IA no mundo real.',
      'Gestão de TI':                     'Gestão de projetos ágeis e alinhamento de TI com objetivos estratégicos de negócio.'
    };
    const resumoLinkedIn = resumoMap[aluno.curso] || `Estudante de ${aluno.curso || 'Tecnologia'} em busca de oportunidades no mercado.`;

    res.json({
      nome:    aluno.nome,
      curso:   aluno.curso,
      github:  aluno.github  || null,
      linkedin: aluno.linkedin || null,
      repos,
      linkedin_resumo: resumoLinkedIn
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PORTAL DE TALENTOS ───────────────────────────────────────────────────────
app.get('/talentos/buscar', async (req, res) => {
  try {
    const { curso, semestre_min, habilidade } = req.query;
    const conditions = ["a.permitir_exibicao_ranking = 1"];
    const params     = [];

    if (curso)        { conditions.push('a.curso = ?');              params.push(curso); }
    if (semestre_min) { conditions.push('a.semestre_atual >= ?');    params.push(parseInt(semestre_min)); }

    // Habilidade: filtra alunos com média > 8.5 na disciplina que contenha o termo
    let havingClause = '';
    if (habilidade) {
      conditions.push("d.nome_materia LIKE ?");
      params.push(`%${habilidade}%`);
      havingClause = 'HAVING media_disciplina > 8.5';
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const [rows] = await db.execute(`
      SELECT
        a.id,
        a.nome,
        a.curso,
        a.semestre_atual,
        a.github,
        a.linkedin,
        d.nome_materia AS disciplina_destaque,
        ROUND(AVG(
          CASE b.mencao
            WHEN 'SS' THEN 10 WHEN 'MS' THEN 9 WHEN 'MM' THEN 7
            WHEN 'MI' THEN 5 ELSE 0
          END
        ), 2) AS media_disciplina
      FROM alunos a
      JOIN boletim b    ON a.id = b.aluno_id
      JOIN disciplinas d ON b.disciplina_id = d.id
      ${where}
      GROUP BY a.id, a.nome, a.curso, a.semestre_atual, a.github, a.linkedin, d.nome_materia
      ${havingClause}
      ORDER BY media_disciplina DESC
    `, params);

    // Agrupa por aluno — pontos fortes = disciplinas com nota > 8.5
    const alunosMap = {};
    rows.forEach(r => {
      if (!alunosMap[r.id]) {
        alunosMap[r.id] = {
          id:            r.id,
          nome:          r.nome,
          curso:         r.curso,
          semestre:      r.semestre_atual,
          github:        r.github,
          linkedin:      r.linkedin,
          pontos_fortes: []
        };
      }
      if (r.media_disciplina >= 8.5) {
        alunosMap[r.id].pontos_fortes.push({
          disciplina: r.disciplina_destaque,
          media:      r.media_disciplina
        });
      }
    });

    const talentos = Object.values(alunosMap).filter(a => a.pontos_fortes.length > 0 || !habilidade);
    res.json({ total: talentos.length, talentos });
  } catch (error) {
    console.error('Erro /talentos/buscar:', error);
    res.status(500).json({ error: error.message });
  }
});

// Filtros para o Portal de Talentos
app.get('/talentos/filtros', async (req, res) => {
  try {
    const [cursos]    = await db.execute('SELECT DISTINCT curso FROM alunos WHERE curso IS NOT NULL AND permitir_exibicao_ranking = 1 ORDER BY curso');
    const [semestres] = await db.execute('SELECT DISTINCT semestre_atual FROM alunos WHERE semestre_atual IS NOT NULL AND permitir_exibicao_ranking = 1 ORDER BY semestre_atual');
    const [discs]     = await db.execute('SELECT DISTINCT nome_materia FROM disciplinas ORDER BY nome_materia');
    res.json({
      cursos:     cursos.map(r => r.curso),
      semestres:  semestres.map(r => r.semestre_atual),
      habilidades: discs.map(r => r.nome_materia)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── DOMÍNIOS (dropdowns para frontend) ──────────────────────────────────────
app.get('/dom/setores', async (req, res) => {
  try { const [r] = await db.execute('SELECT * FROM dom_setores ORDER BY nome'); res.json(r); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/dom/areas-foco', async (req, res) => {
  try { const [r] = await db.execute('SELECT * FROM dom_areas_foco ORDER BY nome'); res.json(r); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/dom/tipos-vaga', async (req, res) => {
  try { const [r] = await db.execute('SELECT * FROM dom_tipos_vaga ORDER BY nome'); res.json(r); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── EMPRESAS — CADASTRO ──────────────────────────────────────────────────────
app.post('/empresas/register', async (req, res) => {
  try {
    const { razao_social, nome_fantasia, cnpj, setor_id, email_corporativo, telefone, site_empresa, linkedin_empresa, senha } = req.body;
    const n = v => (v === undefined || v === '') ? null : v;
    const [result] = await db.execute(
      `INSERT INTO empresas (razao_social, nome_fantasia, cnpj, setor_id, email_corporativo, telefone, site_empresa, linkedin_empresa, senha)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [n(razao_social), n(nome_fantasia), n(cnpj), n(setor_id), n(email_corporativo), n(telefone), n(site_empresa), n(linkedin_empresa), n(senha)]
    );
    res.status(201).json({ id: result.insertId, mensagem: 'Empresa cadastrada com sucesso!' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'CNPJ ou e-mail já cadastrado.' });
    res.status(500).json({ error: error.message });
  }
});

// ─── EMPRESAS — LOGIN ─────────────────────────────────────────────────────────
app.post('/empresas/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const [rows] = await db.execute('SELECT * FROM empresas WHERE email_corporativo = ?', [email]);
    const empresa = rows[0];
    if (!empresa || empresa.senha !== senha) {
      return res.status(401).json({ sucesso: false, mensagem: 'Credenciais inválidas.' });
    }
    const { senha: _, ...pub } = empresa;
    const [setorRows] = await db.execute('SELECT nome FROM dom_setores WHERE id = ?', [empresa.setor_id || 0]);
    pub.setor_nome = setorRows[0]?.nome || '';
    const [intRows] = await db.execute(`
      SELECT ei.*, af.nome AS area_foco_nome, tv.nome AS tipo_vaga_nome
      FROM empresa_interesses ei
      LEFT JOIN dom_areas_foco af ON ei.area_foco_id = af.id
      LEFT JOIN dom_tipos_vaga tv ON ei.tipo_vaga_id = tv.id
      WHERE ei.empresa_id = ?
    `, [empresa.id]);
    pub.interesses = intRows;
    res.json({ sucesso: true, empresa: pub });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

// ─── EMPRESAS — GET por ID ────────────────────────────────────────────────────
app.get('/empresas/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT e.*, s.nome AS setor_nome FROM empresas e
       LEFT JOIN dom_setores s ON e.setor_id = s.id WHERE e.id = ?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Empresa não encontrada' });
    const { senha: _, ...pub } = rows[0];
    const [intRows] = await db.execute(`
      SELECT ei.*, af.nome AS area_foco_nome, tv.nome AS tipo_vaga_nome
      FROM empresa_interesses ei
      LEFT JOIN dom_areas_foco af ON ei.area_foco_id = af.id
      LEFT JOIN dom_tipos_vaga tv ON ei.tipo_vaga_id = tv.id
      WHERE ei.empresa_id = ?
    `, [req.params.id]);
    pub.interesses = intRows;
    res.json(pub);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── EMPRESAS — ATUALIZAR INTERESSES ─────────────────────────────────────────
app.put('/empresas/:id/interesses', async (req, res) => {
  try {
    const { area_foco_id, tipo_vaga_id, curso_preferido, semestre_minimo } = req.body;
    const n = v => (v === undefined || v === '') ? null : v;
    await db.execute('DELETE FROM empresa_interesses WHERE empresa_id = ?', [req.params.id]);
    await db.execute(
      `INSERT INTO empresa_interesses (empresa_id, area_foco_id, tipo_vaga_id, curso_preferido, semestre_minimo)
       VALUES (?, ?, ?, ?, ?)`,
      [req.params.id, n(area_foco_id), n(tipo_vaga_id), n(curso_preferido), n(semestre_minimo) || 1]
    );
    res.json({ mensagem: 'Interesses atualizados com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── INTERAÇÕES — REGISTRAR VISUALIZAÇÃO ─────────────────────────────────────
app.post('/interacoes', async (req, res) => {
  try {
    const { empresa_id, aluno_id, tipo_interacao = 'VISUALIZACAO' } = req.body;
    if (!empresa_id || !aluno_id) return res.status(400).json({ error: 'empresa_id e aluno_id são obrigatórios.' });
    const [result] = await db.execute(
      `INSERT INTO interacoes_empresas_alunos (empresa_id, aluno_id, tipo_interacao) VALUES (?, ?, ?)`,
      [empresa_id, aluno_id, tipo_interacao]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── ALUNO — EMPRESAS QUE VISUALIZARAM O PERFIL ──────────────────────────────
app.get('/alunos/:id/visualizacoes', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        e.id AS empresa_id,
        e.razao_social,
        e.nome_fantasia,
        s.nome AS setor,
        e.linkedin_empresa,
        e.email_corporativo,
        e.site_empresa,
        tv.nome AS tipo_vaga,
        af.nome AS area_foco,
        ei.semestre_minimo,
        MAX(i.data_interacao) AS ultima_visualizacao,
        COUNT(i.id) AS total_visualizacoes
      FROM interacoes_empresas_alunos i
      JOIN empresas e ON i.empresa_id = e.id
      LEFT JOIN dom_setores s ON e.setor_id = s.id
      LEFT JOIN empresa_interesses ei ON ei.empresa_id = e.id
      LEFT JOIN dom_areas_foco af ON ei.area_foco_id = af.id
      LEFT JOIN dom_tipos_vaga tv ON ei.tipo_vaga_id = tv.id
      WHERE i.aluno_id = ?
      GROUP BY e.id, e.razao_social, e.nome_fantasia, s.nome, e.linkedin_empresa,
               e.email_corporativo, e.site_empresa, tv.nome, af.nome, ei.semestre_minimo
      ORDER BY ultima_visualizacao DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── TALENTOS — PERFIL COMPLETO PARA EMPRESA ─────────────────────────────────
app.get('/talentos/aluno/:id/perfil', async (req, res) => {
  try {
    const [alunoRows] = await db.execute(
      'SELECT * FROM alunos WHERE id = ? AND permitir_exibicao_ranking = 1', [req.params.id]
    );
    if (!alunoRows.length) return res.status(404).json({ error: 'Perfil não disponível.' });
    const aluno = alunoRows[0];

    // Métricas
    const [metRows] = await db.execute(`
      SELECT
        ROUND(AVG(CASE mencao WHEN 'SS' THEN 10 WHEN 'MS' THEN 8.5 WHEN 'MM' THEN 6.5
                              WHEN 'MI' THEN 4   WHEN 'II' THEN 2   ELSE 0 END), 1) AS media_geral,
        SUM(atividades_entregues) AS total_atividades,
        SUM(faltas) AS total_faltas,
        COUNT(*) AS total_disciplinas,
        SUM(CASE WHEN mencao='SS' THEN 1 ELSE 0 END) AS cnt_ss,
        SUM(CASE WHEN mencao='MS' THEN 1 ELSE 0 END) AS cnt_ms,
        SUM(CASE WHEN mencao='MM' THEN 1 ELSE 0 END) AS cnt_mm,
        SUM(CASE WHEN mencao='MI' THEN 1 ELSE 0 END) AS cnt_mi,
        SUM(CASE WHEN mencao='II' THEN 1 ELSE 0 END) AS cnt_ii
      FROM boletim WHERE aluno_id = ?
    `, [req.params.id]);

    // Posição no ranking
    const [rankRows] = await db.execute(`
      SELECT COUNT(*) + 1 AS posicao FROM (
        SELECT a.id, AVG(CASE b.mencao WHEN 'SS' THEN 10 WHEN 'MS' THEN 9 WHEN 'MM' THEN 7 WHEN 'MI' THEN 5 ELSE 0 END) AS pts
        FROM alunos a JOIN boletim b ON a.id = b.aluno_id GROUP BY a.id
        HAVING pts > (
          SELECT COALESCE(AVG(CASE mencao WHEN 'SS' THEN 10 WHEN 'MS' THEN 9 WHEN 'MM' THEN 7 WHEN 'MI' THEN 5 ELSE 0 END),0)
          FROM boletim WHERE aluno_id = ?
        )
      ) sub
    `, [req.params.id]);

    // Disciplinas de destaque
    const [discRows] = await db.execute(`
      SELECT d.nome_materia,
        ROUND(CASE b.mencao WHEN 'SS' THEN 10 WHEN 'MS' THEN 8.5 WHEN 'MM' THEN 6.5
                            WHEN 'MI' THEN 4   WHEN 'II' THEN 2   ELSE 0 END, 1) AS nota,
        b.mencao
      FROM boletim b JOIN disciplinas d ON b.disciplina_id = d.id
      WHERE b.aluno_id = ? AND b.mencao IN ('SS','MS')
      ORDER BY nota DESC LIMIT 6
    `, [req.params.id]);

    const metricas = metRows[0];
    metricas.frequencia = Math.max(0, 100 - (metricas.total_faltas || 0) * 2);

    res.json({
      id: aluno.id, nome: aluno.nome, curso: aluno.curso,
      semestre: aluno.semestre_atual, github: aluno.github, linkedin: aluno.linkedin,
      metricas, posicao_ranking: rankRows[0]?.posicao || '—',
      disciplinas_destaque: discRows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PROFESSOR — EDITAR LANÇAMENTOS DO BOLETIM ───────────────────────────────
app.get('/professores/:profId/lancamentos', async (req, res) => {
  try {
    const { discId } = req.query;
    const conditions = ['d.professor_id = ?'];
    const params = [req.params.profId];
    if (discId) { conditions.push('b.disciplina_id = ?'); params.push(discId); }
    const [rows] = await db.execute(`
      SELECT
        b.id AS boletim_id, a.id AS aluno_id, a.nome, a.matricula,
        d.id AS disciplina_id, d.nome_materia,
        b.mencao, b.faltas, b.nota_avaliacao, b.atividades_entregues, b.participacao_nota
      FROM boletim b
      JOIN alunos a ON b.aluno_id = a.id
      JOIN disciplinas d ON b.disciplina_id = d.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY d.nome_materia, a.nome
    `, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/professores/:profId/disciplinas/:discId/alunos/:alunoId/boletim', async (req, res) => {
  try {
    const allowed = ['mencao', 'faltas', 'nota_avaliacao', 'atividades_entregues', 'participacao_nota'];
    const sets = [], vals = [];
    for (const f of allowed) {
      if (f in req.body) { sets.push(`b.${f} = ?`); vals.push(req.body[f] === '' ? null : req.body[f]); }
    }
    if (!sets.length) return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    vals.push(req.params.alunoId, req.params.discId, req.params.profId);
    const [result] = await db.execute(
      `UPDATE boletim b JOIN disciplinas d ON b.disciplina_id = d.id
       SET ${sets.join(', ')}
       WHERE b.aluno_id = ? AND b.disciplina_id = ? AND d.professor_id = ?`,
      vals
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Lançamento não encontrado ou sem permissão.' });
    res.json({ mensagem: 'Lançamento atualizado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── ESTATÍSTICAS PÚBLICAS ────────────────────────────────────────────────────
app.get('/stats', async (_req, res) => {
  try {
    const [[alunoRow]]  = await db.execute('SELECT COUNT(*) AS total FROM alunos');
    const [[cursoRow]]  = await db.execute('SELECT COUNT(DISTINCT curso) AS total FROM alunos WHERE curso IS NOT NULL AND curso != ""');
    const [[profRow]]   = await db.execute('SELECT COUNT(*) AS total FROM professores');
    let empresaTotal = 0;
    try {
      const [[empRow]] = await db.execute('SELECT COUNT(*) AS total FROM empresas');
      empresaTotal = empRow.total;
    } catch (_) {}
    res.json({
      total_alunos:      alunoRow.total,
      total_cursos:      cursoRow.total,
      total_professores: profRow.total,
      total_empresas:    empresaTotal
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MÓDULO ADMIN ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Tokens de sessão em memória: Map< token, { adminId, nome } >
// Simples e suficiente para projeto acadêmico sem JWT
const _adminSessions = new Map();

function _gerarToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Middleware de proteção — exige header  X-Admin-Token: <token>
function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || !_adminSessions.has(token)) {
    return res.status(401).json({ sucesso: false, mensagem: 'Acesso negado. Token admin inválido.' });
  }
  req.adminSession = _adminSessions.get(token);
  next();
}

// POST /admin/login
app.post('/admin/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ sucesso: false, mensagem: 'E-mail e senha são obrigatórios.' });
  }
  try {
    const [rows] = await db.execute(
      'SELECT id, nome, email, senha FROM administradores WHERE email = ?',
      [email]
    );
    const admin = rows[0];
    if (!admin || admin.senha !== senha) {
      return res.status(401).json({ sucesso: false, mensagem: 'Credenciais inválidas.' });
    }
    const token = _gerarToken();
    _adminSessions.set(token, { adminId: admin.id, nome: admin.nome });
    console.log(`[ADMIN LOGIN] ${admin.nome} (id=${admin.id})`);
    res.json({ sucesso: true, token, admin: { id: admin.id, nome: admin.nome } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

// POST /admin/logout
app.post('/admin/logout', adminAuth, (req, res) => {
  const token = req.headers['x-admin-token'];
  _adminSessions.delete(token);
  res.json({ sucesso: true });
});

// GET /admin/empresas  — lista todas as empresas para o painel
app.get('/admin/empresas', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT e.id, e.razao_social, e.nome_fantasia, e.email_corporativo, e.cnpj,
              s.nome AS setor_nome
       FROM empresas e
       LEFT JOIN dom_setores s ON e.setor_id = s.id
       ORDER BY e.razao_social`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/impersonate/empresa/:id
// Retorna EXATAMENTE o mesmo payload do /empresas/login
app.post('/admin/impersonate/empresa/:id', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM empresas WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ sucesso: false, mensagem: 'Empresa não encontrada.' });
    const empresa = rows[0];
    const { senha: _, ...pub } = empresa;
    const [setorRows] = await db.execute('SELECT nome FROM dom_setores WHERE id = ?', [empresa.setor_id || 0]);
    pub.setor_nome = setorRows[0]?.nome || '';
    const [intRows] = await db.execute(`
      SELECT ei.*, af.nome AS area_foco_nome, tv.nome AS tipo_vaga_nome
      FROM empresa_interesses ei
      LEFT JOIN dom_areas_foco af ON ei.area_foco_id = af.id
      LEFT JOIN dom_tipos_vaga tv ON ei.tipo_vaga_id = tv.id
      WHERE ei.empresa_id = ?
    `, [empresa.id]);
    pub.interesses = intRows;
    console.log(`[ADMIN IMPERSONATE] ${req.adminSession.nome} → Empresa #${empresa.id} (${empresa.razao_social})`);
    res.json({ sucesso: true, empresa: pub });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

// GET /admin/alunos  — lista todos os alunos para o painel
app.get('/admin/alunos', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, nome, email, matricula, curso, semestre_atual AS semestre, situacao
       FROM alunos
       ORDER BY nome`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/professores  — lista todos os professores para o painel
app.get('/admin/professores', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, nome, email, campus
       FROM professores
       ORDER BY nome`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/impersonate/aluno/:id
// Retorna EXATAMENTE o mesmo payload do /login normal
app.post('/admin/impersonate/aluno/:id', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, nome FROM alunos WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ sucesso: false, mensagem: 'Aluno não encontrado.' });
    const aluno = rows[0];
    console.log(`[ADMIN IMPERSONATE] ${req.adminSession.nome} → Aluno #${aluno.id} (${aluno.nome})`);
    res.json({ sucesso: true, usuario: { id: aluno.id, nome: aluno.nome, tipo: 'aluno' } });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

// POST /admin/impersonate/professor/:id
// Retorna EXATAMENTE o mesmo payload do /login normal
app.post('/admin/impersonate/professor/:id', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, nome FROM professores WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ sucesso: false, mensagem: 'Professor não encontrado.' });
    const prof = rows[0];
    console.log(`[ADMIN IMPERSONATE] ${req.adminSession.nome} → Professor #${prof.id} (${prof.nome})`);
    res.json({ sucesso: true, usuario: { id: prof.id, nome: prof.nome, tipo: 'professor' } });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

// ─── FIM DO MÓDULO ADMIN ──────────────────────────────────────────────────────

// ─── PERFIL PROFISSIONAL ──────────────────────────────────────────────────────

// GET /alunos/:id/perfil-profissional — retorna todos os dados do perfil
app.get('/alunos/:id/perfil-profissional', async (req, res) => {
  const { id } = req.params;
  try {
    const [[pp]]   = await db.execute('SELECT resumo FROM perfil_profissional WHERE aluno_id = ?', [id]);
    const [exps]   = await db.execute('SELECT empresa, cargo, periodo_inicio, periodo_fim, descricao FROM pp_experiencias WHERE aluno_id = ? ORDER BY id', [id]);
    const [forms]  = await db.execute('SELECT curso, instituicao, periodo_inicio, periodo_fim FROM pp_formacoes WHERE aluno_id = ? ORDER BY id', [id]);
    const [idioms] = await db.execute('SELECT idioma, nivel FROM pp_idiomas WHERE aluno_id = ? ORDER BY id', [id]);
    const [habs]   = await db.execute('SELECT habilidade FROM pp_habilidades WHERE aluno_id = ? ORDER BY id', [id]);
    const [certs]  = await db.execute('SELECT nome, instituicao, data_emissao FROM pp_certificacoes WHERE aluno_id = ? ORDER BY id', [id]);

    res.json({
      resumo:          pp?.resumo       || '',
      experiencias:    exps,
      formacoes:       forms,
      idiomas:         idioms,
      habilidades:     habs.map(h => h.habilidade),
      certificacoes:   certs
    });
  } catch (err) {
    console.error('/perfil-profissional GET:', err);
    res.status(500).json({ erro: 'Erro ao buscar perfil profissional.' });
  }
});

// PUT /alunos/:id/perfil-profissional — salva (delete + insert) todos os dados
app.put('/alunos/:id/perfil-profissional', async (req, res) => {
  const { id } = req.params;
  const { resumo = '', experiencias = [], formacoes = [], idiomas = [], habilidades = [], certificacoes = [] } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Upsert do resumo
    await conn.execute(
      'INSERT INTO perfil_profissional (aluno_id, resumo) VALUES (?, ?) ON DUPLICATE KEY UPDATE resumo = VALUES(resumo)',
      [id, resumo]
    );

    // Sub-tabelas: limpa e reinsere
    await conn.execute('DELETE FROM pp_experiencias WHERE aluno_id = ?', [id]);
    for (const e of experiencias) {
      await conn.execute(
        'INSERT INTO pp_experiencias (aluno_id, empresa, cargo, periodo_inicio, periodo_fim, descricao) VALUES (?,?,?,?,?,?)',
        [id, e.empresa||'', e.cargo||'', e.periodo_inicio||null, e.periodo_fim||null, e.descricao||'']
      );
    }

    await conn.execute('DELETE FROM pp_formacoes WHERE aluno_id = ?', [id]);
    for (const f of formacoes) {
      await conn.execute(
        'INSERT INTO pp_formacoes (aluno_id, curso, instituicao, periodo_inicio, periodo_fim) VALUES (?,?,?,?,?)',
        [id, f.curso||'', f.instituicao||'', f.periodo_inicio||null, f.periodo_fim||null]
      );
    }

    await conn.execute('DELETE FROM pp_idiomas WHERE aluno_id = ?', [id]);
    for (const i of idiomas) {
      await conn.execute(
        'INSERT INTO pp_idiomas (aluno_id, idioma, nivel) VALUES (?,?,?)',
        [id, i.idioma||'', i.nivel||'Básico']
      );
    }

    await conn.execute('DELETE FROM pp_habilidades WHERE aluno_id = ?', [id]);
    for (const h of habilidades) {
      if (h) await conn.execute('INSERT INTO pp_habilidades (aluno_id, habilidade) VALUES (?,?)', [id, h]);
    }

    await conn.execute('DELETE FROM pp_certificacoes WHERE aluno_id = ?', [id]);
    for (const c of certificacoes) {
      if (c.nome?.trim()) await conn.execute(
        'INSERT INTO pp_certificacoes (aluno_id, nome, instituicao, data_emissao) VALUES (?,?,?,?)',
        [id, c.nome.trim(), c.instituicao || null, c.data_emissao || null]
      );
    }

    await conn.commit();
    res.json({ sucesso: true });
  } catch (err) {
    await conn.rollback();
    console.error('/perfil-profissional PUT:', err);
    res.status(500).json({ erro: 'Erro ao salvar perfil profissional.' });
  } finally {
    conn.release();
  }
});

// POST /alunos/:id/perfil-profissional/upload-pdf — extrai texto do PDF do LinkedIn
app.post('/alunos/:id/perfil-profissional/upload-pdf', _pdfUpload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });
  try {
    const { text } = await pdfParse(req.file.buffer);
    const linhas = text.split('\n').map(l => l.trim()).filter(Boolean);

    // ── Localiza seções pelo índice da primeira ocorrência ────────────────
    const SECS = {
      resumo:      /^(Resumo|Summary)$/i,
      experiencia: /^(Experiência|Experience|Experiencia)$/i,
      formacao:    /^(Formação acadêmica|Education|Academic Background)$/i,
      idiomas:     /^(Idiomas|Languages)$/i,
      habilidades: /^(Principais competências|Top Skills|Competências|Skills)$/i,
      certs:       /^(Certifications?|Licenças e certificações|Certificações)$/i,
      contato:     /^(Contato|Contact)$/i,
    };
    const idx = {};
    linhas.forEach((l, i) => {
      Object.entries(SECS).forEach(([k, rx]) => {
        if (rx.test(l) && idx[k] === undefined) idx[k] = i;
      });
    });
    // Retorna fatia de linhas de uma seção até a próxima seção
    const slice = (key) => {
      const s = idx[key];
      if (s === undefined) return [];
      const nexts = Object.values(idx).filter(n => n > s);
      return linhas.slice(s + 1, nexts.length ? Math.min(...nexts) : linhas.length);
    };

    // Predicados auxiliares
    const isPage = l => /^Page\s+\d+\s+of\s+\d+$/i.test(l);
    const isDur  = l => /^\d+\s+(ano|mês|mes|month|year)/i.test(l);
    const isDate = l => /\b(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|jun|jul|ago|set|out|nov|dez)\b.{0,60}(\d{4}|present|atual)/i.test(l);
    const isLoc  = l => /,\s*(brasil|brazil|distrito federal|são paulo|rio de janeiro|minas gerais|\bsp\b|\brj\b|\bdf\b|\bmg\b|\brs\b|\bpr\b|\bba\b|\bce\b|\bpe\b)/i.test(l);

    // ── Resumo ─────────────────────────────────────────────────────────────
    const resumo = slice('resumo')
      .filter(l => !isPage(l) && !/^(E-mail|GitHub|http|www\.)/i.test(l))
      .join(' ').replace(/\s+/g, ' ').trim();

    // ── Habilidades ─────────────────────────────────────────────────────────
    const habilidades = slice('habilidades')
      .filter(l => l.length > 1 && l.length < 100 && !isPage(l));

    // ── Idiomas ────────────────────────────────────────────────────────────
    const nivelRx = /nativo|fluente|avançado|intermediário|básico|native|fluent|advanced|intermediate|beginner|professional|working/i;
    const idiomas = [];
    const idiomasLinhas = slice('idiomas');
    for (let i = 0; i < idiomasLinhas.length; i++) {
      const curr = idiomasLinhas[i], prox = idiomasLinhas[i + 1] || '';
      if (isPage(curr)) continue;
      if (nivelRx.test(prox)) { idiomas.push({ idioma: curr, nivel: prox }); i++; }
      else if (curr.length > 1 && curr.length < 60 && !nivelRx.test(curr)) idiomas.push({ idioma: curr, nivel: '' });
    }

    // ── Experiências ────────────────────────────────────────────────────────
    // Padrões do LinkedIn:
    //   Empresa com múltiplos cargos: EMPRESA → duração total → Cargo → data → local → desc
    //   Empresa com cargo único:      EMPRESA → Cargo → data → local → desc
    const expLinhas = slice('experiencia').filter(l => !isPage(l));
    const experiencias = [];
    let empresaCtx = '';
    let ei = 0;

    const addExp = (emp, cargo, periodoLinha, startDesc) => {
      const desc = [];
      while (startDesc < expLinhas.length) {
        const dl = expLinhas[startDesc];
        if (isDur(dl)) break;                                    // cabeçalho de nova empresa
        if (isDur(expLinhas[startDesc + 1] || '')) break;       // próxima linha é nova empresa
        if (isDate(expLinhas[startDesc + 1] || '')) break;      // próxima linha é data → novo cargo
        // padrão empresa→cargo→data: dl é empresa, dl+1 é cargo, dl+2 é data
        if (isDate(expLinhas[startDesc + 2] || '') &&
            !isDate(expLinhas[startDesc + 1] || '') &&
            !isDur(expLinhas[startDesc + 1] || '')) break;
        desc.push(dl);
        startDesc++;
        if (desc.length > 25) break;
      }
      const partes = periodoLinha.split(/[-–]/);
      experiencias.push({
        empresa:        emp,
        cargo,
        periodo_inicio: partes[0]?.trim()                              || '',
        periodo_fim:    (partes[1] || '').replace(/\(.*\)/, '').trim(),
        descricao:      desc.join(' ').replace(/\s+/g, ' ').trim()
      });
      return startDesc;
    };

    while (ei < expLinhas.length) {
      const l  = expLinhas[ei];
      const p1 = expLinhas[ei + 1] || '';
      const p2 = expLinhas[ei + 2] || '';

      if (isDur(l)) { ei++; continue; }

      // Empresa com múltiplos cargos: próxima linha é duração total
      if (isDur(p1)) {
        empresaCtx = l;
        ei += 2;
        continue;
      }

      // Cargo com data logo em seguida: l=cargo, p1=data
      if (isDate(p1)) {
        const cursor = isLoc(p2) ? ei + 3 : ei + 2;
        ei = addExp(empresaCtx, l, p1, cursor);
        continue;
      }

      // Empresa → cargo → data (cargo único, sem duração total): l=empresa, p1=cargo, p2=data
      if (isDate(p2) && !isDate(p1) && !isDur(p1)) {
        empresaCtx = l;
        const cursor = isLoc(expLinhas[ei + 3] || '') ? ei + 4 : ei + 3;
        ei = addExp(l, p1, p2, cursor);
        empresaCtx = '';
        continue;
      }

      // Fallback: linha isolada é empresa
      empresaCtx = l;
      ei++;
    }

    // ── Formações ───────────────────────────────────────────────────────────
    // Padrão LinkedIn: Instituição\nGrau, Área · (data_inicio - data_fim)
    const grauRx = /bacharelado|licenciatura|tecnólogo|tecnologia|mba|pós.graduação|especialização|curso|técnico|mestrado|doutorado|assistente|ensino médio|médio completo|bachelor|master|phd/i;
    const formLinhas = slice('formacao').filter(l => !isPage(l));
    const formacoes  = [];
    let fi = 0;
    while (fi < formLinhas.length) {
      const inst = formLinhas[fi];
      const prox = formLinhas[fi + 1] || '';
      if (!inst) { fi++; continue; }
      if (grauRx.test(prox)) {
        const pts  = prox.split('·');
        const curso = pts[0].trim();
        const anos  = (pts[1] || '').match(/\d{4}/g) || [];
        formacoes.push({ instituicao: inst, curso, periodo_inicio: anos[0] || '', periodo_fim: anos[1] || '' });
        fi += 2;
      } else { fi++; }
    }

    // ── Certificações ────────────────────────────────────────────────────────
    // LinkedIn exporta certs em dois formatos:
    //   Sidebar (sem datas): só nomes, um por linha, possível multi-linha
    //   Completo (com datas): Nome → Instituição → "Emitido em Month Year · ..."
    const certLinhasRaw = slice('certs').filter(l => !isPage(l) && l.length > 1);
    const isEmitido     = l => /emitido\s+em|emiss[aã]o|issued/i.test(l);
    const isNoiseLine   = l => /[|@]/.test(l) || isLoc(l) || /^(http|www\.)/i.test(l) || l.length > 180;
    const certificacoes = [];
    const hasDates      = certLinhasRaw.some(l => isDate(l) || isEmitido(l));

    if (hasDates) {
      // Formato completo: Nome → [Instituição] → [Emitido em ...]
      let ci = 0;
      while (ci < certLinhasRaw.length) {
        const nome = certLinhasRaw[ci++];
        if (!nome || nome.length < 2 || isNoiseLine(nome)) continue;
        let instituicao = '';
        let data_emissao = '';
        const p1 = certLinhasRaw[ci] || '';
        if (p1 && !isDate(p1) && !isEmitido(p1) && !p1.startsWith('(') && !isNoiseLine(p1)) {
          instituicao = p1;
          ci++;
        }
        const p2 = certLinhasRaw[ci] || '';
        if (p2 && (isDate(p2) || isEmitido(p2))) {
          const m = p2.match(/(?:emitido\s+em\s+)?(.+?)(?:\s*·.*)?$/i);
          data_emissao = m?.[1]?.trim() || p2;
          ci++;
        }
        certificacoes.push({ nome, instituicao, data_emissao });
      }
    } else {
      // Formato sidebar: apenas nomes, um por linha
      // Linhas que começam com "(" são continuação do certificado anterior
      // Linha cujo próximo é título (|) ou localização → é o nome da pessoa (ruído)
      for (let ci = 0; ci < certLinhasRaw.length; ci++) {
        const l    = certLinhasRaw[ci];
        const next = certLinhasRaw[ci + 1] || '';
        if (isNoiseLine(l)) continue;
        // Detecta bloco de cabeçalho da pessoa: linha seguida de título com | ou localização
        if (/\|/.test(next) || isLoc(next)) continue;
        // Continuação de cert anterior: linha começa com (
        if (l.startsWith('(') && certificacoes.length > 0) {
          certificacoes[certificacoes.length - 1].nome += ' ' + l;
          continue;
        }
        certificacoes.push({ nome: l, instituicao: '', data_emissao: '' });
      }
    }

    res.json({ resumo, habilidades, idiomas, experiencias, formacoes, certificacoes });
  } catch (err) {
    console.error('/upload-pdf:', err);
    res.status(500).json({ erro: 'Erro ao processar PDF.' });
  }
});

// ─── FIM DO MÓDULO PERFIL PROFISSIONAL ───────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});