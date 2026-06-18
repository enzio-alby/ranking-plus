// ═══════════════════════════════════════════════════════════════════════════════
// admin.js — Painel Administrativo Ranking+
// ═══════════════════════════════════════════════════════════════════════════════
const ADMIN_API = 'http://localhost:4000';

// ─── Estado em memória da sessão admin ────────────────────────────────────────
let _adminToken = null;   // token recebido no login
let _adminInfo  = null;   // { id, nome }
let _impersonacoes = 0;   // contador da sessão

// Dados carregados (cache para o filtro de busca)
let _alunos      = [];
let _professores = [];
let _empresas    = [];

// Referência ao item pendente de confirmação
let _pendingImpersonate = null; // { id, tipo, nome }

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Tenta restaurar sessão anterior (localStorage — sessionStorage é bloqueado pelo Edge em file://)
    const savedToken = localStorage.getItem('admin_token');
    const savedInfo  = localStorage.getItem('admin_info');
    if (savedToken && savedInfo) {
        _adminToken = savedToken;
        _adminInfo  = JSON.parse(savedInfo);
        _entrarNoPainel();
    }

    // Eventos de login
    document.getElementById('btnLogin').addEventListener('click', handleLogin);
    document.getElementById('loginSenha').addEventListener('keydown', e => {
        if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('loginEmail').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('loginSenha').focus();
    });

    // Logout
    document.getElementById('btnLogout').addEventListener('click', handleLogout);

    // Navegação da sidebar
    document.querySelectorAll('.sidebar-nav .nav-item[data-tab]').forEach(el => {
        el.addEventListener('click', () => irParaTab(el.dataset.tab));
    });

    // Busca em tempo real
    document.getElementById('searchAlunos')?.addEventListener('input', filtrarAlunos);
    document.getElementById('searchProfessores')?.addEventListener('input', filtrarProfessores);
    document.getElementById('searchEmpresas')?.addEventListener('input', filtrarEmpresas);

    // Confirmação de impersonation
    document.getElementById('btnConfirmImpersonate').addEventListener('click', executarImpersonation);

    // Relógio no dashboard
    _atualizarRelogio();
    setInterval(_atualizarRelogio, 1000);
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const senha = document.getElementById('loginSenha').value;
    const alerta = document.getElementById('loginAlerta');
    const btn    = document.getElementById('btnLogin');

    if (!email || !senha) {
        _showAlerta(alerta, 'Preencha e-mail e senha.', 'warning');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Autenticando...';

    try {
        const res  = await fetch(`${ADMIN_API}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        const data = await res.json();

        if (data.sucesso) {
            _adminToken = data.token;
            _adminInfo  = data.admin;
            localStorage.setItem('admin_token', _adminToken);
            localStorage.setItem('admin_info',  JSON.stringify(_adminInfo));
            _entrarNoPainel();
        } else {
            _showAlerta(alerta, data.mensagem || 'Credenciais inválidas.', 'danger');
        }
    } catch (e) {
        _showAlerta(alerta, 'Erro ao conectar com o servidor.', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Entrar no Painel';
    }
}

// ─── ENTRAR NO PAINEL ────────────────────────────────────────────────────────
function _entrarNoPainel() {
    document.getElementById('loginScreen').classList.add('d-none');
    document.getElementById('painelScreen').classList.remove('d-none');

    // Atualiza nome do admin na UI
    const nome = _adminInfo?.nome || 'Admin';
    document.getElementById('sidebarAdminNome').textContent = nome;
    document.getElementById('topbarAdminNome').textContent  = nome;

    // Carrega dados iniciais
    carregarEstatisticas();
    carregarAlunos();
    carregarProfessores();
    carregarEmpresas();
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
async function handleLogout() {
    try {
        await _apiPost('/admin/logout');
    } catch (_) { /* ignora erros no logout */ }

    _adminToken = null;
    _adminInfo  = null;
    _impersonacoes = 0;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');

    document.getElementById('loginScreen').classList.remove('d-none');
    document.getElementById('painelScreen').classList.add('d-none');
    document.getElementById('loginSenha').value = '';
}

// ─── NAVEGAÇÃO ────────────────────────────────────────────────────────────────
const _tabTitles = {
    dashboard:   ['Dashboard',   'Visão geral do sistema'],
    alunos:      ['Alunos',      'Lista de alunos cadastrados'],
    professores: ['Professores', 'Lista de professores cadastrados'],
    empresas:    ['Empresas',    'Lista de empresas cadastradas'],
};

function irParaTab(tab) {
    // Esconde todas as tabs
    ['dashboard', 'alunos', 'professores', 'empresas'].forEach(t => {
        document.getElementById('tab' + _capitalize(t))?.classList.add('d-none');
    });

    // Mostra a selecionada
    document.getElementById('tab' + _capitalize(tab))?.classList.remove('d-none');

    // Atualiza sidebar
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.tab === tab);
    });

    // Atualiza topbar
    const [title, sub] = _tabTitles[tab] || ['', ''];
    document.getElementById('topbarTitle').textContent = title;
    document.getElementById('topbarSub').textContent   = sub;
}

// ─── CARREGAR DADOS ───────────────────────────────────────────────────────────
async function carregarEstatisticas() {
    try {
        const [alunos, profs, empresas] = await Promise.all([
            _apiGet('/admin/alunos'),
            _apiGet('/admin/professores'),
            _apiGet('/admin/empresas')
        ]);
        document.getElementById('statAlunos').textContent      = alunos.length;
        document.getElementById('statProfessores').textContent = profs.length;
        document.getElementById('statEmpresas').textContent    = empresas.length;
    } catch (_) { /* silencioso */ }
}

async function carregarAlunos() {
    const tbody = document.getElementById('tabelaAlunos');
    try {
        _alunos = await _apiGet('/admin/alunos');
        document.getElementById('alunosCount').textContent = `${_alunos.length} aluno(s) cadastrado(s)`;
        renderAlunos(_alunos);
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-3">
            <i class="bi bi-exclamation-triangle me-2"></i>Erro ao carregar alunos.
        </td></tr>`;
    }
}

async function carregarProfessores() {
    const tbody = document.getElementById('tabelaProfessores');
    try {
        _professores = await _apiGet('/admin/professores');
        document.getElementById('professoresCount').textContent = `${_professores.length} professor(es) cadastrado(s)`;
        renderProfessores(_professores);
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">
            <i class="bi bi-exclamation-triangle me-2"></i>Erro ao carregar professores.
        </td></tr>`;
    }
}

// ─── RENDER TABELAS ───────────────────────────────────────────────────────────
function renderAlunos(lista) {
    const tbody = document.getElementById('tabelaAlunos');
    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Nenhum aluno encontrado.</td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(a => `
        <tr>
            <td class="text-muted">${a.id}</td>
            <td><span class="fw-semibold">${_esc(a.nome)}</span></td>
            <td class="text-muted small">${_esc(a.email || '—')}</td>
            <td class="text-muted small">${_esc(a.matricula || '—')}</td>
            <td class="small">${_esc(a.curso || '—')}</td>
            <td class="text-center small">${a.semestre ?? '—'}º</td>
            <td>${_badgeSituacao(a.situacao)}</td>
            <td>
                <button class="btn-impersonate"
                    onclick="confirmarImpersonation(${a.id}, 'aluno', '${_esc(a.nome)}')">
                    <i class="bi bi-person-fill-gear"></i>Acessar como Aluno
                </button>
            </td>
        </tr>
    `).join('');
}

function renderProfessores(lista) {
    const tbody = document.getElementById('tabelaProfessores');
    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Nenhum professor encontrado.</td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(p => `
        <tr>
            <td class="text-muted">${p.id}</td>
            <td><span class="fw-semibold">${_esc(p.nome)}</span></td>
            <td class="text-muted small">${_esc(p.email || '—')}</td>
            <td class="small">${_esc(p.campus || '—')}</td>
            <td>
                <button class="btn-impersonate prof"
                    onclick="confirmarImpersonation(${p.id}, 'professor', '${_esc(p.nome)}')">
                    <i class="bi bi-person-fill-gear"></i>Acessar como Professor
                </button>
            </td>
        </tr>
    `).join('');
}

function renderEmpresas(lista) {
    const tbody = document.getElementById('tabelaEmpresas');
    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Nenhuma empresa encontrada.</td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(e => `
        <tr>
            <td class="text-muted">${e.id}</td>
            <td><span class="fw-semibold">${_esc(e.razao_social)}</span></td>
            <td class="text-muted small">${_esc(e.nome_fantasia || '—')}</td>
            <td class="text-muted small">${_esc(e.email_corporativo || '—')}</td>
            <td class="text-muted small">${_esc(e.cnpj || '—')}</td>
            <td class="small">${_esc(e.setor_nome || '—')}</td>
            <td>
                <button class="btn-impersonate" style="background:#7b1fa2;"
                    onclick="confirmarImpersonation(${e.id}, 'empresa', '${_esc(e.nome_fantasia || e.razao_social)}')">
                    <i class="bi bi-building-fill-gear"></i>Acessar como Empresa
                </button>
            </td>
        </tr>
    `).join('');
}

async function carregarEmpresas() {
    const tbody = document.getElementById('tabelaEmpresas');
    try {
        _empresas = await _apiGet('/admin/empresas');
        document.getElementById('empresasCount').textContent = `${_empresas.length} empresa(s) cadastrada(s)`;
        renderEmpresas(_empresas);
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-3">
            <i class="bi bi-exclamation-triangle me-2"></i>Erro ao carregar empresas.
        </td></tr>`;
    }
}

// ─── FILTRO / BUSCA ───────────────────────────────────────────────────────────
function filtrarAlunos() {
    const q = document.getElementById('searchAlunos').value.toLowerCase();
    const filtrado = _alunos.filter(a =>
        (a.nome      || '').toLowerCase().includes(q) ||
        (a.email     || '').toLowerCase().includes(q) ||
        (a.matricula || '').toLowerCase().includes(q) ||
        (a.curso     || '').toLowerCase().includes(q)
    );
    renderAlunos(filtrado);
}

function filtrarProfessores() {
    const q = document.getElementById('searchProfessores').value.toLowerCase();
    const filtrado = _professores.filter(p =>
        (p.nome   || '').toLowerCase().includes(q) ||
        (p.email  || '').toLowerCase().includes(q) ||
        (p.campus || '').toLowerCase().includes(q)
    );
    renderProfessores(filtrado);
}

function filtrarEmpresas() {
    const q = document.getElementById('searchEmpresas').value.toLowerCase();
    const filtrado = _empresas.filter(e =>
        (e.razao_social      || '').toLowerCase().includes(q) ||
        (e.nome_fantasia     || '').toLowerCase().includes(q) ||
        (e.email_corporativo || '').toLowerCase().includes(q) ||
        (e.cnpj              || '').toLowerCase().includes(q) ||
        (e.setor_nome        || '').toLowerCase().includes(q)
    );
    renderEmpresas(filtrado);
}

// ─── IMPERSONATION ────────────────────────────────────────────────────────────
// 1. Abre modal de confirmação
function confirmarImpersonation(id, tipo, nome) {
    _pendingImpersonate = { id, tipo, nome };

    const meta = {
        aluno:     { icone: '🎓',  label: 'Aluno',   cor: 'var(--primary)', dest: 'área do aluno' },
        professor: { icone: '👨‍🏫', label: 'Professor', cor: '#1565c0',        dest: 'área do professor' },
        empresa:   { icone: '🏢',  label: 'Empresa',  cor: '#7b1fa2',        dest: 'Portal de Talentos' },
    };
    const { icone, label, cor, dest } = meta[tipo] || meta.aluno;

    document.getElementById('confirmIcon').textContent = icone;
    document.getElementById('confirmMsg').textContent  = `Acessar como ${label}?`;
    document.getElementById('confirmSub').textContent  = `"${nome}" — você será redirecionado para ${dest}.`;
    document.getElementById('btnConfirmImpersonate').style.background = cor;

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalConfirm')).show();
}

// 2. Executa após confirmação
async function executarImpersonation() {
    if (!_pendingImpersonate) return;
    const { id, tipo, nome } = _pendingImpersonate;
    _pendingImpersonate = null;

    // Fecha modal
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalConfirm')).hide();

    const toastMeta = {
        aluno:     { icone: '🎓', label: 'Aluno' },
        professor: { icone: '👨‍🏫', label: 'Professor' },
        empresa:   { icone: '🏢', label: 'Empresa' },
    };
    const { icone, label } = toastMeta[tipo] || toastMeta.aluno;
    _mostrarToast(icone, `Acessando como ${label}`, nome);

    try {
        const endpoint = `/admin/impersonate/${tipo}/${id}`;
        const data = await _apiPost(endpoint);

        if (!data.sucesso) {
            alert('Erro na impersonation: ' + (data.mensagem || 'Resposta inesperada do servidor.'));
            return;
        }

        let destino;

        if (tipo === 'empresa') {
            // ── Replica o que handleLoginEmpresa faz em talentos.js ──
            // talentos.js usa sessionStorage, mas o Edge bloqueia em file://
            // então usamos localStorage como fallback — talentos.js lê ambos
            localStorage.setItem('empresa_logada', JSON.stringify(data.empresa));
            destino = '../html/talentos.html';
        } else {
            // ── Replica EXATAMENTE o que o login normal faz em index.js ──
            const usuario = data.usuario; // { id, nome, tipo }
            localStorage.setItem('unirank_user', JSON.stringify(usuario));
            if (usuario.tipo === 'aluno') {
                localStorage.setItem('alunoId', usuario.id);
                localStorage.removeItem('professorId');
                destino = '../html/areaaluno.html';
            } else {
                localStorage.setItem('professorId', usuario.id);
                localStorage.removeItem('alunoId');
                destino = '../html/areaprofessor.html';
            }
        }

        _impersonacoes++;

        setTimeout(() => window.location.href = destino, 1600);

    } catch (e) {
        alert('Erro ao conectar com o servidor: ' + e.message);
    }
}

// ─── HELPERS DE API ───────────────────────────────────────────────────────────
async function _apiGet(path) {
    const res = await fetch(`${ADMIN_API}${path}`, {
        headers: { 'X-Admin-Token': _adminToken }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

async function _apiPost(path, body = {}) {
    const res = await fetch(`${ADMIN_API}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': _adminToken || ''
        },
        body: JSON.stringify(body)
    });
    return res.json();
}

// ─── HELPERS DE UI ────────────────────────────────────────────────────────────
function _mostrarToast(icone, titulo, desc) {
    const toast = document.getElementById('impersonateToast');
    document.getElementById('toastIcon').textContent  = icone;
    document.getElementById('toastTitle').textContent = titulo;
    document.getElementById('toastDesc').textContent  = desc;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function _showAlerta(el, msg, type) {
    if (!el) return;
    el.className = `alert alert-${type}`;
    el.textContent = msg;
    el.classList.remove('d-none');
}

function _badgeSituacao(s) {
    const map = {
        'Ativo':    ['success', 'check-circle'],
        'Inativo':  ['secondary', 'dash-circle'],
        'Trancado': ['warning',  'pause-circle'],
    };
    const [color, icon] = map[s] || ['secondary', 'question-circle'];
    return `<span class="badge bg-${color}"><i class="bi bi-${icon} me-1"></i>${s || 'N/A'}</span>`;
}

function _capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// Escapa HTML para evitar XSS ao inserir nomes/emails na tabela
function _esc(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function _atualizarRelogio() {
    const el = document.getElementById('statHora');
    if (el) el.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
