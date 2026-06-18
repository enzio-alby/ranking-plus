// Portal de Talentos — javascript/talentos.js
const TALENTOS_API = 'http://localhost:4000';

let _todosOsTalentos = [];
let _viewMode = 'grid';
let _empresaLogada = null; // { id, razao_social, nome_fantasia, interesses:[] }
let _usuarioLogado = null; // { nome, tipo: 'aluno'|'professor' } — sessão vinda do areaaluno/areaprofessor

// Quem pode ver perfis: empresa, aluno ou professor logado via index
function _podeVerPerfil() {
    if (_empresaLogada) return true;
    if (_usuarioLogado) return true;
    return !!(localStorage.getItem('alunoId') || localStorage.getItem('professorId'));
}
// Só registra no banco se for empresa
function _deveRegistrarVisualizacao() {
    return !!_empresaLogada;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    _restaurarSessaoEmpresa();
    _restaurarSessaoUser();
    carregarFiltros();
    buscarTalentos();

    document.getElementById('aplicarFiltros')?.addEventListener('click', buscarTalentos);
    document.getElementById('limparFiltros')?.addEventListener('click', limparFiltros);
    document.getElementById('searchBtn')?.addEventListener('click', buscarTalentos);
    document.getElementById('searchHabilidade')?.addEventListener('keydown', e => { if (e.key === 'Enter') buscarTalentos(); });
    document.getElementById('viewGrid')?.addEventListener('click', () => { _viewMode = 'grid'; renderTalentos(_todosOsTalentos); });
    document.getElementById('viewList')?.addEventListener('click', () => { _viewMode = 'list'; renderTalentos(_todosOsTalentos); });
    document.getElementById('btnLoginEmpresa')?.addEventListener('click', handleLoginEmpresa);
    document.getElementById('btnCadastroEmpresa')?.addEventListener('click', handleCadastroEmpresa);
    document.getElementById('btnSalvarInteresses')?.addEventListener('click', handleSalvarInteresses);
});

// ─── SESSÃO EMPRESA ───────────────────────────────────────────────────────────
function _restaurarSessaoEmpresa() {
    // Tenta sessionStorage primeiro (login normal); fallback para localStorage (impersonation via admin em file://)
    const saved = sessionStorage.getItem('empresa_logada') || localStorage.getItem('empresa_logada');
    if (saved) {
        try { _empresaLogada = JSON.parse(saved); _atualizarNavEmpresa(); } catch (_) {}
    }
}

// ─── SESSÃO ALUNO / PROFESSOR ─────────────────────────────────────────────────
function _restaurarSessaoUser() {
    // Empresa já logada: não sobrepor
    if (_empresaLogada) return;

    const alunoId    = localStorage.getItem('alunoId');
    const professorId = localStorage.getItem('professorId');
    if (!alunoId && !professorId) return;

    let tipo = alunoId ? 'aluno' : 'professor';
    let nome = '';
    try {
        const savedUser = localStorage.getItem('unirank_user');
        if (savedUser) { nome = JSON.parse(savedUser).nome || ''; }
    } catch (_) {}

    _usuarioLogado = { nome, tipo };

    const navNao  = document.getElementById('navNaoLogado');
    const navUser = document.getElementById('navLogadoUser');
    const navNome = document.getElementById('navUserNome');
    const navTipo = document.getElementById('navUserTipo');

    navNao?.classList.add('d-none');
    navUser?.classList.remove('d-none');
    if (navNome) navNome.textContent = nome || (tipo === 'aluno' ? 'Aluno' : 'Professor');
    if (navTipo) navTipo.textContent = tipo === 'aluno' ? 'Aluno' : 'Professor';
}

function _atualizarNavEmpresa() {
    const navNao  = document.getElementById('navNaoLogado');
    const navLog  = document.getElementById('navLogado');
    const navNome = document.getElementById('navEmpresaNome');
    const navUser = document.getElementById('navLogadoUser');
    const banner  = document.getElementById('interessesBanner');
    const resumo  = document.getElementById('interessesResumo');

    if (_empresaLogada) {
        navNao?.classList.add('d-none');
        navUser?.classList.add('d-none');
        navLog?.classList.remove('d-none');
        if (navNome) navNome.textContent = _empresaLogada.nome_fantasia || _empresaLogada.razao_social;
        banner?.classList.remove('d-none');
        // Monta resumo de interesses
        const int = (_empresaLogada.interesses || [])[0];
        if (int && resumo) {
            const partes = [int.area_foco_nome, int.tipo_vaga_nome, int.curso_preferido].filter(Boolean);
            resumo.textContent = partes.length ? partes.join(' · ') + (int.semestre_minimo > 1 ? ` · ${int.semestre_minimo}º sem+` : '') : 'Nenhum interesse definido';
        } else if (resumo) {
            resumo.textContent = 'Nenhum interesse definido ainda. Clique em Editar para configurar.';
        }
    } else {
        navNao?.classList.remove('d-none');
        navLog?.classList.add('d-none');
        banner?.classList.add('d-none');
    }
    // Re-renderiza cards para atualizar botões/links com novo estado de sessão
    if (_todosOsTalentos.length) renderTalentos(_todosOsTalentos);
}

function logoutEmpresa() {
    _empresaLogada = null;
    sessionStorage.removeItem('empresa_logada');
    localStorage.removeItem('empresa_logada');
    _atualizarNavEmpresa();
}

// ─── LOGIN EMPRESA ────────────────────────────────────────────────────────────
function abrirModalLogin() {
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalLoginEmpresa')).show();
}
function abrirModalCadastro() {
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCadastroEmpresa')).show();
}
function trocarParaCadastro() {
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalLoginEmpresa')).hide();
    setTimeout(() => abrirModalCadastro(), 350);
}

async function handleLoginEmpresa() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const senha = document.getElementById('loginSenha')?.value;
    const alerta = document.getElementById('loginAlerta');
    const btn = document.getElementById('btnLoginEmpresa');

    if (!email || !senha) { _showAlerta(alerta, 'E-mail e senha são obrigatórios.', 'warning'); return; }

    btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Entrando...';

    try {
        const res = await fetch(`${TALENTOS_API}/empresas/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        const data = await res.json();
        if (data.sucesso) {
            _empresaLogada = data.empresa;
            sessionStorage.setItem('empresa_logada', JSON.stringify(_empresaLogada));
            _atualizarNavEmpresa();
            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalLoginEmpresa')).hide();
            // Pré-preenche interesses se existirem
            _preencherInteressesModal();
        } else {
            _showAlerta(alerta, data.mensagem || 'Credenciais inválidas.', 'danger');
        }
    } catch (e) {
        _showAlerta(alerta, 'Erro ao conectar com o servidor.', 'danger');
    } finally {
        btn.disabled = false; btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-1"></i>Entrar';
    }
}

async function handleCadastroEmpresa() {
    const alerta = document.getElementById('cadastroAlerta');
    const btn = document.getElementById('btnCadastroEmpresa');
    const senha = document.getElementById('cadSenha')?.value;
    const senhaConf = document.getElementById('cadSenhaConf')?.value;

    if (senha !== senhaConf) { _showAlerta(alerta, 'As senhas não conferem.', 'warning'); return; }

    const payload = {
        razao_social:      document.getElementById('cadRazaoSocial')?.value.trim(),
        nome_fantasia:     document.getElementById('cadNomeFantasia')?.value.trim(),
        cnpj:              document.getElementById('cadCnpj')?.value.trim(),
        setor_id:          document.getElementById('cadSetor')?.value || null,
        email_corporativo: document.getElementById('cadEmail')?.value.trim(),
        telefone:          document.getElementById('cadTelefone')?.value.trim(),
        site_empresa:      document.getElementById('cadSite')?.value.trim(),
        linkedin_empresa:  document.getElementById('cadLinkedin')?.value.trim(),
        senha
    };
    if (!payload.razao_social || !payload.cnpj || !payload.email_corporativo || !payload.senha) {
        _showAlerta(alerta, 'Preencha os campos obrigatórios (*).',  'warning'); return;
    }

    btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Cadastrando...';

    try {
        const res = await fetch(`${TALENTOS_API}/empresas/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            _showAlerta(alerta, 'Empresa cadastrada! Faça login para acessar.', 'success');
            setTimeout(() => {
                bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCadastroEmpresa')).hide();
                abrirModalLogin();
            }, 1500);
        } else {
            _showAlerta(alerta, data.error || 'Erro ao cadastrar.', 'danger');
        }
    } catch (e) {
        _showAlerta(alerta, 'Erro de conexão.', 'danger');
    } finally {
        btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-circle me-1"></i>Cadastrar';
    }
}

// ─── INTERESSES ───────────────────────────────────────────────────────────────
function abrirModalInteresses() {
    if (!_empresaLogada) { abrirModalLogin(); return; }
    _preencherInteressesModal();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalInteresses')).show();
}

function _preencherInteressesModal() {
    if (!_empresaLogada) return;
    const int = (_empresaLogada.interesses || [])[0];
    if (!int) return;
    const af = document.getElementById('intAreaFoco');
    const tv = document.getElementById('intTipoVaga');
    const cu = document.getElementById('intCurso');
    const sm = document.getElementById('intSemestreMin');
    if (af && int.area_foco_id) af.value = int.area_foco_id;
    if (tv && int.tipo_vaga_id) tv.value = int.tipo_vaga_id;
    if (cu && int.curso_preferido) cu.value = int.curso_preferido;
    if (sm && int.semestre_minimo) sm.value = int.semestre_minimo;
}

async function handleSalvarInteresses() {
    if (!_empresaLogada) return;
    const alerta = document.getElementById('interessesAlerta');
    const btn = document.getElementById('btnSalvarInteresses');
    const payload = {
        area_foco_id:    document.getElementById('intAreaFoco')?.value   || null,
        tipo_vaga_id:    document.getElementById('intTipoVaga')?.value   || null,
        curso_preferido: document.getElementById('intCurso')?.value      || null,
        semestre_minimo: document.getElementById('intSemestreMin')?.value || 1
    };

    btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Salvando...';

    try {
        const res = await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/interesses`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            // Atualiza sessão local com novos interesses
            const intRes = await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}`);
            if (intRes.ok) {
                const emp = await intRes.json();
                _empresaLogada.interesses = emp.interesses;
                sessionStorage.setItem('empresa_logada', JSON.stringify(_empresaLogada));
                _atualizarNavEmpresa();
            }
            _showAlerta(alerta, 'Interesses salvos com sucesso!', 'success');
            setTimeout(() => bootstrap.Modal.getOrCreateInstance(document.getElementById('modalInteresses')).hide(), 1200);
        } else {
            _showAlerta(alerta, 'Erro ao salvar interesses.', 'danger');
        }
    } catch (e) {
        _showAlerta(alerta, 'Erro de conexão.', 'danger');
    } finally {
        btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-circle me-1"></i>Salvar Interesses';
    }
}

// ─── FILTROS ──────────────────────────────────────────────────────────────────
async function carregarFiltros() {
    try {
        const [resFiltros, resSetores, resAreas, resVagas] = await Promise.all([
            fetch(`${TALENTOS_API}/talentos/filtros`),
            fetch(`${TALENTOS_API}/dom/setores`),
            fetch(`${TALENTOS_API}/dom/areas-foco`),
            fetch(`${TALENTOS_API}/dom/tipos-vaga`)
        ]);

        const filtros = await resFiltros.json();
        const setores = await resSetores.json();
        const areas   = await resAreas.json();
        const vagas   = await resVagas.json();

        filtros.cursos.forEach(c => {
            document.getElementById('filtCurso')?.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`);
            document.getElementById('intCurso')?.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`);
        });
        filtros.semestres.forEach(s => {
            document.getElementById('filtSemestre')?.insertAdjacentHTML('beforeend', `<option value="${s}">${s}º Semestre</option>`);
        });
        setores.forEach(s => {
            document.getElementById('cadSetor')?.insertAdjacentHTML('beforeend', `<option value="${s.id}">${s.nome}</option>`);
        });
        areas.forEach(a => {
            document.getElementById('intAreaFoco')?.insertAdjacentHTML('beforeend', `<option value="${a.id}">${a.nome}</option>`);
        });
        vagas.forEach(v => {
            document.getElementById('intTipoVaga')?.insertAdjacentHTML('beforeend', `<option value="${v.id}">${v.nome}</option>`);
        });
    } catch (e) { console.warn('Erro ao carregar filtros:', e); }
}

// ─── BUSCA ────────────────────────────────────────────────────────────────────
async function buscarTalentos() {
    const habilidade  = document.getElementById('searchHabilidade')?.value.trim() || '';
    const curso       = document.getElementById('filtCurso')?.value    || '';
    const semestreMin = document.getElementById('filtSemestre')?.value || '';
    const soGithub    = document.getElementById('filtSoGithub')?.checked  || false;
    const soLinkedin  = document.getElementById('filtSoLinkedin')?.checked || false;

    const params = new URLSearchParams();
    if (habilidade)  params.set('habilidade',   habilidade);
    if (curso)       params.set('curso',         curso);
    if (semestreMin) params.set('semestre_min',  semestreMin);

    mostrarLoading(true, 'Buscando talentos...');

    try {
        const res  = await fetch(`${TALENTOS_API}/talentos/buscar?${params}`);
        const data = await res.json();
        let talentos = data.talentos || [];

        if (soGithub)   talentos = talentos.filter(t => !!t.github);
        if (soLinkedin) talentos = talentos.filter(t => !!t.linkedin);

        _todosOsTalentos = talentos;
        atualizarEstatisticas(talentos);
        renderTalentos(talentos);

        const desc = document.getElementById('resultadoDesc');
        if (desc) desc.textContent = `${talentos.length} talento${talentos.length !== 1 ? 's' : ''} encontrado${talentos.length !== 1 ? 's' : ''}${habilidade ? ` em "${habilidade}"` : ''}`;
    } catch (e) {
        console.error('Erro ao buscar talentos:', e);
        mostrarErro('Erro ao conectar com o servidor. Verifique se a API está rodando.');
    } finally {
        mostrarLoading(false);
    }
}

function atualizarEstatisticas(talentos) {
    _setEl('statTotal',       talentos.length);
    _setEl('statComGithub',   talentos.filter(t => !!t.github).length);
    _setEl('statComLinkedin', talentos.filter(t => !!t.linkedin).length);
}

// ─── RENDER CARDS ─────────────────────────────────────────────────────────────
function renderTalentos(talentos) {
    const grid = document.getElementById('talentosGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!talentos.length) {
        grid.innerHTML = `<div class="col-12"><div class="text-center py-5 text-muted">
            <i class="bi bi-search fs-1 d-block mb-3"></i>
            <h5>Nenhum talento encontrado</h5>
            <p class="small">Tente ajustar os filtros ou remover a busca por habilidade.</p>
        </div></div>`;
        return;
    }

    const podeVer = _podeVerPerfil();
    const colClass = _viewMode === 'list' ? 'col-12' : 'col-lg-4 col-md-6';

    talentos.forEach(t => {
        const initial = (t.nome || 'T')[0].toUpperCase();
        const semestre = t.semestre ? `${t.semestre}º Sem.` : '—';
        const pontosHtml = (t.pontos_fortes || []).slice(0, 3).map(p =>
            `<span class="skill-pill">${p.disciplina} <strong>${Number(p.media).toFixed(1)}</strong></span>`
        ).join('');

        // Links GitHub/LinkedIn: só clicáveis se puder ver perfil
        const ghBtn = t.github
            ? (podeVer
                ? `<a href="${t.github}" target="_blank" class="btn btn-sm btn-outline-dark" data-gh="${t.id}"><i class="bi bi-github"></i></a>`
                : `<button class="btn btn-sm btn-outline-secondary" title="Faça login para acessar" data-req-login="1"><i class="bi bi-github"></i><i class="bi bi-lock ms-1" style="font-size:.65rem;"></i></button>`)
            : '';
        const liBtn = t.linkedin
            ? (podeVer
                ? `<a href="${t.linkedin}" target="_blank" class="btn btn-sm btn-outline-primary" data-li="${t.id}"><i class="bi bi-linkedin"></i></a>`
                : `<button class="btn btn-sm btn-outline-secondary" title="Faça login para acessar" data-req-login="1"><i class="bi bi-linkedin"></i><i class="bi bi-lock ms-1" style="font-size:.65rem;"></i></button>`)
            : '';

        const btnVerPerfil = podeVer
            ? `<button class="btn btn-sm btn-primary w-100 mt-2" data-ver="${t.id}"><i class="bi bi-eye me-1"></i>Ver Perfil</button>`
            : `<button class="btn btn-sm btn-outline-secondary w-100 mt-2" data-req-login="1" title="Faça login como empresa para ver o perfil completo"><i class="bi bi-lock me-1"></i>Ver Perfil</button>`;

        const col = document.createElement('div');
        col.className = colClass;

        if (_viewMode === 'list') {
            col.innerHTML = `
            <div class="talent-card p-3" data-card-ver="${t.id}">
                <div class="d-flex align-items-center gap-3">
                    <div class="talent-avatar">${initial}</div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-0 fw-bold">${t.nome}</h6>
                                <small class="text-muted">${t.curso || '—'} · ${semestre}</small>
                            </div>
                            <div class="d-flex gap-2 flex-shrink-0 ms-3">${ghBtn}${liBtn}</div>
                        </div>
                        <div class="mt-1">${pontosHtml || '<span class="text-muted small">Sem destaques registrados</span>'}</div>
                    </div>
                </div>
            </div>`;
        } else {
            col.innerHTML = `
            <div class="talent-card h-100" data-card-ver="${t.id}">
                <div class="card-body p-4">
                    <div class="d-flex align-items-center gap-3 mb-3">
                        <div class="talent-avatar">${initial}</div>
                        <div>
                            <h6 class="mb-0 fw-bold">${t.nome}</h6>
                            <small class="text-muted">${t.curso || '—'}</small><br>
                            <span class="badge bg-light text-dark border small">${semestre}</span>
                        </div>
                    </div>
                    <div class="mb-3">
                        <small class="text-muted fw-semibold d-block mb-1">Pontos Fortes</small>
                        ${pontosHtml || '<span class="text-muted small">Sem destaques registrados</span>'}
                    </div>
                    <div class="d-flex gap-2 mt-auto">
                        ${t.github   ? (podeVer ? `<a href="${t.github}"   target="_blank" class="btn btn-sm btn-outline-dark flex-fill" data-gh="${t.id}"><i class="bi bi-github me-1"></i>GitHub</a>` : `<button class="btn btn-sm btn-outline-secondary flex-fill" data-req-login="1" title="Faça login para acessar"><i class="bi bi-github me-1"></i><i class="bi bi-lock" style="font-size:.65rem;"></i></button>`) : '<button class="btn btn-sm btn-light flex-fill" disabled><i class="bi bi-github me-1"></i>—</button>'}
                        ${t.linkedin ? (podeVer ? `<a href="${t.linkedin}" target="_blank" class="btn btn-sm btn-outline-primary flex-fill" data-li="${t.id}"><i class="bi bi-linkedin me-1"></i>LinkedIn</a>` : `<button class="btn btn-sm btn-outline-secondary flex-fill" data-req-login="1" title="Faça login para acessar"><i class="bi bi-linkedin me-1"></i><i class="bi bi-lock" style="font-size:.65rem;"></i></button>`) : '<button class="btn btn-sm btn-light flex-fill" disabled><i class="bi bi-linkedin me-1"></i>—</button>'}
                    </div>
                    ${btnVerPerfil}
                </div>
            </div>`;
        }
        grid.appendChild(col);
    });

    // Delegação de eventos — evita onclick inline e funciona sempre com estado atual
    grid.addEventListener('click', _onGridClick, { once: true });
    // Usa delegação persistente em vez de `once`
    grid.onclick = _onGridClick;
}

function _onGridClick(e) {
    // Botão "requer login"
    if (e.target.closest('[data-req-login]')) { e.stopPropagation(); abrirModalLogin(); return; }

    // Links GitHub/LinkedIn com rastreio
    const ghEl = e.target.closest('[data-gh]');
    if (ghEl) { e.stopPropagation(); registrarInteracao(ghEl.dataset.gh, 'CLIQUE_GITHUB'); return; }
    const liEl = e.target.closest('[data-li]');
    if (liEl) { e.stopPropagation(); registrarInteracao(liEl.dataset.li, 'CLIQUE_LINKEDIN'); return; }

    // Botão "Ver Perfil"
    const verBtn = e.target.closest('[data-ver]');
    if (verBtn) { e.stopPropagation(); abrirPerfilAluno(parseInt(verBtn.dataset.ver)); return; }

    // Clique no card (não em botão/link)
    const card = e.target.closest('[data-card-ver]');
    if (card && !e.target.closest('a,button')) {
        const id = parseInt(card.dataset.cardVer);
        if (_podeVerPerfil()) abrirPerfilAluno(id);
        else abrirModalLogin();
    }
}

// ─── DRAWER PERFIL ────────────────────────────────────────────────────────────
async function abrirPerfilAluno(alunoId) {
    if (!_podeVerPerfil()) { abrirModalLogin(); return; }

    // Registra visualização (só se for empresa)
    if (_deveRegistrarVisualizacao()) registrarInteracao(alunoId, 'VISUALIZACAO');

    // Abre drawer com spinner
    document.getElementById('drawerAvatar').textContent = '?';
    document.getElementById('drawerNome').textContent = '—';
    document.getElementById('drawerCurso').textContent = '—';
    document.getElementById('drawerSemestre').textContent = '—';
    document.getElementById('drawerBody').innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    document.getElementById('perfilDrawer').classList.add('open');
    document.getElementById('drawerBackdrop').classList.add('open');
    document.body.style.overflow = 'hidden';

    try {
        const res = await fetch(`${TALENTOS_API}/talentos/aluno/${alunoId}/perfil`);
        if (!res.ok) { document.getElementById('drawerBody').innerHTML = '<div class="alert alert-warning m-3">Perfil não disponível.</div>'; return; }
        const d = await res.json();

        document.getElementById('drawerAvatar').textContent = (d.nome || '?')[0].toUpperCase();
        document.getElementById('drawerNome').textContent = d.nome;
        document.getElementById('drawerCurso').textContent = d.curso || '—';
        document.getElementById('drawerSemestre').textContent = d.semestre ? `${d.semestre}º Semestre` : '—';

        const m = d.metricas || {};
        const freq = m.frequencia ?? 0;

        // Gráfico de pizza de menções em SVG simples
        const mencaoData = [
            { label: 'SS', val: m.cnt_ss || 0, color: '#22C55E' },
            { label: 'MS', val: m.cnt_ms || 0, color: '#86EFAC' },
            { label: 'MM', val: m.cnt_mm || 0, color: '#FACC15' },
            { label: 'MI', val: m.cnt_mi || 0, color: '#F97316' },
            { label: 'II', val: m.cnt_ii || 0, color: '#EF4444' }
        ].filter(x => x.val > 0);
        const pieSvg = _buildDonutSvg(mencaoData);

        // Barra de frequência
        const freqColor = freq >= 75 ? '#22C55E' : '#EF4444';

        // Disciplinas de destaque
        const discHtml = (d.disciplinas_destaque || []).map(dd =>
            `<span class="badge me-1 mb-1" style="background:#e8f4ff;color:#1565c0;font-weight:500;">${dd.nome_materia} <strong>${dd.mencao}</strong></span>`
        ).join('') || '<span class="text-muted small">Nenhuma disciplina de destaque</span>';

        document.getElementById('drawerBody').innerHTML = `
            <!-- Métricas principais -->
            <div class="row g-2 mb-4">
                <div class="col-4"><div class="metric-box"><div class="val text-primary">${m.media_geral ?? '—'}</div><div class="lbl">CRA Geral</div></div></div>
                <div class="col-4"><div class="metric-box"><div class="val" style="color:${freqColor}">${freq}%</div><div class="lbl">Frequência</div></div></div>
                <div class="col-4"><div class="metric-box"><div class="val text-warning">${d.posicao_ranking !== '—' ? '#' + d.posicao_ranking : '—'}</div><div class="lbl">Ranking</div></div></div>
            </div>
            <div class="row g-2 mb-4">
                <div class="col-4"><div class="metric-box"><div class="val">${m.total_disciplinas ?? '—'}</div><div class="lbl">Disciplinas</div></div></div>
                <div class="col-4"><div class="metric-box"><div class="val">${m.total_atividades ?? '—'}</div><div class="lbl">Atividades</div></div></div>
                <div class="col-4"><div class="metric-box"><div class="val" style="color:${(m.total_faltas||0)>5?'#EF4444':'#333'}">${m.total_faltas ?? '—'}</div><div class="lbl">Faltas</div></div></div>
            </div>

            <!-- Gráfico menções -->
            ${mencaoData.length ? `
            <div class="mb-4">
                <small class="fw-semibold text-muted d-block mb-2">Distribuição de Menções</small>
                <div class="d-flex align-items-center gap-3">
                    ${pieSvg}
                    <div class="flex-grow-1">
                        ${mencaoData.map(x => `
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <span style="display:inline-block;width:10px;height:10px;background:${x.color};border-radius:2px;"></span>
                            <small>${x.label}: <strong>${x.val}</strong></small>
                        </div>`).join('')}
                    </div>
                </div>
            </div>` : ''}

            <!-- Frequência barra -->
            <div class="mb-4">
                <small class="fw-semibold text-muted d-block mb-1">Frequência Geral</small>
                <div class="progress" style="height:12px;border-radius:8px;">
                    <div class="progress-bar" style="width:${freq}%;background:${freqColor};border-radius:8px;">${freq}%</div>
                </div>
                <small class="text-muted">${freq >= 75 ? '✅ Frequência regular' : '⚠️ Abaixo do mínimo (75%)'}</small>
            </div>

            <!-- Disciplinas de destaque -->
            <div class="mb-4">
                <small class="fw-semibold text-muted d-block mb-2">Disciplinas de Destaque (SS/MS)</small>
                <div>${discHtml}</div>
            </div>

            <!-- Links profissionais -->
            <div class="d-flex gap-2">
                ${d.github   ? `<a href="${d.github}"   target="_blank" class="btn btn-outline-dark flex-fill btn-sm" onclick="registrarInteracao(${alunoId},'CLIQUE_GITHUB')"><i class="bi bi-github me-1"></i>GitHub</a>` : '<button class="btn btn-outline-secondary flex-fill btn-sm" disabled><i class="bi bi-github me-1"></i>GitHub</button>'}
                ${d.linkedin ? `<a href="${d.linkedin}" target="_blank" class="btn btn-outline-primary flex-fill btn-sm" onclick="registrarInteracao(${alunoId},'CLIQUE_LINKEDIN')"><i class="bi bi-linkedin me-1"></i>LinkedIn</a>` : '<button class="btn btn-outline-secondary flex-fill btn-sm" disabled><i class="bi bi-linkedin me-1"></i>LinkedIn</button>'}
            </div>`;
    } catch (e) {
        document.getElementById('drawerBody').innerHTML = `<div class="alert alert-danger m-3">Erro ao carregar perfil.</div>`;
    }
}

function fecharDrawer() {
    document.getElementById('perfilDrawer').classList.remove('open');
    document.getElementById('drawerBackdrop').classList.remove('open');
    document.body.style.overflow = '';
}

// Fecha com ESC
document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharDrawer(); });

// ─── SVG DONUT SIMPLES ────────────────────────────────────────────────────────
function _buildDonutSvg(data) {
    const total = data.reduce((s, x) => s + x.val, 0);
    if (!total) return '';
    const size = 80, cx = 40, cy = 40, r = 28, inner = 16;
    let svgPaths = '';
    let startAngle = -Math.PI / 2;
    data.forEach(item => {
        const slice = (item.val / total) * 2 * Math.PI;
        const endAngle = startAngle + slice;
        const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle),   y2 = cy + r * Math.sin(endAngle);
        const xi1 = cx + inner * Math.cos(startAngle), yi1 = cy + inner * Math.sin(startAngle);
        const xi2 = cx + inner * Math.cos(endAngle),   yi2 = cy + inner * Math.sin(endAngle);
        const large = slice > Math.PI ? 1 : 0;
        svgPaths += `<path d="M${xi1},${yi1} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${xi2},${yi2} A${inner},${inner} 0 ${large},0 ${xi1},${yi1} Z" fill="${item.color}"/>`;
        startAngle = endAngle;
    });
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="flex-shrink:0;">${svgPaths}</svg>`;
}

// ─── REGISTRO DE INTERAÇÃO ────────────────────────────────────────────────────
async function registrarInteracao(alunoId, tipo = 'VISUALIZACAO') {
    if (!_empresaLogada) return;
    try {
        await fetch(`${TALENTOS_API}/interacoes`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa_id: _empresaLogada.id, aluno_id: alunoId, tipo_interacao: tipo })
        });
    } catch (_) { /* silencioso — não interrompe UX */ }
}

// ─── UTILITÁRIOS ──────────────────────────────────────────────────────────────
function limparFiltros() {
    ['filtCurso', 'filtSemestre', 'searchHabilidade'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    ['filtSoGithub', 'filtSoLinkedin'].forEach(id => { const el = document.getElementById(id); if (el) el.checked = false; });
    buscarTalentos();
}

function mostrarLoading(show, msg = 'Carregando...') {
    const overlay = document.getElementById('loadingOverlay');
    const msgEl   = document.getElementById('loadingMsg');
    if (overlay) overlay.classList.toggle('show', show);
    if (msgEl) msgEl.textContent = msg;
}

function mostrarErro(msg) {
    const grid = document.getElementById('talentosGrid');
    if (grid) grid.innerHTML = `<div class="col-12"><div class="alert alert-danger text-center"><i class="bi bi-exclamation-triangle me-2"></i>${msg}</div></div>`;
}

function _setEl(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }

function _showAlerta(el, msg, type) {
    if (!el) return;
    el.className = `alert alert-${type}`;
    el.textContent = msg;
    el.classList.remove('d-none');
}
