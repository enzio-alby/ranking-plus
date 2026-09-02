// admin.js — Painel Administrativo Ranking+
const ADMIN_API = 'http://localhost:4000';

// Estado em memória da sessão admin
let _adminToken = null;   // token recebido no login
let _adminInfo  = null;   // { id, nome }
let _impersonacoes = 0;   // contador da sessão

// Dados carregados (cache para o filtro de busca)
let _alunos      = [];
let _professores = [];
let _empresas    = [];
let _chamados    = [];

// Referência ao item pendente de confirmação
let _pendingImpersonate = null; // { id, tipo, nome }

// TEMA CLARO/ESCURO — só estético, só nesta página
// Aplica o tema salvo já aqui (não dentro do DOMContentLoaded) pra não piscar o
// tema errado por uma fração de segundo antes do JS "oficial" rodar.
(function _aplicarTemaSalvo() {
    const salvo = localStorage.getItem('admin_tema');
    if (salvo === 'light') document.documentElement.setAttribute('data-theme', 'light');
})();

function _alternarTema() {
    const claro = document.documentElement.getAttribute('data-theme') === 'light';
    if (claro) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.removeItem('admin_tema');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('admin_tema', 'light');
    }
    _atualizarIconeTema();
}

function _atualizarIconeTema() {
    const btn = document.getElementById('btnToggleTema');
    if (!btn) return;
    const claro = document.documentElement.getAttribute('data-theme') === 'light';
    btn.innerHTML = claro ? '<i class="bi bi-moon-stars-fill"></i>' : '<i class="bi bi-sun-fill"></i>';
    btn.title = claro ? 'Mudar para modo escuro' : 'Mudar para modo claro';
}

// INIT
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

    // Alternar tema claro/escuro
    document.getElementById('btnToggleTema')?.addEventListener('click', _alternarTema);
    _atualizarIconeTema();

    // Navegação da sidebar (rolagem até a seção)
    document.querySelectorAll('.sidebar-nav .nav-item[data-secao]').forEach(el => {
        el.addEventListener('click', () => irParaSecao(el.dataset.secao));
    });
    _initScrollSpy();

    // Busca em tempo real
    document.getElementById('searchAlunos')?.addEventListener('input', filtrarAlunos);
    document.getElementById('searchProfessores')?.addEventListener('input', filtrarProfessores);
    document.getElementById('searchEmpresas')?.addEventListener('input', filtrarEmpresas);

    // Busca global
    const globalInput = document.getElementById('globalSearch');
    globalInput?.addEventListener('input', _buscaGlobal);
    globalInput?.addEventListener('focus', _buscaGlobal);
    document.addEventListener('click', e => {
        if (!document.getElementById('globalSearchWrapper').contains(e.target)) {
            document.getElementById('globalSearchResults').classList.add('d-none');
        }
    });

    // Confirmação de impersonation
    document.getElementById('btnConfirmImpersonate').addEventListener('click', executarImpersonation);

    // Relógio no dashboard
    _atualizarRelogio();
    setInterval(_atualizarRelogio, 1000);
});

// LOGIN
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

// ENTRAR NO PAINEL
function _entrarNoPainel() {
    document.getElementById('loginScreen').classList.add('d-none');
    document.getElementById('painelScreen').classList.remove('d-none');

    // Admin é único no sistema — não expõe nome pessoal na UI
    document.getElementById('sidebarAdminNome').textContent = 'Admin';
    document.getElementById('topbarAdminNome').textContent  = 'Admin';

    // Carrega dados iniciais
    carregarEstatisticas();
    carregarAlunos();
    carregarProfessores();
    carregarEmpresas();
    carregarChamados();
    carregarContratacoes();
}

// LOGOUT
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

// NAVEGAÇÃO (página única, rolagem até a seção)
function irParaSecao(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Marca o item ativo da sidebar conforme a seção visível na tela
function _initScrollSpy() {
    const secoes = document.querySelectorAll('.admin-section');
    if (!secoes.length) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
                el.classList.toggle('active', el.dataset.secao === entry.target.id);
            });
        });
    }, { rootMargin: '-20% 0px -70% 0px' });
    secoes.forEach(s => observer.observe(s));
}

// CARREGAR DADOS
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

// RENDER TABELAS
const PC_PERFIL_NOMES = { executor: 'Executor', comunicador: 'Comunicador', planejador: 'Planejador', analista: 'Analista' };

function _pcBadgeHtml(a) {
    if (!a.perfil_respondido_em) {
        return '<span class="badge bg-secondary">Pendente</span>';
    }
    const vencido = new Date(a.perfil_valido_ate) < new Date();
    const dataFmt = new Date(a.perfil_respondido_em).toLocaleDateString('pt-BR');
    const cor = vencido ? 'bg-warning text-dark' : 'bg-success';
    const rotulo = vencido ? 'Vencido' : (PC_PERFIL_NOMES[a.perfil_dominante] || a.perfil_dominante);
    return `<span class="badge ${cor}" style="cursor:pointer;" onclick="abrirRespostasComportamentais(${a.id}, '${_esc(a.nome)}')" title="${dataFmt} — clique pra ver as respostas">${rotulo}</span>`;
}

function renderAlunos(lista) {
    const tbody = document.getElementById('tabelaAlunos');
    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">Nenhum aluno encontrado.</td></tr>';
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
            <td>${_pcBadgeHtml(a)}</td>
            <td>
                <button class="btn-impersonate"
                    onclick="confirmarImpersonation(${a.id}, 'aluno', '${_esc(a.nome)}')">
                    <i class="bi bi-person-fill-gear"></i>Acessar como Aluno
                </button>
            </td>
        </tr>
    `).join('');
}

// PERFIL COMPORTAMENTAL — detalhe de respostas
async function abrirRespostasComportamentais(alunoId, nome) {
    document.getElementById('pcRespostasNome').textContent = nome;
    const body = document.getElementById('pcRespostasBody');
    body.innerHTML = '<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div></div>';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalRespostasComportamentais')).show();
    try {
        const res = await fetch(`${ADMIN_API}/admin/alunos/${alunoId}/avaliacao-comportamental`, {
            headers: { 'x-admin-token': _adminToken }
        });
        const data = await res.json();
        if (!data.respondido_em || !data.respostas.length) {
            body.innerHTML = '<p class="text-muted text-center py-3 mb-0">Este aluno ainda não respondeu o Mapeamento de Perfil Comportamental.</p>';
            return;
        }
        const dataFmt = new Date(data.respondido_em).toLocaleString('pt-BR');
        const validoFmt = new Date(data.valido_ate).toLocaleDateString('pt-BR');
        body.innerHTML = `
            <div class="alert alert-light border small mb-3">
                Respondido em <strong>${dataFmt}</strong> — válido até <strong>${validoFmt}</strong>
            </div>
            <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                    <thead><tr><th>#</th><th>Pergunta</th><th>Resposta</th></tr></thead>
                    <tbody>
                        ${data.respostas.map(r => `
                            <tr>
                                <td class="text-muted small">${r.ordem}</td>
                                <td class="small">${_esc(r.enunciado)}</td>
                                <td class="small fw-semibold">${_esc(r.resposta)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
    } catch (e) {
        body.innerHTML = '<p class="text-danger text-center py-3 mb-0">Erro ao carregar as respostas.</p>';
    }
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

// CONTRATAÇÕES — acompanhamento cruzado de desfecho de indicação
let _contratacoes = [];

async function carregarContratacoes() {
    const tbody = document.getElementById('tabelaContratacoes');
    try {
        _contratacoes = await _apiGet('/admin/contratacoes');
        document.getElementById('contratacoesCount').textContent = `${_contratacoes.length} registro(s)`;
        renderContratacoes(_contratacoes);
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">
            <i class="bi bi-exclamation-triangle me-2"></i>Erro ao carregar contratações.
        </td></tr>`;
    }
}

function renderContratacoes(lista) {
    const tbody = document.getElementById('tabelaContratacoes');
    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Nenhuma contratação registrada ainda.</td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(c => {
        const dataContratacao = new Date(c.marcado_contratado_em).toLocaleDateString('pt-BR');
        let status;
        if (c.pendente) status = '<span class="badge bg-warning text-dark">Check-in pendente</span>';
        else if (!c.respondido_em) status = '<span class="badge bg-light text-dark border">Aguardando próximo check-in</span>';
        else status = c.continua_na_empresa ? '<span class="badge bg-success">Continua na empresa</span>' : '<span class="badge bg-secondary">Não continua mais</span>';
        return `
        <tr>
            <td class="small">${_esc(c.empresa_nome)}</td>
            <td class="small fw-semibold">${_esc(c.aluno_nome)}</td>
            <td class="text-muted small">${dataContratacao}</td>
            <td>${status}</td>
            <td class="text-muted small">${new Date(c.proximo_checkin_em).toLocaleDateString('pt-BR')}</td>
        </tr>`;
    }).join('');
}

function _exportarContratacoesCSV() {
    const cabecalho = ['Empresa', 'Aluno', 'Contratado em', 'Continua na empresa', 'Respondido em', 'Próximo check-in'];
    const linhas = _contratacoes.map(c => [
        c.empresa_nome, c.aluno_nome,
        new Date(c.marcado_contratado_em).toLocaleDateString('pt-BR'),
        c.respondido_em ? (c.continua_na_empresa ? 'Sim' : 'Não') : '—',
        c.respondido_em ? new Date(c.respondido_em).toLocaleDateString('pt-BR') : '—',
        new Date(c.proximo_checkin_em).toLocaleDateString('pt-BR')
    ]);
    _baixarCSV([cabecalho, ...linhas], 'contratacoes-rankingplus.csv');
}

function _exportarChamadosCSV() {
    const cabecalho = ['ID', 'Assunto', 'Nome', 'E-mail', 'Categoria', 'Prioridade', 'Status', 'Criado em'];
    const linhas = _chamados.map(c => [
        c.id, c.assunto, c.nome, c.email,
        CATEGORIA_LABELS[c.categoria] || c.categoria,
        (PRIORIDADE_META[c.prioridade] || ['—'])[0],
        STATUS_FAVORITO_LABELS_ADMIN[c.status] || c.status,
        new Date(c.criado_em).toLocaleString('pt-BR')
    ]);
    _baixarCSV([cabecalho, ...linhas], 'chamados-rankingplus.csv');
}
const STATUS_FAVORITO_LABELS_ADMIN = { aberto: 'Aberto', em_andamento: 'Em andamento', concluido: 'Concluído' };

// Helper genérico de export CSV — mesmo padrão (aspas + escape) usado em talentos.js
function _baixarCSV(linhas, nomeArquivo) {
    const csv = linhas.map(l => l.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nomeArquivo;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// CHAMADOS DE SUPORTE (KANBAN)
const CATEGORIA_LABELS = {
    technical: 'Problema Técnico', ranking: 'Dúvida sobre Ranking',
    benefits: 'Benefícios', account: 'Conta', other: 'Outros'
};
const PRIORIDADE_META = {
    low:    ['Baixa',   'secondary'],
    medium: ['Média',   'info'],
    high:   ['Alta',    'warning'],
    urgent: ['Urgente', 'danger'],
};
const STATUS_COL = { aberto: 'colAberto', em_andamento: 'colEmAndamento', concluido: 'colConcluido' };
const PROXIMO_STATUS = { aberto: 'em_andamento', em_andamento: 'concluido', concluido: null };
const ANTERIOR_STATUS = { aberto: null, em_andamento: 'aberto', concluido: 'em_andamento' };
const PROXIMO_LABEL = { aberto: 'Iniciar atendimento', em_andamento: 'Marcar concluído' };

async function carregarChamados() {
    const errorBox = document.getElementById('kanbanError');
    errorBox.classList.add('d-none');
    // O esqueleto do quadro (colunas + ids) nunca é destruído — só o conteúdo interno muda.
    // Assim, uma falha aqui nunca impede uma nova tentativa depois.
    Object.values(STATUS_COL).forEach(id => {
        const col = document.getElementById(id);
        if (col) col.innerHTML = '<div class="text-center text-muted small py-4"><div class="spinner-border spinner-border-sm me-2"></div>Carregando...</div>';
    });
    try {
        _chamados = await _apiGet('/admin/chamados');
        renderChamados();
    } catch (e) {
        errorBox.classList.remove('d-none');
        errorBox.classList.add('d-flex');
        Object.values(STATUS_COL).forEach(id => {
            const col = document.getElementById(id);
            if (col) col.innerHTML = '';
        });
    }
}

function renderChamados() {
    const porStatus = { aberto: [], em_andamento: [], concluido: [] };
    _chamados.forEach(c => (porStatus[c.status] || porStatus.aberto).push(c));

    Object.entries(porStatus).forEach(([status, lista]) => {
        const col = document.getElementById(STATUS_COL[status]);
        document.getElementById('count' + _pascal(status)).textContent = lista.length;
        col.innerHTML = lista.length
            ? lista.map(c => _chamadoCardHtml(c)).join('')
            : '<div class="kanban-empty">Nenhum chamado aqui.</div>';
    });

    const abertos = porStatus.aberto.length + porStatus.em_andamento.length;
    const badge = document.getElementById('navChamadosBadge');
    badge.textContent = abertos;
    badge.classList.toggle('d-none', abertos === 0);
}

function _pascal(status) {
    return status.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}

function _chamadoCardHtml(c) {
    const [prLabel, prCor] = PRIORIDADE_META[c.prioridade] || ['—', 'secondary'];
    const data = new Date(c.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const proximo  = PROXIMO_STATUS[c.status];
    const anterior = ANTERIOR_STATUS[c.status];
    return `
    <div class="kanban-card">
        <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
            <strong class="small">${_esc(c.assunto)}</strong>
            <span class="badge bg-${prCor}" style="font-size:.65rem;">${prLabel}</span>
        </div>
        <div class="text-muted" style="font-size:.75rem;">${_esc(c.nome)} · ${_esc(c.email)}</div>
        <span class="badge bg-light text-dark border mt-2" style="font-size:.68rem;">${CATEGORIA_LABELS[c.categoria] || c.categoria}</span>
        <p class="kanban-card-desc">${_esc(c.descricao)}</p>
        <div class="d-flex justify-content-between align-items-center mt-2">
            <small class="text-muted" style="font-size:.7rem;"><i class="bi bi-clock me-1"></i>${data} · #${c.id}</small>
            <div class="d-flex gap-1">
                ${anterior ? `<button type="button" class="btn btn-xs btn-outline-secondary" title="Voltar" onclick="moverChamado(${c.id}, '${anterior}')"><i class="bi bi-arrow-left"></i></button>` : ''}
                ${proximo ? `<button type="button" class="btn btn-xs btn-outline-primary" title="${PROXIMO_LABEL[c.status]}" onclick="moverChamado(${c.id}, '${proximo}')"><i class="bi bi-arrow-right"></i></button>` : ''}
            </div>
        </div>
    </div>`;
}

async function moverChamado(id, novoStatus) {
    const chamado = _chamados.find(c => c.id === id);
    if (!chamado) return;
    const statusAntigo = chamado.status;
    chamado.status = novoStatus; // otimista
    renderChamados();
    try {
        await _apiPut(`/admin/chamados/${id}/status`, { status: novoStatus });
    } catch (e) {
        chamado.status = statusAntigo; // desfaz em caso de falha
        renderChamados();
        if (_adminToken) alert('Não foi possível mover o chamado. Tente novamente.'); // sessão expirada já tem seu próprio aviso
    }
}

// BUSCA GLOBAL
function _buscaGlobal() {
    const q = document.getElementById('globalSearch').value.trim().toLowerCase();
    const resultsEl = document.getElementById('globalSearchResults');
    if (!q) { resultsEl.classList.add('d-none'); return; }

    const matchAluno = a => (a.nome || '').toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q) || (a.matricula || '').toLowerCase().includes(q);
    const matchProf  = p => (p.nome || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q);
    const matchEmp   = e => (e.razao_social || '').toLowerCase().includes(q) || (e.nome_fantasia || '').toLowerCase().includes(q) || (e.email_corporativo || '').toLowerCase().includes(q) || (e.cnpj || '').toLowerCase().includes(q);

    const rAlunos = _alunos.filter(matchAluno).slice(0, 5);
    const rProfs  = _professores.filter(matchProf).slice(0, 5);
    const rEmps   = _empresas.filter(matchEmp).slice(0, 5);

    if (!rAlunos.length && !rProfs.length && !rEmps.length) {
        resultsEl.innerHTML = '<div class="global-search-empty">Nenhum resultado para "' + _esc(q) + '".</div>';
        resultsEl.classList.remove('d-none');
        return;
    }

    const grupo = (titulo, lista, render) => lista.length
        ? `<div class="global-search-group-title">${titulo}</div>` + lista.map(render).join('')
        : '';

    resultsEl.innerHTML =
        grupo('Alunos', rAlunos, a => `
            <div class="global-search-item" onclick="_irParaResultado('secAlunos', 'searchAlunos', '${_esc(a.nome).replace(/'/g, "\\'")}')">
                <i class="bi bi-mortarboard-fill text-primary"></i>
                <div><div class="fw-semibold small">${_esc(a.nome)}</div><div class="text-muted" style="font-size:.72rem;">${_esc(a.email || a.matricula || '')}</div></div>
            </div>`) +
        grupo('Professores', rProfs, p => `
            <div class="global-search-item" onclick="_irParaResultado('secProfessores', 'searchProfessores', '${_esc(p.nome).replace(/'/g, "\\'")}')">
                <i class="bi bi-person-video3" style="color:#1565c0;"></i>
                <div><div class="fw-semibold small">${_esc(p.nome)}</div><div class="text-muted" style="font-size:.72rem;">${_esc(p.email || '')}</div></div>
            </div>`) +
        grupo('Empresas', rEmps, e => `
            <div class="global-search-item" onclick="_irParaResultado('secEmpresas', 'searchEmpresas', '${_esc(e.nome_fantasia || e.razao_social).replace(/'/g, "\\'")}')">
                <i class="bi bi-building" style="color:#7b1fa2;"></i>
                <div><div class="fw-semibold small">${_esc(e.nome_fantasia || e.razao_social)}</div><div class="text-muted" style="font-size:.72rem;">${_esc(e.email_corporativo || e.cnpj || '')}</div></div>
            </div>`);
    resultsEl.classList.remove('d-none');
}

// Rola até a seção e aplica o mesmo termo como filtro da tabela local
function _irParaResultado(secaoId, inputId, termo) {
    document.getElementById('globalSearchResults').classList.add('d-none');
    document.getElementById('globalSearch').value = '';
    irParaSecao(secaoId);
    const input = document.getElementById(inputId);
    if (input) {
        input.value = termo;
        input.dispatchEvent(new Event('input'));
        setTimeout(() => input.focus(), 400);
    }
}

// FILTRO / BUSCA
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

// IMPERSONATION
// 1. Abre modal de confirmação
function confirmarImpersonation(id, tipo, nome) {
    _pendingImpersonate = { id, tipo, nome };

    const meta = {
        aluno:     { icone: '🎓',  label: 'Aluno',   cor: 'var(--accent)', dest: 'área do aluno' },
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

        // Token de sessão do usuário impersonado (achado S1) — sem isto, toda
        // rota protegida do aluno/professor/empresa dá 401 assim que a página
        // impersonada carrega, mesmo com o localStorage "logado" preenchido.
        if (data.token) localStorage.setItem('unirank_token', data.token);

        if (tipo === 'empresa') {
            // Replica o que handleLoginEmpresa faz em talentos.js
            // talentos.js usa sessionStorage, mas o Edge bloqueia em file://
            // então usamos localStorage como fallback — talentos.js lê ambos
            localStorage.setItem('empresa_logada', JSON.stringify(data.empresa));
            destino = '../html/talentos.html';
        } else {
            // Replica EXATAMENTE o que o login normal faz em index.js
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

// HELPERS DE API
// Sessões admin vivem em memória no servidor (Map, sem persistência) — um restart
// do backend invalida todos os tokens já emitidos, mas o localStorage do navegador
// continua com o token antigo. Sem essa checagem, cada seção do painel mostraria
// "Erro ao carregar X" separadamente em vez de indicar o motivo real (sessão expirada).
let _sessaoExpiradaDisparada = false;
function _tratarSessaoExpirada() {
    if (_sessaoExpiradaDisparada) return;
    _sessaoExpiradaDisparada = true;
    _adminToken = null;
    _adminInfo  = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    document.getElementById('painelScreen').classList.add('d-none');
    document.getElementById('loginScreen').classList.remove('d-none');
    _showAlerta(document.getElementById('loginAlerta'), 'Sua sessão expirou. Faça login novamente.', 'warning');
}

async function _apiGet(path) {
    const res = await fetch(`${ADMIN_API}${path}`, {
        headers: { 'X-Admin-Token': _adminToken }
    });
    if (res.status === 401) { _tratarSessaoExpirada(); throw new Error('Sessão expirada.'); }
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
    if (res.status === 401) { _tratarSessaoExpirada(); throw new Error('Sessão expirada.'); }
    return res.json();
}

async function _apiPut(path, body = {}) {
    const res = await fetch(`${ADMIN_API}${path}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': _adminToken || ''
        },
        body: JSON.stringify(body)
    });
    if (res.status === 401) { _tratarSessaoExpirada(); throw new Error('Sessão expirada.'); }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// HELPERS DE UI
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

function _atualizarRelogio() {
    const el = document.getElementById('statHora');
    if (el) el.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
