// Estrutura de API com Node.js + Express + MySQL

const express    = require('express');
const path       = require('path');
const fs         = require('fs');
const crypto     = require('crypto');
const mysql      = require('mysql2/promise');
const nodemailer = require('nodemailer');
const multer     = require('multer');
const pdfParse   = require('pdf-parse');
const chatCrypto = require('./crypto-chat');
const bcrypt     = require('bcryptjs'); // puro JS — sem compilação nativa (roda igual em qualquer SO/VM)

// ─── Carregador de .env (sem dependências externas) ──────────────────────────
// Lê Backend/.env (fora do git) e popula process.env. Mantém segredos fora do
// código-fonte. Não sobrescreve variáveis já definidas no ambiente do sistema.
(function _carregarEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    for (const linha of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const l = linha.trim();
      if (!l || l.startsWith('#')) continue;
      const i = l.indexOf('=');
      if (i === -1) continue;
      const chave = l.slice(0, i).trim();
      const valor = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      if (!(chave in process.env)) process.env[chave] = valor;
    }
  } catch (e) { console.error('[ENV] Falha ao carregar .env:', e.message); }
})();

const app  = express();

// Multer armazena o PDF do LinkedIn em memória (sem gravar em disco)
const _pdfUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
// Anexos do chat — também em memória; são criptografados antes de gravar em disco (ver rota de upload)
const _chatPdfUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const CHAT_UPLOADS_DIR = path.join(__dirname, 'uploads', 'chat');
if (!fs.existsSync(CHAT_UPLOADS_DIR)) fs.mkdirSync(CHAT_UPLOADS_DIR, { recursive: true });

// Tipos aceitos como anexo de chat (PDF ou imagem). Sem coluna de mime na tabela:
// o Content-Type do download é inferido pela extensão do nome_original.
const _CHAT_ANEXO_MIME = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp',
};
const _CHAT_ANEXO_ACEITOS = new Set(Object.values(_CHAT_ANEXO_MIME));
function _mimeAnexoChat(nome) {
  return _CHAT_ANEXO_MIME[path.extname(String(nome || '')).toLowerCase()] || 'application/octet-stream';
}
const PORT = Number(process.env.PORT) || 4000;

// ─── CONFIGURAÇÃO DE E-MAIL (2FA) ────────────────────────────────────────────
// Credenciais vêm do .env (ver .env.example). Nunca hardcoded no código.
// Para Gmail, gere um "App Password" em https://myaccount.google.com/apppasswords
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

// DEV_MODE: sem credenciais configuradas, o OTP é impresso no console do servidor
const DEV_MODE = !SMTP_USER || !SMTP_PASS;

const _mailer = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:   587,
  secure: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS }
});

// Sessões OTP em memória  →  tempToken : { otp, usuarioId, tipo, nome, email, expiry }
const _otpSessions = new Map();

function _gerarOtp() {
  // crypto.randomInt é criptograficamente seguro (ao contrário de Math.random)
  return String(crypto.randomInt(100000, 1000000));
}

// ─── SESSÕES DE USUÁRIO (aluno/professor/empresa) — correção do achado S1 ────
// Antes, nenhuma rota validava quem estava chamando: o backend confiava
// cegamente no :id da URL (IDOR generalizado, anulava o 2FA). Agora, login
// bem-sucedido (via OTP para aluno/professor, ou direto para empresa) emite
// um token opaco que precisa ser enviado em toda rota de dados sensíveis.
const _sessoesUsuario = new Map(); // token -> { tipo, id, expiry }
const SESSAO_TTL_MS = 8 * 60 * 60 * 1000; // 8h

// Versão atual do Termo de Uso — subiu de 1 pra 2 em 26/08/2026 com a cláusula
// do Mapeamento de Perfil Comportamental (LGPD Art. 20 + CFP/SATEPSI). Todo
// aluno com `termos_versao_aceita` menor que isso precisa reaceitar no login.
const TERMOS_VERSAO_ATUAL = 2;

function _criarSessao(tipo, id) {
  const token = crypto.randomBytes(32).toString('hex');
  _sessoesUsuario.set(token, { tipo, id: String(id), expiry: Date.now() + SESSAO_TTL_MS });
  return token;
}

// Exige um token válido (Authorization: Bearer <token>) de um dos tipos permitidos.
// Popula req.usuarioAutenticado = { tipo, id } para uso posterior (ex: exigirDono).
function exigirAutenticacao(tiposPermitidos) {
  const tipos = Array.isArray(tiposPermitidos) ? tiposPermitidos : [tiposPermitidos];
  return (req, res, next) => {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
    const sessao = token ? _sessoesUsuario.get(token) : null;
    if (!sessao || Date.now() > sessao.expiry) {
      if (sessao) _sessoesUsuario.delete(token);
      return res.status(401).json({ error: 'Não autenticado. Faça login novamente.' });
    }
    if (!tipos.includes(sessao.tipo)) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
    req.usuarioAutenticado = { tipo: sessao.tipo, id: sessao.id };
    next();
  };
}

// Lê a identidade do token SE houver um válido, sem nunca bloquear a
// requisição — usada em rotas com dado misto (o dono sempre vê tudo; quem não
// é dono só vê se o próprio aluno optou por exibição pública).
function _identidadeOpcional(req) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  const sessao = token ? _sessoesUsuario.get(token) : null;
  if (!sessao || Date.now() > sessao.expiry) return null;
  return { tipo: sessao.tipo, id: sessao.id };
}

// exigirAutenticacao + confere que o :nomeParametro da URL é o próprio usuário autenticado
// (o "dono" do recurso) — é isto que fecha o IDOR nas rotas /alunos/:id etc.
function exigirDono(tipo, nomeParametro = 'id') {
  return [exigirAutenticacao(tipo), (req, res, next) => {
    if (String(req.params[nomeParametro]) !== req.usuarioAutenticado.id) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
    next();
  }];
}

// ─── SENHAS — bcrypt com migração preguiçosa (achado S4 / D1) ────────────────
// O banco tem contas legadas com senha em texto puro. Em vez de migrar tudo de
// uma vez (script/UPDATE em massa), cada login bem-sucedido já re-grava a senha
// como hash bcrypt — o banco migra sozinho, uma conta de cada vez, sem downtime.
function _senhaEhHashBcrypt(valor) {
  return typeof valor === 'string' && valor.startsWith('$2');
}

function _verificarSenha(senhaDigitada, valorNoBanco) {
  if (_senhaEhHashBcrypt(valorNoBanco)) {
    return bcrypt.compareSync(senhaDigitada, valorNoBanco);
  }
  return senhaDigitada === valorNoBanco; // legado — texto puro
}

// ─── VALIDAÇÃO DE ENTRADA — email / CPF / CNPJ ───────────────────────────────
// Aplicada só na escrita (cadastro/edição) — não valida dado já existente no
// banco (dados de teste com CPF fictício continuam funcionando na leitura).
function _validarEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function _validarCPF(cpf) {
  if (typeof cpf !== 'string') return false;
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false; // 11 dígitos iguais não é CPF válido
  const calcDigito = (base, tamanho) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += parseInt(base[i], 10) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto >= 10 ? 0 : resto;
  };
  if (calcDigito(c, 9) !== parseInt(c[9], 10)) return false;
  if (calcDigito(c, 10) !== parseInt(c[10], 10)) return false;
  return true;
}

function _validarCNPJ(cnpj) {
  if (typeof cnpj !== 'string') return false;
  const c = cnpj.replace(/\D/g, '');
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const calcDigito = (base, pesos) => {
    let soma = 0;
    for (let i = 0; i < pesos.length; i++) soma += parseInt(base[i], 10) * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  if (calcDigito(c, [5,4,3,2,9,8,7,6,5,4,3,2]) !== parseInt(c[12], 10)) return false;
  if (calcDigito(c, [6,5,4,3,2,9,8,7,6,5,4,3,2]) !== parseInt(c[13], 10)) return false;
  return true;
}

// Escala oficial de conversão menção -> nota (corrige o achado C1: duas escalas
// divergentes faziam o mesmo aluno ver um número no dashboard e outro no
// ranking). Devolve uma expressão SQL CASE, embutida via template literal em
// toda query que precisa dela.
function mencaoParaNotaSQL(coluna = 'mencao') {
  return `CASE ${coluna} WHEN 'SS' THEN 10 WHEN 'MS' THEN 8 WHEN 'MM' THEN 6 WHEN 'MI' THEN 4 WHEN 'II' THEN 2 ELSE 0 END`;
}

// Normaliza um campo de formulário vazio/indefinido para null antes do
// INSERT/UPDATE (corrige o achado C2: isso era redefinido de forma idêntica
// em 4 rotas diferentes).
const n = v => (v === undefined || v === '') ? null : v;

// ─── COMPATIBILIDADE ALUNO × VAGA/EMPRESA ────────────────────────────────────
// Score 0–100 determinístico, calculado SEMPRE no servidor (nunca no cliente).
// Combina desempenho acadêmico (o diferencial verificável do Ranking+) com
// aderência de área, perfil comportamental e critérios da vaga. Cada componente
// só entra quando há dado dos DOIS lados pra comparar; os pesos aplicáveis são
// renormalizados pra 100, então "a empresa não preencheu X" não penaliza o aluno.
const _COMPAT_PESOS = { cra: 30, area: 25, comportamental: 20, frequencia: 10, curso: 10, semestre: 5 };

// Áreas "adjacentes" contam como acerto parcial (40% do peso de área) — famílias
// próximas o bastante pra um recrutador considerar o mesmo pool de candidatos.
// Casamento por palavra-chave (não nome exato) pra tolerar os sufixos entre
// parênteses que os nomes de dom_areas_foco carregam ("Backend (Java, Node...)").
const _COMPAT_AREAS_ADJ = [
  ['backend', 'full stack', 'frontend', 'front-end', 'web'],
  ['data science', 'dados', 'analytics', 'machine learning', 'inteligência artificial', ' ia'],
  ['devops', 'sre', 'cloud', 'infraestrutura', 'segurança'],
];
function _areasAdjacentes(a, b) {
  if (!a || !b || a === b) return false;
  const la = a.toLowerCase(), lb = b.toLowerCase();
  return _COMPAT_AREAS_ADJ.some(g => g.some(k => la.includes(k)) && g.some(k => lb.includes(k)));
}

// aluno: { area_interesse_nome, curso, semestre, media_geral (0-10), frequencia (0-100), perfil_dominante }
// alvo:  { origem:'vaga'|'empresa', area_foco_nome, curso_preferido, semestre_minimo, perfis_procurados:[] }
function _calcularCompatibilidade(aluno, alvo) {
  if (!alvo) return null;
  const comp = [];
  const add = (chave, rotulo, aplicavel, fracao, detalhe) => {
    const peso = _COMPAT_PESOS[chave];
    comp.push({ chave, rotulo, peso, aplicavel, obtido: aplicavel ? Math.round(peso * fracao) : 0, detalhe });
  };

  const cra = Number(aluno.media_geral);
  add('cra', 'Desempenho acadêmico', Number.isFinite(cra),
      Number.isFinite(cra) ? Math.max(0, Math.min(1, cra / 10)) : 0,
      Number.isFinite(cra) ? `CRA ${cra.toFixed(1)}` : 'sem notas registradas');

  const temArea = !!(alvo.area_foco_nome && aluno.area_interesse_nome);
  let fracaoArea = 0, detArea = 'área não informada pelos dois lados';
  if (temArea) {
    if (aluno.area_interesse_nome === alvo.area_foco_nome) { fracaoArea = 1; detArea = `ambos em ${alvo.area_foco_nome}`; }
    else if (_areasAdjacentes(aluno.area_interesse_nome, alvo.area_foco_nome)) { fracaoArea = 0.4; detArea = `${aluno.area_interesse_nome} ≈ ${alvo.area_foco_nome}`; }
    else { fracaoArea = 0; detArea = `${aluno.area_interesse_nome} vs ${alvo.area_foco_nome}`; }
  }
  add('area', 'Área de atuação', temArea, fracaoArea, detArea);

  const procurados = Array.isArray(alvo.perfis_procurados) ? alvo.perfis_procurados : [];
  const temComp = procurados.length > 0 && !!aluno.perfil_dominante;
  const compBate = temComp && procurados.includes(aluno.perfil_dominante);
  add('comportamental', 'Perfil comportamental', temComp, compBate ? 1 : 0,
      !temComp ? 'empresa sem perfis definidos ou aluno sem avaliação'
               : (compBate ? `perfil "${aluno.perfil_dominante}" está entre os procurados`
                           : `perfil "${aluno.perfil_dominante}" fora dos procurados`));

  const freq = Number(aluno.frequencia);
  add('frequencia', 'Frequência', Number.isFinite(freq),
      Number.isFinite(freq) ? Math.max(0, Math.min(1, freq / 100)) : 0,
      Number.isFinite(freq) ? `${Math.round(freq)}% de presença` : 'sem dado de faltas');

  const temCurso = !!alvo.curso_preferido;
  const cursoBate = temCurso && String(alvo.curso_preferido).trim().toLowerCase() === String(aluno.curso || '').trim().toLowerCase();
  add('curso', 'Curso', temCurso, cursoBate ? 1 : 0,
      !temCurso ? 'não exige curso específico' : (cursoBate ? `cursa ${aluno.curso}` : `pede ${alvo.curso_preferido}`));

  const temSem = alvo.semestre_minimo != null && Number(alvo.semestre_minimo) > 0;
  const semBate = temSem && Number(aluno.semestre || 0) >= Number(alvo.semestre_minimo);
  add('semestre', 'Semestre', temSem, semBate ? 1 : 0,
      !temSem ? 'sem semestre mínimo' : (semBate ? `${aluno.semestre}º sem. (mín. ${alvo.semestre_minimo}º)` : `abaixo do mínimo (${alvo.semestre_minimo}º)`));

  const aplic = comp.filter(c => c.aplicavel);
  if (!aplic.length) return null;
  const somaPeso = aplic.reduce((s, c) => s + c.peso, 0);
  const somaObt  = aplic.reduce((s, c) => s + c.obtido, 0);
  const score = Math.round(100 * somaObt / somaPeso);
  const faixa = score >= 75 ? 'alta' : score >= 50 ? 'media' : 'baixa';
  return { score, faixa, origem: alvo.origem || 'empresa', componentes: comp };
}

// Dados de cada aluno que o cálculo de compatibilidade precisa além do que as
// rotas de talentos já trazem (área de interesse do ATS, frequência, perfil
// comportamental vigente). Uma consulta por dimensão, em lote pelos ids.
async function _dadosCompatAlunos(ids) {
  const mapa = {};
  const idsNum = [...new Set(ids.map(Number).filter(Number.isFinite))];
  if (!idsNum.length) return mapa;
  idsNum.forEach(id => { mapa[id] = { area_interesse_nome: null, frequencia: null, perfil_dominante: null }; });
  const ph = idsNum.map(() => '?').join(',');
  const [areas] = await db.execute(
    `SELECT pp.aluno_id, af.nome AS area_interesse_nome
       FROM perfil_profissional pp
       LEFT JOIN dom_areas_foco af ON af.id = pp.area_interesse_id
      WHERE pp.aluno_id IN (${ph})`, idsNum);
  areas.forEach(r => { if (mapa[r.aluno_id]) mapa[r.aluno_id].area_interesse_nome = r.area_interesse_nome; });
  const [freqs] = await db.execute(
    `SELECT aluno_id, GREATEST(0, 100 - SUM(faltas) * 2) AS frequencia
       FROM boletim WHERE aluno_id IN (${ph}) GROUP BY aluno_id`, idsNum);
  freqs.forEach(r => { if (mapa[r.aluno_id]) mapa[r.aluno_id].frequencia = Number(r.frequencia); });
  const [perfis] = await db.execute(
    `SELECT ac.aluno_id, ac.perfil_dominante
       FROM avaliacoes_comportamentais ac
      WHERE ac.aluno_id IN (${ph})
        AND ac.respondido_em = (
          SELECT MAX(a2.respondido_em) FROM avaliacoes_comportamentais a2 WHERE a2.aluno_id = ac.aluno_id
        )`, idsNum);
  perfis.forEach(r => { if (mapa[r.aluno_id]) mapa[r.aluno_id].perfil_dominante = r.perfil_dominante; });
  return mapa;
}

// Monta o "alvo" da compatibilidade pra uma empresa: a vaga específica quando
// vagaId é informado e pertence à empresa; senão os Interesses de Perfil gerais.
// perfis_procurados vem sempre da empresa (vaga não tem perfil próprio hoje).
async function _alvoCompatDaEmpresa(empresaId, vagaId) {
  const [perfisRows] = await db.execute(
    'SELECT perfil FROM empresa_perfis_procurados WHERE empresa_id = ? ORDER BY ordem', [empresaId]
  );
  const perfis_procurados = perfisRows.map(r => r.perfil);
  if (vagaId) {
    const [[v]] = await db.execute(
      `SELECT v.curso_preferido, v.semestre_minimo, af.nome AS area_foco_nome
         FROM empresa_vagas v
         LEFT JOIN dom_areas_foco af ON af.id = v.area_foco_id
        WHERE v.id = ? AND v.empresa_id = ?`, [vagaId, empresaId]
    );
    if (v) return { origem: 'vaga', area_foco_nome: v.area_foco_nome,
                    curso_preferido: v.curso_preferido, semestre_minimo: v.semestre_minimo, perfis_procurados };
  }
  const [[ei]] = await db.execute(
    `SELECT ei.curso_preferido, ei.semestre_minimo, af.nome AS area_foco_nome
       FROM empresa_interesses ei
       LEFT JOIN dom_areas_foco af ON af.id = ei.area_foco_id
      WHERE ei.empresa_id = ? LIMIT 1`, [empresaId]
  );
  if (!ei && !perfis_procurados.length) return null;
  return { origem: 'empresa', area_foco_nome: ei?.area_foco_nome || null,
           curso_preferido: ei?.curso_preferido || null, semestre_minimo: ei?.semestre_minimo || null, perfis_procurados };
}

// Resposta de erro padronizada: loga o detalhe SÓ no servidor e devolve mensagem
// genérica ao cliente — nunca expõe error.message/SQL/stack. (Correção do achado S8)
function _falha(res, error, { status = 500, sucesso } = {}) {
  console.error('[ERRO]', error);
  const corpo = sucesso === false
    ? { sucesso: false, erro: 'Ocorreu um erro ao processar a solicitação.' }
    : { error: 'Ocorreu um erro ao processar a solicitação.' };
  return res.status(status).json(corpo);
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

app.use(express.json({ limit: '2mb' })); // avatar em base64 é maior que o padrão de 100kb

// Serve estaticamente APENAS as pastas de frontend — nunca a raiz nem Backend/.
// Antes, servir a raiz expunha Backend/.chat-key (chave AES do chat), o próprio
// código-fonte e os dumps em banco_sql/ via HTTP. (Correção do achado S3)
const _RAIZ = path.join(__dirname, '..');
for (const dir of ['html', 'css', 'javascript', 'images']) {
  app.use(`/${dir}`, express.static(path.join(_RAIZ, dir)));
}

// Rotas-alias de URL limpa — servem o mesmo .html de sempre por um caminho
// curto (ex: /admin em vez de /html/admin.html). Puramente cosmético/UX:
// os links internos e os .html continuam funcionando normalmente, e a
// segurança real permanece nos tokens/adminAuth de cada rota de API.
// Preparado para funcionar igual em produção (ex: rankingplus.site/admin).
const _ROTAS_LIMPAS = {
  '/': 'index.html',
  '/admin': 'admin.html',
  '/talentos': 'talentos.html',
  '/aluno': 'areaaluno.html',
  '/professor': 'areaprofessor.html',
  '/termos': 'termodeuso.html',
  '/suporte': 'suporte.html',
  '/recuperar-senha': 'recuperarsenha.html',
  '/perfil-comportamental': 'avaliacaocomportamental.html',
};
for (const [rota, arquivo] of Object.entries(_ROTAS_LIMPAS)) {
  app.get(rota, (req, res) => res.sendFile(path.join(_RAIZ, 'html', arquivo)));
}

// CORS manual — garante cabeçalhos em toda resposta, inclusive erros e preflight.
// Lista de origens permitidas vem do .env (ALLOW_ORIGIN, separadas por vírgula).
// "*" some daqui: com o S1 já emitindo token de sessão, o ganho real de fechar
// o CORS é impedir que QUALQUER site na internet consiga ler a resposta de rotas
// públicas (ex: /ranking) embutido em outra página — dado sensível já depende do
// token, não do CORS. "null" cobre acesso via file:// (impersonation do admin,
// ver admin.js). Origem fora da lista simplesmente não recebe o header — o
// navegador bloqueia o JS de ler a resposta, sem precisar rejeitar a requisição
// na mão. (Correção do achado S8)
const ORIGENS_PERMITIDAS = (process.env.ALLOW_ORIGIN || 'http://localhost:4000,null')
  .split(',').map(o => o.trim()).filter(Boolean);
app.use((req, res, next) => {
  const origem = req.headers.origin;
  if (ORIGENS_PERMITIDAS.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origem && ORIGENS_PERMITIDAS.includes(origem)) {
    res.setHeader('Access-Control-Allow-Origin', origem);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();
  console.log(`[${req.method}] ${req.path}`); // log de toda requisição que chega no Express
  next();
});

// Configurações do Banco — vêm do .env (ver .env.example). Para apontar para
// outra máquina (ex: Laragon do colega), basta editar DB_HOST/DB_USER/DB_PASS.
const dbConfig = {
  host:     process.env.DB_HOST || 'localhost',
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'universidade_ranking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// TLS opcional na conexão com o banco — desligado por padrão (Laragon local não
// precisa). Pronto pra migração pro Cloud SQL do GCP: setar DB_SSL_CA com o
// caminho do certificado da CA do servidor liga TLS com verificação completa
// (jeito certo de conectar em IP público do Cloud SQL); DB_SSL=true sozinho
// liga TLS sem verificar CA, pra provedores que só exigem criptografia em trânsito.
if (process.env.DB_SSL_CA && fs.existsSync(process.env.DB_SSL_CA)) {
  dbConfig.ssl = { ca: fs.readFileSync(process.env.DB_SSL_CA), rejectUnauthorized: true };
  console.log('[DB] TLS ativado com verificação de CA (DB_SSL_CA).');
} else if (process.env.DB_SSL === 'true') {
  dbConfig.ssl = { rejectUnauthorized: false };
  console.log('[DB] TLS ativado sem verificação de CA (DB_SSL=true).');
}

console.log(`[DB] Conectando em ${dbConfig.user}@${dbConfig.host} (banco: ${dbConfig.database})`);

const db = mysql.createPool(dbConfig);

// ─── RATE LIMITER (em memória, sem dependências) ─────────────────────────────
// Limita tentativas por IP numa janela de tempo. Usado nas rotas de autenticação
// para conter brute-force de senha/OTP. (Correção do achado S7)
function rateLimit({ janelaMs = 15 * 60 * 1000, max = 10, msg = 'Muitas tentativas. Tente novamente mais tarde.' } = {}) {
  const hits = new Map(); // ip -> [timestamps]
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'desconhecido';
    const agora = Date.now();
    const recentes = (hits.get(ip) || []).filter(t => agora - t < janelaMs);
    if (recentes.length >= max) {
      return res.status(429).json({ sucesso: false, mensagem: msg });
    }
    recentes.push(agora);
    hits.set(ip, recentes);
    next();
  };
}
const limiteLogin = rateLimit({ max: 10, msg: 'Muitas tentativas de login. Tente novamente em 15 minutos.' });
const limiteOtp   = rateLimit({ max: 15, msg: 'Muitas tentativas. Tente novamente em 15 minutos.' });

// --- ROTAS DE LOGIN ---
app.post('/login', limiteLogin, async (req, res) => {
  const { tipoUsuario, identificador, senha } = req.body; // identificador pode ser email ou matricula
  console.log('[LOGIN] Tentativa:', { tipoUsuario, identificador });
  
  try {
    let query, params;
    
    if (tipoUsuario === 'aluno') {
      // Busca por Email OU Matrícula — colunas explícitas (achado D6): login não
      // precisa arrastar avatar_base64 (imagem inteira) nem o resto do perfil.
      query = `SELECT id, nome, email, senha FROM alunos WHERE email = ? OR matricula = ?`;
      params = [identificador, identificador];
    } else if (tipoUsuario === 'professor') {
      query = `SELECT id, nome, email, senha FROM professores WHERE email = ?`;
      params = [identificador];
    } else {
      return res.status(400).json({ sucesso: false, mensagem: 'Tipo inválido.' });
    }

    const [rows] = await db.execute(query, params);
    const user = rows[0];

    if (!user || !_verificarSenha(senha, user.senha)) {
      return res.status(401).json({ sucesso: false, mensagem: 'Credenciais inválidas.' });
    }

    // Migração preguiçosa (S4/D1): login com senha ainda em texto puro vira hash agora.
    if (!_senhaEhHashBcrypt(user.senha)) {
      const tabela = tipoUsuario === 'aluno' ? 'alunos' : 'professores';
      await db.execute(`UPDATE ${tabela} SET senha = ? WHERE id = ?`, [bcrypt.hashSync(senha, 10), user.id]);
    }

    if (!user.email) {
      return res.status(400).json({ sucesso: false, mensagem: 'Conta sem e-mail cadastrado. Contate o suporte.' });
    }

    // Gera OTP e sessão temporária
    const otp        = _gerarOtp();
    const tempToken  = crypto.randomBytes(24).toString('hex');
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
    _falha(res, error, { sucesso: false }); // _falha já loga o erro — evita log duplicado
  }
});

// POST /verificar-otp — valida o código e retorna sessão
app.post('/verificar-otp', limiteOtp, async (req, res) => {
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
  // Anti-brute-force: no máximo 5 tentativas por sessão OTP (o espaço é só 10^6).
  sessao.tentativas = (sessao.tentativas || 0) + 1;
  if (sessao.tentativas > 5) {
    _otpSessions.delete(tempToken);
    return res.status(429).json({ sucesso: false, mensagem: 'Muitas tentativas incorretas. Faça login novamente.' });
  }
  // Comparação em tempo constante para não vazar o código por timing.
  const codigoBuf = Buffer.from(codigo.trim());
  const otpBuf    = Buffer.from(sessao.otp);
  const codigoOk  = codigoBuf.length === otpBuf.length && crypto.timingSafeEqual(codigoBuf, otpBuf);
  if (!codigoOk) {
    return res.status(401).json({ sucesso: false, mensagem: 'Código inválido.' });
  }
  _otpSessions.delete(tempToken);
  console.log(`[2FA OK] ${sessao.tipo} #${sessao.usuarioId} (${sessao.nome})`);
  const token = _criarSessao(sessao.tipo, sessao.usuarioId);

  // Só aluno tem a cláusula de Perfil Comportamental no termo — professor não precisa reaceitar.
  let precisaReaceitarTermos = false;
  if (sessao.tipo === 'aluno') {
    const [[a]] = await db.execute('SELECT termos_versao_aceita FROM alunos WHERE id = ?', [sessao.usuarioId]);
    precisaReaceitarTermos = !a || (a.termos_versao_aceita || 1) < TERMOS_VERSAO_ATUAL;
  }

  res.json({
    sucesso: true, token,
    usuario: { id: sessao.usuarioId, nome: sessao.nome, tipo: sessao.tipo },
    precisaReaceitarTermos
  });
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
      github, linkedin, termos_aceitos
    } = req.body;

    // O cadastro exige aceite explícito dos termos — não confia só na validação do front
    if (!termos_aceitos) {
      return res.status(400).json({ error: 'É necessário aceitar os Termos de Uso para se cadastrar.' });
    }
    if (!_validarEmail(email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }
    if (cpf && String(cpf).trim() && !_validarCPF(cpf)) {
      return res.status(400).json({ error: 'CPF inválido.' });
    }

    // Registra data/hora do aceite dos termos (LGPD Art. 8º §1º — comprovação de consentimento)
    const termosAceitosEm = termos_aceitos ? new Date() : null;

    const [result] = await db.execute(
      `INSERT INTO alunos (
        nome, senha, matricula, email, curso, telefone, turno,
        cpf, data_nascimento, campus, semestre_atual, periodo_curso,
        data_matricula, github, linkedin, situacao, termos_aceitos_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ativo', ?)`,
      [n(nome), senha ? bcrypt.hashSync(senha, 10) : null, n(matricula), n(email), n(curso),
       n(telefone), n(turno), n(cpf), n(data_nascimento),
       n(campus), n(semestre), n(periodo_curso), n(data_matricula),
       n(github), n(linkedin), termosAceitosEm]
    );

    res.status(201).json({ id: result.insertId, mensagem: 'Aluno cadastrado com sucesso!' });
  } catch (error) {
    _falha(res, error);
  }
});

// ─── SUPORTE: Abertura de Chamados (formulário e chat) ──────────────────────
const _CATEGORIA_LABEL = {
  technical: 'Problema Técnico', ranking: 'Dúvida sobre Ranking',
  benefits: 'Benefícios e Recompensas', account: 'Problemas de Conta', other: 'Outros'
};
const _PRIORIDADE_LABEL = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' };

function _emailChamadoHtml(c) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border-radius:8px;border:1px solid #e0e0e0;">
      <h2 style="color:#020122;margin-bottom:4px;">Ranking+ — Novo Chamado de Suporte</h2>
      <hr style="border-color:#eee;">
      <p><strong>Origem:</strong> ${c.origem === 'chat' ? 'Chat ao Vivo' : 'Formulário de Ticket'}</p>
      <p><strong>Solicitante:</strong> ${c.nome} (${c.email})</p>
      <p><strong>Categoria:</strong> ${_CATEGORIA_LABEL[c.categoria] || c.categoria}</p>
      <p><strong>Prioridade:</strong> ${_PRIORIDADE_LABEL[c.prioridade] || c.prioridade}</p>
      <p><strong>Assunto:</strong> ${c.assunto}</p>
      <p style="white-space:pre-wrap;background:#f8f8f8;padding:12px;border-radius:6px;"><strong>Descrição:</strong><br>${c.descricao}</p>
      <p style="color:#999;font-size:12px;margin-top:16px;">Chamado #${c.id} — aberto em ${new Date(c.criado_em).toLocaleString('pt-BR')}</p>
    </div>
  `;
}

app.post('/suporte/chamados', async (req, res) => {
  try {
    const { nome, email, categoria, prioridade, assunto, descricao, origem } = req.body;

    if (!nome || !email || !categoria || !assunto || !descricao) {
      return res.status(400).json({ error: 'Preencha nome, e-mail, categoria, assunto e descrição.' });
    }

    const origemNormalizada = origem === 'chat' ? 'chat' : 'formulario';

    const [result] = await db.execute(
      `INSERT INTO chamados_suporte (nome, email, categoria, prioridade, assunto, descricao, origem)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nome, email, categoria, prioridade || 'medium', assunto, descricao, origemNormalizada]
    );

    const chamado = {
      id: result.insertId, nome, email, categoria,
      prioridade: prioridade || 'medium', assunto, descricao,
      origem: origemNormalizada, criado_em: new Date()
    };

    try {
      await _mailer.sendMail({
        from:    `"Ranking+ Suporte" <${SMTP_USER}>`,
        to:      'admin.rankingplus@gmail.com',
        replyTo: email,
        subject: `[Chamado #${chamado.id}] ${assunto}`,
        html:    _emailChamadoHtml(chamado)
      });
      console.log(`[SUPORTE EMAIL] Chamado #${chamado.id} notificado para admin.rankingplus@gmail.com`);
    } catch (mailErr) {
      // Falha no SMTP não deve derrubar o chamado — ele já está salvo no banco
      console.error('[SUPORTE EMAIL] Falha no envio:', mailErr.message);
    }

    res.status(201).json({ id: chamado.id, mensagem: 'Chamado registrado com sucesso!' });
  } catch (error) {
    _falha(res, error);
  }
});

// Atualizar dados do Aluno (inclui mostrar_no_ranking)
app.put('/alunos/:id', exigirDono('aluno'), async (req, res) => {
  try {
    const allowed = ['nome','email','telefone','data_nascimento','permitir_exibicao_ranking',
                     'permitir_contato','compartilhar_progresso','semestre_atual',
                     'turno','campus','endereco_rua','endereco_numero','endereco_complemento',
                     'endereco_bairro','endereco_cep','endereco_cidade','endereco_estado',
                     'contato_emergencia_nome','contato_emergencia_telefone',
                     'contato_emergencia_parentesco','contato_emergencia_email',
                     'github','linkedin'];
    if ('email' in req.body && !_validarEmail(req.body.email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }
    if (req.body.contato_emergencia_email && !_validarEmail(req.body.contato_emergencia_email)) {
      return res.status(400).json({ error: 'E-mail de contato de emergência inválido.' });
    }
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
    _falha(res, error);
  }
});

// Buscar Perfil Completo do Aluno
app.get('/alunos/:id', exigirDono('aluno'), async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM alunos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Aluno não encontrado' });
    const { senha: _, ...pub } = rows[0]; // nunca devolve a senha (hash ou não) — S4/D1
    res.json(pub);
  } catch (error) {
    _falha(res, error);
  }
});

// Avatar do aluno — base64, redimensionado no cliente antes do envio
app.put('/alunos/:id/avatar', exigirDono('aluno'), async (req, res) => {
  try {
    const { avatar_base64 } = req.body;
    if (!avatar_base64 || !avatar_base64.startsWith('data:image/')) {
      return res.status(400).json({ error: 'avatar_base64 inválido — esperado data URI de imagem.' });
    }
    await db.execute('UPDATE alunos SET avatar_base64 = ? WHERE id = ?', [avatar_base64, req.params.id]);
    res.json({ mensagem: 'Avatar atualizado com sucesso.' });
  } catch (error) {
    _falha(res, error);
  }
});

app.delete('/alunos/:id/avatar', exigirDono('aluno'), async (req, res) => {
  try {
    await db.execute('UPDATE alunos SET avatar_base64 = NULL WHERE id = ?', [req.params.id]);
    res.json({ mensagem: 'Avatar removido.' });
  } catch (error) {
    _falha(res, error);
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
    _falha(res, error);
  }
});

// Matricular Aluno em Disciplina (Criar Boletim) — achado extra encontrado
// durante o D4: rota sem autenticação nenhuma, qualquer um matriculava
// qualquer aluno em qualquer disciplina. Sem uso hoje no frontend (é ação
// administrativa) — protegida com o mesmo token de admin das outras rotas
// de gestão (/admin/alunos, /admin/professores etc.).
app.post('/boletim', adminAuth, async (req, res) => {
  try {
    const { aluno_id, disciplina_id } = req.body;
    // Inicia com 0 faltas e sem menção
    const [result] = await db.execute(
      `INSERT INTO boletim (aluno_id, disciplina_id, faltas, atividades_entregues) VALUES (?, ?, 0, 0)`,
      [aluno_id, disciplina_id]
    );
    res.status(201).json({ id: result.insertId, mensagem: 'Matrícula realizada!' });
  } catch (error) {
    // Achado D4: chave única (aluno_id, disciplina_id, semestre_cursado) agora
    // impede matrícula duplicada — devolve mensagem clara em vez de erro genérico.
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Este aluno já está matriculado nesta disciplina neste semestre.' });
    }
    _falha(res, error);
  }
});

// ROTA PODEROSA: Buscar Boletim Completo com Detalhes da Matéria
// Traz: Matéria, Professor, Sala, Horário, Notas, Faltas, Menção
// Chamado tanto pelo próprio aluno (seu boletim) quanto por qualquer professor
// (avaliando um aluno) — não pode ser "só dono" (achado do S1 corrigido de novo).
app.get('/alunos/:id/boletim-detalhado', exigirAutenticacao(['aluno', 'professor']), (req, res, next) => {
  if (req.usuarioAutenticado.tipo === 'aluno' && req.usuarioAutenticado.id !== String(req.params.id)) {
    return res.status(403).json({ error: 'Acesso negado.' });
  }
  next();
}, async (req, res) => {
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
    _falha(res, error);
  }
});

// Métricas Gerais do Aluno (Média de notas, Presença, total de atividades entregues)
app.get('/alunos/:id/metricas', exigirDono('aluno'), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        ROUND(AVG(
          ${mencaoParaNotaSQL("mencao")}
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
    _falha(res, error);
  }
});

// Desempenho semestral de um aluno específico — usado no gráfico exibido para
// aluno (colegas), professor e empresa ao visualizar um aluno. Aceita
// ?filtro=semestral|anual|completo (default: anual):
//   semestral → últimos 2 semestres (1 ano)
//   anual     → últimos 4 semestres (2 anos)
//   completo  → duração nominal do curso a partir da matrícula (8 semestres/
//               4 anos para cursos de TI padrão, 5 semestres/2,5 anos para ADS)
// Não existe histórico de CRA por semestre persistido hoje (boletim não é
// segmentado por período), então a curva é ilustrativa e termina na média
// real atual do aluno.
// Sem dono fixo (achado do S1 corrigido de novo): o próprio aluno sempre vê
// seu histórico completo; qualquer outro (ex: empresa no drawer do Portal de
// Talentos) só vê se `permitir_exibicao_ranking=1` — mesmo modelo de
// privacidade já usado em /talentos/aluno/:id/perfil e no /ranking (D5).
app.get('/alunos/:id/desempenho-semestral', async (req, res) => {
  try {
    const [alunoRows] = await db.execute('SELECT curso, permitir_exibicao_ranking FROM alunos WHERE id = ?', [req.params.id]);
    if (!alunoRows.length) return res.status(404).json({ error: 'Aluno não encontrado.' });
    const aluno = alunoRows[0];

    const quemPede = _identidadeOpcional(req);
    const podeVerSempre = quemPede && (
      (quemPede.tipo === 'aluno' && quemPede.id === String(req.params.id)) || quemPede.tipo === 'professor'
    );
    if (!podeVerSempre && !aluno.permitir_exibicao_ranking) {
      return res.status(403).json({ error: 'Perfil não disponível publicamente.' });
    }

    const filtro = ['semestral', 'anual', 'completo'].includes(req.query.filtro) ? req.query.filtro : 'anual';
    // agrupar=ano faz agregação real por ano civil (média dos semestres daquele ano),
    // em vez de só mostrar mais semestres com rótulo de semestre — usado pelo gráfico
    // "Evolução das Notas" no modo Ano. Opt-in: sem esse param, comportamento é o de sempre.
    const agruparPorAno = req.query.agrupar === 'ano';

    // Média real por semestre cursado — histórico persistido em boletim.semestre_cursado,
    // não mais uma curva sintética interpolada até o CRA atual.
    const [porSemestre] = await db.execute(`
      SELECT semestre_cursado,
        ROUND(AVG(
          ${mencaoParaNotaSQL("mencao")}
        ), 1) AS media
      FROM boletim WHERE aluno_id = ?
      GROUP BY semestre_cursado
      ORDER BY semestre_cursado ASC
    `, [req.params.id]);

    const mediaGeralRow = porSemestre.length
      ? porSemestre.reduce((soma, r) => soma + Number(r.media), 0) / porSemestre.length
      : null;
    const mediaGeral = mediaGeralRow !== null ? Number(mediaGeralRow.toFixed(1)) : null;

    let base = porSemestre;
    if (agruparPorAno) {
      const porAno = new Map();
      porSemestre.forEach(r => {
        const ano = String(r.semestre_cursado).split('.')[0];
        if (!porAno.has(ano)) porAno.set(ano, []);
        porAno.get(ano).push(Number(r.media));
      });
      base = [...porAno.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([ano, medias]) => ({
          semestre_cursado: ano,
          media: Number((medias.reduce((s, m) => s + m, 0) / medias.length).toFixed(1))
        }));
    }

    // periodos permite pedir uma janela customizada (ex: "3 Anos" = 3 anos civis quando
    // agruparPorAno, ou 6 semestres quando não) sem criar um novo valor de filtro.
    const periodosCustom = parseInt(req.query.periodos, 10);
    const quantidade = Number.isFinite(periodosCustom) && periodosCustom > 0
      ? periodosCustom
      : (filtro === 'completo' ? base.length : filtro === 'semestral' ? 2 : (agruparPorAno ? 3 : 4));
    const janela = base.slice(-quantidade);

    const labels = janela.map(r => agruparPorAno ? String(r.semestre_cursado) : String(r.semestre_cursado).slice(2)); // "2026.1" → "26.1"
    const values = janela.map(r => Number(r.media));

    res.json({ curso: aluno.curso, filtro, labels, values, media_geral: mediaGeral });
  } catch (error) {
    _falha(res, error);
  }
});

// Ranking Geral
// Cache curto do /ranking (achado P3) — evita recalcular o GROUP BY inteiro
// sobre alunos+boletim a cada requisição. É invalidado assim que um boletim
// muda (ver rota de lançamento de nota do professor), então uma edição de
// nota aparece na hora, sem esperar o cache vencer.
let _rankingCache = { dados: null, expiraEm: 0 };
const RANKING_CACHE_MS = 30 * 1000;

function _invalidarCacheRanking() {
  _rankingCache = { dados: null, expiraEm: 0 };
}

app.get('/ranking', async (req, res) => {
  try {
    if (_rankingCache.dados && Date.now() < _rankingCache.expiraEm) {
      return res.json(_rankingCache.dados);
    }
    const [rows] = await db.execute(`
      SELECT
        a.id,
        CASE WHEN COALESCE(a.permitir_exibicao_ranking, 1) = 1
             THEN a.nome ELSE 'Aluno Anônimo' END AS nome,
        a.curso,
        COALESCE(a.permitir_exibicao_ranking, 1) AS permitir_exibicao_ranking,
        ROUND(AVG(
          ${mencaoParaNotaSQL("b.mencao")}
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
    _rankingCache = { dados: rows, expiraEm: Date.now() + RANKING_CACHE_MS };
    res.json(rows);
  } catch (error) {
    _falha(res, error); // _falha já loga o erro — evita log duplicado
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
          ${mencaoParaNotaSQL("b.mencao")}
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
    _falha(res, error); // _falha já loga o erro — evita log duplicado
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
    _falha(res, error);
  }
});

// Listar Professores
app.get('/professores', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, nome, email, campus FROM professores');
    res.json(rows);
  } catch (error) {
    _falha(res, error);
  }
});

// Buscar Professor por ID
app.get('/professores/:id', exigirDono('professor'), async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM professores WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Professor não encontrado' });
    const { senha: _, ...pub } = rows[0]; // nunca devolve a senha (hash ou não) — S4/D1
    res.json(pub);
  } catch (error) {
    _falha(res, error);
  }
});

// PUT /professores/:id — edita os dados pessoais (nome, email, telefone, titulação, área de atuação).
// Campus não entra aqui — é readonly na UI, definido só via matrícula/vínculo institucional.
app.put('/professores/:id', exigirDono('professor'), async (req, res) => {
  try {
    const allowed = ['nome', 'email', 'telefone', 'titulacao', 'area_atuacao'];
    if ('email' in req.body && req.body.email && !_validarEmail(req.body.email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }
    const sets = [], vals = [];
    for (const f of allowed) {
      if (f in req.body) { sets.push(`${f} = ?`); vals.push(req.body[f] === '' ? null : req.body[f]); }
    }
    if (!sets.length) return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    vals.push(req.params.id);
    await db.execute(`UPDATE professores SET ${sets.join(', ')} WHERE id = ?`, vals);
    res.json({ mensagem: 'Dados atualizados com sucesso.' });
  } catch (error) {
    _falha(res, error);
  }
});

// PUT /professores/:id/senha — troca de senha (grava como hash bcrypt — S4/D1)
app.put('/professores/:id/senha', exigirDono('professor'), async (req, res) => {
  try {
    const { nova_senha } = req.body;
    if (!nova_senha || String(nova_senha).length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }
    await db.execute('UPDATE professores SET senha = ? WHERE id = ?', [bcrypt.hashSync(nova_senha, 10), req.params.id]);
    res.json({ mensagem: 'Senha atualizada com sucesso.' });
  } catch (error) {
    _falha(res, error);
  }
});

// PUT /professores/:id/preferencias — idioma + notificações por e-mail
app.put('/professores/:id/preferencias', exigirDono('professor'), async (req, res) => {
  try {
    const allowed = ['idioma_preferido', 'notif_notas', 'notif_faltas', 'notif_ranking', 'notif_eventos'];
    const sets = [], vals = [];
    for (const f of allowed) {
      if (f in req.body) { sets.push(`${f} = ?`); vals.push(req.body[f]); }
    }
    if (!sets.length) return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    vals.push(req.params.id);
    await db.execute(`UPDATE professores SET ${sets.join(', ')} WHERE id = ?`, vals);
    res.json({ mensagem: 'Preferências atualizadas com sucesso.' });
  } catch (error) {
    _falha(res, error);
  }
});

// Disciplinas do professor (turmas)
app.get('/professores/:id/disciplinas', exigirDono('professor'), async (req, res) => {
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
    _falha(res, error);
  }
});

// Aviso do professor pra turma inteira — vira uma notificação pra cada aluno
// matriculado na disciplina no semestre mais recente cursado nela.
app.post('/disciplinas/:discId/aviso', async (req, res) => {
  try {
    const { mensagem } = req.body;
    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({ error: 'Mensagem do aviso é obrigatória.' });
    }
    const discId = req.params.discId;

    const [discRows] = await db.execute('SELECT nome_materia FROM disciplinas WHERE id = ?', [discId]);
    if (!discRows.length) return res.status(404).json({ error: 'Disciplina não encontrada.' });

    const [alunoRows] = await db.execute(`
      SELECT DISTINCT aluno_id FROM boletim
      WHERE disciplina_id = ? AND semestre_cursado = (
        SELECT MAX(semestre_cursado) FROM boletim WHERE disciplina_id = ?
      )
    `, [discId, discId]);

    for (const a of alunoRows) {
      await _criarNotificacao('aluno', a.aluno_id, 'aviso_turma',
        `Aviso — ${discRows[0].nome_materia}`, mensagem.trim(), discId);
    }

    res.status(201).json({ mensagem: `Aviso enviado para ${alunoRows.length} aluno(s).` });
  } catch (error) {
    _falha(res, error);
  }
});

// Evolução da média da turma por semestre — mesma ideia do desempenho do aluno,
// mas agregando todos os alunos que já passaram por essa disciplina.
app.get('/disciplinas/:discId/evolucao', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT semestre_cursado,
        ROUND(AVG(
          ${mencaoParaNotaSQL("mencao")}
        ), 1) AS media
      FROM boletim WHERE disciplina_id = ?
      GROUP BY semestre_cursado ORDER BY semestre_cursado ASC
    `, [req.params.discId]);

    res.json({
      labels: rows.map(r => String(r.semestre_cursado).slice(2)),
      values: rows.map(r => Number(r.media))
    });
  } catch (error) {
    _falha(res, error);
  }
});

// Alunos de uma disciplina específica do professor
app.get('/professores/:profId/disciplinas/:discId/alunos', exigirDono('professor', 'profId'), async (req, res) => {
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
    _falha(res, error);
  }
});

// Todos os alunos do professor (todas as disciplinas)
app.get('/professores/:id/alunos', exigirDono('professor'), async (req, res) => {
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
          ${mencaoParaNotaSQL("b.mencao")}
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
    _falha(res, error);
  }
});

// Estatísticas do professor para o dashboard
app.get('/professores/:id/stats', exigirDono('professor'), async (req, res) => {
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
          ${mencaoParaNotaSQL("b.mencao")}
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
    _falha(res, error);
  }
});

// ─── STATS POR DISCIPLINA (para gráficos do dashboard do professor) ─────────
app.get('/professores/:id/disciplinas/stats', exigirDono('professor'), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        d.id,
        d.nome_materia,
        COUNT(b.aluno_id)  AS total_alunos,
        ROUND(AVG(
          ${mencaoParaNotaSQL("b.mencao")}
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
    _falha(res, error);
  }
});

// ─── PERFIL PROFISSIONAL DO ALUNO (GitHub + LinkedIn) ────────────────────────
// Cache simples em memória por username — evita estourar o rate limit do
// GitHub (60 req/hora sem autenticação, compartilhado por todo mundo que abre
// "Meu Perfil"). Também serve o último resultado bom conhecido se a API do
// GitHub responder rate-limited nesse meio-tempo, em vez de mostrar "nenhum
// repositório encontrado" pra quem realmente tem repos públicos.
const _ghReposCache = new Map(); // username -> { repos, expiraEm }
const GH_CACHE_TTL_MS = 10 * 60 * 1000;

app.get('/alunos/:id/profissional', exigirDono('aluno'), async (req, res) => {
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
      const cache = _ghReposCache.get(ghUser);
      if (cache && cache.expiraEm > Date.now()) {
        repos = cache.repos;
      } else {
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
            _ghReposCache.set(ghUser, { repos, expiraEm: Date.now() + GH_CACHE_TTL_MS });
          } else {
            console.warn(`[GitHub] ${ghRes.status} ao buscar repos de @${ghUser}${ghRes.status === 403 ? ' (provável rate limit da API do GitHub)' : ''}.`);
            if (cache) repos = cache.repos; // serve o último resultado bom conhecido, mesmo expirado
          }
        } catch (err) {
          console.warn('[GitHub] erro de conexão ao buscar repos de', ghUser, '-', err.message);
          if (cache) repos = cache.repos;
        }
      }
    }

    res.json({
      nome:    aluno.nome,
      curso:   aluno.curso,
      github:  aluno.github  || null,
      linkedin: aluno.linkedin || null,
      repos
    });
  } catch (error) {
    _falha(res, error);
  }
});

// PUT /alunos/:id/termos/reaceitar — confirma a leitura da versão atual do termo de uso
app.put('/alunos/:id/termos/reaceitar', exigirDono('aluno'), async (req, res) => {
  try {
    await db.execute(
      'UPDATE alunos SET termos_versao_aceita = ?, termos_aceitos_em = NOW() WHERE id = ?',
      [TERMOS_VERSAO_ATUAL, req.params.id]
    );
    res.json({ sucesso: true });
  } catch (error) {
    _falha(res, error);
  }
});

// ─── PERFIL COMPORTAMENTAL ────────────────────────────────────────────────────
// Formulário único (50 perguntas: 30 Likert + 10 forçada + 8 situacional + 2
// pretensão) — ver Backend/seed-perfil-comportamental.js pro conteúdo semeado.
// Cálculo é 100% determinístico (soma de pesos pré-definidos por opção, sem ML)
// e roda sempre no servidor — nunca confia em score calculado no cliente.
const EIXOS_COMPORTAMENTAIS = ['execucao', 'comunicacao', 'colaboracao', 'resiliencia', 'aprendizado'];

async function _calcularAvaliacaoComportamental(questionarioId, mapaRespostas) {
  const [perguntas] = await db.execute(
    'SELECT id, bloco FROM perguntas_comportamentais WHERE questionario_id = ?', [questionarioId]
  );
  const [opcoes] = await db.execute(`
    SELECT o.id, o.pergunta_id, o.peso_execucao, o.peso_comunicacao, o.peso_colaboracao, o.peso_resiliencia, o.peso_aprendizado
    FROM opcoes_resposta o
    JOIN perguntas_comportamentais p ON p.id = o.pergunta_id
    WHERE p.questionario_id = ?`, [questionarioId]);

  const blocoPorPergunta = new Map(perguntas.map(p => [p.id, p.bloco]));
  const opcoesPorPergunta = new Map();
  opcoes.forEach(o => {
    if (!opcoesPorPergunta.has(o.pergunta_id)) opcoesPorPergunta.set(o.pergunta_id, []);
    opcoesPorPergunta.get(o.pergunta_id).push(o);
  });

  const zerarEixos = () => Object.fromEntries(EIXOS_COMPORTAMENTAIS.map(e => [e, 0]));
  const bruto = { likert: zerarEixos(), forcada: zerarEixos(), situacional: zerarEixos() };
  const maxPossivel = { likert: zerarEixos(), forcada: zerarEixos(), situacional: zerarEixos() };

  for (const [perguntaId, opcoesDaPergunta] of opcoesPorPergunta) {
    const bloco = blocoPorPergunta.get(perguntaId);
    if (!bruto[bloco]) continue; // pretensão não pontua eixo nenhum
    // Pretensão aceita até 2 opções marcadas (checkbox) — os demais blocos são
    // sempre 1 (radio). Somar os pesos de todas as escolhidas cobre os dois
    // casos sem precisar de lógica especial aqui: pretensão sempre soma 0.
    const opcoesEscolhidasIds = mapaRespostas.get(perguntaId) || [];
    EIXOS_COMPORTAMENTAIS.forEach(e => {
      const chave = 'peso_' + e;
      const maxDaPergunta = Math.max(...opcoesDaPergunta.map(o => o[chave]));
      maxPossivel[bloco][e] += maxDaPergunta;
      opcoesEscolhidasIds.forEach(opcaoId => {
        const escolhida = opcoesDaPergunta.find(o => o.id === opcaoId);
        if (escolhida) bruto[bloco][e] += escolhida[chave];
      });
    });
  }

  // Likert: o mínimo teórico por eixo é 1 ponto por item (nunca 0), os outros
  // blocos partem de 0 — por isso o mínimo de normalização difere por bloco.
  function normalizar(bloco, e) {
    const max = maxPossivel[bloco][e];
    if (!max) return 0;
    const min = bloco === 'likert' ? max / 5 : 0;
    const val = bruto[bloco][e];
    return Math.round(((val - min) / (max - min || 1)) * 100);
  }

  const eixoFinal = {};
  EIXOS_COMPORTAMENTAIS.forEach(e => {
    // 70% traço direto (Likert) + 20% âncora forçada anti-forjação + 10% situacional —
    // pesos documentados na pesquisa que embasou o modelo (ver vault do projeto).
    const combinado = 0.70 * normalizar('likert', e) + 0.20 * normalizar('forcada', e) + 0.10 * normalizar('situacional', e);
    eixoFinal[e] = Math.max(0, Math.min(100, Math.round(combinado)));
  });

  // Tradução determinística dos 5 eixos pros 4 perfis de apresentação (fórmula fixa).
  const bruto4 = {
    executor:    0.45 * eixoFinal.execucao    + 0.35 * eixoFinal.resiliencia               + 0.20 * (100 - eixoFinal.colaboracao),
    comunicador: 0.55 * eixoFinal.comunicacao  + 0.30 * eixoFinal.colaboracao               + 0.15 * eixoFinal.aprendizado,
    planejador:  0.50 * eixoFinal.execucao     + 0.30 * eixoFinal.colaboracao               + 0.20 * (100 - eixoFinal.aprendizado),
    analista:    0.45 * eixoFinal.aprendizado  + 0.35 * (100 - eixoFinal.comunicacao)       + 0.20 * eixoFinal.execucao,
  };
  const somaTotal = Object.values(bruto4).reduce((s, v) => s + v, 0) || 1;
  const perfilPct = {};
  Object.keys(bruto4).forEach(p => { perfilPct[p] = Math.round(bruto4[p] / somaTotal * 100); });
  const perfilDominante = Object.entries(perfilPct).sort((a, b) => b[1] - a[1])[0][0];

  return { eixoFinal, perfilPct, perfilDominante };
}

// GET /avaliacao/questionario/ativo — perguntas + opções (sem pesos, pra não expor o gabarito)
app.get('/avaliacao/questionario/ativo', async (req, res) => {
  try {
    const [[quest]] = await db.execute(
      "SELECT id, nome FROM questionarios_comportamentais WHERE origem='sistema' AND ativo=1 ORDER BY id DESC LIMIT 1"
    );
    if (!quest) return res.status(404).json({ error: 'Nenhum questionário ativo.' });
    const [perguntas] = await db.execute(
      'SELECT id, ordem, bloco, enunciado FROM perguntas_comportamentais WHERE questionario_id = ? ORDER BY ordem',
      [quest.id]
    );
    const [opcoes] = await db.execute(`
      SELECT o.id, o.pergunta_id, o.ordem, o.texto
      FROM opcoes_resposta o JOIN perguntas_comportamentais p ON p.id = o.pergunta_id
      WHERE p.questionario_id = ? ORDER BY o.pergunta_id, o.ordem`, [quest.id]);
    const opcoesPorPergunta = new Map();
    opcoes.forEach(o => {
      if (!opcoesPorPergunta.has(o.pergunta_id)) opcoesPorPergunta.set(o.pergunta_id, []);
      opcoesPorPergunta.get(o.pergunta_id).push({ id: o.id, texto: o.texto });
    });
    res.json({
      questionario_id: quest.id,
      nome: quest.nome,
      perguntas: perguntas.map(p => ({ ...p, opcoes: opcoesPorPergunta.get(p.id) || [] }))
    });
  } catch (error) {
    _falha(res, error);
  }
});

// GET /alunos/:id/avaliacao-comportamental — resultado atual + se pode refazer agora
app.get('/alunos/:id/avaliacao-comportamental', async (req, res) => {
  try {
    const [alunoRows] = await db.execute('SELECT permitir_exibicao_ranking FROM alunos WHERE id = ?', [req.params.id]);
    if (!alunoRows.length) return res.status(404).json({ error: 'Aluno não encontrado.' });

    const quemPede = _identidadeOpcional(req);
    const podeVerSempre = quemPede && (
      (quemPede.tipo === 'aluno' && quemPede.id === String(req.params.id)) || quemPede.tipo === 'professor'
    );
    if (!podeVerSempre && !alunoRows[0].permitir_exibicao_ranking) {
      return res.status(403).json({ error: 'Perfil não disponível publicamente.' });
    }

    const [[avaliacao]] = await db.execute(
      `SELECT * FROM avaliacoes_comportamentais WHERE aluno_id = ? ORDER BY respondido_em DESC LIMIT 1`,
      [req.params.id]
    );

    const ehAlunoTeste = String(req.params.id) === String(process.env.ALUNO_TESTE_ID || '');
    const podeReavaliarAgora = ehAlunoTeste || !avaliacao || new Date(avaliacao.valido_ate) <= new Date();

    if (!avaliacao) {
      return res.json({ avaliacao: null, pode_reavaliar_agora: true, proxima_liberacao: null });
    }
    res.json({
      avaliacao: {
        eixos: {
          execucao: avaliacao.score_execucao, comunicacao: avaliacao.score_comunicacao,
          colaboracao: avaliacao.score_colaboracao, resiliencia: avaliacao.score_resiliencia,
          aprendizado: avaliacao.score_aprendizado
        },
        perfis: {
          executor: avaliacao.perfil_executor_pct, comunicador: avaliacao.perfil_comunicador_pct,
          planejador: avaliacao.perfil_planejador_pct, analista: avaliacao.perfil_analista_pct
        },
        perfil_dominante: avaliacao.perfil_dominante,
        respondido_em: avaliacao.respondido_em,
        valido_ate: avaliacao.valido_ate
      },
      pode_reavaliar_agora: podeReavaliarAgora,
      proxima_liberacao: podeReavaliarAgora ? null : avaliacao.valido_ate
    });
  } catch (error) {
    _falha(res, error);
  }
});

// Compartilhado pelas duas rotas abaixo (dono e admin) — mesma consulta, dois donos de acesso diferentes.
async function _respostasComportamentaisDetalhe(alunoId) {
  const [[avaliacao]] = await db.execute(
    'SELECT id, respondido_em, valido_ate FROM avaliacoes_comportamentais WHERE aluno_id = ? ORDER BY respondido_em DESC LIMIT 1',
    [alunoId]
  );
  if (!avaliacao) return { respondido_em: null, valido_ate: null, respostas: [] };
  const [respostas] = await db.execute(`
    SELECT p.ordem, p.bloco, p.enunciado, o.texto AS resposta
    FROM respostas_comportamentais r
    JOIN perguntas_comportamentais p ON p.id = r.pergunta_id
    JOIN opcoes_resposta o ON o.id = r.opcao_id
    WHERE r.avaliacao_id = ? ORDER BY p.ordem`, [avaliacao.id]);
  return { respondido_em: avaliacao.respondido_em, valido_ate: avaliacao.valido_ate, respostas };
}

// GET /alunos/:id/avaliacao-comportamental/respostas — detalhe pergunta-a-pergunta (só o próprio dono)
app.get('/alunos/:id/avaliacao-comportamental/respostas', exigirDono('aluno'), async (req, res) => {
  try {
    res.json(await _respostasComportamentaisDetalhe(req.params.id));
  } catch (error) {
    _falha(res, error);
  }
});

// GET /admin/alunos/:id/avaliacao-comportamental — mesmo detalhe, visão do admin
app.get('/admin/alunos/:id/avaliacao-comportamental', adminAuth, async (req, res) => {
  try {
    res.json(await _respostasComportamentaisDetalhe(req.params.id));
  } catch (error) {
    _falha(res, error);
  }
});

// POST /alunos/:id/avaliacao-comportamental — envia, calcula e grava (histórico versionado)
app.post('/alunos/:id/avaliacao-comportamental', exigirDono('aluno'), async (req, res) => {
  try {
    const { respostas } = req.body; // [{ pergunta_id, opcao_id }]
    if (!Array.isArray(respostas) || !respostas.length) {
      return res.status(400).json({ error: 'Respostas ausentes.' });
    }

    const [[quest]] = await db.execute(
      "SELECT id FROM questionarios_comportamentais WHERE origem='sistema' AND ativo=1 ORDER BY id DESC LIMIT 1"
    );
    if (!quest) return res.status(404).json({ error: 'Nenhum questionário ativo.' });

    // Regra dos 6 meses — validada sempre no servidor, nunca confiando no frontend.
    // Exceção: só o ALUNO_TESTE_ID (variável de ambiente) pula essa checagem.
    const ehAlunoTeste = String(req.params.id) === String(process.env.ALUNO_TESTE_ID || '');
    if (!ehAlunoTeste) {
      const [[ultima]] = await db.execute(
        'SELECT valido_ate FROM avaliacoes_comportamentais WHERE aluno_id = ? ORDER BY respondido_em DESC LIMIT 1',
        [req.params.id]
      );
      if (ultima && new Date(ultima.valido_ate) > new Date()) {
        return res.status(403).json({ error: 'Você já respondeu recentemente. Aguarde a próxima liberação.' });
      }
    }

    // Valida que toda pergunta do questionário foi respondida e que cada opção
    // pertence mesmo à pergunta enviada (evita resposta forjada/incompleta).
    // Pretensão (bloco='pretensao') aceita 1 ou 2 opções marcadas — as demais
    // perguntas (traço comportamental) exigem exatamente 1, sempre.
    const [perguntas] = await db.execute(
      'SELECT id, bloco FROM perguntas_comportamentais WHERE questionario_id = ?', [quest.id]
    );
    const blocoPorPergunta = new Map(perguntas.map(p => [p.id, p.bloco]));
    const [opcoesValidas] = await db.execute(`
      SELECT o.id, o.pergunta_id FROM opcoes_resposta o
      JOIN perguntas_comportamentais p ON p.id = o.pergunta_id
      WHERE p.questionario_id = ?`, [quest.id]);
    const opcaoPertenceA = new Map(opcoesValidas.map(o => [o.id, o.pergunta_id]));

    const mapaRespostas = new Map(); // pergunta_id -> [opcao_id, ...]
    for (const r of respostas) {
      const perguntaId = parseInt(r.pergunta_id, 10);
      const opcaoId = parseInt(r.opcao_id, 10);
      if (opcaoPertenceA.get(opcaoId) !== perguntaId) {
        return res.status(400).json({ error: 'Resposta inválida detectada.' });
      }
      if (!mapaRespostas.has(perguntaId)) mapaRespostas.set(perguntaId, []);
      const jaEscolhidas = mapaRespostas.get(perguntaId);
      if (!jaEscolhidas.includes(opcaoId)) jaEscolhidas.push(opcaoId);
    }
    const idsPerguntas = perguntas.map(p => p.id);
    for (const perguntaId of idsPerguntas) {
      const qtd = (mapaRespostas.get(perguntaId) || []).length;
      const max = blocoPorPergunta.get(perguntaId) === 'pretensao' ? 2 : 1;
      if (qtd < 1) {
        return res.status(400).json({ error: 'Todas as perguntas precisam ser respondidas.' });
      }
      if (qtd > max) {
        return res.status(400).json({ error: 'Quantidade de opções marcadas inválida para uma das perguntas.' });
      }
    }

    const { eixoFinal, perfilPct, perfilDominante } = await _calcularAvaliacaoComportamental(quest.id, mapaRespostas);

    const [result] = await db.execute(
      `INSERT INTO avaliacoes_comportamentais
         (aluno_id, questionario_id, score_execucao, score_comunicacao, score_colaboracao, score_resiliencia, score_aprendizado,
          perfil_executor_pct, perfil_comunicador_pct, perfil_planejador_pct, perfil_analista_pct, perfil_dominante, valido_ate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 6 MONTH))`,
      [req.params.id, quest.id, eixoFinal.execucao, eixoFinal.comunicacao, eixoFinal.colaboracao, eixoFinal.resiliencia, eixoFinal.aprendizado,
       perfilPct.executor, perfilPct.comunicador, perfilPct.planejador, perfilPct.analista, perfilDominante]
    );
    const avaliacaoId = result.insertId;

    for (const [perguntaId, opcaoIds] of mapaRespostas) {
      for (const opcaoId of opcaoIds) {
        await db.execute(
          'INSERT INTO respostas_comportamentais (avaliacao_id, pergunta_id, opcao_id) VALUES (?, ?, ?)',
          [avaliacaoId, perguntaId, opcaoId]
        );
      }
    }

    const [[nova]] = await db.execute('SELECT valido_ate FROM avaliacoes_comportamentais WHERE id = ?', [avaliacaoId]);
    res.status(201).json({ eixos: eixoFinal, perfis: perfilPct, perfil_dominante: perfilDominante, valido_ate: nova.valido_ate });
  } catch (error) {
    _falha(res, error);
  }
});

// ─── PORTAL DE TALENTOS ───────────────────────────────────────────────────────
app.get('/talentos/buscar', async (req, res) => {
  try {
    const { curso, semestre_min, habilidade, mencao } = req.query;
    const conditions = ["a.permitir_exibicao_ranking = 1"];
    const params     = [];

    if (curso)        { conditions.push('a.curso = ?');              params.push(curso); }
    if (semestre_min) { conditions.push('a.semestre_atual >= ?');    params.push(parseInt(semestre_min)); }

    // Habilidade: aceita múltiplos termos separados por vírgula (chips no front-end),
    // casando qualquer um deles (OR). Filtra alunos com média > 8.5 na disciplina.
    let havingClause = '';
    if (habilidade) {
      const termos = String(habilidade).split(',').map(t => t.trim()).filter(Boolean);
      if (termos.length) {
        conditions.push('(' + termos.map(() => 'd.nome_materia LIKE ?').join(' OR ') + ')');
        termos.forEach(t => params.push(`%${t}%`));
        havingClause = 'HAVING media_disciplina > 8.5';

        // Menção específica: só faz sentido combinada com busca de habilidade — filtra
        // as linhas de boletim (na própria disciplina buscada) pra exigir que pelo menos
        // uma delas tenha a menção pedida, não a média geral do aluno na disciplina.
        if (mencao) {
          const mencoes = String(mencao).split(',').map(m => m.trim().toUpperCase()).filter(Boolean);
          if (mencoes.length) {
            conditions.push('(' + mencoes.map(() => 'b.mencao = ?').join(' OR ') + ')');
            mencoes.forEach(m => params.push(m));
          }
        }
      }
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
          ${mencaoParaNotaSQL("b.mencao")}
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

    // Média geral por aluno — usada para o badge de destaque e ordenação no front-end
    const alunoIds = talentos.map(t => t.id);
    if (alunoIds.length) {
      const placeholders = alunoIds.map(() => '?').join(',');
      const [mediaRows] = await db.execute(`
        SELECT aluno_id, ROUND(AVG(
          ${mencaoParaNotaSQL("mencao")}
        ), 1) AS media_geral
        FROM boletim WHERE aluno_id IN (${placeholders}) GROUP BY aluno_id
      `, alunoIds);
      const mediaPorAluno = Object.fromEntries(mediaRows.map(r => [r.aluno_id, r.media_geral]));
      talentos.forEach(t => { t.media_geral = mediaPorAluno[t.id] ?? null; });
    }

    // Compatibilidade (score 0–100) — só pra empresa logada, contra a vaga
    // indicada (?vaga_id) ou, na falta dela, os Interesses de Perfil da empresa.
    const quemPede = _identidadeOpcional(req);
    if (quemPede && quemPede.tipo === 'empresa' && talentos.length) {
      const alvo = await _alvoCompatDaEmpresa(quemPede.id, req.query.vaga_id ? parseInt(req.query.vaga_id) : null);
      if (alvo) {
        const extra = await _dadosCompatAlunos(talentos.map(t => t.id));
        talentos.forEach(t => {
          const d = extra[t.id] || {};
          t.compatibilidade = _calcularCompatibilidade({
            area_interesse_nome: d.area_interesse_nome, curso: t.curso, semestre: t.semestre,
            media_geral: t.media_geral, frequencia: d.frequencia, perfil_dominante: d.perfil_dominante
          }, alvo);
        });
      }
    }

    res.json({ total: talentos.length, talentos });
  } catch (error) {
    _falha(res, error); // _falha já loga o erro — evita log duplicado
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
    _falha(res, error);
  }
});

// ─── DOMÍNIOS (dropdowns para frontend) ──────────────────────────────────────
app.get('/dom/setores', async (req, res) => {
  try { const [r] = await db.execute('SELECT * FROM dom_setores ORDER BY nome'); res.json(r); }
  catch (e) { _falha(res, e); }
});
app.get('/dom/areas-foco', async (req, res) => {
  try { const [r] = await db.execute('SELECT * FROM dom_areas_foco ORDER BY nome'); res.json(r); }
  catch (e) { _falha(res, e); }
});
app.get('/dom/tipos-vaga', async (req, res) => {
  try { const [r] = await db.execute('SELECT * FROM dom_tipos_vaga ORDER BY nome'); res.json(r); }
  catch (e) { _falha(res, e); }
});

// ─── EMPRESAS — CADASTRO ──────────────────────────────────────────────────────
app.post('/empresas/register', async (req, res) => {
  try {
    const { razao_social, nome_fantasia, cnpj, setor_id, email_corporativo, telefone, site_empresa, linkedin_empresa, senha } = req.body;
    if (!_validarEmail(email_corporativo)) {
      return res.status(400).json({ error: 'E-mail corporativo inválido.' });
    }
    if (!_validarCNPJ(cnpj)) {
      return res.status(400).json({ error: 'CNPJ inválido.' });
    }
    const [result] = await db.execute(
      `INSERT INTO empresas (razao_social, nome_fantasia, cnpj, setor_id, email_corporativo, telefone, site_empresa, linkedin_empresa, senha)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [n(razao_social), n(nome_fantasia), n(cnpj), n(setor_id), n(email_corporativo), n(telefone), n(site_empresa), n(linkedin_empresa), senha ? bcrypt.hashSync(senha, 10) : null]
    );
    res.status(201).json({ id: result.insertId, mensagem: 'Empresa cadastrada com sucesso!' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'CNPJ ou e-mail já cadastrado.' });
    _falha(res, error);
  }
});

// ─── EMPRESAS — LOGIN ─────────────────────────────────────────────────────────
app.post('/empresas/login', limiteLogin, async (req, res) => {
  try {
    const { email, senha } = req.body;
    const [rows] = await db.execute('SELECT * FROM empresas WHERE email_corporativo = ?', [email]);
    const empresa = rows[0];
    if (!empresa || !_verificarSenha(senha, empresa.senha)) {
      return res.status(401).json({ sucesso: false, mensagem: 'Credenciais inválidas.' });
    }
    if (!_senhaEhHashBcrypt(empresa.senha)) { // migração preguiçosa (S4/D1)
      await db.execute('UPDATE empresas SET senha = ? WHERE id = ?', [bcrypt.hashSync(senha, 10), empresa.id]);
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
    // Empresa não passa por OTP (login direto) — emite sessão aqui mesmo. (S1)
    const token = _criarSessao('empresa', empresa.id);
    res.json({ sucesso: true, token, empresa: pub });
  } catch (error) {
    _falha(res, error, { sucesso: false });
  }
});

// ─── EMPRESAS — GET por ID ────────────────────────────────────────────────────
app.get('/empresas/:id', exigirDono('empresa'), async (req, res) => {
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
    const [perfisRows] = await db.execute(
      'SELECT perfil FROM empresa_perfis_procurados WHERE empresa_id = ? ORDER BY ordem', [req.params.id]
    );
    pub.interesses = intRows;
    pub.perfis_procurados = perfisRows.map(r => r.perfil);
    res.json(pub);
  } catch (error) {
    _falha(res, error);
  }
});

// Progresso real dos "primeiros passos" — base do checklist de onboarding no
// Portal de Talentos. Nada é marcado manualmente: cada item reflete se aquela
// ação já existe de verdade no banco.
app.get('/empresas/:id/onboarding', exigirDono('empresa'), async (req, res) => {
  try {
    const [[interesse]] = await db.execute('SELECT COUNT(*) AS n FROM empresa_interesses WHERE empresa_id = ?', [req.params.id]);
    const [[vaga]] = await db.execute('SELECT COUNT(*) AS n FROM empresa_vagas WHERE empresa_id = ?', [req.params.id]);
    const [[favorito]] = await db.execute('SELECT COUNT(*) AS n FROM empresa_favoritos WHERE empresa_id = ?', [req.params.id]);
    res.json({
      tem_interesse: interesse.n > 0,
      tem_vaga: vaga.n > 0,
      tem_favorito: favorito.n > 0
    });
  } catch (error) {
    _falha(res, error);
  }
});

// ─── EMPRESAS — ATUALIZAR INTERESSES ─────────────────────────────────────────
// perfis_procurados: até 2 dos 4 perfis comportamentais (Executor/Comunicador/
// Planejador/Analista) que a empresa procura — usado no match do Portal de Talentos.
app.put('/empresas/:id/interesses', exigirDono('empresa'), async (req, res) => {
  try {
    const { area_foco_id, tipo_vaga_id, curso_preferido, semestre_minimo, perfis_procurados } = req.body;
    await db.execute('DELETE FROM empresa_interesses WHERE empresa_id = ?', [req.params.id]);
    await db.execute(
      `INSERT INTO empresa_interesses (empresa_id, area_foco_id, tipo_vaga_id, curso_preferido, semestre_minimo)
       VALUES (?, ?, ?, ?, ?)`,
      [req.params.id, n(area_foco_id), n(tipo_vaga_id), n(curso_preferido), n(semestre_minimo) || 1]
    );

    await db.execute('DELETE FROM empresa_perfis_procurados WHERE empresa_id = ?', [req.params.id]);
    const PERFIS_VALIDOS = ['executor', 'comunicador', 'planejador', 'analista'];
    const escolhidos = (Array.isArray(perfis_procurados) ? perfis_procurados : [])
      .filter(p => PERFIS_VALIDOS.includes(p)).slice(0, 2);
    for (let i = 0; i < escolhidos.length; i++) {
      await db.execute(
        'INSERT INTO empresa_perfis_procurados (empresa_id, perfil, ordem) VALUES (?, ?, ?)',
        [req.params.id, escolhidos[i], i + 1]
      );
    }

    res.json({ mensagem: 'Interesses atualizados com sucesso.' });
  } catch (error) {
    _falha(res, error);
  }
});

// ─── EMPRESAS — VAGAS (múltiplas, além do perfil único de Interesses) ────────
app.get('/empresas/:id/vagas', exigirDono('empresa'), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT v.*, af.nome AS area_foco_nome, tv.nome AS tipo_vaga_nome,
             (SELECT COUNT(*) FROM vaga_interesses vi WHERE vi.vaga_id = v.id) AS interessados_count
      FROM empresa_vagas v
      LEFT JOIN dom_areas_foco af ON v.area_foco_id = af.id
      LEFT JOIN dom_tipos_vaga tv ON v.tipo_vaga_id = tv.id
      WHERE v.empresa_id = ?
      ORDER BY v.status = 'aberta' DESC, v.criado_em DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (error) {
    _falha(res, error);
  }
});

app.post('/empresas/:id/vagas', exigirDono('empresa'), async (req, res) => {
  try {
    const { titulo, descricao, area_foco_id, tipo_vaga_id, curso_preferido, semestre_minimo } = req.body;
    if (!titulo || !titulo.trim()) return res.status(400).json({ error: 'titulo é obrigatório.' });
    const [result] = await db.execute(
      `INSERT INTO empresa_vagas (empresa_id, titulo, descricao, area_foco_id, tipo_vaga_id, curso_preferido, semestre_minimo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, titulo.trim(), n(descricao), n(area_foco_id), n(tipo_vaga_id), n(curso_preferido), n(semestre_minimo)]
    );
    res.status(201).json({ id: result.insertId, mensagem: 'Vaga criada com sucesso.' });
  } catch (error) {
    _falha(res, error);
  }
});

app.put('/empresas/:id/vagas/:vagaId', exigirDono('empresa'), async (req, res) => {
  try {
    const allowed = ['titulo', 'descricao', 'area_foco_id', 'tipo_vaga_id', 'curso_preferido', 'semestre_minimo', 'status'];
    const sets = [];
    const vals = [];
    for (const field of allowed) {
      if (field in req.body) {
        sets.push(`${field} = ?`);
        vals.push(req.body[field] === '' ? null : req.body[field]);
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    vals.push(req.params.id, req.params.vagaId);
    const [result] = await db.execute(
      `UPDATE empresa_vagas SET ${sets.join(', ')} WHERE empresa_id = ? AND id = ?`, vals
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Vaga não encontrada.' });
    res.json({ mensagem: 'Vaga atualizada com sucesso.' });
  } catch (error) {
    _falha(res, error);
  }
});

// Sem DELETE de verdade — fechar a vaga (status='fechada') via PUT já cobre o
// caso de uso e preserva o histórico de vagas publicadas pela empresa.

// Alunos que demonstraram interesse numa vaga específica, sem exigir nenhum
// match — visão de demanda real pra empresa decidir quem contatar.
app.get('/empresas/:id/vagas/:vagaId/interessados', exigirDono('empresa'), async (req, res) => {
  try {
    const [[vaga]] = await db.execute(
      'SELECT id FROM empresa_vagas WHERE id = ? AND empresa_id = ?',
      [req.params.vagaId, req.params.id]
    );
    if (!vaga) return res.status(404).json({ error: 'Vaga não encontrada.' });
    const [rows] = await db.execute(`
      SELECT a.id, a.nome, a.curso, a.semestre_atual AS semestre, vi.criado_em
      FROM vaga_interesses vi
      JOIN alunos a ON a.id = vi.aluno_id
      WHERE vi.vaga_id = ?
      ORDER BY vi.criado_em DESC
    `, [req.params.vagaId]);
    res.json(rows);
  } catch (error) {
    _falha(res, error);
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

    // Avisa o aluno que uma empresa viu o perfil dele — com uma janela de 30min
    // pra não gerar notificação repetida se a empresa reabrir o drawer várias vezes.
    if (tipo_interacao === 'VISUALIZACAO') {
      const [jaNotificado] = await db.execute(
        `SELECT id FROM notificacoes
         WHERE destinatario_tipo='aluno' AND destinatario_id=? AND tipo='visualizacao_perfil'
           AND referencia_id=? AND criado_em > (NOW() - INTERVAL 30 MINUTE)`,
        [aluno_id, empresa_id]
      );
      if (!jaNotificado.length) {
        const [empRows] = await db.execute('SELECT nome_fantasia FROM empresas WHERE id = ?', [empresa_id]);
        const empresaNome = empRows[0]?.nome_fantasia || 'Uma empresa';
        await _criarNotificacao('aluno', aluno_id, 'visualizacao_perfil',
          'Seu perfil foi visualizado',
          `${empresaNome} visualizou seu perfil no Portal de Talentos.`,
          empresa_id);
      }
    }

    res.status(201).json({ id: result.insertId });
  } catch (error) {
    _falha(res, error);
  }
});

// ─── NOTIFICAÇÕES ─────────────────────────────────────────────────────────────
async function _criarNotificacao(tipoDestinatario, destinatarioId, tipo, titulo, mensagem, referenciaId) {
  await db.execute(
    `INSERT INTO notificacoes (destinatario_tipo, destinatario_id, tipo, titulo, mensagem, referencia_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [tipoDestinatario, destinatarioId, tipo, titulo, mensagem, referenciaId ?? null]
  );
}

// Recalcula a posição de UM aluno no ranking e notifica se ela mudou desde a
// última vez. Corrige o achado P1: antes isso rodava dentro do GET de
// notificações (chamado em polling pelo front), com efeito colateral de
// escrita a cada requisição. Agora só roda quando o boletim realmente muda
// (lançamento de menção/nota pelo professor), não a cada consulta.
async function _atualizarPosicaoRanking(alunoId) {
  const [rankRows] = await db.execute(`
    SELECT a.id,
      ROUND(AVG(${mencaoParaNotaSQL("b.mencao")}), 2) AS pontuacao
    FROM alunos a JOIN boletim b ON a.id = b.aluno_id
    GROUP BY a.id
    ORDER BY pontuacao DESC, a.id ASC
  `);
  const posicaoAtual = rankRows.findIndex(r => r.id == alunoId) + 1;
  if (posicaoAtual === 0) return;

  const [alunoRows] = await db.execute('SELECT ultima_posicao_ranking FROM alunos WHERE id = ?', [alunoId]);
  const posicaoAnterior = alunoRows[0]?.ultima_posicao_ranking;

  if (posicaoAnterior !== null && posicaoAnterior !== undefined && posicaoAnterior !== posicaoAtual) {
    const subiu = posicaoAtual < posicaoAnterior;
    await _criarNotificacao('aluno', alunoId, 'ranking_mudou',
      subiu ? 'Você subiu no ranking!' : 'Sua posição no ranking mudou',
      `Você ${subiu ? 'subiu de' : 'foi de'} #${posicaoAnterior} para #${posicaoAtual}.`,
      posicaoAtual);
  }
  await db.execute('UPDATE alunos SET ultima_posicao_ranking = ? WHERE id = ?', [posicaoAtual, alunoId]);
}

app.get('/alunos/:id/notificacoes', exigirDono('aluno'), async (req, res) => {
  try {
    const alunoId = req.params.id;
    const [rows] = await db.execute(
      `SELECT id, tipo, titulo, mensagem, referencia_id, lida, criado_em
       FROM notificacoes WHERE destinatario_tipo='aluno' AND destinatario_id=?
       ORDER BY criado_em DESC LIMIT 30`,
      [alunoId]
    );
    const naoLidas = rows.filter(n => !n.lida).length;
    res.json({ notificacoes: rows, nao_lidas: naoLidas });
  } catch (error) {
    _falha(res, error);
  }
});

app.put('/alunos/:id/notificacoes/:notifId/lida', exigirDono('aluno'), async (req, res) => {
  try {
    await db.execute(
      `UPDATE notificacoes SET lida=1 WHERE id=? AND destinatario_tipo='aluno' AND destinatario_id=?`,
      [req.params.notifId, req.params.id]
    );
    res.json({ mensagem: 'Notificação marcada como lida.' });
  } catch (error) {
    _falha(res, error);
  }
});

app.put('/alunos/:id/notificacoes/marcar-todas-lidas', exigirDono('aluno'), async (req, res) => {
  try {
    await db.execute(
      `UPDATE notificacoes SET lida=1 WHERE destinatario_tipo='aluno' AND destinatario_id=? AND lida=0`,
      [req.params.id]
    );
    res.json({ mensagem: 'Notificações marcadas como lidas.' });
  } catch (error) {
    _falha(res, error);
  }
});

// Empresa: antes de listar, sincroniza notificações de "novo candidato" —
// alunos que batem com os Interesses de Perfil salvos, ainda não vistos e
// ainda não notificados (mesma regra de "Novo pra você" do talentos.js,
// mas persistida em vez de recalculada só na tela).
app.get('/empresas/:id/notificacoes', exigirDono('empresa'), async (req, res) => {
  try {
    const empresaId = req.params.id;
    const [interesses] = await db.execute('SELECT * FROM empresa_interesses WHERE empresa_id = ? LIMIT 1', [empresaId]);
    const interesse = interesses[0];

    if (interesse) {
      const [novosMatches] = await db.execute(
        `SELECT a.id, a.nome FROM alunos a
         WHERE (? IS NULL OR a.curso = ?)
           AND (? IS NULL OR a.semestre_atual >= ?)
           AND NOT EXISTS (SELECT 1 FROM interacoes_empresas_alunos i WHERE i.empresa_id=? AND i.aluno_id=a.id)
           AND NOT EXISTS (SELECT 1 FROM notificacoes n WHERE n.destinatario_tipo='empresa' AND n.destinatario_id=?
                            AND n.tipo='novo_candidato' AND n.referencia_id=a.id)
         LIMIT 20`,
        [interesse.curso_preferido, interesse.curso_preferido,
         interesse.semestre_minimo, interesse.semestre_minimo,
         empresaId, empresaId]
      );
      for (const aluno of novosMatches) {
        await _criarNotificacao('empresa', empresaId, 'novo_candidato',
          'Novo candidato disponível',
          `${aluno.nome} bate com os interesses de perfil salvos.`,
          aluno.id);
      }
    }

    const [rows] = await db.execute(
      `SELECT id, tipo, titulo, mensagem, referencia_id, lida, criado_em
       FROM notificacoes WHERE destinatario_tipo='empresa' AND destinatario_id=?
       ORDER BY criado_em DESC LIMIT 30`,
      [empresaId]
    );
    const naoLidas = rows.filter(n => !n.lida).length;
    res.json({ notificacoes: rows, nao_lidas: naoLidas });
  } catch (error) {
    _falha(res, error);
  }
});

app.put('/empresas/:id/notificacoes/:notifId/lida', exigirDono('empresa'), async (req, res) => {
  try {
    await db.execute(
      `UPDATE notificacoes SET lida=1 WHERE id=? AND destinatario_tipo='empresa' AND destinatario_id=?`,
      [req.params.notifId, req.params.id]
    );
    res.json({ mensagem: 'Notificação marcada como lida.' });
  } catch (error) {
    _falha(res, error);
  }
});

app.put('/empresas/:id/notificacoes/marcar-todas-lidas', exigirDono('empresa'), async (req, res) => {
  try {
    await db.execute(
      `UPDATE notificacoes SET lida=1 WHERE destinatario_tipo='empresa' AND destinatario_id=? AND lida=0`,
      [req.params.id]
    );
    res.json({ mensagem: 'Notificações marcadas como lidas.' });
  } catch (error) {
    _falha(res, error);
  }
});

// ─── EMPRESA — HISTÓRICO DE CANDIDATOS JÁ VISUALIZADOS ───────────────────────
// Reaproveita interacoes_empresas_alunos (já existia para outros fins) — não
// precisa de tabela nova, só agrupa por aluno pegando a visualização mais recente.
app.get('/empresas/:id/historico-visualizacoes', exigirDono('empresa'), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        a.id, a.nome, a.curso, a.semestre_atual AS semestre,
        MAX(i.data_interacao) AS ultima_visualizacao
      FROM interacoes_empresas_alunos i
      JOIN alunos a ON a.id = i.aluno_id
      WHERE i.empresa_id = ? AND i.tipo_interacao = 'VISUALIZACAO'
      GROUP BY a.id, a.nome, a.curso, a.semestre_atual
      ORDER BY ultima_visualizacao DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (error) {
    _falha(res, error);
  }
});

// ─── EMPRESA — FAVORITOS / SHORTLIST ──────────────────────────────────────────
app.get('/empresas/:id/favoritos', exigirDono('empresa'), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT a.id, a.nome, a.curso, a.semestre_atual AS semestre, f.status, f.notas,
             f.entrevista_data_hora, f.entrevista_observacao, f.criado_em
      FROM empresa_favoritos f
      JOIN alunos a ON a.id = f.aluno_id
      WHERE f.empresa_id = ?
      ORDER BY f.criado_em DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (error) {
    _falha(res, error);
  }
});

const STATUS_FAVORITO_VALIDOS = ['novo', 'contatado', 'entrevista_marcada', 'em_processo', 'contratado', 'descartado'];

app.put('/empresas/:id/favoritos/:alunoId/status', exigirDono('empresa'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUS_FAVORITO_VALIDOS.includes(status)) {
      return res.status(400).json({ error: 'status inválido.' });
    }
    const [result] = await db.execute(
      'UPDATE empresa_favoritos SET status = ? WHERE empresa_id = ? AND aluno_id = ?',
      [status, req.params.id, req.params.alunoId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Favorito não encontrado.' });
    }

    // Status avançou além de "novo" → checa se o aluno já tinha demonstrado
    // interesse em alguma vaga desta empresa; se sim, destrava o chat (match mútuo).
    let novasConversas = [];
    if (status !== 'novo' && status !== 'descartado') {
      novasConversas = await _processarMatchVagas(req.params.alunoId, req.params.id);
    }

    // Vira "Contratado" pela primeira vez → agenda o check-in trimestral de
    // retenção (é isso que alimenta o histórico real de desfecho de indicação).
    if (status === 'contratado') {
      const [[favorito]] = await db.execute(
        'SELECT id FROM empresa_favoritos WHERE empresa_id = ? AND aluno_id = ?',
        [req.params.id, req.params.alunoId]
      );
      const [[jaExiste]] = await db.execute(
        'SELECT id FROM contratacoes_checkins WHERE favorito_id = ?', [favorito.id]
      );
      if (!jaExiste) {
        await db.execute(
          `INSERT INTO contratacoes_checkins (favorito_id, empresa_id, aluno_id, proximo_checkin_em)
           VALUES (?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 3 MONTH))`,
          [favorito.id, req.params.id, req.params.alunoId]
        );
      }
    }

    res.json({ status, match: novasConversas.length > 0 });
  } catch (error) {
    _falha(res, error);
  }
});

// ─── ACOMPANHAMENTO DE CONTRATAÇÕES (check-in trimestral de retenção) ────────
// GET /empresas/:id/contratacoes — todo mundo que a empresa já marcou como
// "Contratado", com o check-in pendente (se houver) em destaque.
app.get('/empresas/:id/contratacoes', exigirDono('empresa'), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT c.id AS checkin_id, c.aluno_id, a.nome AS aluno_nome, c.marcado_contratado_em,
             c.continua_na_empresa, c.respondido_em, c.proximo_checkin_em,
             (c.respondido_em IS NULL AND c.proximo_checkin_em <= CURDATE()) AS pendente
      FROM contratacoes_checkins c
      JOIN alunos a ON a.id = c.aluno_id
      WHERE c.empresa_id = ?
      ORDER BY pendente DESC, c.marcado_contratado_em DESC`, [req.params.id]);
    res.json(rows);
  } catch (error) {
    _falha(res, error);
  }
});

// PUT /empresas/:id/contratacoes/:checkinId — responde "continua na empresa?" (sim/não)
// e, se sim, já agenda o próximo check-in trimestral (histórico de retenção contínuo).
app.put('/empresas/:id/contratacoes/:checkinId', exigirDono('empresa'), async (req, res) => {
  try {
    const { continua_na_empresa } = req.body;
    if (typeof continua_na_empresa !== 'boolean') {
      return res.status(400).json({ error: 'continua_na_empresa (boolean) é obrigatório.' });
    }
    const [[checkin]] = await db.execute(
      'SELECT * FROM contratacoes_checkins WHERE id = ? AND empresa_id = ?',
      [req.params.checkinId, req.params.id]
    );
    if (!checkin) return res.status(404).json({ error: 'Check-in não encontrado.' });

    await db.execute(
      'UPDATE contratacoes_checkins SET continua_na_empresa = ?, respondido_em = NOW() WHERE id = ?',
      [continua_na_empresa ? 1 : 0, checkin.id]
    );

    if (continua_na_empresa) {
      await db.execute(
        `INSERT INTO contratacoes_checkins (favorito_id, empresa_id, aluno_id, proximo_checkin_em)
         VALUES (?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 3 MONTH))`,
        [checkin.favorito_id, checkin.empresa_id, checkin.aluno_id]
      );
    }

    res.json({ sucesso: true });
  } catch (error) {
    _falha(res, error);
  }
});

// Notas privadas da empresa sobre o candidato favoritado — visível só pra ela,
// nunca exposta em nenhuma rota que o aluno ou outra empresa possa ler.
app.put('/empresas/:id/favoritos/:alunoId/notas', exigirDono('empresa'), async (req, res) => {
  try {
    const { notas } = req.body;
    if (typeof notas !== 'string') {
      return res.status(400).json({ error: 'notas deve ser uma string.' });
    }
    if (notas.length > 2000) {
      return res.status(400).json({ error: 'notas excede o limite de 2000 caracteres.' });
    }
    const [result] = await db.execute(
      'UPDATE empresa_favoritos SET notas = ? WHERE empresa_id = ? AND aluno_id = ?',
      [notas, req.params.id, req.params.alunoId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Favorito não encontrado.' });
    }
    res.json({ notas });
  } catch (error) {
    _falha(res, error);
  }
});

// Data/hora e observação da entrevista marcada — aceita null/vazio pra desmarcar
// (ex: entrevista cancelada, mas o status continua "entrevista_marcada" até a
// empresa trocar manualmente).
app.put('/empresas/:id/favoritos/:alunoId/entrevista', exigirDono('empresa'), async (req, res) => {
  try {
    const { data_hora, observacao } = req.body;
    if (observacao != null && typeof observacao === 'string' && observacao.length > 2000) {
      return res.status(400).json({ error: 'observacao excede o limite de 2000 caracteres.' });
    }
    const [result] = await db.execute(
      'UPDATE empresa_favoritos SET entrevista_data_hora = ?, entrevista_observacao = ? WHERE empresa_id = ? AND aluno_id = ?',
      [data_hora || null, observacao || null, req.params.id, req.params.alunoId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Favorito não encontrado.' });
    }
    res.json({ data_hora: data_hora || null, observacao: observacao || null });
  } catch (error) {
    _falha(res, error);
  }
});

app.post('/empresas/:id/favoritos', exigirDono('empresa'), async (req, res) => {
  try {
    const { aluno_id } = req.body;
    if (!aluno_id) return res.status(400).json({ error: 'aluno_id é obrigatório.' });
    await db.execute(
      'INSERT IGNORE INTO empresa_favoritos (empresa_id, aluno_id) VALUES (?, ?)',
      [req.params.id, aluno_id]
    );
    res.status(201).json({ favoritado: true });
  } catch (error) {
    _falha(res, error);
  }
});

app.delete('/empresas/:id/favoritos/:alunoId', exigirDono('empresa'), async (req, res) => {
  try {
    await db.execute(
      'DELETE FROM empresa_favoritos WHERE empresa_id = ? AND aluno_id = ?',
      [req.params.id, req.params.alunoId]
    );
    res.json({ favoritado: false });
  } catch (error) {
    _falha(res, error);
  }
});

// ─── ALUNO — EMPRESAS QUE VISUALIZARAM O PERFIL ──────────────────────────────
app.get('/alunos/:id/visualizacoes', exigirDono('aluno'), async (req, res) => {
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
    _falha(res, error);
  }
});

// ─── ALUNO — VAGAS E INTERESSE (base do chat por match mútuo) ────────────────
app.get('/alunos/:id/vagas', exigirDono('aluno'), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT v.id, v.empresa_id, v.titulo, v.descricao, v.curso_preferido, v.semestre_minimo, v.criado_em,
             e.nome_fantasia AS empresa_nome, af.nome AS area_foco_nome, tv.nome AS tipo_vaga_nome,
             (vi.id IS NOT NULL) AS tenho_interesse
      FROM empresa_vagas v
      JOIN empresas e ON e.id = v.empresa_id
      LEFT JOIN dom_areas_foco af ON v.area_foco_id = af.id
      LEFT JOIN dom_tipos_vaga tv ON v.tipo_vaga_id = tv.id
      LEFT JOIN vaga_interesses vi ON vi.vaga_id = v.id AND vi.aluno_id = ?
      WHERE v.status = 'aberta'
      ORDER BY v.criado_em DESC
    `, [req.params.id]);

    // Compatibilidade do próprio aluno com cada vaga (mesma régua do lado empresa).
    if (rows.length) {
      const [[med]] = await db.execute(
        `SELECT ROUND(AVG(${mencaoParaNotaSQL('mencao')}), 1) AS media_geral FROM boletim WHERE aluno_id = ?`,
        [req.params.id]
      );
      const [[al]] = await db.execute('SELECT curso, semestre_atual FROM alunos WHERE id = ?', [req.params.id]);
      const d = (await _dadosCompatAlunos([req.params.id]))[Number(req.params.id)] || {};
      const dadosAluno = {
        area_interesse_nome: d.area_interesse_nome, curso: al?.curso, semestre: al?.semestre_atual,
        media_geral: med?.media_geral, frequencia: d.frequencia, perfil_dominante: d.perfil_dominante
      };
      const empresaIds = [...new Set(rows.map(r => r.empresa_id))];
      const perfisPorEmpresa = {};
      if (empresaIds.length) {
        const ph = empresaIds.map(() => '?').join(',');
        const [pr] = await db.execute(
          `SELECT empresa_id, perfil FROM empresa_perfis_procurados WHERE empresa_id IN (${ph}) ORDER BY ordem`,
          empresaIds
        );
        pr.forEach(r => { (perfisPorEmpresa[r.empresa_id] = perfisPorEmpresa[r.empresa_id] || []).push(r.perfil); });
      }
      rows.forEach(r => {
        r.compatibilidade = _calcularCompatibilidade(dadosAluno, {
          origem: 'vaga', area_foco_nome: r.area_foco_nome,
          curso_preferido: r.curso_preferido, semestre_minimo: r.semestre_minimo,
          perfis_procurados: perfisPorEmpresa[r.empresa_id] || []
        });
      });
    }

    res.json(rows);
  } catch (error) {
    _falha(res, error);
  }
});

app.post('/alunos/:id/vagas/:vagaId/interesse', exigirDono('aluno'), async (req, res) => {
  try {
    const [[vaga]] = await db.execute(
      "SELECT id, empresa_id FROM empresa_vagas WHERE id = ? AND status = 'aberta'",
      [req.params.vagaId]
    );
    if (!vaga) return res.status(404).json({ error: 'Vaga não encontrada ou fechada.' });
    await db.execute(
      'INSERT IGNORE INTO vaga_interesses (vaga_id, aluno_id) VALUES (?, ?)',
      [req.params.vagaId, req.params.id]
    );
    const novasConversas = await _processarMatchVagas(req.params.id, vaga.empresa_id);
    res.status(201).json({ interesse: true, match: novasConversas.length > 0 });
  } catch (error) {
    _falha(res, error);
  }
});

app.delete('/alunos/:id/vagas/:vagaId/interesse', exigirDono('aluno'), async (req, res) => {
  try {
    await db.execute(
      'DELETE FROM vaga_interesses WHERE vaga_id = ? AND aluno_id = ?',
      [req.params.vagaId, req.params.id]
    );
    res.json({ interesse: false });
  } catch (error) {
    _falha(res, error);
  }
});

// ─── TALENTOS — PERFIL COMPLETO PARA EMPRESA ─────────────────────────────────
app.get('/talentos/aluno/:id/perfil', async (req, res) => {
  try {
    // Colunas explícitas (achado D6) — este perfil público nunca devolve
    // avatar_base64 nem os outros campos do aluno, então não precisa buscá-los.
    const [alunoRows] = await db.execute(
      'SELECT id, nome, curso, semestre_atual, github, linkedin FROM alunos WHERE id = ? AND permitir_exibicao_ranking = 1', [req.params.id]
    );
    if (!alunoRows.length) return res.status(404).json({ error: 'Perfil não disponível.' });
    const aluno = alunoRows[0];

    // Métricas
    const [metRows] = await db.execute(`
      SELECT
        ROUND(AVG(${mencaoParaNotaSQL("mencao")}), 1) AS media_geral,
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
        SELECT a.id, AVG(${mencaoParaNotaSQL("b.mencao")}) AS pts
        FROM alunos a JOIN boletim b ON a.id = b.aluno_id GROUP BY a.id
        HAVING pts > (
          SELECT COALESCE(AVG(${mencaoParaNotaSQL("mencao")}),0)
          FROM boletim WHERE aluno_id = ?
        )
      ) sub
    `, [req.params.id]);

    // Disciplinas de destaque
    const [discRows] = await db.execute(`
      SELECT d.nome_materia,
        ROUND(${mencaoParaNotaSQL("b.mencao")}, 1) AS nota,
        b.mencao
      FROM boletim b JOIN disciplinas d ON b.disciplina_id = d.id
      WHERE b.aluno_id = ? AND b.mencao IN ('SS','MS')
      ORDER BY nota DESC LIMIT 6
    `, [req.params.id]);

    const metricas = metRows[0];
    metricas.frequencia = Math.max(0, 100 - (metricas.total_faltas || 0) * 2);

    // Área de trabalho de interesse — definida pelo aluno no Perfil Profissional (ATS)
    const [[ppArea]] = await db.execute(`
      SELECT af.nome AS area_interesse_nome
      FROM perfil_profissional pp
      LEFT JOIN dom_areas_foco af ON af.id = pp.area_interesse_id
      WHERE pp.aluno_id = ?
    `, [req.params.id]);

    const payload = {
      id: aluno.id, nome: aluno.nome, curso: aluno.curso,
      semestre: aluno.semestre_atual, github: aluno.github, linkedin: aluno.linkedin,
      area_interesse: ppArea?.area_interesse_nome || null,
      metricas, posicao_ranking: rankRows[0]?.posicao || '—',
      disciplinas_destaque: discRows
    };

    // Compatibilidade com detalhamento (breakdown) — só pra empresa logada.
    const quemPede = _identidadeOpcional(req);
    if (quemPede && quemPede.tipo === 'empresa') {
      const alvo = await _alvoCompatDaEmpresa(quemPede.id, req.query.vaga_id ? parseInt(req.query.vaga_id) : null);
      if (alvo) {
        const d = (await _dadosCompatAlunos([req.params.id]))[Number(req.params.id)] || {};
        payload.compatibilidade = _calcularCompatibilidade({
          area_interesse_nome: ppArea?.area_interesse_nome || null,
          curso: aluno.curso, semestre: aluno.semestre_atual,
          media_geral: metricas.media_geral, frequencia: metricas.frequencia,
          perfil_dominante: d.perfil_dominante
        }, alvo);
      }
    }

    res.json(payload);
  } catch (error) {
    _falha(res, error);
  }
});

// ─── PROFESSOR — EDITAR LANÇAMENTOS DO BOLETIM ───────────────────────────────
app.get('/professores/:profId/lancamentos', exigirDono('professor', 'profId'), async (req, res) => {
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
    _falha(res, error);
  }
});

app.put('/professores/:profId/disciplinas/:discId/alunos/:alunoId/boletim', exigirDono('professor', 'profId'), async (req, res) => {
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

    // Achados P1/P3: a nota só afeta o ranking quando a menção muda — recalcula
    // a posição deste aluno e invalida o cache do /ranking aqui (não mais a
    // cada GET de notificações via polling).
    if ('mencao' in req.body) {
      await _atualizarPosicaoRanking(req.params.alunoId);
      _invalidarCacheRanking();
    }

    res.json({ mensagem: 'Lançamento atualizado com sucesso.' });
  } catch (error) {
    _falha(res, error);
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
    _falha(res, error);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MÓDULO ADMIN ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Tokens de sessão em memória: Map< token, { adminId, nome } >
// Simples e suficiente para projeto acadêmico sem JWT
const _adminSessions = new Map();

function _gerarToken() {
  return crypto.randomBytes(32).toString('hex'); // token de sessão imprevisível (256 bits)
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
app.post('/admin/login', limiteLogin, async (req, res) => {
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
    if (!admin || !_verificarSenha(senha, admin.senha)) {
      return res.status(401).json({ sucesso: false, mensagem: 'Credenciais inválidas.' });
    }
    if (!_senhaEhHashBcrypt(admin.senha)) { // migração preguiçosa (S4/D1)
      await db.execute('UPDATE administradores SET senha = ? WHERE id = ?', [bcrypt.hashSync(senha, 10), admin.id]);
    }
    const token = _gerarToken();
    _adminSessions.set(token, { adminId: admin.id, nome: admin.nome });
    console.log(`[ADMIN LOGIN] ${admin.nome} (id=${admin.id})`);
    res.json({ sucesso: true, token, admin: { id: admin.id, nome: admin.nome } });
  } catch (error) {
    _falha(res, error, { sucesso: false }); // _falha já loga o erro — evita log duplicado
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
    _falha(res, error);
  }
});

// GET /admin/contratacoes — acompanhamento cruzado (todas as empresas), pra
// aba "Contratações" do admin e pro CSV. É a base de dados real do pitch
// "8/9 em cada 10 são contratados" — sem isso a promessa não tem lastro.
app.get('/admin/contratacoes', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT c.id AS checkin_id, e.razao_social AS empresa_nome, a.nome AS aluno_nome,
             c.marcado_contratado_em, c.continua_na_empresa, c.respondido_em, c.proximo_checkin_em,
             (c.respondido_em IS NULL AND c.proximo_checkin_em <= CURDATE()) AS pendente
      FROM contratacoes_checkins c
      JOIN empresas e ON e.id = c.empresa_id
      JOIN alunos a ON a.id = c.aluno_id
      ORDER BY c.marcado_contratado_em DESC`);
    res.json(rows);
  } catch (error) {
    _falha(res, error);
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
    const token = _criarSessao('empresa', empresa.id); // sem isto, S1 bloqueia toda rota da empresa impersonada
    res.json({ sucesso: true, token, empresa: pub });
  } catch (error) {
    _falha(res, error, { sucesso: false });
  }
});

// GET /admin/alunos  — lista todos os alunos para o painel
app.get('/admin/alunos', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT a.id, a.nome, a.email, a.matricula, a.curso, a.semestre_atual AS semestre, a.situacao,
              av.respondido_em AS perfil_respondido_em, av.valido_ate AS perfil_valido_ate, av.perfil_dominante
       FROM alunos a
       LEFT JOIN avaliacoes_comportamentais av ON av.id = (
         SELECT id FROM avaliacoes_comportamentais WHERE aluno_id = a.id ORDER BY respondido_em DESC LIMIT 1
       )
       ORDER BY a.nome`
    );
    res.json(rows);
  } catch (error) {
    _falha(res, error);
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
    _falha(res, error);
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
    const token = _criarSessao('aluno', aluno.id); // sem isto, S1 bloqueia toda rota do aluno impersonado
    res.json({ sucesso: true, token, usuario: { id: aluno.id, nome: aluno.nome, tipo: 'aluno' } });
  } catch (error) {
    _falha(res, error, { sucesso: false });
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
    const token = _criarSessao('professor', prof.id); // sem isto, S1 bloqueia toda rota do professor impersonado
    res.json({ sucesso: true, token, usuario: { id: prof.id, nome: prof.nome, tipo: 'professor' } });
  } catch (error) {
    _falha(res, error, { sucesso: false });
  }
});

// GET /admin/chamados — lista todos os chamados de suporte para o painel
app.get('/admin/chamados', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, nome, email, categoria, prioridade, assunto, descricao, origem, status, criado_em
       FROM chamados_suporte
       ORDER BY criado_em DESC`
    );
    res.json(rows);
  } catch (error) {
    _falha(res, error);
  }
});

const STATUS_CHAMADO_VALIDOS = ['aberto', 'em_andamento', 'concluido'];

// PUT /admin/chamados/:id/status — move o chamado entre as colunas do quadro
app.put('/admin/chamados/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUS_CHAMADO_VALIDOS.includes(status)) {
      return res.status(400).json({ sucesso: false, mensagem: 'status inválido.' });
    }
    const [result] = await db.execute(
      'UPDATE chamados_suporte SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Chamado não encontrado.' });
    }
    console.log(`[ADMIN CHAMADO] ${req.adminSession.nome} moveu chamado #${req.params.id} → ${status}`);
    res.json({ sucesso: true, status });
  } catch (error) {
    _falha(res, error, { sucesso: false });
  }
});

// ─── FIM DO MÓDULO ADMIN ──────────────────────────────────────────────────────

// ─── PERFIL PROFISSIONAL ──────────────────────────────────────────────────────

// GET /alunos/:id/perfil-profissional — retorna todos os dados do perfil
// Sem dono fixo (mesmo caso do desempenho-semestral): o Portal de Talentos
// mostra o perfil ATS de qualquer candidato que optou por exibição pública.
app.get('/alunos/:id/perfil-profissional', async (req, res) => {
  const { id } = req.params;
  try {
    const [[permissao]] = await db.execute('SELECT permitir_exibicao_ranking FROM alunos WHERE id = ?', [id]);
    if (!permissao) return res.status(404).json({ error: 'Aluno não encontrado.' });
    const quemPede = _identidadeOpcional(req);
    const podeVerSempre = quemPede && (
      (quemPede.tipo === 'aluno' && quemPede.id === String(id)) || quemPede.tipo === 'professor'
    );
    if (!podeVerSempre && !permissao.permitir_exibicao_ranking) {
      return res.status(403).json({ error: 'Perfil não disponível publicamente.' });
    }

    const [[pp]]   = await db.execute(`
      SELECT pp.resumo, pp.area_interesse_id, af.nome AS area_interesse_nome
      FROM perfil_profissional pp
      LEFT JOIN dom_areas_foco af ON af.id = pp.area_interesse_id
      WHERE pp.aluno_id = ?
    `, [id]);
    const [exps]   = await db.execute('SELECT empresa, cargo, periodo_inicio, periodo_fim, descricao FROM pp_experiencias WHERE aluno_id = ? ORDER BY id', [id]);
    const [forms]  = await db.execute('SELECT curso, instituicao, periodo_inicio, periodo_fim FROM pp_formacoes WHERE aluno_id = ? ORDER BY id', [id]);
    const [idioms] = await db.execute('SELECT idioma, nivel FROM pp_idiomas WHERE aluno_id = ? ORDER BY id', [id]);
    const [habs]   = await db.execute('SELECT habilidade FROM pp_habilidades WHERE aluno_id = ? ORDER BY id', [id]);
    const [certs]  = await db.execute('SELECT nome, instituicao, data_emissao FROM pp_certificacoes WHERE aluno_id = ? ORDER BY id', [id]);

    res.json({
      resumo:             pp?.resumo              || '',
      area_interesse_id:  pp?.area_interesse_id    || null,
      area_interesse_nome: pp?.area_interesse_nome || null,
      experiencias:    exps,
      formacoes:       forms,
      idiomas:         idioms,
      habilidades:     habs.map(h => h.habilidade),
      certificacoes:   certs
    });
  } catch (err) {
    _falha(res, err); // padronizado (achado do polimento) — antes devolvia {erro} em vez de {error}
  }
});

// PUT /alunos/:id/perfil-profissional — salva (delete + insert) todos os dados
app.put('/alunos/:id/perfil-profissional', exigirDono('aluno'), async (req, res) => {
  const { id } = req.params;
  const { resumo = '', area_interesse_id = null, experiencias = [], formacoes = [], idiomas = [], habilidades = [], certificacoes = [] } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Upsert do resumo + área de interesse
    await conn.execute(
      `INSERT INTO perfil_profissional (aluno_id, resumo, area_interesse_id) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE resumo = VALUES(resumo), area_interesse_id = VALUES(area_interesse_id)`,
      [id, resumo, area_interesse_id || null]
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
    _falha(res, err); // padronizado (achado do polimento) — antes devolvia {erro} em vez de {error}
  } finally {
    conn.release();
  }
});

// POST /alunos/:id/perfil-profissional/upload-pdf — extrai texto do PDF do LinkedIn
// ─── Parser de PDF do LinkedIn — extraído em funções nomeadas (polimento) ────
// Mesma lógica de antes, só reorganizada: era ~200 linhas dentro do handler da
// rota, virou 1 função por seção do currículo. Nenhuma regex ou ordem de
// verificação mudou — testado com PDF real antes/depois, saída idêntica.

// Acha o índice da primeira ocorrência de cada seção e devolve uma função
// `slice(chave)` que corta as linhas daquela seção até a próxima seção.
function _pdfDividirSecoes(linhas) {
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
  return (key) => {
    const s = idx[key];
    if (s === undefined) return [];
    const nexts = Object.values(idx).filter(n => n > s);
    return linhas.slice(s + 1, nexts.length ? Math.min(...nexts) : linhas.length);
  };
}

// Predicados auxiliares compartilhados por todas as seções.
const _pdfEhPagina = l => /^Page\s+\d+\s+of\s+\d+$/i.test(l);
const _pdfEhDuracao = l => /^\d+\s+(ano|mês|mes|month|year)/i.test(l);
const _pdfEhData = l => /\b(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|jun|jul|ago|set|out|nov|dez)\b.{0,60}(\d{4}|present|atual)/i.test(l);
const _pdfEhLocal = l => /,\s*(brasil|brazil|distrito federal|são paulo|rio de janeiro|minas gerais|\bsp\b|\brj\b|\bdf\b|\bmg\b|\brs\b|\bpr\b|\bba\b|\bce\b|\bpe\b)/i.test(l);

function _pdfParsearResumo(slice) {
  return slice('resumo')
    .filter(l => !_pdfEhPagina(l) && !/^(E-mail|GitHub|http|www\.)/i.test(l))
    .join(' ').replace(/\s+/g, ' ').trim();
}

function _pdfParsearHabilidades(slice) {
  return slice('habilidades')
    .filter(l => l.length > 1 && l.length < 100 && !_pdfEhPagina(l));
}

function _pdfParsearIdiomas(slice) {
  const nivelRx = /nativo|fluente|avançado|intermediário|básico|native|fluent|advanced|intermediate|beginner|professional|working/i;
  const idiomas = [];
  const idiomasLinhas = slice('idiomas');
  for (let i = 0; i < idiomasLinhas.length; i++) {
    const curr = idiomasLinhas[i], prox = idiomasLinhas[i + 1] || '';
    if (_pdfEhPagina(curr)) continue;
    if (nivelRx.test(prox)) { idiomas.push({ idioma: curr, nivel: prox }); i++; }
    else if (curr.length > 1 && curr.length < 60 && !nivelRx.test(curr)) idiomas.push({ idioma: curr, nivel: '' });
  }
  return idiomas;
}

// Padrões do LinkedIn:
//   Empresa com múltiplos cargos: EMPRESA → duração total → Cargo → data → local → desc
//   Empresa com cargo único:      EMPRESA → Cargo → data → local → desc
function _pdfParsearExperiencias(slice) {
  const expLinhas = slice('experiencia').filter(l => !_pdfEhPagina(l));
  const experiencias = [];
  let empresaCtx = '';
  let ei = 0;

  const addExp = (emp, cargo, periodoLinha, startDesc) => {
    const desc = [];
    while (startDesc < expLinhas.length) {
      const dl = expLinhas[startDesc];
      if (_pdfEhDuracao(dl)) break;                                    // cabeçalho de nova empresa
      if (_pdfEhDuracao(expLinhas[startDesc + 1] || '')) break;       // próxima linha é nova empresa
      if (_pdfEhData(expLinhas[startDesc + 1] || '')) break;      // próxima linha é data → novo cargo
      // padrão empresa→cargo→data: dl é empresa, dl+1 é cargo, dl+2 é data
      if (_pdfEhData(expLinhas[startDesc + 2] || '') &&
          !_pdfEhData(expLinhas[startDesc + 1] || '') &&
          !_pdfEhDuracao(expLinhas[startDesc + 1] || '')) break;
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

    if (_pdfEhDuracao(l)) { ei++; continue; }

    // Empresa com múltiplos cargos: próxima linha é duração total
    if (_pdfEhDuracao(p1)) {
      empresaCtx = l;
      ei += 2;
      continue;
    }

    // Cargo com data logo em seguida: l=cargo, p1=data
    if (_pdfEhData(p1)) {
      const cursor = _pdfEhLocal(p2) ? ei + 3 : ei + 2;
      ei = addExp(empresaCtx, l, p1, cursor);
      continue;
    }

    // Empresa → cargo → data (cargo único, sem duração total): l=empresa, p1=cargo, p2=data
    if (_pdfEhData(p2) && !_pdfEhData(p1) && !_pdfEhDuracao(p1)) {
      empresaCtx = l;
      const cursor = _pdfEhLocal(expLinhas[ei + 3] || '') ? ei + 4 : ei + 3;
      ei = addExp(l, p1, p2, cursor);
      empresaCtx = '';
      continue;
    }

    // Fallback: linha isolada é empresa
    empresaCtx = l;
    ei++;
  }
  return experiencias;
}

// Padrão LinkedIn: Instituição\nGrau, Área · (data_inicio - data_fim)
function _pdfParsearFormacoes(slice) {
  const grauRx = /bacharelado|licenciatura|tecnólogo|tecnologia|mba|pós.graduação|especialização|curso|técnico|mestrado|doutorado|assistente|ensino médio|médio completo|bachelor|master|phd/i;
  const formLinhas = slice('formacao').filter(l => !_pdfEhPagina(l));
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
  return formacoes;
}

// LinkedIn exporta certs em dois formatos:
//   Sidebar (sem datas): só nomes, um por linha, possível multi-linha
//   Completo (com datas): Nome → Instituição → "Emitido em Month Year · ..."
function _pdfParsearCertificacoes(slice) {
  const certLinhasRaw = slice('certs').filter(l => !_pdfEhPagina(l) && l.length > 1);
  const isEmitido     = l => /emitido\s+em|emiss[aã]o|issued/i.test(l);
  const isNoiseLine   = l => /[|@]/.test(l) || _pdfEhLocal(l) || /^(http|www\.)/i.test(l) || l.length > 180;
  const certificacoes = [];
  const hasDates      = certLinhasRaw.some(l => _pdfEhData(l) || isEmitido(l));

  if (hasDates) {
    // Formato completo: Nome → [Instituição] → [Emitido em ...]
    let ci = 0;
    while (ci < certLinhasRaw.length) {
      const nome = certLinhasRaw[ci++];
      if (!nome || nome.length < 2 || isNoiseLine(nome)) continue;
      let instituicao = '';
      let data_emissao = '';
      const p1 = certLinhasRaw[ci] || '';
      if (p1 && !_pdfEhData(p1) && !isEmitido(p1) && !p1.startsWith('(') && !isNoiseLine(p1)) {
        instituicao = p1;
        ci++;
      }
      const p2 = certLinhasRaw[ci] || '';
      if (p2 && (_pdfEhData(p2) || isEmitido(p2))) {
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
      if (/\|/.test(next) || _pdfEhLocal(next)) continue;
      // Continuação de cert anterior: linha começa com (
      if (l.startsWith('(') && certificacoes.length > 0) {
        certificacoes[certificacoes.length - 1].nome += ' ' + l;
        continue;
      }
      certificacoes.push({ nome: l, instituicao: '', data_emissao: '' });
    }
  }
  return certificacoes;
}

app.post('/alunos/:id/perfil-profissional/upload-pdf', exigirDono('aluno'), _pdfUpload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });
  try {
    const { text } = await pdfParse(req.file.buffer);
    const linhas = text.split('\n').map(l => l.trim()).filter(Boolean);
    const slice = _pdfDividirSecoes(linhas);

    const resumo         = _pdfParsearResumo(slice);
    const habilidades    = _pdfParsearHabilidades(slice);
    const idiomas        = _pdfParsearIdiomas(slice);
    const experiencias   = _pdfParsearExperiencias(slice);
    const formacoes      = _pdfParsearFormacoes(slice);
    const certificacoes  = _pdfParsearCertificacoes(slice);

    res.json({ resumo, habilidades, idiomas, experiencias, formacoes, certificacoes });
  } catch (err) {
    _falha(res, err); // padronizado (achado do polimento) — antes devolvia {erro} em vez de {error}
  }
});

// ─── FIM DO MÓDULO PERFIL PROFISSIONAL ───────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT — aluno↔aluno (respeita alunos.permitir_contato) e aluno↔professor (sempre livre)
// Mensagens e anexos ficam criptografados em repouso (ver crypto-chat.js).
// ═══════════════════════════════════════════════════════════════════════════════

async function _nomeParticipante(tipo, id) {
  if (tipo === 'empresa') {
    const [[row]] = await db.execute('SELECT nome_fantasia FROM empresas WHERE id = ?', [id]);
    return row?.nome_fantasia || '—';
  }
  const tabela = tipo === 'professor' ? 'professores' : 'alunos';
  const [[row]] = await db.execute(`SELECT nome FROM ${tabela} WHERE id = ?`, [id]);
  return row?.nome || '—';
}

// Ordena o par de participantes de forma consistente (independe de quem inicia a
// conversa) pra bater sempre na mesma linha da UNIQUE KEY de `conversas`.
function _ordenarPar(tipo1, id1, tipo2, id2) {
  const chave = (t, i) => `${t}-${String(i).padStart(10, '0')}`;
  return chave(tipo1, id1) <= chave(tipo2, id2)
    ? { p1t: tipo1, p1i: id1, p2t: tipo2, p2i: id2 }
    : { p1t: tipo2, p1i: id2, p2t: tipo1, p2i: id1 };
}

// Só o par aluno↔aluno respeita o toggle — professor é sempre contatável e sempre
// pode contatar, nos dois sentidos.
async function _contatoPermitido(tipo1, id1, tipo2, id2) {
  if (tipo1 !== 'aluno' || tipo2 !== 'aluno') return true;
  const [[a1]] = await db.execute('SELECT permitir_contato FROM alunos WHERE id = ?', [id1]);
  const [[a2]] = await db.execute('SELECT permitir_contato FROM alunos WHERE id = ?', [id2]);
  return (a1?.permitir_contato ?? 1) != 0 && (a2?.permitir_contato ?? 1) != 0;
}

// Chat aluno↔empresa é diferente do aluno↔professor: nunca livre, só abre por
// match mútuo (empresa avançou o favorito além de "novo" E o aluno demonstrou
// interesse numa vaga daquela empresa). Chamada tanto de POST /alunos/:id/vagas/
// :vagaId/interesse quanto de PUT /empresas/:id/favoritos/:alunoId/status —
// cada uma cobre o lado que acabou de mudar, checando se o outro lado já batia.
// Cria uma conversa por vaga (não uma DM genérica pro par aluno-empresa).
async function _processarMatchVagas(alunoId, empresaId) {
  const [[fav]] = await db.execute(
    'SELECT status FROM empresa_favoritos WHERE empresa_id = ? AND aluno_id = ?',
    [empresaId, alunoId]
  );
  if (!fav || fav.status === 'novo' || fav.status === 'descartado') return [];

  const [vagasSemConversa] = await db.execute(`
    SELECT vi.vaga_id
    FROM vaga_interesses vi
    JOIN empresa_vagas v ON v.id = vi.vaga_id
    WHERE vi.aluno_id = ? AND v.empresa_id = ?
      AND NOT EXISTS (
        SELECT 1 FROM conversas c
        WHERE c.vaga_id = vi.vaga_id
          AND ((c.participante1_tipo = 'aluno'   AND c.participante1_id = ?) OR (c.participante2_tipo = 'aluno'   AND c.participante2_id = ?))
          AND ((c.participante1_tipo = 'empresa' AND c.participante1_id = ?) OR (c.participante2_tipo = 'empresa' AND c.participante2_id = ?))
      )
  `, [alunoId, empresaId, alunoId, alunoId, empresaId, empresaId]);

  const novasConversas = [];
  for (const { vaga_id } of vagasSemConversa) {
    const { p1t, p1i, p2t, p2i } = _ordenarPar('aluno', alunoId, 'empresa', empresaId);
    const [result] = await db.execute(
      'INSERT INTO conversas (participante1_tipo, participante1_id, participante2_tipo, participante2_id, vaga_id) VALUES (?, ?, ?, ?, ?)',
      [p1t, p1i, p2t, p2i, vaga_id]
    );
    novasConversas.push(result.insertId);
    await _criarNotificacao('aluno', alunoId, 'match_vaga',
      'Vocês têm interesse mútuo!', 'Uma empresa quer conversar sobre uma vaga com você.', result.insertId);
    await _criarNotificacao('empresa', empresaId, 'match_vaga',
      'Vocês têm interesse mútuo!', 'Um candidato quer conversar sobre uma vaga.', result.insertId);
  }
  return novasConversas;
}

// GET /chat/contatos/:tipo/:id — quem esse usuário pode iniciar uma conversa nova
app.get('/chat/contatos/:tipo/:id', exigirAutenticacao(['aluno', 'professor']), async (req, res) => {
  try {
    const { tipo, id } = req.usuarioAutenticado; // ignora :tipo/:id da URL — identidade vem do token (S1)
    if (tipo === 'professor') {
      const [alunos] = await db.execute('SELECT id, nome FROM alunos ORDER BY nome');
      return res.json({ alunos, professores: [] });
    }
    const [professores] = await db.execute('SELECT id, nome FROM professores ORDER BY nome');
    const [alunos] = await db.execute('SELECT id, nome, permitir_contato FROM alunos WHERE id != ? ORDER BY nome', [id]);
    res.json({ professores, alunos });
  } catch (error) {
    _falha(res, error);
  }
});

// GET /chat/conversas/participante/:tipo/:id — lista de conversas existentes, mais recente primeiro
// (rota com prefixo "participante" pra não colidir com /chat/conversas/:conversaId/mensagens,
// que tem a mesma quantidade de segmentos de URL)
app.get('/chat/conversas/participante/:tipo/:id', exigirAutenticacao(['aluno', 'professor', 'empresa']), async (req, res) => {
  try {
    const { tipo, id } = req.usuarioAutenticado; // ignora :tipo/:id da URL — identidade vem do token (S1)
    const [rows] = await db.execute(`
      SELECT * FROM conversas
      WHERE (participante1_tipo = ? AND participante1_id = ?)
         OR (participante2_tipo = ? AND participante2_id = ?)
      ORDER BY COALESCE(ultima_mensagem_em, criado_em) DESC
    `, [tipo, id, tipo, id]);

    const conversas = await Promise.all(rows.map(async c => {
      const souP1 = c.participante1_tipo === tipo && c.participante1_id == id;
      const outroTipo = souP1 ? c.participante2_tipo : c.participante1_tipo;
      const outroId   = souP1 ? c.participante2_id   : c.participante1_id;
      const outroNome = await _nomeParticipante(outroTipo, outroId);

      const [[ultima]] = await db.execute(
        'SELECT texto_cifrado, iv, auth_tag, anexo_id, criado_em FROM mensagens WHERE conversa_id = ? ORDER BY id DESC LIMIT 1',
        [c.id]
      );
      const [[naoLidas]] = await db.execute(
        'SELECT COUNT(*) AS n FROM mensagens WHERE conversa_id = ? AND remetente_tipo != ? AND lida = 0',
        [c.id, tipo]
      );

      let previa = ultima?.anexo_id ? '📎 Anexo' : '';
      if (ultima?.texto_cifrado) {
        try { previa = chatCrypto.decryptTexto(ultima.texto_cifrado, ultima.iv, ultima.auth_tag); } catch (_) { previa = ''; }
      }

      return {
        id: c.id, outro_tipo: outroTipo, outro_id: outroId, outro_nome: outroNome,
        previa: previa.slice(0, 80), ultima_em: ultima?.criado_em || c.criado_em,
        nao_lidas: naoLidas.n
      };
    }));

    res.json(conversas);
  } catch (error) {
    _falha(res, error);
  }
});

// POST /chat/conversas — obtém a conversa entre dois participantes, criando se necessário
app.post('/chat/conversas', exigirAutenticacao(['aluno', 'professor']), async (req, res) => {
  try {
    const { tipo: meu_tipo, id: meu_id } = req.usuarioAutenticado; // identidade vem do token (S1), não do body
    const { outro_tipo, outro_id } = req.body;
    if (!outro_tipo || !outro_id) {
      return res.status(400).json({ error: 'outro_tipo e outro_id são obrigatórios.' });
    }
    if (!(await _contatoPermitido(meu_tipo, meu_id, outro_tipo, outro_id))) {
      return res.status(403).json({ error: 'Este aluno desativou o contato de colegas.' });
    }
    const { p1t, p1i, p2t, p2i } = _ordenarPar(meu_tipo, meu_id, outro_tipo, outro_id);

    const [existente] = await db.execute(
      'SELECT id FROM conversas WHERE participante1_tipo=? AND participante1_id=? AND participante2_tipo=? AND participante2_id=?',
      [p1t, p1i, p2t, p2i]
    );
    if (existente.length) return res.json({ conversa_id: existente[0].id });

    const [result] = await db.execute(
      'INSERT INTO conversas (participante1_tipo, participante1_id, participante2_tipo, participante2_id) VALUES (?, ?, ?, ?)',
      [p1t, p1i, p2t, p2i]
    );
    res.status(201).json({ conversa_id: result.insertId });
  } catch (error) {
    _falha(res, error);
  }
});

// GET /chat/conversas/:conversaId/mensagens?meu_tipo=&meu_id=&apos_id=
app.get('/chat/conversas/:conversaId/mensagens', exigirAutenticacao(['aluno', 'professor', 'empresa']), async (req, res) => {
  try {
    const { conversaId } = req.params;
    const { apos_id } = req.query;
    const { tipo: meu_tipo, id: meu_id } = req.usuarioAutenticado; // identidade vem do token (S1), não da query

    const [[conversa]] = await db.execute('SELECT * FROM conversas WHERE id = ?', [conversaId]);
    if (!conversa) return res.status(404).json({ error: 'Conversa não encontrada.' });
    const souParticipante =
      (conversa.participante1_tipo === meu_tipo && conversa.participante1_id == meu_id) ||
      (conversa.participante2_tipo === meu_tipo && conversa.participante2_id == meu_id);
    if (!souParticipante) return res.status(403).json({ error: 'Você não faz parte desta conversa.' });

    const params = [conversaId];
    let filtroApos = '';
    if (apos_id) { filtroApos = 'AND m.id > ?'; params.push(apos_id); }

    const [rows] = await db.execute(`
      SELECT m.id, m.remetente_tipo, m.remetente_id, m.texto_cifrado, m.iv, m.auth_tag, m.lida, m.criado_em,
             a.id AS anexo_id, a.nome_original, a.tamanho_bytes, a.expira_em, a.removido_em
      FROM mensagens m
      LEFT JOIN mensagem_anexos a ON a.id = m.anexo_id
      WHERE m.conversa_id = ? ${filtroApos}
      ORDER BY m.id ASC
    `, params);

    const mensagens = rows.map(m => {
      let texto = '';
      if (m.texto_cifrado) {
        try { texto = chatCrypto.decryptTexto(m.texto_cifrado, m.iv, m.auth_tag); } catch (_) { texto = '⚠️ Não foi possível decifrar esta mensagem.'; }
      }
      return {
        id: m.id, remetente_tipo: m.remetente_tipo, remetente_id: m.remetente_id,
        texto, lida: !!m.lida, criado_em: m.criado_em,
        anexo: m.anexo_id ? {
          id: m.anexo_id, nome: m.nome_original, tamanho_bytes: m.tamanho_bytes,
          expirado: !!m.removido_em || new Date(m.expira_em) < new Date()
        } : null
      };
    });
    res.json(mensagens);
  } catch (error) {
    _falha(res, error);
  }
});

// POST /chat/conversas/:conversaId/mensagens — envia uma mensagem (texto e/ou anexo)
app.post('/chat/conversas/:conversaId/mensagens', exigirAutenticacao(['aluno', 'professor', 'empresa']), async (req, res) => {
  try {
    const { conversaId } = req.params;
    const { texto, anexo_id } = req.body;
    // Identidade do remetente vem do token (S1) — antes vinha do body, permitindo
    // mandar mensagem se passando por qualquer outra pessoa.
    const { tipo: remetente_tipo, id: remetente_id } = req.usuarioAutenticado;
    if (!texto?.trim() && !anexo_id) return res.status(400).json({ error: 'Mensagem vazia.' });

    const [[conversa]] = await db.execute('SELECT * FROM conversas WHERE id = ?', [conversaId]);
    if (!conversa) return res.status(404).json({ error: 'Conversa não encontrada.' });

    const souP1 = conversa.participante1_tipo === remetente_tipo && conversa.participante1_id == remetente_id;
    const souP2 = conversa.participante2_tipo === remetente_tipo && conversa.participante2_id == remetente_id;
    if (!souP1 && !souP2) return res.status(403).json({ error: 'Você não faz parte desta conversa.' });
    const destinatarioTipo = souP1 ? conversa.participante2_tipo : conversa.participante1_tipo;
    const destinatarioId   = souP1 ? conversa.participante2_id   : conversa.participante1_id;

    // Revalida a permissão a cada envio — cobre o caso do aluno desligar o toggle
    // depois que a conversa já existia.
    if (!(await _contatoPermitido(remetente_tipo, remetente_id, destinatarioTipo, destinatarioId))) {
      return res.status(403).json({ error: 'Este aluno desativou o contato de colegas.' });
    }

    let textoCifrado = null, iv = null, authTag = null;
    if (texto?.trim()) {
      const enc = chatCrypto.encryptTexto(texto.trim());
      textoCifrado = enc.cifrado; iv = enc.iv; authTag = enc.authTag;
    }

    const [result] = await db.execute(
      'INSERT INTO mensagens (conversa_id, remetente_tipo, remetente_id, texto_cifrado, iv, auth_tag, anexo_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [conversaId, remetente_tipo, remetente_id, textoCifrado, iv, authTag, anexo_id || null]
    );
    await db.execute('UPDATE conversas SET ultima_mensagem_em = NOW() WHERE id = ?', [conversaId]);

    // Notificação real só existe (sino) do lado do aluno por enquanto.
    if (destinatarioTipo === 'aluno') {
      const remetenteNome = await _nomeParticipante(remetente_tipo, remetente_id);
      await _criarNotificacao('aluno', destinatarioId, 'nova_mensagem',
        `Nova mensagem de ${remetenteNome}`,
        (texto?.trim() ? texto.trim() : '📎 Enviou um anexo').slice(0, 200),
        conversaId);
    }

    res.status(201).json({
      id: result.insertId, remetente_tipo, remetente_id,
      texto: texto?.trim() || '', lida: false, criado_em: new Date(), anexo_id: anexo_id || null
    });
  } catch (error) {
    _falha(res, error);
  }
});

// PUT /chat/conversas/:conversaId/marcar-lida
app.put('/chat/conversas/:conversaId/marcar-lida', exigirAutenticacao(['aluno', 'professor', 'empresa']), async (req, res) => {
  try {
    const { conversaId } = req.params;
    const { tipo: meu_tipo } = req.usuarioAutenticado; // identidade vem do token (S1), não do body
    await db.execute(
      'UPDATE mensagens SET lida = 1 WHERE conversa_id = ? AND remetente_tipo != ? AND lida = 0',
      [conversaId, meu_tipo]
    );
    res.json({ sucesso: true });
  } catch (error) {
    _falha(res, error);
  }
});

// POST /chat/anexos — upload de PDF ou imagem (criptografado em disco, expira em 7 dias)
// Exige login (evita upload anônimo/spam) — o vínculo com a conversa acontece
// só quando a mensagem é enviada (rota de baixo), que já checa participação.
app.post('/chat/anexos', exigirAutenticacao(['aluno', 'professor', 'empresa']), _chatPdfUpload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    if (!_CHAT_ANEXO_ACEITOS.has(req.file.mimetype)) {
      return res.status(400).json({ error: 'Formato não aceito. Envie PDF ou imagem (JPG, PNG, WEBP).' });
    }

    const { cifrado, iv, authTag } = chatCrypto.encryptBuffer(req.file.buffer);
    const nomeArquivo = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}.enc`;
    fs.writeFileSync(path.join(CHAT_UPLOADS_DIR, nomeArquivo), cifrado);

    const [result] = await db.execute(
      `INSERT INTO mensagem_anexos (nome_original, caminho_arquivo, iv, auth_tag, tamanho_bytes, expira_em)
       VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [req.file.originalname, nomeArquivo, iv, authTag, req.file.size]
    );
    res.status(201).json({ anexo_id: result.insertId, nome: req.file.originalname, tamanho_bytes: req.file.size });
  } catch (error) {
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Arquivo maior que 5 MB.' });
    _falha(res, error);
  }
});

// GET /chat/anexos/:anexoId/download
// Correção do achado S6: antes, qualquer usuário autenticado conseguia enumerar
// anexoId (sequencial) e baixar PDFs de conversas alheias. Agora exige participação
// real na conversa dona do anexo, usando a identidade do token (S1), não o body/query.
app.get('/chat/anexos/:anexoId/download', exigirAutenticacao(['aluno', 'professor', 'empresa']), async (req, res) => {
  try {
    const [[anexo]] = await db.execute('SELECT * FROM mensagem_anexos WHERE id = ?', [req.params.anexoId]);
    if (!anexo) return res.status(404).json({ error: 'Anexo não encontrado.' });

    const [[msg]] = await db.execute('SELECT conversa_id FROM mensagens WHERE anexo_id = ?', [anexo.id]);
    if (!msg) return res.status(404).json({ error: 'Anexo não encontrado.' });
    const [[conversa]] = await db.execute('SELECT * FROM conversas WHERE id = ?', [msg.conversa_id]);
    const { tipo: meuTipo, id: meuId } = req.usuarioAutenticado;
    const souParticipante = conversa && (
      (conversa.participante1_tipo === meuTipo && String(conversa.participante1_id) === meuId) ||
      (conversa.participante2_tipo === meuTipo && String(conversa.participante2_id) === meuId)
    );
    if (!souParticipante) return res.status(403).json({ error: 'Você não faz parte desta conversa.' });

    if (anexo.removido_em || new Date(anexo.expira_em) < new Date()) {
      return res.status(410).json({ error: 'Este anexo expirou.' });
    }
    const caminho = path.join(CHAT_UPLOADS_DIR, anexo.caminho_arquivo);
    if (!fs.existsSync(caminho)) return res.status(404).json({ error: 'Arquivo não encontrado no servidor.' });

    const cifrado = fs.readFileSync(caminho);
    const decifrado = chatCrypto.decryptBuffer(cifrado, anexo.iv, anexo.auth_tag);
    res.setHeader('Content-Type', _mimeAnexoChat(anexo.nome_original));
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(anexo.nome_original)}"`);
    res.send(decifrado);
  } catch (error) {
    _falha(res, error);
  }
});

// Limpeza de anexos expirados — roda a cada hora, apaga o arquivo físico e marca
// removido_em (mantém a linha/nome no histórico, só não serve mais o conteúdo).
async function _limparAnexosExpirados() {
  try {
    const [expirados] = await db.execute(
      'SELECT id, caminho_arquivo FROM mensagem_anexos WHERE expira_em < NOW() AND removido_em IS NULL'
    );
    for (const a of expirados) {
      const caminho = path.join(CHAT_UPLOADS_DIR, a.caminho_arquivo);
      if (fs.existsSync(caminho)) fs.unlinkSync(caminho);
      await db.execute('UPDATE mensagem_anexos SET removido_em = NOW() WHERE id = ?', [a.id]);
    }
    if (expirados.length) console.log(`[CHAT] ${expirados.length} anexo(s) expirado(s) removido(s).`);
  } catch (err) {
    console.error('[CHAT] Erro na limpeza de anexos expirados:', err.message);
  }
}
setInterval(_limparAnexosExpirados, 60 * 60 * 1000);
_limparAnexosExpirados();

// ─── FIM DO MÓDULO CHAT ───────────────────────────────────────────────────────

// ─── TRATAMENTO DE ERRO CENTRAL ──────────────────────────────────────────────
// No Express 5, rejeições de handlers async caem aqui automaticamente. Loga o
// detalhe só no servidor e devolve mensagem genérica — não vaza SQL/stack ao
// cliente. (Correção do achado S8). Deve ficar DEPOIS de todas as rotas.
app.use((err, req, res, next) => {
  console.error(`[ERRO] ${req.method} ${req.path}:`, err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: 'Ocorreu um erro ao processar a solicitação.' });
});

// Rede: falhas fora do ciclo de request não devem derrubar o processo silenciosamente.
process.on('unhandledRejection', (motivo) => console.error('[unhandledRejection]', motivo));
process.on('uncaughtException',  (erro)  => console.error('[uncaughtException]', erro));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});