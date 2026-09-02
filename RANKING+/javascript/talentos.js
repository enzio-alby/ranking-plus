// Portal de Talentos — javascript/talentos.js
const TALENTOS_API = 'http://localhost:4000';

let _todosOsTalentos = [];
let _viewMode = 'grid';
let _empresaLogada = null; // { id, razao_social, nome_fantasia, interesses:[] }
let _usuarioLogado = null; // { nome, tipo: 'aluno'|'professor' } — sessão vinda do areaaluno/areaprofessor
let _searchChips = [];   // termos de habilidade combinados na busca (chips)
let _ordenarPor  = 'cra_desc';
let _talentosPagina = 1;
const TALENTOS_POR_PAGINA = 9;
let _favoritosIds = new Set(); // IDs de alunos favoritados pela empresa logada
let _favoritosStatusMap = new Map(); // aluno_id -> status de acompanhamento ('novo'|'contatado'|'entrevista_marcada'|'em_processo'|'descartado')
let _favoritosNotasMap = new Map(); // aluno_id -> notas privadas da empresa sobre o candidato
let _favoritosEntrevistaMap = new Map(); // aluno_id -> { data_hora, observacao } — só relevante quando status = 'entrevista_marcada'
const STATUS_FAVORITO_LABELS = {
    novo: 'Novo',
    contatado: 'Contatado',
    entrevista_marcada: 'Entrevista marcada',
    em_processo: 'Em processo',
    contratado: 'Contratado',
    descartado: 'Descartado'
};
let _visualizadosIds = new Set(); // IDs já vistos pela empresa logada — usado no badge "Novo pra você"
let _compararIds = []; // até 3 IDs selecionados para comparação lado a lado
const COMPARAR_MAX = 3;

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

// INIT
document.addEventListener('DOMContentLoaded', async () => {
    _restaurarSessaoEmpresa();
    _restaurarSessaoUser();
    await carregarFiltros();   // popula os <option> de curso antes de restaurar o filtro salvo
    _restaurarUltimoFiltro();
    buscarTalentos();

    document.getElementById('aplicarFiltros')?.addEventListener('click', buscarTalentos);
    document.getElementById('limparFiltros')?.addEventListener('click', limparFiltros);
    document.getElementById('searchBtn')?.addEventListener('click', () => { _addSearchChipFromInput(); buscarTalentos(); });
    document.getElementById('searchHabilidade')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); _addSearchChipFromInput(); buscarTalentos(); }
    });
    document.getElementById('viewGrid')?.addEventListener('click', () => { _viewMode = 'grid'; renderTalentos(_todosOsTalentos); });
    document.getElementById('viewList')?.addEventListener('click', () => { _viewMode = 'list'; renderTalentos(_todosOsTalentos); });

    document.getElementById('notifEmpresaBtn')?.addEventListener('click', _carregarNotificacoesEmpresa);
    document.getElementById('notifEmpresaMarcarTodasLidas')?.addEventListener('click', async () => {
        if (!_empresaLogada) return;
        await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/notificacoes/marcar-todas-lidas`, { method: 'PUT' });
        _carregarNotificacoesEmpresa();
    });

    // Spotlight border — o brilho segue o cursor dentro do card (delegado, funciona pra cards criados depois)
    document.getElementById('talentosGrid')?.addEventListener('mousemove', (e) => {
        const card = e.target.closest('.talent-card');
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
    document.getElementById('ordenarPor')?.addEventListener('change', e => {
        _ordenarPor = e.target.value;
        renderTalentos(_todosOsTalentos);
    });
    document.getElementById('btnLoginEmpresa')?.addEventListener('click', handleLoginEmpresa);
    document.getElementById('btnCadastroEmpresa')?.addEventListener('click', handleCadastroEmpresa);
    document.getElementById('btnSalvarInteresses')?.addEventListener('click', handleSalvarInteresses);
    document.getElementById('exportarCsv')?.addEventListener('click', _exportarTalentosCsv);
    document.getElementById('exportarFavoritosCsv')?.addEventListener('click', exportarFavoritosCSV);
});

// SESSÃO EMPRESA
function _restaurarSessaoEmpresa() {
    // Tenta sessionStorage primeiro (login normal); fallback para localStorage (impersonation via admin em file://)
    const saved = sessionStorage.getItem('empresa_logada') || localStorage.getItem('empresa_logada');
    // Sem token válido (achado S1), a empresa "logada" aqui é só aparência — toda
    // rota de dados vai dar 401. Em vez de mostrar tudo quebrado, trata como
    // deslogado e limpa o resto anterior (ex: sessão de antes do token existir).
    if (saved && !localStorage.getItem('unirank_token')) {
        sessionStorage.removeItem('empresa_logada');
        localStorage.removeItem('empresa_logada');
        return;
    }
    if (saved) {
        try { _empresaLogada = JSON.parse(saved); _atualizarNavEmpresa(); } catch (_) {}
    }
}

// SESSÃO ALUNO / PROFESSOR
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
    const favWrap = document.getElementById('filtSoFavoritosWrap');

    if (_empresaLogada) {
        navNao?.classList.add('d-none');
        navUser?.classList.add('d-none');
        navLog?.classList.remove('d-none');
        favWrap?.classList.remove('d-none');
        if (navNome) navNome.textContent = _empresaLogada.nome_fantasia || _empresaLogada.razao_social;
        banner?.classList.remove('d-none');
        // Badge de check-ins pendentes — não bloqueia a UI, só atualiza quando volta.
        fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/contratacoes`)
            .then(r => r.ok ? r.json() : [])
            .then(lista => _atualizarBadgeContratacoes(lista))
            .catch(() => {});
        // Monta resumo de interesses
        const int = (_empresaLogada.interesses || [])[0];
        if (int && resumo) {
            const partes = [int.area_foco_nome, int.tipo_vaga_nome, int.curso_preferido].filter(Boolean);
            resumo.textContent = partes.length ? partes.join(' · ') + (int.semestre_minimo > 1 ? ` · ${int.semestre_minimo}º sem+` : '') : 'Nenhum interesse definido';
        } else if (resumo) {
            resumo.textContent = 'Nenhum interesse definido ainda. Clique em Editar para configurar.';
        }
        _carregarFavoritos();
        _carregarHistoricoVisualizados();
        _carregarNotificacoesEmpresa();
        _carregarOnboarding();
    } else {
        navNao?.classList.remove('d-none');
        navLog?.classList.add('d-none');
        favWrap?.classList.add('d-none');
        banner?.classList.add('d-none');
        document.getElementById('onboardingChecklist')?.classList.add('d-none');
        _favoritosIds = new Set();
        _favoritosStatusMap = new Map();
        _favoritosNotasMap = new Map();
        _favoritosEntrevistaMap = new Map();
        _visualizadosIds = new Set();
    }

    // "Melhor match" só faz sentido com empresa logada (o score de compatibilidade
    // vem do servidor; se a empresa não cadastrou nenhum critério, degrada sozinho).
    const matchOption = document.getElementById('ordenarMatchOption');
    if (matchOption) {
        const temInteresse = !!_empresaLogada;
        matchOption.hidden = !temInteresse;
        if (!temInteresse && _ordenarPor === 'match_desc') {
            _ordenarPor = 'cra_desc';
            const sel = document.getElementById('ordenarPor');
            if (sel) sel.value = 'cra_desc';
        }
    }
    // Re-renderiza cards para atualizar botões/links com novo estado de sessão
    if (_todosOsTalentos.length) renderTalentos(_todosOsTalentos);
}

// Checklist de "primeiros passos" — progresso real, lido do banco (nada
// marcado manualmente). Some sozinho quando os 3 passos estão completos, ou
// se a empresa dispensar antes disso (guardado por empresa em localStorage).
function _onboardingDispensadoChave() {
    return `onboarding_dispensado_${_empresaLogada?.id}`;
}

async function _carregarOnboarding() {
    const card = document.getElementById('onboardingChecklist');
    if (!card || !_empresaLogada) return;
    if (localStorage.getItem(_onboardingDispensadoChave()) === '1') { card.classList.add('d-none'); return; }

    try {
        const res = await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/onboarding`);
        if (!res.ok) { card.classList.add('d-none'); return; }
        const p = await res.json();

        const passos = [
            { feito: p.tem_interesse, texto: 'Definir Interesses de Perfil', cta: 'Definir', onclick: 'abrirModalInteresses()' },
            { feito: p.tem_vaga, texto: 'Publicar sua primeira vaga', cta: 'Publicar', onclick: 'abrirModalVagas(); _abrirFormNovaVaga();' },
            { feito: p.tem_favorito, texto: 'Favoritar um candidato', cta: 'Ver candidatos', onclick: "document.getElementById('talentosGrid')?.scrollIntoView({behavior:'smooth'})" }
        ];
        const concluidos = passos.filter(p => p.feito).length;

        if (concluidos === passos.length) { card.classList.add('d-none'); return; }
        card.classList.remove('d-none');

        document.getElementById('onboardingProgresso').textContent = `${concluidos}/${passos.length} concluídos`;
        document.getElementById('onboardingBarra').style.width = `${(concluidos / passos.length) * 100}%`;
        document.getElementById('onboardingItens').innerHTML = passos.map(passo => `
            <div class="onboarding-item ${passo.feito ? 'feito' : ''}">
                <div class="oi-check">${passo.feito ? '<i class="bi bi-check-lg"></i>' : ''}</div>
                <div class="oi-texto">${passo.texto}</div>
                ${!passo.feito ? `<button type="button" class="btn btn-sm btn-outline-primary oi-cta" onclick="${passo.onclick}">${passo.cta}</button>` : ''}
            </div>`).join('');
    } catch (e) {
        card.classList.add('d-none');
    }
}

window._dispensarOnboarding = function () {
    localStorage.setItem(_onboardingDispensadoChave(), '1');
    document.getElementById('onboardingChecklist')?.classList.add('d-none');
};

// Monta um estado vazio padronizado (ícone + título + texto + ação opcional)
// pras listas da empresa (Minhas Vagas, Favoritos, Já Visualizados).
function _emptyStateHtml(icone, titulo, texto, ctaHtml = '') {
    return `
        <div class="empty-state-nice">
            <i class="bi ${icone}"></i>
            <div class="est-titulo">${titulo}</div>
            <div class="est-texto">${texto}</div>
            ${ctaHtml}
        </div>`;
}

// Notificações da empresa
async function _carregarNotificacoesEmpresa() {
    if (!_empresaLogada) return;
    const lista = document.getElementById('notifEmpresaLista');
    const badge = document.getElementById('notifEmpresaBadge');
    try {
        const res  = await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/notificacoes`);
        const data = await res.json();

        if (badge) {
            if (data.nao_lidas > 0) {
                badge.textContent = data.nao_lidas > 9 ? '9+' : data.nao_lidas;
                badge.classList.remove('d-none');
            } else {
                badge.classList.add('d-none');
            }
        }

        if (!lista) return;
        if (!data.notificacoes.length) {
            lista.innerHTML = '<div class="text-center text-muted small py-4">Nenhuma notificação por aqui.</div>';
            return;
        }

        lista.innerHTML = data.notificacoes.map(n => `
            <a href="#" class="dropdown-item py-2 px-3 border-bottom notif-empresa-item ${n.lida ? '' : 'bg-light'}" data-notif-id="${n.id}" data-aluno-id="${n.tipo === 'novo_candidato' ? n.referencia_id : ''}">
                <div class="d-flex align-items-start gap-2">
                    <i class="bi ${n.tipo === 'novo_candidato' ? 'bi-person-plus' : 'bi-bell'}" style="color:var(--primary);margin-top:2px;"></i>
                    <div>
                        <div class="small fw-semibold">${_esc(n.titulo)}</div>
                        <div class="small text-muted">${_esc(n.mensagem)}</div>
                    </div>
                </div>
            </a>
        `).join('');

        lista.querySelectorAll('.notif-empresa-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const id = item.dataset.notifId;
                await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/notificacoes/${id}/lida`, { method: 'PUT' });
                _carregarNotificacoesEmpresa();
            });
        });
    } catch (_) {
        if (lista) lista.innerHTML = '<div class="text-center text-muted small py-4">Não foi possível carregar.</div>';
    }
}

function logoutEmpresa() {
    _empresaLogada = null;
    sessionStorage.removeItem('empresa_logada');
    localStorage.removeItem('empresa_logada');
    localStorage.removeItem('unirank_token'); // correção do achado S1
    _atualizarNavEmpresa();
}

// Sair da sessão de aluno/professor (talentos.html é aberto a partir da área do
// aluno/professor — mesmo comportamento de logout usado lá: limpa tudo e volta
// pro login).
function logoutUsuario() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// LOGIN EMPRESA
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
            if (data.token) localStorage.setItem('unirank_token', data.token); // correção do achado S1
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

// INTERESSES
function abrirModalInteresses() {
    if (!_empresaLogada) { abrirModalLogin(); return; }
    _preencherInteressesModal();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalInteresses')).show();
}

function _preencherInteressesModal() {
    if (!_empresaLogada) return;

    const perfis = _empresaLogada.perfis_procurados || [];
    const p1 = document.getElementById('intPerfil1');
    const p2 = document.getElementById('intPerfil2');
    if (p1) p1.value = perfis[0] || '';
    if (p2) p2.value = perfis[1] || '';

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
    const perfisSelecionados = [
        document.getElementById('intPerfil1')?.value,
        document.getElementById('intPerfil2')?.value
    ].filter(Boolean);
    const payload = {
        area_foco_id:    document.getElementById('intAreaFoco')?.value   || null,
        tipo_vaga_id:    document.getElementById('intTipoVaga')?.value   || null,
        curso_preferido: document.getElementById('intCurso')?.value      || null,
        semestre_minimo: document.getElementById('intSemestreMin')?.value || 1,
        perfis_procurados: perfisSelecionados
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
                _empresaLogada.perfis_procurados = emp.perfis_procurados;
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

// VAGAS (múltiplas, além do perfil único de Interesses)
let _vagasCache = [];

function abrirModalVagas() {
    if (!_empresaLogada) { abrirModalLogin(); return; }
    _fecharFormVaga();
    document.getElementById('vagasAlerta').classList.add('d-none');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalVagas')).show();
    _carregarVagas();
}

async function _carregarVagas() {
    const lista = document.getElementById('vagasLista');
    lista.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';
    try {
        const res = await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/vagas`);
        _vagasCache = res.ok ? await res.json() : [];
        _renderVagasLista(_vagasCache);
    } catch (e) {
        lista.innerHTML = '<p class="text-danger text-center py-3 mb-0">Erro ao carregar vagas.</p>';
    }
}

function _renderVagasLista(vagas) {
    const lista = document.getElementById('vagasLista');
    if (!vagas.length) {
        lista.innerHTML = _emptyStateHtml('bi-briefcase', 'Nenhuma vaga publicada ainda',
            'Publique sua primeira vaga pra começar a receber interesse de candidatos e ver quem curtiu ela aqui.',
            '<button type="button" class="btn btn-sm btn-primary" onclick="_abrirFormNovaVaga()"><i class="bi bi-plus-lg me-1"></i>Nova Vaga</button>');
        return;
    }
    lista.innerHTML = vagas.map(v => {
        const aberta = v.status === 'aberta';
        const detalhes = [v.area_foco_nome, v.tipo_vaga_nome, v.curso_preferido, v.semestre_minimo ? `${v.semestre_minimo}º sem+` : null]
            .filter(Boolean).join(' · ');
        return `
        <div class="d-flex justify-content-between align-items-start border rounded p-2 mb-2">
            <div>
                <div class="fw-semibold small">
                    ${_escTextarea(v.titulo)}
                    <span class="badge ${aberta ? 'bg-success' : 'bg-secondary'} ms-1">${aberta ? 'Aberta' : 'Fechada'}</span>
                </div>
                ${detalhes ? `<div class="text-muted" style="font-size:.75rem;">${_escTextarea(detalhes)}</div>` : ''}
                ${v.descricao ? `<div class="text-muted small mt-1">${_escTextarea(v.descricao)}</div>` : ''}
                <button type="button" class="btn btn-sm btn-link p-0 mt-1" onclick="_toggleInteressadosVaga(${v.id}, this)">
                    <i class="bi bi-people me-1"></i>${v.interessados_count || 0} interessado${v.interessados_count == 1 ? '' : 's'}
                </button>
                <div class="d-none mt-1" id="vagaInteressados-${v.id}"></div>
            </div>
            <div class="d-flex gap-1 flex-shrink-0 ms-2">
                <button type="button" class="btn btn-sm btn-outline-secondary" title="Editar" onclick="_editarVaga(${v.id})"><i class="bi bi-pencil"></i></button>
                ${aberta ? `<button type="button" class="btn btn-sm btn-outline-danger" title="Fechar vaga" onclick="fecharVaga(${v.id})"><i class="bi bi-x-lg"></i></button>` : ''}
            </div>
        </div>`;
    }).join('');
}

// Visibilidade de quem se interessou na vaga, sem exigir match — só pra
// facilitar a empresa a ver demanda real antes de agir (pedido explícito).
async function _toggleInteressadosVaga(vagaId, btnEl) {
    const wrap = document.getElementById(`vagaInteressados-${vagaId}`);
    if (!wrap) return;
    if (!wrap.classList.contains('d-none')) { wrap.classList.add('d-none'); return; }
    wrap.classList.remove('d-none');
    wrap.innerHTML = '<div class="text-muted small"><div class="spinner-border spinner-border-sm me-1"></div>Carregando...</div>';
    try {
        const res = await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/vagas/${vagaId}/interessados`);
        const alunos = res.ok ? await res.json() : [];
        wrap.innerHTML = alunos.length
            ? `<ul class="list-unstyled small mb-0 border-top pt-1">${alunos.map(a =>
                `<li class="py-1"><i class="bi bi-person-fill text-muted me-1"></i>
                   <a href="#" class="link-primary text-decoration-none" onclick="abrirPerfilAluno(${a.id}, ${vagaId}); return false;">${_escTextarea(a.nome)}</a>
                   — ${_escTextarea(a.curso || '')}${a.semestre ? ` (${a.semestre}º sem.)` : ''}</li>`
              ).join('')}</ul>`
            : '<p class="text-muted small mb-0">Ninguém demonstrou interesse ainda.</p>';
    } catch (e) {
        wrap.innerHTML = '<p class="text-danger small mb-0">Erro ao carregar interessados.</p>';
    }
}

function _abrirFormNovaVaga() {
    document.getElementById('vagaForm').reset();
    document.getElementById('vagaFormId').value = '';
    document.getElementById('vagaAreaFoco').innerHTML = document.getElementById('intAreaFoco')?.innerHTML || '<option value="">—</option>';
    document.getElementById('vagaTipoVaga').innerHTML = document.getElementById('intTipoVaga')?.innerHTML || '<option value="">—</option>';
    document.getElementById('vagasListaWrap').classList.add('d-none');
    document.getElementById('vagaForm').classList.remove('d-none');
}

function _editarVaga(vagaId) {
    const v = _vagasCache.find(x => x.id === vagaId);
    if (!v) return;
    _abrirFormNovaVaga();
    document.getElementById('vagaFormId').value = v.id;
    document.getElementById('vagaTitulo').value = v.titulo || '';
    document.getElementById('vagaDescricao').value = v.descricao || '';
    if (v.area_foco_id) document.getElementById('vagaAreaFoco').value = v.area_foco_id;
    if (v.tipo_vaga_id) document.getElementById('vagaTipoVaga').value = v.tipo_vaga_id;
    document.getElementById('vagaCurso').value = v.curso_preferido || '';
    document.getElementById('vagaSemestreMin').value = v.semestre_minimo || '';
}

function _fecharFormVaga() {
    document.getElementById('vagaForm')?.classList.add('d-none');
    document.getElementById('vagasListaWrap')?.classList.remove('d-none');
}

async function salvarVaga() {
    const alerta = document.getElementById('vagasAlerta');
    const id = document.getElementById('vagaFormId').value;
    const titulo = document.getElementById('vagaTitulo').value.trim();
    if (!titulo) { _showAlerta(alerta, 'Título é obrigatório.', 'warning'); return; }

    const payload = {
        titulo,
        descricao: document.getElementById('vagaDescricao').value.trim() || null,
        area_foco_id: document.getElementById('vagaAreaFoco').value || null,
        tipo_vaga_id: document.getElementById('vagaTipoVaga').value || null,
        curso_preferido: document.getElementById('vagaCurso').value.trim() || null,
        semestre_minimo: document.getElementById('vagaSemestreMin').value || null
    };

    const btn = document.getElementById('vagaFormSalvarBtn');
    btn.disabled = true;
    try {
        const url = id ? `${TALENTOS_API}/empresas/${_empresaLogada.id}/vagas/${id}` : `${TALENTOS_API}/empresas/${_empresaLogada.id}/vagas`;
        const res = await fetch(url, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) { _showAlerta(alerta, data.error || 'Erro ao salvar vaga.', 'danger'); return; }
        _fecharFormVaga();
        _showAlerta(alerta, id ? 'Vaga atualizada com sucesso!' : 'Vaga criada com sucesso!', 'success');
        _carregarVagas();
    } catch (e) {
        _showAlerta(alerta, 'Erro de conexão.', 'danger');
    } finally {
        btn.disabled = false;
    }
}

async function fecharVaga(vagaId) {
    try {
        await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/vagas/${vagaId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'fechada' })
        });
        _carregarVagas();
    } catch (e) {
        console.error('Erro ao fechar vaga:', e);
    }
}

// FILTROS
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

// BUSCA MULTI-HABILIDADE (chips)
function _addSearchChipFromInput() {
    const input = document.getElementById('searchHabilidade');
    const val = (input?.value || '').trim();
    if (val && !_searchChips.includes(val)) _searchChips.push(val);
    if (input) input.value = '';
    renderSearchChips();
}

function _removeSearchChip(idx) {
    _searchChips.splice(idx, 1);
    renderSearchChips();
    buscarTalentos();
}

function renderSearchChips() {
    const el = document.getElementById('searchChips');
    if (!el) return;
    el.innerHTML = _searchChips.map((termo, i) => `
        <span class="search-chip">${termo}<button type="button" onclick="_removeSearchChip(${i})" aria-label="Remover ${termo}"><i class="bi bi-x-lg"></i></button></span>
    `).join('');
    // Menção específica só faz sentido combinada com pelo menos uma habilidade buscada
    const mencaoSel = document.getElementById('filtMencao');
    if (mencaoSel) {
        mencaoSel.disabled = _searchChips.length === 0;
        if (!_searchChips.length) mencaoSel.value = '';
    }
    const ajuda = document.getElementById('filtMencaoAjuda');
    if (ajuda) ajuda.classList.toggle('d-none', _searchChips.length > 0);
}

// ORDENAÇÃO
function _ordenarTalentos(talentos, criterio) {
    const lista = [...talentos];
    switch (criterio) {
        case 'cra_asc':       return lista.sort((a, b) => (a.media_geral ?? -1) - (b.media_geral ?? -1));
        case 'nome_asc':      return lista.sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
        case 'semestre_desc': return lista.sort((a, b) => (b.semestre ?? 0) - (a.semestre ?? 0));
        case 'match_desc':
            // Usa o score de compatibilidade do servidor quando presente; sem ele
            // (nem interesse cadastrado) o score não existe — nunca quebra.
            return lista.sort((a, b) => (_matchScoreDe(b) ?? -1) - (_matchScoreDe(a) ?? -1));
        case 'cra_desc':
        default:               return lista.sort((a, b) => (b.media_geral ?? -1) - (a.media_geral ?? -1));
    }
}

// Match score (%) — heurística simples e transparente de aderência do candidato aos
// "Interesses de Perfil" cadastrados pela empresa (curso preferido + semestre mínimo),
// mesma fonte de dado já usada pelo badge "Novo pra você". Pesos iguais (50/50): não é
// nenhum algoritmo de ranqueamento sofisticado, é uma régua declarada e auditável —
// quando um dos dois critérios não está preenchido pela empresa, ele conta como "bate"
// (mesmo comportamento já usado em `bateInteresse`, mantido igual de propósito).
function _calcularMatchScore(t, interesse) {
    if (!interesse) return null;
    let score = 0;
    if (!interesse.curso_preferido || interesse.curso_preferido === t.curso) score += 50;
    if (!interesse.semestre_minimo || (t.semestre ?? 0) >= interesse.semestre_minimo) score += 50;
    return score;
}

// Score de compatibilidade calculado no servidor (t.compatibilidade). Prefere-se
// sempre este ao _calcularMatchScore acima — o do servidor combina desempenho
// acadêmico, área, perfil comportamental e critérios da vaga; o local é só
// fallback (curso + semestre) pra quando o backend não devolveu o campo.
function _matchScoreDe(t) {
    if (t.compatibilidade && t.compatibilidade.score != null) return t.compatibilidade.score;
    return _calcularMatchScore(t, _empresaLogada?.interesses?.[0]);
}
function _matchCorDe(t) {
    const c = t.compatibilidade;
    if (c && c.score != null) return c.faixa === 'alta' ? 'success' : c.faixa === 'media' ? 'warning' : 'secondary';
    const s = _matchScoreDe(t);
    return s >= 70 ? 'success' : s >= 40 ? 'warning' : 'secondary';
}

// Card de compatibilidade com breakdown, usado no drawer do candidato.
function _compatCardHtml(compat) {
    if (!compat || compat.score == null) return '';
    const cor = compat.faixa === 'alta' ? '#16A34A' : compat.faixa === 'media' ? '#D97706' : '#6B7280';
    const rotuloFaixa = compat.faixa === 'alta' ? 'Alta compatibilidade'
        : compat.faixa === 'media' ? 'Compatibilidade média' : 'Baixa compatibilidade';
    const origem = compat.origem === 'vaga' ? 'com a vaga' : 'com seus Interesses de Perfil';
    const linhas = (compat.componentes || []).map(c => {
        const pct = c.aplicavel && c.peso ? Math.round(100 * c.obtido / c.peso) : 0;
        const barCor = !c.aplicavel ? '#D1D5DB' : (pct >= 75 ? '#16A34A' : pct >= 40 ? '#D97706' : '#DC2626');
        return `
        <div class="mb-2">
            <div class="d-flex justify-content-between small">
                <span class="${c.aplicavel ? '' : 'text-muted'}">${_esc(c.rotulo)}</span>
                <span class="text-muted">${c.aplicavel ? c.obtido + '/' + c.peso + ' pts' : 'n/d'}</span>
            </div>
            <div class="progress" style="height:6px;border-radius:6px;">
                <div class="progress-bar" style="width:${c.aplicavel ? pct : 100}%;background:${barCor};border-radius:6px;"></div>
            </div>
            <div class="text-muted" style="font-size:.72rem;">${_esc(c.detalhe || '')}</div>
        </div>`;
    }).join('');
    return `
    <div class="card border-0 mb-4" style="border-left:4px solid ${cor};background:#f8fafc;">
        <div class="card-body py-3">
            <div class="d-flex align-items-center justify-content-between mb-3">
                <div>
                    <div class="small text-uppercase text-muted" style="letter-spacing:.5px;">Compatibilidade ${origem}</div>
                    <div class="fw-bold" style="color:${cor};">${rotuloFaixa}</div>
                </div>
                <div class="fs-3 fw-bold" style="color:${cor};">${compat.score}%</div>
            </div>
            ${linhas}
        </div>
    </div>`;
}

// LEMBRAR ÚLTIMO FILTRO (preferência de UI — localStorage)
const _FILTRO_STORAGE_KEY = 'talentos_ultimo_filtro';

function _salvarUltimoFiltro() {
    try {
        localStorage.setItem(_FILTRO_STORAGE_KEY, JSON.stringify({
            curso:      document.getElementById('filtCurso')?.value || '',
            semestre:   document.getElementById('filtSemestre')?.value || '',
            craMin:     document.getElementById('filtCraMin')?.value || '',
            mencao:     document.getElementById('filtMencao')?.value || '',
            soGithub:   document.getElementById('filtSoGithub')?.checked || false,
            soLinkedin: document.getElementById('filtSoLinkedin')?.checked || false,
            chips:      _searchChips,
            ordenarPor: _ordenarPor
        }));
    } catch (_) { /* localStorage indisponível — ignora silenciosamente */ }
}

function _restaurarUltimoFiltro() {
    try {
        const salvo = JSON.parse(localStorage.getItem(_FILTRO_STORAGE_KEY) || 'null');
        if (!salvo) return;
        if (document.getElementById('filtCurso'))     document.getElementById('filtCurso').value     = salvo.curso || '';
        if (document.getElementById('filtSemestre'))  document.getElementById('filtSemestre').value  = salvo.semestre || '';
        if (document.getElementById('filtCraMin'))    document.getElementById('filtCraMin').value    = salvo.craMin || '';
        if (document.getElementById('filtSoGithub'))  document.getElementById('filtSoGithub').checked  = !!salvo.soGithub;
        if (document.getElementById('filtSoLinkedin'))document.getElementById('filtSoLinkedin').checked = !!salvo.soLinkedin;
        if (document.getElementById('ordenarPor') && salvo.ordenarPor) document.getElementById('ordenarPor').value = salvo.ordenarPor;
        _searchChips = Array.isArray(salvo.chips) ? salvo.chips : [];
        _ordenarPor  = salvo.ordenarPor || 'cra_desc';
        renderSearchChips(); // já habilita/desabilita filtMencao conforme _searchChips
        if (document.getElementById('filtMencao') && salvo.mencao) document.getElementById('filtMencao').value = salvo.mencao;
    } catch (_) { /* filtro salvo corrompido — ignora e segue com o padrão */ }
}

// BUSCA
async function buscarTalentos() {
    const habilidade  = _searchChips.join(',');
    const curso       = document.getElementById('filtCurso')?.value    || '';
    const semestreMin = document.getElementById('filtSemestre')?.value || '';
    const craMin      = parseFloat(document.getElementById('filtCraMin')?.value) || 0;
    const mencao      = document.getElementById('filtMencao')?.value || '';
    const soGithub    = document.getElementById('filtSoGithub')?.checked  || false;
    const soLinkedin  = document.getElementById('filtSoLinkedin')?.checked || false;

    const params = new URLSearchParams();
    if (habilidade)  params.set('habilidade',   habilidade);
    if (curso)       params.set('curso',         curso);
    if (semestreMin) params.set('semestre_min',  semestreMin);
    if (habilidade && mencao) params.set('mencao', mencao); // só faz sentido combinado com habilidade

    renderSkeletonCards();
    _salvarUltimoFiltro();

    try {
        const res  = await fetch(`${TALENTOS_API}/talentos/buscar?${params}`);
        const data = await res.json();
        let talentos = data.talentos || [];

        if (soGithub)   talentos = talentos.filter(t => !!t.github);
        if (soLinkedin) talentos = talentos.filter(t => !!t.linkedin);
        if (craMin > 0) talentos = talentos.filter(t => (t.media_geral ?? 0) >= craMin);
        if (document.getElementById('filtSoFavoritos')?.checked) talentos = talentos.filter(t => _favoritosIds.has(t.id));

        _todosOsTalentos = talentos;
        _talentosPagina = 1;
        atualizarEstatisticas(talentos);
        renderTalentos(talentos);

        const desc = document.getElementById('resultadoDesc');
        if (desc) desc.textContent = `${talentos.length} talento${talentos.length !== 1 ? 's' : ''} encontrado${talentos.length !== 1 ? 's' : ''}${habilidade ? ` em "${_searchChips.join('", "')}"` : ''}`;
    } catch (e) {
        console.error('Erro ao buscar talentos:', e);
        mostrarErro('Erro ao conectar com o servidor. Verifique se a API está rodando.');
    }
}

function atualizarEstatisticas(talentos) {
    _setEl('statTotal',       talentos.length);
    _setEl('statComGithub',   talentos.filter(t => !!t.github).length);
    _setEl('statComLinkedin', talentos.filter(t => !!t.linkedin).length);
}

// RENDER CARDS
function renderTalentos(talentosOriginais) {
    const grid = document.getElementById('talentosGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!talentosOriginais.length) {
        grid.innerHTML = `<div class="col-12"><div class="text-center py-5 text-muted">
            <i class="bi bi-search fs-1 d-block mb-3"></i>
            <h5>Nenhum talento encontrado</h5>
            <p class="small">Tente ajustar os filtros ou remover a busca por habilidade.</p>
        </div></div>`;
        const pagEl = document.getElementById('talentosPaginacao');
        if (pagEl) pagEl.innerHTML = '';
        return;
    }

    // Top 3 por CRA geral dentro do conjunto filtrado atual — independe da ordenação escolhida
    const top3Ids = [...talentosOriginais]
        .filter(t => t.media_geral != null)
        .sort((a, b) => b.media_geral - a.media_geral)
        .slice(0, 3)
        .map(t => t.id);
    const medalhas = ['🥇', '🥈', '🥉'];
    const medalhaPorId = Object.fromEntries(top3Ids.map((id, i) => [id, medalhas[i]]));

    const talentosOrdenados = _ordenarTalentos(talentosOriginais, _ordenarPor);

    const totalPaginas = Math.max(1, Math.ceil(talentosOrdenados.length / TALENTOS_POR_PAGINA));
    if (_talentosPagina > totalPaginas) _talentosPagina = totalPaginas;
    const inicio = (_talentosPagina - 1) * TALENTOS_POR_PAGINA;
    const talentos = talentosOrdenados.slice(inicio, inicio + TALENTOS_POR_PAGINA);

    const podeVer = _podeVerPerfil();
    const colClass = _viewMode === 'list' ? 'col-12' : 'col-lg-4 col-md-6';

    talentos.forEach((t, cardIndex) => {
        const initial = (t.nome || 'T')[0].toUpperCase();
        const semestre = t.semestre ? `${t.semestre}º Sem.` : '—';
        const medalhaHtml = medalhaPorId[t.id] ? `<span class="talent-medal" title="Top 3 por CRA no resultado atual">${medalhaPorId[t.id]}</span>` : '';
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

        // Favoritar — só faz sentido pra empresa (shortlist de candidatos)
        const isFav = _favoritosIds.has(t.id);
        const favBtnHtml = _empresaLogada
            ? `<button type="button" class="talent-fav-btn${isFav ? ' is-fav' : ''}" data-fav="${t.id}" title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"><i class="bi bi-star${isFav ? '-fill' : ''}"></i></button>`
            : '';

        // Comparar — disponível pra quem já pode ver o perfil completo
        const isComparando = _compararIds.includes(t.id);
        const compareBtnHtml = podeVer
            ? `<button type="button" class="talent-compare-btn${isComparando ? ' is-compare' : ''}" data-compare="${t.id}" title="${isComparando ? 'Remover da comparação' : 'Adicionar à comparação'}"><i class="bi bi-${isComparando ? 'check2-square' : 'square'}"></i></button>`
            : '';

        // Grid: os dois botões ficam num toolbar absoluto no canto do card.
        // Lista: seguem o fluxo normal, lado a lado com GitHub/LinkedIn.
        const actionsTopHtml = (favBtnHtml || compareBtnHtml) ? `<div class="talent-actions-top">${favBtnHtml}${compareBtnHtml}</div>` : '';

        // Badge "Novo pra você" — bate com curso/semestre mínimo salvo nos Interesses
        // da empresa e ainda não foi visualizado. Não existe alerta em tempo real
        // nesse projeto (sem e-mail/push), então isso é o equivalente honesto: só
        // sinaliza o que já é real (dado salvo + histórico), sem simular notificação.
        const interesse = _empresaLogada?.interesses?.[0];
        const bateInteresse = interesse && (
            (!interesse.curso_preferido || interesse.curso_preferido === t.curso) &&
            (!interesse.semestre_minimo || (t.semestre ?? 0) >= interesse.semestre_minimo)
        );
        const novoBadgeHtml = (_empresaLogada && bateInteresse && !_visualizadosIds.has(t.id))
            ? `<span class="badge talent-new-badge">Novo pra você</span>` : '';

        // Score de compatibilidade (%) — vem do servidor (t.compatibilidade), com
        // fallback local (curso + semestre). Visível em todo candidato quando há
        // empresa logada. O tooltip lista o detalhamento por componente.
        const matchScore = _empresaLogada ? _matchScoreDe(t) : null;
        const matchCor = _matchCorDe(t);
        const matchTitle = t.compatibilidade && t.compatibilidade.componentes
            ? `Compatibilidade ${t.compatibilidade.score}% — ` + t.compatibilidade.componentes
                .filter(c => c.aplicavel).map(c => `${c.rotulo} ${c.obtido}/${c.peso}`).join(' · ')
            : 'Aderência aos seus Interesses de Perfil (curso + semestre mínimo)';
        const matchBadgeHtml = (matchScore !== null && matchScore !== undefined)
            ? `<span class="badge bg-${matchCor}-subtle text-${matchCor}-emphasis border border-${matchCor}-subtle small" title="${_esc(matchTitle)}">${matchScore}% match</span>`
            : '';

        const col = document.createElement('div');
        col.className = colClass + ' fade-in-item';
        col.style.animationDelay = Math.min(cardIndex * 50, 300) + 'ms';

        if (_viewMode === 'list') {
            col.innerHTML = `
            <div class="talent-card p-3" data-card-ver="${t.id}">
                <div class="d-flex align-items-center gap-3">
                    <div class="talent-avatar-wrap"><div class="talent-avatar">${initial}</div>${medalhaHtml}</div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-0 fw-bold">${_esc(t.nome)}</h6>
                                <small class="text-muted">${_esc(t.curso) || '—'} · ${semestre}</small>
                                ${(novoBadgeHtml || matchBadgeHtml) ? `<div class="mt-1 d-flex gap-1 flex-wrap">${novoBadgeHtml}${matchBadgeHtml}</div>` : ''}
                            </div>
                            <div class="d-flex gap-2 flex-shrink-0 ms-3">${ghBtn}${liBtn}${favBtnHtml}${compareBtnHtml}</div>
                        </div>
                        <div class="mt-1">${pontosHtml || '<span class="text-muted small">Sem destaques registrados</span>'}</div>
                    </div>
                </div>
            </div>`;
        } else {
            col.innerHTML = `
            <div class="talent-card h-100" data-card-ver="${t.id}">
                ${actionsTopHtml}
                <div class="card-body p-4">
                    <div class="d-flex align-items-center gap-3 mb-3">
                        <div class="talent-avatar-wrap"><div class="talent-avatar">${initial}</div>${medalhaHtml}</div>
                        <div>
                            <h6 class="mb-0 fw-bold">${_esc(t.nome)}</h6>
                            <small class="text-muted">${_esc(t.curso) || '—'}</small><br>
                            <span class="badge bg-light text-dark border small">${semestre}</span>
                            ${novoBadgeHtml ? ` ${novoBadgeHtml}` : ''}
                            ${matchBadgeHtml ? ` ${matchBadgeHtml}` : ''}
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

    _renderTalentosPaginacao(talentosOrdenados.length, totalPaginas);
}

// PAGINAÇÃO DE CANDIDATOS
function _renderTalentosPaginacao(totalItens, totalPaginas) {
    const nav = document.getElementById('talentosPaginacao');
    if (!nav) return;
    nav.innerHTML = '';
    if (totalPaginas <= 1) return;

    const addItem = (label, page, disabled, active) => {
        const li = document.createElement('li');
        li.className = `page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`;
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.textContent = label;
        if (!disabled && !active) {
            a.addEventListener('click', e => {
                e.preventDefault();
                _talentosPagina = page;
                renderTalentos(_todosOsTalentos);
                document.getElementById('talentosGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
        li.appendChild(a);
        nav.appendChild(li);
    };

    addItem('Anterior', _talentosPagina - 1, _talentosPagina === 1, false);
    for (let p = 1; p <= totalPaginas; p++) addItem(String(p), p, false, p === _talentosPagina);
    addItem('Próxima', _talentosPagina + 1, _talentosPagina === totalPaginas, false);
}

function _onGridClick(e) {
    // Botão "requer login"
    if (e.target.closest('[data-req-login]')) { e.stopPropagation(); abrirModalLogin(); return; }

    // Favoritar/desfavoritar
    const favEl = e.target.closest('[data-fav]');
    if (favEl) { e.stopPropagation(); toggleFavorito(parseInt(favEl.dataset.fav), favEl); return; }

    // Adicionar/remover da comparação
    const compEl = e.target.closest('[data-compare]');
    if (compEl) { e.stopPropagation(); toggleComparar(parseInt(compEl.dataset.compare), compEl); return; }

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

// DRAWER PERFIL
async function abrirPerfilAluno(alunoId, vagaId) {
    if (!_podeVerPerfil()) { abrirModalLogin(); return; }
    // vagaId (opcional): quando o perfil é aberto a partir de uma vaga específica
    // (lista de interessados), a compatibilidade no drawer é calculada contra ela.
    const _compatQS = vagaId ? `?vaga_id=${encodeURIComponent(vagaId)}` : '';

    // Registra visualização (só se for empresa)
    if (_deveRegistrarVisualizacao()) registrarInteracao(alunoId, 'VISUALIZACAO');

    // Abre drawer com spinner
    document.getElementById('drawerAvatar').textContent = '?';
    document.getElementById('drawerNome').textContent = '—';
    document.getElementById('drawerCurso').textContent = '—';
    document.getElementById('drawerSemestre').textContent = '—';
    document.getElementById('drawerAreaInteresse').classList.add('d-none');
    document.getElementById('drawerBody').innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    document.getElementById('perfilDrawer').classList.add('open');
    document.getElementById('drawerBackdrop').classList.add('open');
    document.body.style.overflow = 'hidden';

    try {
        const [res, resDesempenho, resPerfilComp] = await Promise.all([
            fetch(`${TALENTOS_API}/talentos/aluno/${alunoId}/perfil${_compatQS}`),
            fetch(`${TALENTOS_API}/alunos/${alunoId}/desempenho-semestral`),
            fetch(`${TALENTOS_API}/alunos/${alunoId}/avaliacao-comportamental`)
        ]);
        if (!res.ok) { document.getElementById('drawerBody').innerHTML = `<div class="alert alert-warning m-3">Perfil não disponível. <button type="button" class="btn btn-sm btn-outline-warning ms-2" onclick="abrirPerfilAluno(${alunoId})">Tentar de novo</button></div>`; return; }
        const d = await res.json();
        const desempenho = resDesempenho.ok ? await resDesempenho.json() : null;
        const perfilComp = resPerfilComp.ok ? (await resPerfilComp.json()).avaliacao : null;
        const perfilCompVigente = perfilComp && new Date(perfilComp.valido_ate) > new Date() ? perfilComp : null;

        document.getElementById('drawerAvatar').textContent = (d.nome || '?')[0].toUpperCase();
        document.getElementById('drawerNome').textContent = d.nome;
        document.getElementById('drawerCurso').textContent = d.curso || '—';
        document.getElementById('drawerSemestre').textContent = d.semestre ? `${d.semestre}º Semestre` : '—';
        const areaEl = document.getElementById('drawerAreaInteresse');
        if (d.area_interesse) {
            areaEl.textContent = d.area_interesse;
            areaEl.classList.remove('d-none');
        } else {
            areaEl.classList.add('d-none');
        }

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

        const isFavDrawer = _favoritosIds.has(alunoId);
        const PC_NOMES = { executor: 'Executor', comunicador: 'Comunicador', planejador: 'Planejador', analista: 'Analista' };
        const perfilCompHtml = perfilCompVigente ? `
            <div class="card border-0 mb-4" style="background:linear-gradient(135deg, var(--primary), #1a1a6e);">
                <div class="card-body text-white text-center py-3">
                    <div class="small opacity-75 text-uppercase" style="letter-spacing:.5px;">Perfil Comportamental</div>
                    <div class="fs-4 fw-bold" style="color:var(--accent);">${PC_NOMES[perfilCompVigente.perfil_dominante] || perfilCompVigente.perfil_dominante}</div>
                </div>
            </div>` : '';
        document.getElementById('drawerBody').innerHTML = `
            ${_compatCardHtml(d.compatibilidade)}
            ${perfilCompHtml}
            <!-- Exportar relatório completo + Favoritar -->
            <div class="d-flex gap-2 mb-4">
                <button type="button" class="btn btn-primary flex-fill" onclick="exportarPerfilCompletoPDF(${alunoId}, '${(d.nome || '').replace(/'/g, "\\'")}', this)">
                    <i class="bi bi-file-earmark-pdf-fill me-1"></i>Exportar Relatório + Currículo (PDF)
                </button>
                ${_empresaLogada ? `
                <button type="button" class="btn btn-outline-warning" data-fav="${alunoId}" title="${isFavDrawer ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
                    onclick="toggleFavorito(${alunoId}, this)">
                    <i class="bi bi-star${isFavDrawer ? '-fill' : ''}"></i>
                </button>` : ''}
            </div>

            <div id="statusFavoritoWrap">${_statusFavoritoWrapHtml(alunoId)}</div>

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

            <!-- Desempenho por período -->
            ${desempenho && desempenho.values?.length ? `
            <div class="mb-4">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                    <small class="fw-semibold text-muted">Desempenho</small>
                    <div class="btn-group btn-group-sm" id="drawerDesempFiltro">
                        <button type="button" class="btn btn-outline-dark" data-filtro="semestral">Semestral</button>
                        <button type="button" class="btn btn-dark" data-filtro="anual">Anual</button>
                        <button type="button" class="btn btn-outline-dark" data-filtro="completo">Curso Todo</button>
                    </div>
                </div>
                <div id="drawerDesempChart">${_buildLineSvg(desempenho.labels, desempenho.values)}</div>
            </div>` : ''}

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

        // Wira os botões de filtro do gráfico de Desempenho (Semestral/Anual/Curso Todo)
        const filtroGrupo = document.getElementById('drawerDesempFiltro');
        if (filtroGrupo) {
            filtroGrupo.addEventListener('click', async (e) => {
                const btn = e.target.closest('[data-filtro]');
                if (!btn) return;
                filtroGrupo.querySelectorAll('button').forEach(b => b.className = 'btn btn-outline-dark');
                btn.className = 'btn btn-dark';
                const chartEl = document.getElementById('drawerDesempChart');
                chartEl.innerHTML = '<div class="text-center py-3"><div class="spinner-border spinner-border-sm text-primary"></div></div>';
                try {
                    const r  = await fetch(`${TALENTOS_API}/alunos/${alunoId}/desempenho-semestral?filtro=${btn.dataset.filtro}`);
                    const dd = r.ok ? await r.json() : { labels: [], values: [] };
                    chartEl.innerHTML = _buildLineSvg(dd.labels, dd.values);
                } catch (_) {
                    chartEl.innerHTML = '<p class="text-danger small mb-0">Erro ao carregar.</p>';
                }
            });
        }
    } catch (e) {
        document.getElementById('drawerBody').innerHTML = `<div class="alert alert-danger m-3">Erro ao carregar perfil. <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="abrirPerfilAluno(${alunoId})">Tentar de novo</button></div>`;
    }
}

// Tem currículo ATS preenchido pra valer a pena gerar uma página pra ele?
function _temCurriculoAts(pp) {
    return !!(pp && (pp.resumo || pp.experiencias?.length || pp.formacoes?.length ||
                     pp.idiomas?.length || pp.habilidades?.length || pp.certificacoes?.length));
}

// Desenha o currículo ATS na página ATUAL do pdf (retrato) — reaproveitado tanto
// no relatório individual do drawer quanto no comparativo de candidatos.
function _renderCurriculoAtsNaPagina(pdf, nomeAluno, curso, pp) {
    const margin = 18;
    const maxW   = pdf.internal.pageSize.getWidth() - margin * 2;
    const lineH  = 5.5;
    let y = margin;

    const txt = (text, size = 11, style = 'normal') => {
        pdf.setFontSize(size);
        pdf.setFont('helvetica', style);
        pdf.splitTextToSize(String(text || ''), maxW).forEach(l => {
            if (y > 274) { pdf.addPage('a4', 'portrait'); y = margin; }
            pdf.text(l, margin, y);
            y += lineH;
        });
    };
    const sep = () => {
        pdf.setDrawColor(180);
        pdf.line(margin, y, margin + maxW, y);
        y += lineH * 0.8;
    };

    pdf.setTextColor(0);
    txt(nomeAluno || 'Aluno', 15, 'bold');
    txt(curso || '—', 10);
    y += lineH * 0.5;
    sep();

    if (pp.resumo) {
        txt('RESUMO PROFISSIONAL', 11, 'bold');
        y += 1;
        txt(pp.resumo, 10);
        y += lineH * 0.5;
        sep();
    }

    if (pp.experiencias?.length) {
        txt('EXPERIÊNCIA PROFISSIONAL', 11, 'bold');
        y += 1;
        pp.experiencias.forEach(e => {
            const cargo   = [e.cargo, e.empresa].filter(Boolean).join(' — ');
            const periodo = [e.periodo_inicio, e.periodo_fim].filter(Boolean).join(' a ');
            if (cargo)        txt(cargo, 10, 'bold');
            if (periodo)      txt(periodo, 9);
            if (e.descricao)  txt(e.descricao, 10);
            y += lineH * 0.4;
        });
        sep();
    }

    if (pp.formacoes?.length) {
        txt('FORMAÇÃO COMPLEMENTAR', 11, 'bold');
        y += 1;
        pp.formacoes.forEach(f => {
            const linha = [f.curso, f.instituicao].filter(Boolean).join(' — ');
            if (linha)          txt(linha, 10, 'bold');
            if (f.periodo_fim)  txt(f.periodo_fim, 9);
            y += lineH * 0.3;
        });
        sep();
    }

    if (pp.idiomas?.length) {
        txt('IDIOMAS', 11, 'bold');
        y += 1;
        pp.idiomas.forEach(id => txt(`${id.idioma}: ${id.nivel}`, 10));
        y += lineH * 0.5;
        sep();
    }

    if (pp.habilidades?.length) {
        txt('HABILIDADES', 11, 'bold');
        y += 1;
        txt(pp.habilidades.join(' · '), 10);
    }

    if (pp.certificacoes?.length) {
        if (pp.habilidades?.length) { y += lineH * 0.5; sep(); }
        txt('CERTIFICAÇÕES E CURSOS COMPLEMENTARES', 11, 'bold');
        y += 1;
        pp.certificacoes.forEach(c => {
            const partes = [c.nome, c.instituicao].filter(Boolean).join(' — ');
            const data   = c.data_emissao ? ` (${c.data_emissao})` : '';
            txt(partes + data, 10);
        });
    }
}

// EXPORTAR RELATÓRIO ACADÊMICO + CURRÍCULO ATS (PDF)
// Gera um PDF de 2 páginas para o aluno visualizado no drawer: página 1 é o
// resumo acadêmico (CRA, frequência, ranking, disciplinas de destaque), página 2
// é o currículo ATS completo preenchido pelo próprio aluno em Meu Perfil.
window.exportarPerfilCompletoPDF = async function(alunoId, nome, btn) {
    if (typeof window.jspdf === 'undefined') {
        alert('Biblioteca de geração de PDF não carregada. Recarregue a página.');
        return;
    }
    const textoOriginal = btn?.innerHTML;
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Gerando PDF…'; }

    try {
        const [resPerfil, resPP, resDesempenho] = await Promise.all([
            fetch(`${TALENTOS_API}/talentos/aluno/${alunoId}/perfil`),
            fetch(`${TALENTOS_API}/alunos/${alunoId}/perfil-profissional`),
            fetch(`${TALENTOS_API}/alunos/${alunoId}/desempenho-semestral?filtro=completo`)
        ]);
        const d  = resPerfil.ok ? await resPerfil.json() : {};
        const pp = resPP.ok    ? await resPP.json()    : {};
        const desemp = resDesempenho.ok ? await resDesempenho.json() : null;
        const m  = d.metricas || {};

        const { jsPDF } = window.jspdf;
        const pdf    = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        const margin = 18;
        const maxW   = pdf.internal.pageSize.getWidth() - margin * 2;
        const lineH  = 5.5;
        let y = margin;

        const txt = (text, size = 11, style = 'normal') => {
            pdf.setFontSize(size);
            pdf.setFont('helvetica', style);
            pdf.splitTextToSize(String(text || ''), maxW).forEach(l => {
                if (y > 274) { pdf.addPage(); y = margin; }
                pdf.text(l, margin, y);
                y += lineH;
            });
        };
        const sep = () => {
            pdf.setDrawColor(180);
            pdf.line(margin, y, margin + maxW, y);
            y += lineH * 0.8;
        };

        // Página 1 — Relatório Acadêmico
        pdf.setTextColor(0);
        txt(d.nome || nome || 'Aluno', 16, 'bold');
        txt(d.curso || '—', 11);
        txt(d.semestre ? `${d.semestre}º Semestre` : '', 10);
        y += lineH * 0.5;
        sep();

        txt('DESEMPENHO ACADÊMICO', 12, 'bold');
        y += 1;
        txt(`CRA Geral: ${m.media_geral ?? '—'}`, 10);
        txt(`Frequência: ${m.frequencia ?? '—'}%`, 10);
        txt(`Posição no Ranking: ${d.posicao_ranking !== undefined && d.posicao_ranking !== '—' ? '#' + d.posicao_ranking : '—'}`, 10);
        txt(`Disciplinas cursadas: ${m.total_disciplinas ?? '—'}`, 10);
        txt(`Atividades entregues: ${m.total_atividades ?? '—'}`, 10);
        txt(`Faltas registradas: ${m.total_faltas ?? '—'}`, 10);
        y += lineH * 0.5;
        sep();

        if (desemp?.labels?.length) {
            txt('EVOLUÇÃO DO CRA — CURSO TODO', 12, 'bold');
            y += 1;
            const linha = desemp.labels.map((l, i) => `${l}: ${desemp.values[i]}`).join('   •   ');
            txt(linha, 9.5);
            y += lineH * 0.5;
            sep();
        }

        if (d.disciplinas_destaque?.length) {
            txt('DISCIPLINAS DE DESTAQUE (SS/MS)', 12, 'bold');
            y += 1;
            d.disciplinas_destaque.forEach(dd => txt(`${dd.nome_materia} — ${dd.mencao}`, 10));
            y += lineH * 0.5;
            sep();
        }

        txt('CONTATO', 12, 'bold');
        y += 1;
        txt(`GitHub: ${d.github || 'não informado'}`, 10);
        txt(`LinkedIn: ${d.linkedin || 'não informado'}`, 10);

        // Página 2 — Currículo ATS
        pdf.addPage();
        _renderCurriculoAtsNaPagina(pdf, d.nome || nome || 'Aluno', d.curso, pp);

        pdf.save((d.nome || nome || 'aluno').replace(/\s+/g, '_') + '_relatorio_completo.pdf');
    } catch (err) {
        console.error('Erro ao exportar relatório:', err);
        alert('Erro ao gerar o relatório. Consulte o console.');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = textoOriginal; }
    }
};

function fecharDrawer() {
    document.getElementById('perfilDrawer').classList.remove('open');
    document.getElementById('drawerBackdrop').classList.remove('open');
    document.body.style.overflow = '';
}

// Fecha com ESC
document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharDrawer(); });

// FAVORITOS / SHORTLIST (empresa)
async function _carregarFavoritos() {
    if (!_empresaLogada) { _favoritosIds = new Set(); return; }
    try {
        const res = await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/favoritos`);
        const lista = res.ok ? await res.json() : [];
        _favoritosIds = new Set(lista.map(a => a.id));
        _favoritosStatusMap = new Map(lista.map(a => [a.id, a.status || 'novo']));
        _favoritosNotasMap = new Map(lista.map(a => [a.id, a.notas || '']));
        _favoritosEntrevistaMap = new Map(lista.map(a => [a.id, { data_hora: a.entrevista_data_hora || null, observacao: a.entrevista_observacao || '' }]));
        if (_todosOsTalentos.length) renderTalentos(_todosOsTalentos);
    } catch (_) { /* falha ao carregar favoritos — mantém estado anterior */ }
}

// ANÁLISE DE RECRUTAMENTO (funil de favoritos)
const FUNIL_STATUS_COR = {
    novo: 'secondary',
    contatado: 'info',
    entrevista_marcada: 'warning',
    em_processo: 'primary',
    contratado: 'success',
    descartado: 'danger'
};

function abrirModalFunil() {
    if (!_empresaLogada) { abrirModalLogin(); return; }
    const body = document.getElementById('funilFavoritosBody');
    body.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalFunilFavoritos')).show();
    _carregarFunil();
}

async function _carregarFunil() {
    const body = document.getElementById('funilFavoritosBody');
    try {
        const res = await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/favoritos`);
        const favoritos = res.ok ? await res.json() : [];
        _renderFunilFavoritos(favoritos);
    } catch (e) {
        body.innerHTML = '<p class="text-danger text-center py-3 mb-0">Erro ao carregar a análise.</p>';
    }
}

function _renderFunilFavoritos(favoritos) {
    const body = document.getElementById('funilFavoritosBody');
    const total = favoritos.length;

    if (!total) {
        body.innerHTML = `<div class="text-center text-muted py-4">
            <i class="bi bi-bar-chart display-4 d-block mb-2 opacity-50"></i>
            Favorite candidatos pra ver a análise aqui.
        </div>`;
        return;
    }

    const contagem = { novo: 0, contatado: 0, entrevista_marcada: 0, em_processo: 0, contratado: 0, descartado: 0 };
    favoritos.forEach(f => { contagem[f.status || 'novo'] = (contagem[f.status || 'novo'] || 0) + 1; });

    const barraHtml = (label, qtd, cor) => `
        <div class="mb-3">
            <div class="d-flex justify-content-between small mb-1">
                <span class="fw-semibold">${label}</span>
                <span class="text-muted">${qtd} (${total ? Math.round(qtd / total * 100) : 0}%)</span>
            </div>
            <div class="progress" style="height:10px;">
                <div class="progress-bar bg-${cor}" style="width:${total ? (qtd / total * 100) : 0}%"></div>
            </div>
        </div>`;

    // Funil sequencial (contratado/descartado ficam de fora — são as duas saídas
    // do funil, positiva e negativa, não um estágio de avanço)
    const funilHtml = ['novo', 'contatado', 'entrevista_marcada', 'em_processo']
        .map(s => barraHtml(STATUS_FAVORITO_LABELS[s], contagem[s], FUNIL_STATUS_COR[s]))
        .join('');

    // Taxas de conversão entre estágios sequenciais + a métrica que mais importa:
    // quanto do que a empresa favoritou realmente virou contratação.
    const pct = (n, d) => d > 0 ? Math.round(n / d * 100) : 0;
    const conversoes = [
        `De <strong>${total}</strong> favoritos, <strong>${contagem.contatado}</strong> foram contatados (${pct(contagem.contatado, total)}% do total).`,
        `<strong>${contagem.entrevista_marcada}</strong> chegaram a entrevista (${pct(contagem.entrevista_marcada, total)}% do total, ${pct(contagem.entrevista_marcada, contagem.contatado)}% dos contatados).`,
        `<strong>${contagem.em_processo}</strong> avançaram pra "Em processo" (${pct(contagem.em_processo, total)}% do total, ${pct(contagem.em_processo, contagem.entrevista_marcada)}% dos entrevistados).`,
        `<strong>${contagem.contratado}</strong> foram efetivamente contratados (${pct(contagem.contratado, total)}% do total favoritado).`
    ];

    body.innerHTML = `
        <div class="text-center mb-4">
            <div class="display-6 fw-bold text-primary">${total}</div>
            <div class="text-muted small">candidato${total !== 1 ? 's' : ''} favoritado${total !== 1 ? 's' : ''} no total</div>
        </div>
        ${funilHtml}
        ${contagem.contratado ? barraHtml(STATUS_FAVORITO_LABELS.contratado, contagem.contratado, FUNIL_STATUS_COR.contratado) : ''}
        ${contagem.descartado ? barraHtml(STATUS_FAVORITO_LABELS.descartado, contagem.descartado, FUNIL_STATUS_COR.descartado) : ''}
        <hr>
        <h6 class="fw-bold small text-muted text-uppercase mb-2">Taxas de conversão</h6>
        <ul class="small mb-0 ps-3">
            ${conversoes.map(c => `<li>${c}</li>`).join('')}
        </ul>
    `;
}

// Carrega quem a empresa já visualizou — usado pra não marcar "Novo pra você" de novo
async function _carregarHistoricoVisualizados() {
    if (!_empresaLogada) { _visualizadosIds = new Set(); return; }
    try {
        const res = await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/historico-visualizacoes`);
        const lista = res.ok ? await res.json() : [];
        _visualizadosIds = new Set(lista.map(a => a.id));
        if (_todosOsTalentos.length) renderTalentos(_todosOsTalentos);
    } catch (_) { /* falha ao carregar histórico — mantém estado anterior */ }
}

window.toggleFavorito = async function(alunoId, btnEl) {
    if (!_empresaLogada) { abrirModalLogin(); return; }
    const jaFavoritado = _favoritosIds.has(alunoId);
    try {
        if (jaFavoritado) {
            await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/favoritos/${alunoId}`, { method: 'DELETE' });
            _favoritosIds.delete(alunoId);
            _favoritosStatusMap.delete(alunoId);
            _favoritosNotasMap.delete(alunoId);
            _favoritosEntrevistaMap.delete(alunoId);
        } else {
            await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/favoritos`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aluno_id: alunoId })
            });
            _favoritosIds.add(alunoId);
            _favoritosStatusMap.set(alunoId, 'novo');
            _favoritosNotasMap.set(alunoId, '');
            _favoritosEntrevistaMap.set(alunoId, { data_hora: null, observacao: '' });
        }
        // Atualiza só o(s) botão(ões) desse aluno na tela, sem re-renderizar tudo
        document.querySelectorAll(`[data-fav="${alunoId}"]`).forEach(b => {
            b.classList.toggle('is-fav', _favoritosIds.has(alunoId));
            b.innerHTML = _favoritosIds.has(alunoId) ? '<i class="bi bi-star-fill"></i>' : '<i class="bi bi-star"></i>';
        });
        // Se o botão estiver dentro do drawer, atualiza o bloco de status de acompanhamento
        const statusWrap = document.getElementById('statusFavoritoWrap');
        if (statusWrap) statusWrap.innerHTML = _statusFavoritoWrapHtml(alunoId);
        // Se o filtro "somente favoritos" estiver ativo, reaplica pra sumir/aparecer o card
        if (document.getElementById('filtSoFavoritos')?.checked) renderTalentos(_todosOsTalentos);
    } catch (e) {
        console.error('Erro ao favoritar:', e);
    }
};

function _escTextarea(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// _esc vem de javascript/esc.js (carregado antes deste arquivo)

// Converte o ISO (com timezone) que a API devolve pro formato local que
// <input type="datetime-local"> espera ("YYYY-MM-DDTHH:mm") — usa os getters
// locais do Date, não os UTC, senão a hora exibida fica deslocada do que a
// empresa realmente digitou.
function _isoParaDatetimeLocal(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function _statusFavoritoWrapHtml(alunoId) {
    if (!_empresaLogada || !_favoritosIds.has(alunoId)) return '';
    const statusAtual = _favoritosStatusMap.get(alunoId) || 'novo';
    const entrevista = _favoritosEntrevistaMap.get(alunoId) || { data_hora: null, observacao: '' };
    return `
        <div class="mb-4">
            <label for="statusFavoritoSelect" class="form-label small fw-semibold text-muted mb-1">Status de acompanhamento</label>
            <select id="statusFavoritoSelect" class="form-select form-select-sm" onchange="atualizarStatusFavorito(${alunoId}, this.value)">
                ${Object.entries(STATUS_FAVORITO_LABELS).map(([val, label]) =>
                    `<option value="${val}" ${statusAtual === val ? 'selected' : ''}>${label}</option>`
                ).join('')}
            </select>
            <div id="entrevistaFieldsWrap" ${statusAtual === 'entrevista_marcada' ? '' : 'class="d-none"'}>
                <label for="entrevistaDataInput" class="form-label small fw-semibold text-muted mb-1 mt-2">Data/hora da entrevista</label>
                <input type="datetime-local" id="entrevistaDataInput" class="form-control form-control-sm"
                    value="${_isoParaDatetimeLocal(entrevista.data_hora)}"
                    onchange="_salvarEntrevistaFavorito(${alunoId})">
                <label for="entrevistaObsInput" class="form-label small fw-semibold text-muted mb-1 mt-2">Observação da entrevista</label>
                <textarea id="entrevistaObsInput" class="form-control form-control-sm" rows="2" maxlength="2000"
                    placeholder="Ex: entrevista técnica, focar em SQL"
                    onblur="_salvarEntrevistaFavorito(${alunoId})">${_escTextarea(entrevista.observacao)}</textarea>
                <small class="text-muted" id="entrevistaFavoritoSalvo" style="display:none;">Salvo ✓</small>
            </div>
            <label for="notasFavoritoInput" class="form-label small fw-semibold text-muted mb-1 mt-2">Anotações privadas</label>
            <textarea id="notasFavoritoInput" class="form-control form-control-sm" rows="3" maxlength="2000"
                placeholder="Anotações privadas sobre este candidato... (só você vê)"
                onblur="atualizarNotasFavorito(${alunoId}, this.value)">${_escTextarea(_favoritosNotasMap.get(alunoId))}</textarea>
            <small class="text-muted" id="notasFavoritoSalvo" style="display:none;">Salvo ✓</small>
        </div>`;
}

window.atualizarStatusFavorito = async function(alunoId, status) {
    if (!_empresaLogada) return;
    try {
        const res = await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/favoritos/${alunoId}/status`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error('Falha ao atualizar status.');
        _favoritosStatusMap.set(alunoId, status);
        // Re-renderiza pra mostrar/esconder os campos de entrevista conforme o novo status
        const wrap = document.getElementById('statusFavoritoWrap');
        if (wrap) wrap.innerHTML = _statusFavoritoWrapHtml(alunoId);
    } catch (e) {
        console.error('Erro ao atualizar status do favorito:', e);
    }
};

window._salvarEntrevistaFavorito = async function(alunoId) {
    if (!_empresaLogada) return;
    const dataInput = document.getElementById('entrevistaDataInput');
    const obsInput = document.getElementById('entrevistaObsInput');
    const data_hora = dataInput?.value || null;
    const observacao = obsInput?.value || '';
    const atual = _favoritosEntrevistaMap.get(alunoId) || { data_hora: null, observacao: '' };
    if ((atual.data_hora ? _isoParaDatetimeLocal(atual.data_hora) : '') === (data_hora || '') && (atual.observacao || '') === observacao) return; // nada mudou
    try {
        const res = await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/favoritos/${alunoId}/entrevista`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data_hora, observacao })
        });
        if (!res.ok) throw new Error('Falha ao salvar dados da entrevista.');
        _favoritosEntrevistaMap.set(alunoId, { data_hora, observacao });
        const indicador = document.getElementById('entrevistaFavoritoSalvo');
        if (indicador) {
            indicador.style.display = 'inline';
            setTimeout(() => { indicador.style.display = 'none'; }, 1500);
        }
    } catch (e) {
        console.error('Erro ao salvar dados da entrevista:', e);
    }
};

window.atualizarNotasFavorito = async function(alunoId, notas) {
    if (!_empresaLogada) return;
    if ((_favoritosNotasMap.get(alunoId) || '') === notas) return; // nada mudou — evita PUT desnecessário
    try {
        const res = await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/favoritos/${alunoId}/notas`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notas })
        });
        if (!res.ok) throw new Error('Falha ao salvar notas.');
        _favoritosNotasMap.set(alunoId, notas);
        const indicador = document.getElementById('notasFavoritoSalvo');
        if (indicador) {
            indicador.style.display = 'inline';
            setTimeout(() => { indicador.style.display = 'none'; }, 1500);
        }
    } catch (e) {
        console.error('Erro ao salvar notas do favorito:', e);
    }
};

// MENSAGENS (chat por match mútuo — javascript/chat.js compartilhado com areaaluno/areaprofessor)
window.abrirModalMensagens = function() {
    if (!_empresaLogada) { abrirModalLogin(); return; }
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalMensagensEmpresa')).show();
    if (typeof window.initChat === 'function') window.initChat();
};

// KANBAN DE FAVORITOS (funil de acompanhamento)
let _kanbanFavoritosDados = []; // cache da última carga do modal, pra mover sem refetch

window.abrirKanbanFavoritos = async function() {
    if (!_empresaLogada) { abrirModalLogin(); return; }
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalKanbanFavoritos')).show();
    await _carregarKanbanFavoritos();
};

async function _carregarKanbanFavoritos() {
    const body = document.getElementById('kanbanFavoritosBody');
    body.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';
    try {
        const res = await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/favoritos`);
        if (!res.ok) throw new Error('Falha ao carregar favoritos.');
        _kanbanFavoritosDados = await res.json();
        _renderKanbanFavoritos();
    } catch (e) {
        body.innerHTML = `<div class="alert alert-danger text-center m-0">Erro ao carregar favoritos.
            <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="_carregarKanbanFavoritos()">Tentar de novo</button></div>`;
    }
}

// "Contratado" e "Descartado" são as duas saídas do funil (positiva/negativa),
// lado a lado depois de "Em processo" — nenhuma delas avança pra outra.
const KANBAN_ORDEM   = ['novo', 'contatado', 'entrevista_marcada', 'em_processo', 'contratado', 'descartado'];
const KANBAN_ICONES  = { novo: 'circle-fill', contatado: 'chat-dots-fill', entrevista_marcada: 'calendar-event-fill', em_processo: 'arrow-repeat', contratado: 'trophy-fill', descartado: 'x-circle-fill' };
const KANBAN_PROXIMO  = { novo: 'contatado', contatado: 'entrevista_marcada', entrevista_marcada: 'em_processo', em_processo: 'contratado', contratado: null, descartado: null };
const KANBAN_ANTERIOR = { novo: null, contatado: 'novo', entrevista_marcada: 'contatado', em_processo: 'entrevista_marcada', contratado: 'em_processo', descartado: 'em_processo' };

function _renderKanbanFavoritos() {
    const body = document.getElementById('kanbanFavoritosBody');
    if (!_kanbanFavoritosDados.length) {
        body.innerHTML = _emptyStateHtml('bi-star', 'Nenhum candidato favoritado ainda',
            'Clique na estrela de um card ou do drawer de perfil pra começar a acompanhar candidatos aqui.');
        return;
    }
    const porStatus = {};
    KANBAN_ORDEM.forEach(s => porStatus[s] = []);
    _kanbanFavoritosDados.forEach(f => (porStatus[f.status] || porStatus.novo).push(f));

    body.innerHTML = `<div class="kanban-board">` + KANBAN_ORDEM.map(status => `
        <div class="kanban-col" data-status="${status}">
            <div class="kanban-col-header ${status}">
                <span><i class="bi bi-${KANBAN_ICONES[status]} me-1"></i>${STATUS_FAVORITO_LABELS[status]}</span>
                <span class="kanban-count">${porStatus[status].length}</span>
            </div>
            <div class="kanban-col-body">
                ${porStatus[status].length ? porStatus[status].map(f => _kanbanCardHtml(f)).join('') : '<div class="kanban-empty">Nenhum candidato aqui.</div>'}
            </div>
        </div>
    `).join('') + `</div>`;
}

function _kanbanCardHtml(f) {
    const anterior = KANBAN_ANTERIOR[f.status];
    const proximo  = KANBAN_PROXIMO[f.status];
    let entrevistaLinha = '';
    if (f.status === 'entrevista_marcada') {
        entrevistaLinha = f.entrevista_data_hora
            ? `<div class="curso-sem">📅 ${new Date(f.entrevista_data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${new Date(f.entrevista_data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>`
            : `<div class="curso-sem text-muted fst-italic">sem data marcada</div>`;
    }
    return `
    <div class="kanban-card" onclick="bootstrap.Modal.getInstance(document.getElementById('modalKanbanFavoritos')).hide(); abrirPerfilAluno(${f.id});">
        <strong>${_escTextarea(f.nome)}</strong>
        <div class="curso-sem">${_escTextarea(f.curso || '—')} · ${f.semestre ? f.semestre + 'º sem.' : '—'}</div>
        ${entrevistaLinha}
        <div class="kanban-card-actions">
            ${anterior ? `<button type="button" title="Voltar" onclick="event.stopPropagation(); moverFavoritoKanban(${f.id}, '${anterior}')"><i class="bi bi-arrow-left"></i></button>` : ''}
            ${proximo ? `<button type="button" title="Avançar" onclick="event.stopPropagation(); moverFavoritoKanban(${f.id}, '${proximo}')"><i class="bi bi-arrow-right"></i></button>` : ''}
        </div>
    </div>`;
}

window.moverFavoritoKanban = async function(alunoId, novoStatus) {
    const item = _kanbanFavoritosDados.find(f => f.id === alunoId);
    if (!item) return;
    const statusAntigo = item.status;
    item.status = novoStatus; // otimista — não trava a UI esperando o servidor
    _renderKanbanFavoritos();
    try {
        const res = await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/favoritos/${alunoId}/status`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus })
        });
        if (!res.ok) throw new Error('Falha ao mover.');
        _favoritosStatusMap.set(alunoId, novoStatus); // mantém em sincronia com o drawer/badges do resto da página
    } catch (e) {
        item.status = statusAntigo;
        _renderKanbanFavoritos();
        alert('Não foi possível mover o candidato. Tente novamente.');
    }
};

// COMPARAÇÃO DE CANDIDATOS LADO A LADO
window.toggleComparar = function(alunoId, btnEl) {
    const idx = _compararIds.indexOf(alunoId);
    if (idx >= 0) {
        _compararIds.splice(idx, 1);
    } else {
        if (_compararIds.length >= COMPARAR_MAX) {
            alert(`Você já selecionou ${COMPARAR_MAX} candidatos. Remova um antes de adicionar outro.`);
            return;
        }
        _compararIds.push(alunoId);
    }
    document.querySelectorAll(`[data-compare="${alunoId}"]`).forEach(b => {
        const ativo = _compararIds.includes(alunoId);
        b.classList.toggle('is-compare', ativo);
        b.innerHTML = `<i class="bi bi-${ativo ? 'check2-square' : 'square'}"></i>`;
    });
    _renderCompareBar();
};

function _renderCompareBar() {
    const bar   = document.getElementById('compareBar');
    const chips = document.getElementById('compareChips');
    if (!bar || !chips) return;

    bar.classList.toggle('show', _compararIds.length > 0);
    chips.innerHTML = _compararIds.map(id => {
        const t = _todosOsTalentos.find(x => x.id === id);
        const nome = t?.nome || `Aluno #${id}`;
        return `<span class="chip">
            <span class="avatar-mini">${nome[0].toUpperCase()}</span>
            ${nome}
            <button type="button" onclick="toggleComparar(${id}, null)" aria-label="Remover ${nome}"><i class="bi bi-x-lg"></i></button>
        </span>`;
    }).join('');
}

window.limparComparacao = function() {
    const idsAntigos = [..._compararIds];
    _compararIds = [];
    idsAntigos.forEach(id => {
        document.querySelectorAll(`[data-compare="${id}"]`).forEach(b => {
            b.classList.remove('is-compare');
            b.innerHTML = '<i class="bi bi-square"></i>';
        });
    });
    _renderCompareBar();
};

window.abrirComparacao = async function() {
    if (_compararIds.length < 2) { alert('Selecione pelo menos 2 candidatos para comparar.'); return; }

    const body = document.getElementById('comparacaoBody');
    body.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalComparacao')).show();

    try {
        const dados = await Promise.all(_compararIds.map(async id => {
            const [resPerfil, resDesemp, resPerfilComp] = await Promise.all([
                fetch(`${TALENTOS_API}/talentos/aluno/${id}/perfil`),
                fetch(`${TALENTOS_API}/alunos/${id}/desempenho-semestral?filtro=completo`),
                fetch(`${TALENTOS_API}/alunos/${id}/avaliacao-comportamental`)
            ]);
            const perfilComp = resPerfilComp.ok ? (await resPerfilComp.json()).avaliacao : null;
            return {
                perfil: resPerfil.ok ? await resPerfil.json() : null,
                desemp: resDesemp.ok ? await resDesemp.json() : null,
                perfilComp: perfilComp && new Date(perfilComp.valido_ate) > new Date() ? perfilComp : null
            };
        }));

        const PC_NOMES = { executor: 'Executor', comunicador: 'Comunicador', planejador: 'Planejador', analista: 'Analista' };
        const colClass = dados.length === 2 ? 'col-md-6' : 'col-md-4';
        body.innerHTML = `<div class="row g-3">` + dados.map(({ perfil: d, desemp, perfilComp }) => {
            if (!d) return `<div class="${colClass}"><div class="compare-col text-muted text-center py-4">Perfil não disponível.</div></div>`;
            const m = d.metricas || {};
            const freq = m.frequencia ?? 0;
            const freqColor = freq >= 75 ? '#22C55E' : '#EF4444';
            const discHtml = (d.disciplinas_destaque || []).slice(0, 4).map(dd =>
                `<span class="badge me-1 mb-1" style="background:#e8f4ff;color:#1565c0;font-weight:500;">${dd.nome_materia} <strong>${dd.mencao}</strong></span>`
            ).join('') || '<span class="text-muted small">Nenhuma disciplina de destaque</span>';
            const perfilCompHtml = perfilComp
                ? `<div class="mb-3 text-center py-2" style="background:linear-gradient(135deg, var(--primary), #1a1a6e); border-radius:10px;">
                       <div class="text-white-50" style="font-size:.68rem; text-transform:uppercase; letter-spacing:.5px;">Perfil Comportamental</div>
                       <div class="fw-bold" style="color:var(--accent); font-size:1.1rem;">${PC_NOMES[perfilComp.perfil_dominante] || perfilComp.perfil_dominante}</div>
                   </div>`
                : `<div class="mb-3 text-center py-2 text-muted small border rounded">Perfil Comportamental não preenchido</div>`;

            return `<div class="${colClass}">
                <div class="compare-col">
                    <div class="text-center mb-3">
                        <div class="talent-avatar mx-auto mb-2">${(d.nome || '?')[0].toUpperCase()}</div>
                        <h6 class="fw-bold mb-0">${_esc(d.nome)}</h6>
                        <small class="text-muted">${_esc(d.curso) || '—'} · ${d.semestre ? d.semestre + 'º Sem.' : '—'}</small>
                    </div>
                    ${perfilCompHtml}
                    <div class="row g-2 mb-3 text-center">
                        <div class="col-4"><div class="metric-box"><div class="val text-primary">${m.media_geral ?? '—'}</div><div class="lbl">CRA</div></div></div>
                        <div class="col-4"><div class="metric-box"><div class="val" style="color:${freqColor}">${freq}%</div><div class="lbl">Freq.</div></div></div>
                        <div class="col-4"><div class="metric-box"><div class="val text-warning">${d.posicao_ranking !== '—' ? '#' + d.posicao_ranking : '—'}</div><div class="lbl">Ranking</div></div></div>
                    </div>
                    ${desemp?.values?.length ? `
                    <div class="mb-3">
                        <small class="fw-semibold text-muted d-block mb-1">Desempenho (curso todo)</small>
                        ${_buildLineSvg(desemp.labels, desemp.values)}
                    </div>` : ''}
                    <div class="mb-3">
                        <small class="fw-semibold text-muted d-block mb-1">Disciplinas de destaque</small>
                        ${discHtml}
                    </div>
                    <div class="d-flex gap-2">
                        ${d.github   ? `<a href="${d.github}"   target="_blank" class="btn btn-sm btn-outline-dark flex-fill"><i class="bi bi-github me-1"></i>GitHub</a>`   : '<button class="btn btn-sm btn-light flex-fill" disabled><i class="bi bi-github me-1"></i>—</button>'}
                        ${d.linkedin ? `<a href="${d.linkedin}" target="_blank" class="btn btn-sm btn-outline-primary flex-fill"><i class="bi bi-linkedin me-1"></i>LinkedIn</a>` : '<button class="btn btn-sm btn-light flex-fill" disabled><i class="bi bi-linkedin me-1"></i>—</button>'}
                    </div>
                </div>
            </div>`;
        }).join('') + `</div>`;
    } catch (e) {
        body.innerHTML = '<p class="text-danger text-center py-4 mb-0">Erro ao carregar comparação.</p>';
    }
};

window.exportarComparacaoPDF = async function(btn) {
    if (_compararIds.length < 2) { alert('Selecione pelo menos 2 candidatos para comparar.'); return; }
    if (typeof window.jspdf === 'undefined') {
        alert('Biblioteca de geração de PDF não carregada. Recarregue a página.');
        return;
    }
    const textoOriginal = btn?.innerHTML;
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Gerando PDF…'; }

    try {
        const dados = await Promise.all(_compararIds.map(async id => {
            const [resPerfil, resDesemp, resPP] = await Promise.all([
                fetch(`${TALENTOS_API}/talentos/aluno/${id}/perfil`),
                fetch(`${TALENTOS_API}/alunos/${id}/desempenho-semestral?filtro=completo`),
                fetch(`${TALENTOS_API}/alunos/${id}/perfil-profissional`)
            ]);
            return {
                perfil: resPerfil.ok ? await resPerfil.json() : null,
                desemp: resDesemp.ok ? await resDesemp.json() : null,
                pp: resPP.ok ? await resPP.json() : null
            };
        }));

        const { jsPDF } = window.jspdf;
        const pdf     = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
        const margin   = 14;
        const pageW    = pdf.internal.pageSize.getWidth();
        const colGap   = 6;
        const colW     = (pageW - margin * 2 - colGap * (dados.length - 1)) / dados.length;
        const lineH    = 5.2;
        const topY     = margin;

        pdf.setTextColor(0);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Comparação de Candidatos — Ranking+', margin, topY);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(120);
        pdf.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, margin, topY + 5.5);
        pdf.setTextColor(0);
        const startY = topY + 14;

        dados.forEach(({ perfil: d, desemp }, i) => {
            const x = margin + i * (colW + colGap);
            let y = startY;
            const txtCol = (text, size = 10, style = 'normal') => {
                pdf.setFontSize(size);
                pdf.setFont('helvetica', style);
                pdf.splitTextToSize(String(text || ''), colW).forEach(l => {
                    pdf.text(l, x, y);
                    y += lineH;
                });
            };

            if (i > 0) { pdf.setDrawColor(210); pdf.line(x - colGap / 2, startY - 8, x - colGap / 2, 195); }

            if (!d) { txtCol('Perfil não disponível.', 10, 'italic'); return; }
            const m = d.metricas || {};
            txtCol(d.nome || '—', 12, 'bold');
            txtCol(`${d.curso || '—'}${d.semestre ? ' · ' + d.semestre + 'º Sem.' : ''}`, 9);
            y += 2;
            txtCol(`CRA Geral: ${m.media_geral ?? '—'}`, 9.5);
            txtCol(`Frequência: ${m.frequencia ?? '—'}%`, 9.5);
            txtCol(`Ranking: ${d.posicao_ranking !== undefined && d.posicao_ranking !== '—' ? '#' + d.posicao_ranking : '—'}`, 9.5);
            txtCol(`Disciplinas cursadas: ${m.total_disciplinas ?? '—'}`, 9.5);
            txtCol(`Atividades entregues: ${m.total_atividades ?? '—'}`, 9.5);
            txtCol(`Faltas: ${m.total_faltas ?? '—'}`, 9.5);
            y += 2;
            if (desemp?.labels?.length) {
                txtCol('EVOLUÇÃO (CURSO TODO)', 9.5, 'bold');
                const linha = desemp.labels.map((l, idx) => `${l}: ${desemp.values[idx]}`).join('   •   ');
                txtCol(linha, 8.5);
                y += 2;
            }
            if (d.disciplinas_destaque?.length) {
                txtCol('DISCIPLINAS DE DESTAQUE', 9.5, 'bold');
                d.disciplinas_destaque.slice(0, 4).forEach(dd => txtCol(`${dd.nome_materia} — ${dd.mencao}`, 8.5));
                y += 2;
            }
            txtCol('CONTATO', 9.5, 'bold');
            txtCol(`GitHub: ${d.github || 'não informado'}`, 8.5);
            txtCol(`LinkedIn: ${d.linkedin || 'não informado'}`, 8.5);
        });

        // Currículo ATS de cada candidato que tiver um preenchido
        // Uma página em retrato por candidato (o comparativo em si é paisagem),
        // só pra quem tem algo de fato em Perfil Profissional — não gera página
        // em branco pra quem não preencheu.
        dados.forEach(({ perfil: d, pp }) => {
            if (!_temCurriculoAts(pp)) return;
            pdf.addPage('a4', 'portrait');
            _renderCurriculoAtsNaPagina(pdf, d?.nome, d?.curso, pp);
        });

        pdf.save('comparacao_candidatos_ranking_plus.pdf');
    } catch (err) {
        console.error('Erro ao exportar comparação:', err);
        alert('Erro ao gerar o PDF de comparação. Consulte o console.');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = textoOriginal; }
    }
};

// HISTÓRICO "QUEM EU JÁ VI" (empresa)
window.abrirHistoricoVisualizacoes = async function() {
    if (!_empresaLogada) { abrirModalLogin(); return; }
    const body = document.getElementById('historicoVisualizacoesBody');
    body.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalHistoricoVisualizacoes')).show();

    try {
        const res = await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/historico-visualizacoes`);
        const lista = res.ok ? await res.json() : [];
        if (!lista.length) {
            body.innerHTML = _emptyStateHtml('bi-eye', 'Nenhuma visualização ainda',
                'Assim que você abrir o perfil de um candidato, ele aparece aqui pra você retomar rápido depois.');
            return;
        }
        body.innerHTML = `<div class="list-group">` + lista.map(a => `
            <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                onclick="bootstrap.Modal.getInstance(document.getElementById('modalHistoricoVisualizacoes')).hide(); abrirPerfilAluno(${a.id});">
                <span>
                    <strong>${_esc(a.nome)}</strong>
                    <small class="text-muted d-block">${_esc(a.curso) || '—'} · ${a.semestre ? a.semestre + 'º Sem.' : '—'}</small>
                </span>
                <small class="text-muted">${new Date(a.ultima_visualizacao).toLocaleDateString('pt-BR')}</small>
            </button>
        `).join('') + `</div>`;
    } catch (e) {
        body.innerHTML = '<p class="text-danger text-center py-4 mb-0">Erro ao carregar histórico.</p>';
    }
};

// EXPORTAR CSV DOS CANDIDATOS FILTRADOS
function _exportarTalentosCsv() {
    if (!_todosOsTalentos.length) { alert('Nenhum candidato para exportar — ajuste os filtros e tente novamente.'); return; }
    const linhas = [['Nome', 'Curso', 'Semestre', 'CRA', 'GitHub', 'LinkedIn']];
    _ordenarTalentos(_todosOsTalentos, _ordenarPor).forEach(t => {
        linhas.push([t.nome, t.curso || '', t.semestre ?? '', t.media_geral ?? '', t.github || '', t.linkedin || '']);
    });
    const csv = linhas.map(l => l.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `talentos_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// EXPORTAR CSV DOS FAVORITOS (COM STATUS E NOTAS)
// Separado do CSV de busca acima: status/notas só existem no contexto de favoritos,
// não fariam sentido nas colunas do CSV de busca geral.
function _favoritosParaCsvString(favoritos) {
    const linhas = [['Nome', 'Curso', 'Semestre', 'Status', 'Notas', 'Favoritado em']];
    favoritos.forEach(f => {
        const dataFav = f.criado_em ? new Date(f.criado_em).toLocaleDateString('pt-BR') : '';
        linhas.push([
            f.nome, f.curso || '', f.semestre ?? '',
            STATUS_FAVORITO_LABELS[f.status] || f.status || '',
            f.notas || '', dataFav
        ]);
    });
    return linhas.map(l => l.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
}

async function exportarFavoritosCSV() {
    if (!_empresaLogada) return;
    let favoritos;
    try {
        const res = await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/favoritos`);
        favoritos = res.ok ? await res.json() : [];
    } catch (_) {
        alert('Erro ao buscar favoritos. Tente novamente.');
        return;
    }
    if (!favoritos.length) { alert('Você ainda não tem nenhum candidato favoritado.'); return; }

    const csv = _favoritosParaCsvString(favoritos);
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `favoritos_ranking_plus_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// SVG LINHA SIMPLES (desempenho por semestre)
function _buildLineSvg(labels, values) {
    if (!values || !values.length) return '';
    const w = 280, h = 90, padX = 10, padY = 10;
    const min = Math.min(...values), max = Math.max(...values);
    const range = (max - min) || 1;
    const stepX = values.length > 1 ? (w - padX * 2) / (values.length - 1) : 0;
    const pts = values.map((v, i) => {
        const x = padX + i * stepX;
        const y = padY + (h - padY * 2 - 14) * (1 - (v - min) / range);
        return { x, y, v };
    });
    const polyline = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const circles  = pts.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.5" fill="#F4442E"/>`).join('');
    const labelsSvg = (labels || []).map((l, i) => {
        const x = padX + i * stepX;
        return `<text x="${x.toFixed(1)}" y="${h - 2}" font-size="8" text-anchor="middle" fill="#666">${l}</text>`;
    }).join('');
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="max-width:100%;">
        <polyline points="${polyline}" fill="none" stroke="#F4442E" stroke-width="2"/>
        ${circles}
        ${labelsSvg}
    </svg>`;
}

// SVG DONUT SIMPLES
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

// REGISTRO DE INTERAÇÃO
async function registrarInteracao(alunoId, tipo = 'VISUALIZACAO') {
    if (!_empresaLogada) return;
    try {
        await fetch(`${TALENTOS_API}/interacoes`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empresa_id: _empresaLogada.id, aluno_id: alunoId, tipo_interacao: tipo })
        });
    } catch (_) { /* silencioso — não interrompe UX */ }
}

// CONTRATAÇÕES — check-in trimestral de retenção
async function abrirModalContratacoes() {
    if (!_empresaLogada) { abrirModalLogin(); return; }
    const body = document.getElementById('contratacoesBody');
    body.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalContratacoes')).show();
    await _carregarContratacoes();
}

async function _carregarContratacoes() {
    const body = document.getElementById('contratacoesBody');
    try {
        const res = await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/contratacoes`);
        const lista = res.ok ? await res.json() : [];
        _renderContratacoes(lista);
        _atualizarBadgeContratacoes(lista);
    } catch (e) {
        body.innerHTML = '<p class="text-danger text-center py-3 mb-0">Erro ao carregar contratações.</p>';
    }
}

function _renderContratacoes(lista) {
    const body = document.getElementById('contratacoesBody');
    if (!lista.length) {
        body.innerHTML = '<div class="text-center text-muted py-4">Nenhuma contratação registrada ainda — marque um favorito como "Contratado" no Kanban de Favoritos.</div>';
        return;
    }
    body.innerHTML = lista.map(c => {
        const dataContratacao = new Date(c.marcado_contratado_em).toLocaleDateString('pt-BR');
        if (c.pendente) {
            return `
            <div class="d-flex align-items-center justify-content-between border rounded p-3 mb-2">
                <div>
                    <strong>${_esc(c.aluno_nome)}</strong>
                    <div class="text-muted small">Contratado em ${dataContratacao} — check-in trimestral pendente</div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-success" onclick="_responderCheckin(${c.checkin_id}, true)">Continua na empresa</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="_responderCheckin(${c.checkin_id}, false)">Não continua</button>
                </div>
            </div>`;
        }
        const statusTexto = c.respondido_em
            ? (c.continua_na_empresa ? '<span class="badge bg-success">Continua na empresa</span>' : '<span class="badge bg-secondary">Não continua mais</span>')
            : `<span class="badge bg-light text-dark border">Próximo check-in: ${new Date(c.proximo_checkin_em).toLocaleDateString('pt-BR')}</span>`;
        return `
            <div class="d-flex align-items-center justify-content-between border rounded p-3 mb-2 opacity-75">
                <div>
                    <strong>${_esc(c.aluno_nome)}</strong>
                    <div class="text-muted small">Contratado em ${dataContratacao}</div>
                </div>
                ${statusTexto}
            </div>`;
    }).join('');
}

async function _responderCheckin(checkinId, continuaNaEmpresa) {
    try {
        const res = await fetch(`${TALENTOS_API}/empresas/${_empresaLogada.id}/contratacoes/${checkinId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ continua_na_empresa: continuaNaEmpresa })
        });
        if (!res.ok) { alert('Não foi possível registrar o check-in.'); return; }
        await _carregarContratacoes();
    } catch (e) {
        alert('Erro de conexão ao registrar o check-in.');
    }
}

function _atualizarBadgeContratacoes(lista) {
    const pendentes = lista.filter(c => c.pendente).length;
    const badge = document.getElementById('contratacoesPendentesBadge');
    if (!badge) return;
    badge.textContent = pendentes;
    badge.classList.toggle('d-none', pendentes === 0);
}

// UTILITÁRIOS
function limparFiltros() {
    ['filtCurso', 'filtSemestre', 'filtCraMin', 'searchHabilidade'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    ['filtSoGithub', 'filtSoLinkedin', 'filtSoFavoritos'].forEach(id => { const el = document.getElementById(id); if (el) el.checked = false; });
    _searchChips = [];
    renderSearchChips();
    buscarTalentos();
}

// Skeleton loader no formato do talent-card — evita bloquear a página inteira com overlay
function renderSkeletonCards(count = 6) {
    const grid = document.getElementById('talentosGrid');
    if (!grid) return;
    const colClass = _viewMode === 'list' ? 'col-12' : 'col-lg-4 col-md-6';
    grid.innerHTML = Array.from({ length: count }).map(() => `
        <div class="${colClass}">
            <div class="skeleton-card p-4">
                <div class="d-flex align-items-center gap-3 mb-3">
                    <div class="skeleton-avatar"></div>
                    <div class="flex-grow-1">
                        <div class="skeleton-line mb-2" style="width:70%;"></div>
                        <div class="skeleton-line" style="width:45%;"></div>
                    </div>
                </div>
                <div class="mb-3">
                    <span class="skeleton-pill"></span><span class="skeleton-pill"></span><span class="skeleton-pill"></span>
                </div>
                <div class="d-flex gap-2">
                    <div class="skeleton-btn flex-fill"></div>
                    <div class="skeleton-btn flex-fill"></div>
                </div>
            </div>
        </div>`).join('');
}

function mostrarErro(msg) {
    const grid = document.getElementById('talentosGrid');
    if (grid) grid.innerHTML = `<div class="col-12"><div class="alert alert-danger text-center">
        <i class="bi bi-exclamation-triangle me-2"></i>${msg}
        <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="buscarTalentos()">Tentar de novo</button>
    </div></div>`;
}

function _setEl(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }

function _showAlerta(el, msg, type) {
    if (!el) return;
    el.className = `alert alert-${type}`;
    el.textContent = msg;
    el.classList.remove('d-none');
}
