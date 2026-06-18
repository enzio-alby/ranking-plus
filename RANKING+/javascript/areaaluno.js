// Main JavaScript for Student Academic System
document.addEventListener('DOMContentLoaded', function () {
    // Initialize the application
    initializeApp();

    // Navigation functionality
    setupNavigation();

    // Sidebar toggle for mobile
    setupSidebarToggle();

    // Initialize tooltips and other Bootstrap components
    initializeBootstrapComponents();
});

const ALUNO_API = 'http://localhost:4000';

function initializeApp() {
    console.log('Student Academic System initialized');

    showPage('dashboard');

    const content = document.getElementById('pageContent');
    if (content) content.classList.add('fade-in');

    // Preenche nome do localStorage imediatamente (sem esperar o fetch)
    const saved = localStorage.getItem('unirank_user');
    if (saved) {
        try {
            const user = JSON.parse(saved);
            const firstName = (user.nome || 'Aluno').split(' ')[0];
            const headerName = document.getElementById('headerUserName');
            const welcomeName = document.getElementById('welcomeName');
            if (headerName) headerName.textContent = user.nome || 'Aluno';
            if (welcomeName) welcomeName.textContent = firstName;
        } catch (_) {}
    }

    // Busca dados completos do aluno na API
    const alunoId = localStorage.getItem('alunoId');
    if (alunoId) loadAlunoData(alunoId);
}

async function loadAlunoData(id) {
    try {
        const [resAluno, resMetricas, resBoletim, resRanking] = await Promise.all([
            fetch(`${ALUNO_API}/alunos/${id}`),
            fetch(`${ALUNO_API}/alunos/${id}/metricas`),
            fetch(`${ALUNO_API}/alunos/${id}/boletim-detalhado`),
            fetch(`${ALUNO_API}/ranking/detalhado`)
        ]);

        if (!resAluno.ok) return;
        const aluno    = await resAluno.json();
        const metricas = resMetricas.ok ? await resMetricas.json() : null;
        const boletim  = resBoletim.ok  ? await resBoletim.json()  : [];
        const rankData = resRanking.ok  ? await resRanking.json()  : null;

        const firstName  = (aluno.nome || 'Aluno').split(' ')[0];
        const semestre   = aluno.semestre_atual || aluno.semestre || '—';
        const curso      = aluno.curso || '—';
        const situacao   = aluno.situacao || 'Ativo';
        const cra        = metricas?.media_geral ?? '—';
        const presenca   = metricas ? `${metricas.presenca_geral ?? '—'}%` : '—';

        // ── Dashboard stat cards ──────────────────────────────────────
        _setEl('dashCRA',  cra !== '—' ? cra : '—');
        _setEl('dashFreq', metricas ? `${metricas.presenca_geral ?? '—'}%` : '—');

        const totalFaltas = metricas?.total_faltas ?? 0;
        const freqLabel   = totalFaltas > 0 ? `${totalFaltas} falta(s) registrada(s)` : 'sem faltas';
        _setEl('dashFreqLabel', freqLabel);
        _setEl('dashCRALabel',  cra !== '—' ? 'média geral' : 'sem notas ainda');

        const discCount = Array.isArray(boletim) ? boletim.length : 0;
        _setEl('dashDisc', discCount || '—');
        _setEl('dashDiscLabel', discCount > 0 ? 'disciplinas matriculadas' : 'nenhuma disciplina');

        if (rankData && Array.isArray(rankData.alunos)) {
            const pos   = rankData.alunos.findIndex(a => a.id == id) + 1;
            const total = rankData.total || rankData.alunos.length;
            _setEl('dashRanking',      pos > 0 ? `#${pos}` : '—');
            _setEl('dashRankingLabel', pos > 0 ? `de ${total} alunos` : 'sem dados de ranking');
        }

        // Cabeçalho e welcome
        _setEl('headerUserName', aluno.nome || 'Aluno');
        _setEl('welcomeName', firstName);

        // Aba Relatórios
        _setEl('reportName',   aluno.nome  || '');
        _setEl('reportCourse', `${curso} · ${semestre}º Semestre`);
        _setEl('reportEmail',  aluno.email || '');
        const reportAvatar = document.getElementById('reportAvatarPreview');
        if (reportAvatar && aluno.foto_url) reportAvatar.src = aluno.foto_url;

        // Aba Perfil — card lateral
        _setEl('perfilNome',      aluno.nome || '—');
        _setEl('perfilCurso',     curso);
        _setEl('perfilMatricula', aluno.matricula || '—');
        _setEl('perfilSemestre',  semestre + 'º');
        _setEl('perfilCRA',       cra);
        _setEl('perfilFreq',      presenca);

        // Aba Perfil — informações acadêmicas
        _setEl('perfilCursoCompleto', curso);
        _setEl('perfilPeriodo',  aluno.periodo_curso || aluno.data_matricula?.substring(0, 7) || '—');
        _setEl('perfilTurno',    aluno.turno   || '—');
        _setEl('perfilCampus',   aluno.campus  || '—');
        _setEl('perfilEmail',    aluno.email   || '—');
        const situacaoEl = document.getElementById('perfilSituacao');
        if (situacaoEl) {
            situacaoEl.textContent = situacao;
            situacaoEl.className = `badge ${situacao === 'Ativo' ? 'bg-success' : 'bg-secondary'}`;
        }

        // Toggle permitir_exibicao_ranking — carrega do banco e salva ao mudar
        const rankToggle = document.getElementById('showInRanking');
        if (rankToggle) {
            rankToggle.checked = aluno.permitir_exibicao_ranking !== 0; // default = mostrar
            rankToggle.onchange = async function() {
                try {
                    const res = await fetch(`${ALUNO_API}/alunos/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ permitir_exibicao_ranking: this.checked ? 1 : 0 })
                    });
                    if (!res.ok) console.warn('Erro ao salvar preferência de ranking:', await res.json());
                } catch(e) { console.warn('Erro ao salvar preferência de ranking:', e); }
            };
        }

        // Aba Editar Perfil — dados pessoais
        const nameParts = (aluno.nome || '').trim().split(' ');
        _setVal('firstName', nameParts[0] || '');
        _setVal('lastName',  nameParts.slice(1).join(' ') || '');
        _setVal('email',     aluno.email     || '');
        _setVal('phone',     aluno.telefone  || '');

        // data_nascimento pode vir como "1999-05-15T03:00:00.000Z" ou "1999-05-15"
        if (aluno.data_nascimento) {
            const birthDate = document.getElementById('birthDate');
            if (birthDate) birthDate.value = aluno.data_nascimento.substring(0, 10);
        }

        // Sexo: não existe na tabela — limpa seleção para não mostrar dado errado
        const genderEl = document.getElementById('gender');
        if (genderEl) genderEl.value = '';

        // Endereço
        _setVal('street',       aluno.endereco_rua          || '');
        _setVal('number',       aluno.endereco_numero       || '');
        _setVal('complement',   aluno.endereco_complemento  || '');
        _setVal('neighborhood', aluno.endereco_bairro       || '');
        _setVal('zipCode',      aluno.endereco_cep          || '');
        _setVal('city',         aluno.endereco_cidade       || '');
        const stateEl = document.getElementById('state');
        if (stateEl) stateEl.value = aluno.endereco_estado || '';

        // Contato de Emergência
        _setVal('emergencyName',     aluno.contato_emergencia_nome       || '');
        _setVal('emergencyPhone',    aluno.contato_emergencia_telefone   || '');
        _setVal('emergencyRelation', aluno.contato_emergencia_parentesco || '');
        _setVal('emergencyEmail',    aluno.contato_emergencia_email      || '');

        // Redes profissionais
        _setVal('editGithub',  aluno.github   || '');
        _setVal('editLinkedin', aluno.linkedin || '');

        // Informações Acadêmicas (readonly)
        _setVal('studentId',      aluno.matricula     || '');
        _setVal('course',         aluno.curso         || '');
        _setVal('entryPeriod',    aluno.periodo_curso || '');
        _setVal('currentSemester', semestre ? `${semestre}º Semestre` : '');

    } catch (err) {
        console.warn('Não foi possível carregar dados do aluno:', err);
    }
}

function _setEl(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function _setVal(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function setupNavigation() {
    // Get all navigation links
    const navLinks = document.querySelectorAll('.nav-link[data-page]');
    const dropdownLinks = document.querySelectorAll('.dropdown-item[data-page]');

    // Add click event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetPage = this.getAttribute('data-page');

            // Update active state
            updateActiveNavLink(this);

            // Show target page
            showPage(targetPage);

            // Close sidebar on mobile after navigation
            closeSidebarOnMobile();
        });
    });

    // Add click event listeners to dropdown links
    dropdownLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetPage = this.getAttribute('data-page');

            // Find corresponding nav link and update active state
            const correspondingNavLink = document.querySelector(`.nav-link[data-page="${targetPage}"]`);
            if (correspondingNavLink) {
                updateActiveNavLink(correspondingNavLink);
            }

            // Show target page
            showPage(targetPage);

            // Close sidebar on mobile after navigation
            closeSidebarOnMobile();
        });
    });
}

function updateActiveNavLink(activeLink) {
    // Remove active class from all nav links
    const allNavLinks = document.querySelectorAll('.nav-link');
    allNavLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to clicked link
    activeLink.classList.add('active');
}

function showPage(pageId) {
    // Hide all pages
    const allPages = document.querySelectorAll('.page-content');
    allPages.forEach(page => {
        page.classList.remove('active');
    });

    // Show target page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.add('active');

        // Add fade-in animation
        targetPage.classList.remove('fade-in');
        setTimeout(() => {
            targetPage.classList.add('fade-in');
        }, 10);

        // Initialize page-specific functionality
        initializePageSpecificFeatures(pageId);


        // Update page title
        updatePageTitle(pageId);
    }
}

async function initializeDisciplinasPage() {
    const grid   = document.getElementById('disciplinasGrid');
    const badge  = document.getElementById('disciplinasCount');
    const alunoId = localStorage.getItem('alunoId');
    if (!grid || !alunoId) return;

    grid.innerHTML = '<div class="col-12 text-center py-5 text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Carregando disciplinas...</div>';

    try {
        const res = await fetch(`${ALUNO_API}/alunos/${alunoId}/boletim-detalhado`);
        const disciplinas = await res.json();

        if (!Array.isArray(disciplinas) || disciplinas.length === 0) {
            grid.innerHTML = '<div class="col-12 text-center py-4 text-muted">Nenhuma disciplina encontrada.</div>';
            if (badge) badge.textContent = '0 disciplinas';
            return;
        }

        if (badge) badge.textContent = `${disciplinas.length} disciplina${disciplinas.length !== 1 ? 's' : ''} ativa${disciplinas.length !== 1 ? 's' : ''}`;
        grid.innerHTML = '';

        disciplinas.forEach(d => {
            const nota = _mencaoToNota(d.mencao);
            const badgeClass = nota >= 9 ? 'bg-success' : nota >= 7 ? 'bg-warning' : 'bg-danger';
            const freq = Math.max(0, 100 - (d.faltas || 0) * 2);
            const progressClass = freq >= 85 ? 'bg-success' : freq >= 75 ? 'bg-warning' : 'bg-danger';

            const col = document.createElement('div');
            col.className = 'col-lg-4 col-md-6 mb-4';
            col.innerHTML = `
                <div class="card subject-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="card-title mb-0">${d.nome_materia}</h5>
                            <span class="badge ${badgeClass}">${d.mencao || '—'}</span>
                        </div>
                        <p class="text-muted small mb-1"><i class="bi bi-person me-1"></i>${d.nome_professor || 'Professor não informado'}</p>
                        <p class="text-muted small mb-3">
                            ${d.dia_semana ? `<i class="bi bi-calendar3 me-1"></i>${d.dia_semana}` : ''}
                            ${d.horario ? ` · ${d.horario}` : ''}
                            ${d.sala ? ` · Sala ${d.sala}` : ''}
                        </p>
                        <div class="row text-center mb-3">
                            <div class="col-6">
                                <div class="metric">
                                    <div class="metric-value">${freq}%</div>
                                    <div class="metric-label">Frequência</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="metric">
                                    <div class="metric-value">${nota > 0 ? nota : '—'}</div>
                                    <div class="metric-label">Nota</div>
                                </div>
                            </div>
                        </div>
                        <div class="progress mb-2" style="height:6px;">
                            <div class="progress-bar ${progressClass}" style="width:${freq}%"></div>
                        </div>
                        <small class="text-muted">${d.atividades_entregues || 0} atividade(s) entregue(s) · ${d.faltas || 0} falta(s)</small>
                    </div>
                </div>`;
            grid.appendChild(col);
        });
    } catch (err) {
        console.error('Erro ao carregar disciplinas:', err);
        grid.innerHTML = '<div class="col-12 text-center py-4 text-danger">Erro ao carregar disciplinas.</div>';
    }
}

function _mencaoToNota(mencao) {
    const map = { SS: 10, MS: 8.5, MM: 6.5, MI: 4, II: 2, SR: 0 };
    return map[mencao] ?? 0;
}

function _showAlunoAlert(message, type = 'info') {
    const div = document.createElement('div');
    div.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-4`;
    div.style.zIndex = '9999';
    div.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

async function loadQuadroProfissional() {
    const alunoId = localStorage.getItem('alunoId');
    const section = document.getElementById('quadroProfissionalSection');
    const body    = document.getElementById('quadroBody');
    const links   = document.getElementById('quadroLinks');
    if (!alunoId || !section || !body) return;

    section.style.setProperty('display', 'block', 'important');
    body.innerHTML = '<div class="text-center text-muted small py-3"><div class="spinner-border spinner-border-sm me-1"></div> Carregando...</div>';

    try {
        const res  = await fetch(`${ALUNO_API}/alunos/${alunoId}/profissional`);
        if (!res.ok) {
            body.innerHTML = '<p class="text-muted small text-center py-3">Adicione seu GitHub/LinkedIn em <strong>Editar Perfil</strong> para visualizar o Quadro Profissional.</p>';
            return;
        }
        const data = await res.json();

        // Botões de links no header do card
        if (links) {
            links.innerHTML = '';
            if (data.github)   links.innerHTML += `<a href="${data.github}" target="_blank" class="btn btn-sm btn-outline-dark me-1"><i class="bi bi-github me-1"></i>GitHub</a>`;
            if (data.linkedin) links.innerHTML += `<a href="${data.linkedin}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="bi bi-linkedin me-1"></i>LinkedIn</a>`;
        }

        if (!data.github && !data.linkedin) {
            body.innerHTML = '<p class="text-muted small text-center py-3">Adicione seu GitHub/LinkedIn em <strong>Editar Perfil</strong> para visualizar o Quadro Profissional.</p>';
            return;
        }

        let html = '';

        // LinkedIn resumo
        if (data.linkedin || data.linkedin_resumo) {
            html += `
            <div class="mb-4 p-3 border rounded bg-light">
                <div class="d-flex align-items-center mb-2">
                    <i class="bi bi-linkedin text-primary fs-5 me-2"></i>
                    <strong>Resumo Profissional</strong>
                </div>
                <p class="mb-0 text-muted small">${data.linkedin_resumo || 'Sem resumo disponível.'}</p>
            </div>`;
        }

        // GitHub repos
        if (data.repos && data.repos.length > 0) {
            html += `
            <div>
                <div class="d-flex align-items-center mb-3">
                    <i class="bi bi-github fs-5 me-2"></i>
                    <strong>Repositórios Recentes</strong>
                    <span class="badge bg-secondary ms-2">${data.repos.length}</span>
                </div>
                <div class="row g-3">`;
            data.repos.forEach(r => {
                const lang = r.linguagem && r.linguagem !== 'N/A' ? r.linguagem : null;
                const langColors = { JavaScript:'#f1e05a', Python:'#3572A5', Java:'#b07219', TypeScript:'#2b7489', 'C#':'#178600', PHP:'#4F5D95', CSS:'#563d7c', HTML:'#e34c26', Go:'#00ADD8', Rust:'#dea584' };
                const langColor = langColors[lang] || '#6c757d';
                html += `
                <div class="col-md-4">
                    <div class="card h-100 shadow-sm">
                        <div class="card-body">
                            <h6 class="card-title mb-1"><a href="${r.url}" target="_blank" class="text-decoration-none">${r.nome}</a></h6>
                            <p class="card-text text-muted small mb-2" style="font-size:0.78rem;">${r.descricao}</p>
                            <div class="d-flex align-items-center gap-2 mt-auto">
                                ${lang ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:0.75rem;"><span style="width:10px;height:10px;border-radius:50%;background:${langColor};display:inline-block;"></span>${lang}</span>` : ''}
                                <span class="text-muted" style="font-size:0.75rem;"><i class="bi bi-star me-1"></i>${r.stars}</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            });
            html += '</div></div>';
        } else if (data.github) {
            html += `<p class="text-muted small"><i class="bi bi-github me-1"></i>Nenhum repositório público encontrado em <strong>${data.github}</strong>.</p>`;
        }

        body.innerHTML = html || '<p class="text-muted small text-center">Nenhuma informação profissional disponível.</p>';

        // Após renderizar GitHub/LinkedIn, carrega também as empresas que viram o perfil
        await _renderVisualizacoesEmpresas(body);

    } catch(e) {
        body.innerHTML = '<p class="text-muted small text-center text-danger">Erro ao carregar Quadro Profissional.</p>';
    }
}

async function _renderVisualizacoesEmpresas(containerEl) {
    const alunoId = localStorage.getItem('alunoId');
    if (!alunoId) return;
    try {
        const res = await fetch(`${ALUNO_API}/alunos/${alunoId}/visualizacoes`);
        if (!res.ok) return;
        const rows = await res.json();
        if (!rows.length) return;

        const sectionHtml = `
        <div class="mt-4">
            <div class="d-flex align-items-center mb-3">
                <i class="bi bi-eye-fill text-accent fs-5 me-2" style="color:#F4442E;"></i>
                <strong>Empresas que visualizaram seu perfil</strong>
                <span class="badge bg-danger ms-2">${rows.length}</span>
            </div>
            <div class="row g-3">
                ${rows.map(e => {
                    const nomeExibido = e.nome_fantasia || e.razao_social;
                    const dateFmt = e.ultima_visualizacao ? new Date(e.ultima_visualizacao).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
                    return `
                    <div class="col-md-6">
                        <div class="card border-0 shadow-sm h-100">
                            <div class="card-body p-3">
                                <div class="d-flex align-items-center gap-2 mb-2">
                                    <div style="width:38px;height:38px;border-radius:8px;background:#020122;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                        <i class="bi bi-building text-white"></i>
                                    </div>
                                    <div>
                                        <div class="fw-bold small">${nomeExibido}</div>
                                        <div class="text-muted" style="font-size:.72rem;">${e.setor || '—'}</div>
                                    </div>
                                </div>
                                <div class="row g-1 mb-2">
                                    ${e.tipo_vaga  ? `<div class="col-auto"><span class="badge bg-light text-dark border" style="font-size:.7rem;"><i class="bi bi-briefcase me-1"></i>${e.tipo_vaga}</span></div>` : ''}
                                    ${e.area_foco  ? `<div class="col-auto"><span class="badge bg-light text-dark border" style="font-size:.7rem;"><i class="bi bi-code-slash me-1"></i>${e.area_foco}</span></div>` : ''}
                                    ${e.semestre_minimo > 1 ? `<div class="col-auto"><span class="badge bg-light text-dark border" style="font-size:.7rem;">${e.semestre_minimo}º sem+</span></div>` : ''}
                                </div>
                                <div class="d-flex align-items-center justify-content-between">
                                    <small class="text-muted" style="font-size:.72rem;"><i class="bi bi-clock me-1"></i>${dateFmt}</small>
                                    <div class="d-flex gap-1">
                                        ${e.linkedin_empresa ? `<a href="${e.linkedin_empresa}" target="_blank" class="btn btn-xs btn-outline-primary" style="padding:1px 7px;font-size:.7rem;"><i class="bi bi-linkedin"></i></a>` : ''}
                                        ${e.email_corporativo ? `<a href="mailto:${e.email_corporativo}" class="btn btn-xs btn-outline-secondary" style="padding:1px 7px;font-size:.7rem;"><i class="bi bi-envelope"></i></a>` : ''}
                                        ${e.site_empresa ? `<a href="${e.site_empresa}" target="_blank" class="btn btn-xs btn-outline-dark" style="padding:1px 7px;font-size:.7rem;"><i class="bi bi-globe"></i></a>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
        containerEl.insertAdjacentHTML('beforeend', sectionHtml);
    } catch(_) { /* silencioso */ }
}

// Ranking: estado para toggle e dados carregados
let _rankingData = [];
let _rankingNomesVisiveis = true;

async function initializeColegasPage() {
    await _carregarFiltrosRanking();
    await _carregarRanking();

    const toggleBtn = document.getElementById('rankingToggleNomes');
    if (toggleBtn) {
        toggleBtn.addEventListener('change', function() {
            _rankingNomesVisiveis = this.checked;
            _renderRankingTable(_rankingData);
        });
    }

    const filtBtn = document.getElementById('rankFiltBtn');
    if (filtBtn) filtBtn.addEventListener('click', _carregarRanking);
}

async function _carregarFiltrosRanking() {
    try {
        const res = await fetch(`${ALUNO_API}/filtros`);
        const filtros = await res.json();

        const selCurso = document.getElementById('rankFiltCurso');
        const selSem   = document.getElementById('rankFiltSemestre');
        const selDisc  = document.getElementById('rankFiltDisciplina');
        const repDisc  = document.getElementById('reportDisciplinaFilter');

        if (selCurso) filtros.cursos.forEach(c => {
            selCurso.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`);
        });
        if (selSem) filtros.semestres.forEach(s => {
            selSem.insertAdjacentHTML('beforeend', `<option value="${s}">${s}º Semestre</option>`);
        });
        if (selDisc) filtros.disciplinas.forEach(d => {
            selDisc.insertAdjacentHTML('beforeend', `<option value="${d.id}">${d.nome_materia}</option>`);
        });
        // Filtro no relatório
        if (repDisc) filtros.disciplinas.forEach(d => {
            repDisc.insertAdjacentHTML('beforeend', `<option value="${d.id}">${d.nome_materia}</option>`);
        });
    } catch(e) { console.warn('Filtros não carregados:', e); }
}

async function _carregarRanking() {
    const tbody = document.getElementById('rankingTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Carregando...</td></tr>';

    const params = new URLSearchParams();
    const curso      = document.getElementById('rankFiltCurso')?.value;
    const semestre   = document.getElementById('rankFiltSemestre')?.value;
    const disciplina = document.getElementById('rankFiltDisciplina')?.value;
    if (curso)      params.set('curso', curso);
    if (semestre)   params.set('semestre', semestre);
    if (disciplina) params.set('disciplina_id', disciplina);

    try {
        const res  = await fetch(`${ALUNO_API}/ranking/detalhado?${params}`);
        const data = await res.json();
        _rankingData = data.alunos || [];

        const total = data.total || _rankingData.length;
        const el = document.getElementById('rankTotalAlunos');
        const badge = document.getElementById('rankTotalBadge');
        if (el) el.textContent = total;
        if (badge) badge.textContent = `${total} aluno${total !== 1 ? 's' : ''}`;

        // Posição do aluno logado
        const alunoId = parseInt(localStorage.getItem('alunoId'), 10);
        const myIdx   = _rankingData.findIndex(a => a.id === alunoId);
        const posEl   = document.getElementById('rankMinhaPos');
        const ponEl   = document.getElementById('rankMinhaPontuacao');
        if (posEl) posEl.textContent = myIdx >= 0 ? `#${myIdx + 1}` : '—';
        if (ponEl && myIdx >= 0) ponEl.textContent = _rankingData[myIdx].pontuacao ?? '—';

        _renderRankingTable(_rankingData);

        // Atualiza gráfico de distribuição com dados reais
        _renderGradeDistributionFromRanking(_rankingData);

    } catch (err) {
        console.error('Erro ranking:', err);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger">Erro ao carregar ranking.</td></tr>';
    }
}

function _renderRankingTable(alunos) {
    const tbody   = document.getElementById('rankingTableBody');
    const alunoId = parseInt(localStorage.getItem('alunoId'), 10);
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!alunos.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum aluno encontrado.</td></tr>';
        return;
    }

    alunos.forEach((a, i) => {
        const pos    = i + 1;
        const isMe   = a.id === alunoId;
        const nota   = parseFloat(a.pontuacao) || 0;
        const status = nota >= 9 ? ['success','Excelente'] : nota >= 7 ? ['success','Bom'] : nota >= 5 ? ['warning','Regular'] : ['danger','Atenção'];
        const posIcon = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `${pos}º`;
        const ocultoPorPreferencia = !isMe && a.permitir_exibicao_ranking === 0;
        const nomeExibido = _rankingNomesVisiveis
            ? (isMe ? `<strong>Você (${a.nome})</strong>` : (ocultoPorPreferencia ? `<span class="text-muted">Aluno Anônimo</span>` : a.nome))
            : (isMe ? '<strong>Você</strong>' : `Aluno-${String(a.id).padStart(3,'0')}`);

        const tr = document.createElement('tr');
        if (isMe) tr.className = 'table-primary';
        else if (pos <= 3) tr.className = 'table-warning';
        tr.innerHTML = `
            <td>${posIcon}</td>
            <td>${nomeExibido}</td>
            <td><small class="text-muted">${a.curso || '—'}</small></td>
            <td><span class="badge bg-primary">${a.pontuacao ?? '—'}</span></td>
            <td>${a.frequencia ?? '—'}%</td>
            <td><span class="badge bg-${status[0]}">${status[1]}</span></td>`;
        tbody.appendChild(tr);
    });
}

function _renderGradeDistributionFromRanking(alunos) {
    const counts = [0,0,0,0,0]; // 9-10, 8-8.9, 7-7.9, 5-6.9, <5
    alunos.forEach(a => {
        const p = parseFloat(a.pontuacao) || 0;
        if      (p >= 9)   counts[0]++;
        else if (p >= 8)   counts[1]++;
        else if (p >= 7)   counts[2]++;
        else if (p >= 5)   counts[3]++;
        else               counts[4]++;
    });
    if (typeof window.initializeGradeDistributionChart === 'function') {
        const el = document.getElementById('gradeDistributionChart');
        if (el) el.innerHTML = '';
        if (typeof window.frappe !== 'undefined') {
            new window.frappe.Chart(document.getElementById('gradeDistributionChart'), {
                title: 'Distribuição de notas',
                type: 'bar',
                height: 240,
                colors: ['#22C55E'],
                data: {
                    labels: ['9.0-10', '8.0-8.9', '7.0-7.9', '5.0-6.9', '< 5.0'],
                    datasets: [{ name: 'Alunos', values: counts }]
                },
                axisOptions: { xIsSeries: true },
                barOptions:  { spaceRatio: 0.3 }
            });
        }
    }
}

function initializePerfilPage() {
    if (typeof initializeCRAHistoryChart === 'function') {
        initializeCRAHistoryChart();
        if (typeof window._wireCraFiltro === 'function') window._wireCraFiltro();
    }
    _renderConquistas();
    loadQuadroProfissional();
    loadPerfilProfissional();
}

async function _renderConquistas() {
    const container = document.getElementById('conquistasContainer');
    const alunoId   = localStorage.getItem('alunoId');
    if (!container || !alunoId) return;

    try {
        const [resMetricas, resRank] = await Promise.all([
            fetch(`${ALUNO_API}/alunos/${alunoId}/metricas`),
            fetch(`${ALUNO_API}/ranking/detalhado`)
        ]);
        const metricas = resMetricas.ok ? await resMetricas.json() : null;
        const rankData = resRank.ok     ? await resRank.json()     : null;

        const media        = parseFloat(metricas?.media_geral)    || 0;
        const presenca     = parseFloat(metricas?.presenca_geral) || 0;
        const totalAlunos  = rankData?.total || 0;
        const meuId        = parseInt(alunoId, 10);
        const posicao      = (rankData?.alunos || []).findIndex(a => a.id === meuId) + 1;
        const top20pct     = totalAlunos > 0 ? Math.ceil(totalAlunos * 0.20) : 9999;

        const todas = [
            {
                ativo: posicao > 0 && posicao <= 3,
                icon: 'bi-trophy-fill text-warning',
                titulo: 'Pódio',
                desc: `Top 3 do ranking (posição atual: ${posicao > 0 ? '#'+posicao : '—'})`
            },
            {
                ativo: posicao > 0 && posicao <= top20pct,
                icon: 'bi-award-fill text-warning',
                titulo: 'Top 20% da Turma',
                desc: `Entre os ${top20pct} primeiros de ${totalAlunos} alunos`
            },
            {
                ativo: presenca >= 90,
                icon: 'bi-calendar-check-fill text-success',
                titulo: 'Frequência Exemplar',
                desc: `${presenca.toFixed(0)}% de presença — acima de 90%`
            },
            {
                ativo: media >= 9,
                icon: 'bi-star-fill text-warning',
                titulo: 'Excelência Acadêmica',
                desc: `Média geral ${media.toFixed(1)} — acima de 9.0`
            },
            {
                ativo: media >= 7,
                icon: 'bi-graph-up-arrow text-primary',
                titulo: 'Bom Desempenho',
                desc: `Média geral ${media.toFixed(1)}`
            },
            {
                ativo: (metricas?.total_atividades || 0) >= 10,
                icon: 'bi-check2-all text-info',
                titulo: 'Dedicado',
                desc: `${metricas?.total_atividades || 0} atividades entregues`
            }
        ];

        const conquistadas = todas.filter(c => c.ativo);
        const pendentes    = todas.filter(c => !c.ativo);

        let html = '';
        if (conquistadas.length === 0) {
            html = '<p class="text-muted small text-center">Nenhuma conquista ainda. Continue se esforçando!</p>';
        }
        conquistadas.forEach((c, i) => {
            html += `
                <div class="achievement-item ${i < conquistadas.length - 1 ? 'mb-3' : ''}">
                    <div class="d-flex align-items-center">
                        <i class="bi ${c.icon} me-3" style="font-size:1.5rem;"></i>
                        <div>
                            <h6 class="mb-1">${c.titulo}</h6>
                            <small class="text-muted">${c.desc}</small>
                        </div>
                    </div>
                </div>`;
        });

        if (pendentes.length > 0) {
            html += `<hr class="my-3"><p class="text-muted small fw-semibold mb-2">A conquistar:</p>`;
            pendentes.forEach(c => {
                html += `
                    <div class="achievement-item mb-2 opacity-50">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-lock-fill text-secondary me-3" style="font-size:1.2rem;"></i>
                            <div>
                                <h6 class="mb-1">${c.titulo}</h6>
                                <small class="text-muted">${c.desc}</small>
                            </div>
                        </div>
                    </div>`;
            });
        }

        container.innerHTML = html;
    } catch(e) {
        console.warn('Conquistas:', e);
        container.innerHTML = '<p class="text-muted small text-center">Não foi possível calcular conquistas.</p>';
    }
}

function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('show');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function (e) {
            if (window.innerWidth <= 991.98) {
                if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                    sidebar.classList.remove('show');
                }
            }
        });
    }
}

function closeSidebarOnMobile() {
    if (window.innerWidth <= 991.98) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('show');
        }
    }
}

function initializeBootstrapComponents() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

function updatePageTitle(pageId) {
    const titles = {
        dashboard: 'Dashboard - Espaço do Aluno',
        disciplinas: 'Disciplinas - Espaço do Aluno',
        colegas: 'Colegas - Espaço do Aluno',
        perfil: 'Perfil - Espaço do Aluno'
    };

    document.title = titles[pageId] || 'Espaço do Aluno - Sistema de Ranking Acadêmico';
}

// Utility functions
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner-border spinner-border-custom" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
            </div>
        `;
    }
}

function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        const loading = container.querySelector('.loading');
        if (loading) {
            loading.remove();
        }
    }
}

// Handle window resize
window.addEventListener('resize', function () {
    // Close sidebar on desktop if it was open on mobile
    if (window.innerWidth > 991.98) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('show');
        }
    }
});

// Handle keyboard navigation
document.addEventListener('keydown', function (e) {
    // ESC key closes sidebar on mobile
    if (e.key === 'Escape') {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
        }
    }

    // Arrow key navigation between nav items
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const activeLink = document.querySelector('.nav-link.active');
        const allNavLinks = Array.from(document.querySelectorAll('.nav-link[data-page]'));

        if (activeLink && allNavLinks.length > 0) {
            e.preventDefault();

            const currentIndex = allNavLinks.indexOf(activeLink);
            let nextIndex;

            if (e.key === 'ArrowDown') {
                nextIndex = (currentIndex + 1) % allNavLinks.length;
            } else {
                nextIndex = (currentIndex - 1 + allNavLinks.length) % allNavLinks.length;
            }

            const nextLink = allNavLinks[nextIndex];
            nextLink.focus();
            nextLink.click();
        }
    }
});

function initializeEditarPerfilPage() {
    console.log('Editar Perfil page initialized');

    // Initialize form validation
    const form = document.getElementById('editProfileForm');
    if (form) {
        setupFormValidation(form);
    }

    // Initialize phone and CEP masks
    setupInputMasks();

    // Initialize photo upload functionality
    setupPhotoUpload();
}

function setupFormValidation(form) {
    // Bootstrap form validation + save to API
    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        if (!form.checkValidity()) {
            event.stopPropagation();
            form.classList.add('was-validated');
            return;
        }
        form.classList.add('was-validated');

        const alunoId = localStorage.getItem('alunoId');
        if (!alunoId) return;

        const nameParts = [
            (document.getElementById('firstName')?.value || '').trim(),
            (document.getElementById('lastName')?.value  || '').trim()
        ].filter(Boolean);

        const _fv = id => (document.getElementById(id)?.value || '').trim() || null;

        const payload = {
            nome:                          nameParts.join(' ') || null,
            email:                         _fv('email'),
            telefone:                      _fv('phone'),
            data_nascimento:               _fv('birthDate'),
            endereco_rua:                  _fv('street'),
            endereco_numero:               _fv('number'),
            endereco_complemento:          _fv('complement'),
            endereco_bairro:               _fv('neighborhood'),
            endereco_cep:                  _fv('zipCode'),
            endereco_cidade:               _fv('city'),
            endereco_estado:               _fv('state'),
            contato_emergencia_nome:       _fv('emergencyName'),
            contato_emergencia_telefone:   _fv('emergencyPhone'),
            contato_emergencia_parentesco: _fv('emergencyRelation'),
            contato_emergencia_email:      _fv('emergencyEmail'),
            github:                        _fv('editGithub'),
            linkedin:                      _fv('editLinkedin'),
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        const origText  = submitBtn?.innerHTML;
        if (submitBtn) { submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...'; submitBtn.disabled = true; }

        try {
            const res = await fetch(`${ALUNO_API}/alunos/${alunoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                // Atualiza localStorage com nome novo
                const saved = localStorage.getItem('unirank_user');
                if (saved && payload.nome) {
                    try {
                        const u = JSON.parse(saved);
                        u.nome = payload.nome;
                        localStorage.setItem('unirank_user', JSON.stringify(u));
                    } catch(_) {}
                }
                _showAlunoAlert('Perfil atualizado com sucesso!', 'success');
                showPage('perfil');
            } else {
                const err = await res.json().catch(() => ({}));
                _showAlunoAlert(`Erro ao salvar: ${err.error || res.status}`, 'danger');
            }
        } catch(e) {
            _showAlunoAlert('Erro de conexão ao salvar perfil.', 'danger');
        } finally {
            if (submitBtn) { submitBtn.innerHTML = origText; submitBtn.disabled = false; }
        }
    }, false);

    // Real-time validation for specific fields
    const emailField = document.getElementById('email');
    if (emailField) {
        emailField.addEventListener('blur', validateEmail);
    }

    const phoneField = document.getElementById('phone');
    if (phoneField) {
        phoneField.addEventListener('blur', validatePhone);
    }
}

function setupInputMasks() {
    // Phone mask
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 11) {
                value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            } else if (value.length >= 7) {
                value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            } else if (value.length >= 3) {
                value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
            }
            e.target.value = value;
        });
    });

    // CEP mask
    const cepInput = document.getElementById('zipCode');
    if (cepInput) {
        cepInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 6) {
                value = value.replace(/(\d{5})(\d{0,3})/, '$1-$2');
            }
            e.target.value = value;
        });
    }
}

function setupPhotoUpload() {
    // Simulate photo upload functionality
    const uploadBtn = document.querySelector('.btn-outline-primary');
    const removeBtn = document.querySelector('.btn-outline-danger');

    if (uploadBtn) {
        uploadBtn.addEventListener('click', function () {
            // Create a file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/jpeg,image/png';
            fileInput.style.display = 'none';

            fileInput.addEventListener('change', function (e) {
                const file = e.target.files[0];
                if (file) {
                    // Validate file size (2MB max)
                    if (file.size > 2 * 1024 * 1024) {
                        alert('O arquivo deve ter no máximo 2MB.');
                        return;
                    }

                    // Validate file type
                    if (!['image/jpeg', 'image/png'].includes(file.type)) {
                        alert('Apenas arquivos JPG e PNG são aceitos.');
                        return;
                    }

                    // Simulate upload success
                    showUploadSuccess();
                }
            });

            document.body.appendChild(fileInput);
            fileInput.click();
            document.body.removeChild(fileInput);
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', function () {
            // Simulate photo removal
            showPhotoRemoved();
        });
    }
}

// Export functions for use in other scripts
window.StudentAcademicSystem = {
    showPage,
    updateActiveNavLink,
    showLoading,
    hideLoading,
    initializePageSpecificFeatures
};

document.addEventListener('DOMContentLoaded', function () {
    // Adiciona funcionalidade de mostrar/ocultar senha ao segurar o botão
    const senhaInput = document.getElementById('senhaInput');
    const toggleSenha = document.getElementById('toggleSenha');
    const eyeIcon = document.getElementById('eyeIcon');

    if (senhaInput && toggleSenha && eyeIcon) {
        toggleSenha.addEventListener('mousedown', function () {
            senhaInput.type = 'text';
            eyeIcon.classList.remove('bi-eye');
            eyeIcon.classList.add('bi-eye-slash');
        });

        toggleSenha.addEventListener('mouseup', function () {
            senhaInput.type = 'password';
            eyeIcon.classList.remove('bi-eye-slash');
            eyeIcon.classList.add('bi-eye');
        });

        toggleSenha.addEventListener('mouseleave', function () {
            senhaInput.type = 'password';
            eyeIcon.classList.remove('bi-eye-slash');
            eyeIcon.classList.add('bi-eye');
        });
    }
});




// ─────────────────────────────────────────────────────────────────────────────
// Geração de Relatório PDF com html2pdf.js
// ─────────────────────────────────────────────────────────────────────────────

function _svgToDataUrl(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    const svg = container.querySelector('svg');
    if (!svg) return null;
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    // Frappe Charts às vezes gera <rect> com width/height negativo — sanitiza para 0
    clone.querySelectorAll('rect').forEach(r => {
        if (parseFloat(r.getAttribute('width'))  < 0) r.setAttribute('width',  '0');
        if (parseFloat(r.getAttribute('height')) < 0) r.setAttribute('height', '0');
    });
    const svgStr = new XMLSerializer().serializeToString(clone);
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
}

// Tenta converter o avatar para data URL via canvas.
// Se a imagem estiver "tainted" (file:// CORS), retorna SVG com iniciais do nome.
function _getAvatarDataUrl(name) {
    const img = document.getElementById('reportAvatarPreview');
    if (img && img.complete && img.naturalWidth > 0) {
        try {
            const c = document.createElement('canvas');
            c.width  = img.naturalWidth;
            c.height = img.naturalHeight;
            c.getContext('2d').drawImage(img, 0, 0);
            return c.toDataURL('image/png'); // lança SecurityError se tainted
        } catch (_) { /* tainted — usa fallback com inicial */ }
    }
    const initial = (name || 'A')[0].toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">` +
        `<circle cx="40" cy="40" r="40" fill="#020122"/>` +
        `<text x="40" y="52" text-anchor="middle" font-family="Arial" font-size="32" fill="#fff" font-weight="bold">${initial}</text>` +
        `</svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function _buildStrengths(cra, freq, ranking) {
    const list = [];
    const craNum  = parseFloat(String(cra).replace(',', '.')) || 0;
    const freqNum = parseFloat(String(freq).replace('%', '').replace(',', '.')) || 0;
    const rankNum = parseInt(String(ranking).replace(/\D/g, '')) || 999;

    if (craNum >= 9.0)      list.push('Excelente desempenho acadêmico — CRA acima de 9.0');
    else if (craNum >= 8.0) list.push('Bom desempenho acadêmico — CRA acima de 8.0');
    else if (craNum >= 7.0) list.push('Desempenho acadêmico satisfatório');

    if (freqNum >= 95)      list.push('Frequência exemplar acima de 95% — comprometimento consistente');
    else if (freqNum >= 90) list.push('Boa frequência acima de 90%');
    else if (freqNum >= 75) list.push('Frequência regular — há oportunidade de melhora');

    if (rankNum <= 5)        list.push('Entre os 5 primeiros do ranking da turma');
    else if (rankNum <= 15)  list.push('Posição de destaque no ranking da turma');

    if (list.length === 0) list.push('Em desenvolvimento contínuo');
    return list;
}

async function generateStudentReport() {
    if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
        alert('Bibliotecas de geração de PDF não carregadas. Recarregue a página.');
        return;
    }

    const btn = document.getElementById('generateReportBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Gerando PDF…'; }

    const tpl  = document.getElementById('report-print');
    let clone  = null;

    try {
        const name        = document.getElementById('reportName')?.textContent.trim()   || 'Aluno';
        const course      = document.getElementById('reportCourse')?.textContent.trim() || '';
        const email       = document.getElementById('reportEmail')?.textContent.trim()  || '';
        const obs         = document.getElementById('reportObservations')?.value        || '';
        const dateStr     = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

        const statCards   = Array.from(document.querySelectorAll('.stat-card h3'));
        const cra         = statCards[0]?.textContent.trim() || '—';
        const freq        = statCards[1]?.textContent.trim() || '—';
        const ranking     = statCards[2]?.textContent.trim() || '—';
        const disciplines = statCards[3]?.textContent.trim() || '—';

        const strengths     = _buildStrengths(cra, freq, ranking);
        const avatarDataUrl = _getAvatarDataUrl(name);
        const perfDataUrl   = _svgToDataUrl('performanceChart');
        const freqDataUrl   = _svgToDataUrl('frequencyChart');

        // Popula o template original (mantido display:none)
        tpl.querySelector('#rp-name').textContent        = name;
        tpl.querySelector('#rp-course').textContent      = course;
        tpl.querySelector('#rp-email').textContent       = email;
        tpl.querySelector('#rp-date').textContent        = 'Gerado em ' + dateStr;
        tpl.querySelector('#rp-avatar').src              = avatarDataUrl;
        tpl.querySelector('#rp-cra').textContent         = cra;
        tpl.querySelector('#rp-freq').textContent        = freq;
        tpl.querySelector('#rp-rank').textContent        = ranking;
        tpl.querySelector('#rp-disciplines').textContent = disciplines;
        tpl.querySelector('#rp-obs').textContent         = obs || '—';

        const chartImgs = tpl.querySelectorAll('.rp-chart-img');
        const chartSrcs = [perfDataUrl, freqDataUrl];
        chartImgs.forEach((img, i) => {
            if (chartSrcs[i]) { img.src = chartSrcs[i]; img.style.display = ''; }
            else img.style.display = 'none';
        });
        tpl.querySelector('#rp-strengths').innerHTML =
            strengths.map(s => '<li>' + s + '</li>').join('');

        // Clona o template populado e anexa diretamente ao body com z-index negativo.
        // html2canvas captura o elemento independente de z-index (renderiza em isolamento).
        // O clone fica invisível ao usuário pois fica atrás de todo o conteúdo da página.
        clone = tpl.cloneNode(true);
        Object.assign(clone.style, {
            display:       'block',
            position:      'absolute',
            top:           '0',
            left:          '0',
            width:         '730px',
            zIndex:        '-1',
            pointerEvents: 'none'
        });
        document.body.appendChild(clone);

        // Aguarda 1 frame + 150ms para o layout e imagens estabilizarem
        await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => setTimeout(r, 150));

        const canvas = await html2canvas(clone, {
            scale:       2,
            useCORS:     true,
            allowTaint:  true,
            logging:     false,
            width:       730,
            height:      clone.scrollHeight,
            windowWidth: 730
        });

        const { jsPDF } = window.jspdf;
        const pdf     = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        const margin  = 8;  // mm
        const pdfW    = pdf.internal.pageSize.getWidth();  // 210mm
        const pdfH    = pdf.internal.pageSize.getHeight(); // 297mm
        const imgW    = pdfW - margin * 2;                 // 194mm
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // Altura natural da imagem mantendo proporção
        const naturalH = (canvas.height / canvas.width) * imgW;
        const maxH     = pdfH - margin * 2;                // 281mm

        if (naturalH <= maxH) {
            // Cabe em uma página — centraliza verticalmente
            pdf.addImage(imgData, 'JPEG', margin, margin, imgW, naturalH);
        } else {
            // Muito alto: escala para caber em exatamente uma página
            const ratio  = maxH / naturalH;
            const finalW = imgW * ratio;
            const xOff   = margin + (imgW - finalW) / 2;
            pdf.addImage(imgData, 'JPEG', xOff, margin, finalW, maxH);
        }

        const incluirPP = document.getElementById('incluirPerfilProfissional')?.checked;
        if (incluirPP) _ppAppendAtsPdf(pdf, name, course, email);

        pdf.save(name.replace(/\s+/g, '_') + '_relatorio.pdf');

    } catch (err) {
        console.error('Erro ao gerar relatório:', err);
        alert('Erro ao gerar o relatório. Consulte o console.');
    } finally {
        if (clone && clone.parentNode) clone.parentNode.removeChild(clone);
        if (btn) { btn.disabled = false; btn.textContent = 'Gerar meu relatório PDF'; }
    }
}

// ─── Bindings dos botões da aba Relatórios ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const genBtn = document.getElementById('generateReportBtn');
    if (genBtn) genBtn.addEventListener('click', e => { e.preventDefault(); generateStudentReport(); });

    const exportBtn = document.getElementById('exportMyExcel');
    if (exportBtn) exportBtn.addEventListener('click', e => {
        e.preventDefault();
        const name       = document.getElementById('reportName')?.textContent.trim()   || '';
        const email      = document.getElementById('reportEmail')?.textContent.trim()  || '';
        const course     = document.getElementById('reportCourse')?.textContent.trim() || '';
        const stats      = Array.from(document.querySelectorAll('.stat-card h3')).map(el => el.textContent.trim());
        const rows = [
            ['Nome', 'Curso/Semestre', 'Email', 'CRA', 'Frequência', 'Ranking', 'Disciplinas'],
            [name, course, email, stats[0] || '', stats[1] || '', stats[2] || '', stats[3] || '']
        ];
        const csv  = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = (name.replace(/\s+/g, '_') || 'aluno') + '_dados.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });
});

function initializePageSpecificFeatures(pageId) {
    switch (pageId) {
        case 'dashboard':
            if (typeof initializeAllCharts === 'function') {
                initializeAllCharts();
            }
            break;
        case 'disciplinas':
            initializeDisciplinasPage();
            break;
        case 'colegas':
            initializeColegasPage();
            break;
        case 'perfil':
            initializePerfilPage();
            break;
        case 'relatorios':
            initializeRelatoriosPage();
            break;
    }
}

(function () {
  function hasFrappe() {
    return typeof window.frappe !== 'undefined' && typeof window.frappe.Chart === 'function';
  }

  function parseNumber(value, fallback = 0) {
    if (value == null) return fallback;
    const cleaned = String(value).replace(/[^\d.,-]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return Number.isNaN(num) ? fallback : num;
  }

  function clearChart(id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  }

  function renderChart(id, config) {
    const el = document.getElementById(id);
    if (!el || !hasFrappe()) return null;
    clearChart(id);
    return new window.frappe.Chart(el, config);
  }

  // ── Datasets estáticos para os filtros ───────────────────────────────────
  const _PERF_DATA = {
    mes: {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'],
      datasets: [
        { name: 'Suas Notas',     values: [8.2, 8.5, 8.8, 9.0, 8.9] },
        { name: 'Média da Turma', values: [7.8, 8.0, 8.1, 8.3, 8.1] }
      ]
    },
    semestre: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [
        { name: 'Suas Notas',     values: [7.5, 8.1, 8.7, 8.4, 9.2, 8.9] },
        { name: 'Média da Turma', values: [7.2, 7.8, 8.0, 7.9, 8.3, 8.1] }
      ]
    },
    ano: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      datasets: [
        { name: 'Suas Notas',     values: [7.5, 8.1, 8.7, 8.4, 9.2, 8.9, 8.7, 8.8, 9.1, 9.0, 8.8, 9.2] },
        { name: 'Média da Turma', values: [7.2, 7.8, 8.0, 7.9, 8.3, 8.1, 7.9, 8.1, 8.3, 8.4, 8.2, 8.5] }
      ]
    }
  };

  const _CRA_DATA = {
    '2anos': {
      labels: ['2023.1', '2023.2', '2024.1', '2024.2'],
      values: [8.4, 8.6, 8.7, 8.9]
    },
    '3anos': {
      labels: ['2022.1', '2022.2', '2023.1', '2023.2', '2024.1', '2024.2'],
      values: [8.3, 8.0, 8.4, 8.6, 8.7, 8.9]
    },
    tudo: {
      labels: ['2021.1', '2021.2', '2022.1', '2022.2', '2023.1', '2023.2', '2024.1'],
      values: [7.8, 8.1, 8.3, 8.0, 8.4, 8.6, 8.7]
    }
  };

  // Marca o botão ativo e desmarca os demais dentro de um btn-group
  function _setFiltroAtivo(groupId, attrName, valor) {
    const grupo = document.getElementById(groupId);
    if (!grupo) return;
    grupo.querySelectorAll(`[${attrName}]`).forEach(btn => {
      const ativo = btn.getAttribute(attrName) === valor;
      btn.className = ativo ? 'btn btn-dark' : 'btn btn-outline-dark';
    });
  }

  function initializePerformanceChart(filtro = 'mes') {
    const data = _PERF_DATA[filtro] || _PERF_DATA.mes;
    _setFiltroAtivo('perfFiltroGrupo', 'data-perf-filtro', filtro);
    return renderChart('performanceChart', {
      title: 'Evolução das notas',
      type: 'line',
      height: 280,
      colors: ['#F4442E', '#020122'],
      data
    });
  }

  // Wira os botões de filtro do gráfico de Evolução das Notas
  function _wirePerfFiltro() {
    const grupo = document.getElementById('perfFiltroGrupo');
    if (!grupo) return;
    const clone = grupo.cloneNode(true);
    grupo.replaceWith(clone);
    clone.addEventListener('click', e => {
      const btn = e.target.closest('[data-perf-filtro]');
      if (btn) initializePerformanceChart(btn.dataset.perfFiltro);
    });
  }

  function initializeFrequencyChart() {
    return renderChart('frequencyChart', {
      title: 'Frequência por disciplina',
      type: 'bar',
      height: 280,
      colors: ['#F4442E'],
      data: {
        labels: ['Algoritmos', 'BD', 'Cálculo', 'POO', 'Redes', 'Eng. Software'],
        datasets: [
          { name: 'Frequência', values: [96, 92, 88, 98, 94, 96] }
        ]
      },
      axisOptions: {
        xIsSeries: true
      },
      barOptions: {
        spaceRatio: 0.25
      }
    });
  }

  function initializeGradeDistributionChart() {
    return renderChart('gradeDistributionChart', {
      title: 'Distribuição de notas',
      type: 'bar',
      height: 240,
      colors: ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#6B7280'],
      data: {
        labels: ['9.0-10.0', '8.0-8.9', '7.0-7.9', '6.0-6.9', 'Abaixo de 6.0'],
        datasets: [
          { name: 'Alunos (%)', values: [15, 35, 30, 15, 5] }
        ]
      },
      axisOptions: { xIsSeries: true },
      barOptions: { spaceRatio: 0.3 }
    });
  }

  function initializeCRAHistoryChart(filtro = '2anos') {
    const d = _CRA_DATA[filtro] || _CRA_DATA['2anos'];
    _setFiltroAtivo('craFiltroGrupo', 'data-cra-filtro', filtro);
    return renderChart('craHistoryChart', {
      title: 'Histórico de CRA',
      type: 'line',
      height: 280,
      colors: ['#020122'],
      data: {
        labels: d.labels,
        datasets: [{ name: 'CRA', values: d.values }]
      }
    });
  }

  // Wira os botões de filtro do Histórico de CRA
  function _wireCraFiltro() {
    const grupo = document.getElementById('craFiltroGrupo');
    if (!grupo) return;
    const clone = grupo.cloneNode(true);
    grupo.replaceWith(clone);
    clone.addEventListener('click', e => {
      const btn = e.target.closest('[data-cra-filtro]');
      if (btn) initializeCRAHistoryChart(btn.dataset.craFiltro);
    });
  }

  function getDashboardStats() {
    const stats = Array.from(document.querySelectorAll('.stat-card h3')).map(el => el.textContent.trim());

    return {
      cra: parseNumber(stats[0], 8.7),
      attendance: parseNumber(stats[1], 94),
      ranking: parseNumber(stats[2], 15),
      activeSubjects: parseNumber(stats[3], 6)
    };
  }

  function initializeReportPieChart() {
    const stats = getDashboardStats();

    const activities = Math.min(stats.activeSubjects * 15, 100);
    const participation = Math.max(60, Math.min(100, Math.round((stats.cra * 8) + 20)));

    return renderChart('reportPiePreview', {
      title: 'Composição do desempenho',
      type: 'bar',
      height: 240,
      colors: ['#020122', '#F4442E', '#22C55E', '#F59E0B'],
      data: {
        labels: ['CRA', 'Frequência', 'Atividades', 'Participação'],
        datasets: [
          {
            name: 'Score (%)',
            values: [
              Math.round((stats.cra / 10) * 100),
              Math.round(stats.attendance),
              Math.round(activities),
              Math.round(participation)
            ]
          }
        ]
      },
      axisOptions: { xIsSeries: true },
      barOptions: { spaceRatio: 0.3 }
    });
  }

  function initializeReportRankChart() {
    const stats = getDashboardStats();
    const base = Math.max(1, stats.ranking);
    const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const values = labels.map((_, i) => Math.max(1, base + Math.round((5 - i) * 0.25)));

    return renderChart('reportRankPreview', {
      title: 'Posição Jan-Dez',
      type: 'bar',
      height: 240,
      colors: ['#020122'],
      data: {
        labels,
        datasets: [
          { name: 'Posição', values }
        ]
      },
      axisOptions: {
        xIsSeries: true
      },
      barOptions: {
        spaceRatio: 0.3
      }
    });
  }

  function initializeReportCharts() {
    initializeReportPieChart();
    initializeReportRankChart();
  }

  function initializeAllCharts() {
    initializePerformanceChart();
    _wirePerfFiltro();
    initializeFrequencyChart();
    initializeCRAHistoryChart();
    // gradeDistributionChart: fica na aba Ranking (oculta no load) → renderizado
    // apenas quando a aba é aberta via initializeColegasPage(), evitando width<0.
    // initializeReportCharts(): mesma razão — só na aba Relatórios.
  }

  window.initializePerformanceChart = initializePerformanceChart;
  window.initializeFrequencyChart = initializeFrequencyChart;
  window.initializeGradeDistributionChart = initializeGradeDistributionChart;
  window.initializeCRAHistoryChart = initializeCRAHistoryChart;
  window.initializeReportPieChart = initializeReportPieChart;
  window.initializeReportCharts = initializeReportCharts;
  window.initializeAllCharts = initializeAllCharts;
  window._wireCraFiltro = _wireCraFiltro;

  window.addEventListener('load', function () {
    if (hasFrappe()) {
      initializeAllCharts();
    } else {
      console.error('Frappe Charts não foi carregado.');
    }
  });
})();

async function initializeRelatoriosPage() {
    // Frappe Charts lê a largura do container no momento da criação.
    // Se renderizado logo após classList.add('active') o browser ainda não
    // recalculou o layout e retorna 0px → barras com largura negativa.
    // Aguardar 2 frames garante que o reflow terminou.
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    if (typeof window.initializeReportPieChart === 'function') {
        window.initializeReportPieChart();
    }

    // Monta gráfico de frequência por disciplina (com filtro)
    await _renderReportFreqChart();

    const filterEl = document.getElementById('reportDisciplinaFilter');
    if (filterEl) {
        // Remove listener anterior para não acumular em navegações repetidas
        filterEl.replaceWith(filterEl.cloneNode(true));
        document.getElementById('reportDisciplinaFilter')
                .addEventListener('change', _renderReportFreqChart);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PERFIL PROFISSIONAL ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

let _ppState = { resumo: '', experiencias: [], formacoes: [], idiomas: [], habilidades: [], certificacoes: [] };

async function loadPerfilProfissional() {
    const alunoId  = localStorage.getItem('alunoId');
    if (!alunoId) return;

    const loadEl = document.getElementById('perfilProfLoading');
    const formEl = document.getElementById('perfilProfForm');
    if (loadEl) loadEl.style.display = '';
    if (formEl) formEl.style.display = 'none';

    try {
        const res = await fetch(`${ALUNO_API}/alunos/${alunoId}/perfil-profissional`);
        const data = res.ok ? await res.json() : {};
        _ppState = {
            resumo:        data.resumo        || '',
            experiencias:  data.experiencias  || [],
            formacoes:     data.formacoes     || [],
            idiomas:       data.idiomas       || [],
            habilidades:   data.habilidades   || [],
            certificacoes: data.certificacoes || []
        };
    } catch (_) {
        _ppState = { resumo: '', experiencias: [], formacoes: [], idiomas: [], habilidades: [], certificacoes: [] };
    } finally {
        if (loadEl) loadEl.style.display = 'none';
        if (formEl) formEl.style.display = '';
        _ppRenderAll();
    }

    // Bind do upload de PDF (vincula apenas uma vez)
    const fileInput = document.getElementById('linkedinPdfInput');
    if (fileInput && !fileInput.dataset.bound) {
        fileInput.dataset.bound = '1';
        fileInput.addEventListener('change', ppHandleLinkedinUpload);
    }
}

function _ppRenderAll() {
    const resumoEl = document.getElementById('ppResumo');
    if (resumoEl) resumoEl.value = _ppState.resumo || '';
    _ppRenderExperiencias();
    _ppRenderFormacoes();
    _ppRenderIdiomas();
    _ppRenderHabilidades();
    _ppRenderCertificacoes();
}

// ── Experiências ──────────────────────────────────────────────────────────────
function _ppExpRow(e, i) {
    return `<div class="card mb-2 border-start border-primary border-3" id="ppExp-${i}">
        <div class="card-body py-2 px-3">
            <div class="row g-2 mb-2">
                <div class="col-md-5">
                    <input type="text" class="form-control form-control-sm" placeholder="Empresa"
                        value="${_esc(e.empresa)}" data-pp="empresa">
                </div>
                <div class="col-md-5">
                    <input type="text" class="form-control form-control-sm" placeholder="Cargo"
                        value="${_esc(e.cargo)}" data-pp="cargo">
                </div>
                <div class="col-md-2 text-end">
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="ppRemoveExperiencia(${i})">
                        <i class="bi bi-trash3"></i>
                    </button>
                </div>
            </div>
            <div class="row g-2">
                <div class="col-md-3">
                    <input type="text" class="form-control form-control-sm" placeholder="Início (ex: Jan 2022)"
                        value="${_esc(e.periodo_inicio)}" data-pp="periodo_inicio">
                </div>
                <div class="col-md-3">
                    <input type="text" class="form-control form-control-sm" placeholder="Fim (ou Atual)"
                        value="${_esc(e.periodo_fim)}" data-pp="periodo_fim">
                </div>
                <div class="col-md-6">
                    <input type="text" class="form-control form-control-sm" placeholder="Descrição breve das atividades"
                        value="${_esc(e.descricao)}" data-pp="descricao">
                </div>
            </div>
        </div>
    </div>`;
}

function _ppRenderExperiencias() {
    const el = document.getElementById('ppExperiencias');
    if (!el) return;
    el.innerHTML = _ppState.experiencias.length
        ? _ppState.experiencias.map((e, i) => _ppExpRow(e, i)).join('')
        : '<p class="text-muted small fst-italic">Nenhuma experiência adicionada.</p>';
}

function ppAddExperiencia() {
    _ppState.experiencias.push({ empresa:'', cargo:'', periodo_inicio:'', periodo_fim:'', descricao:'' });
    _ppRenderExperiencias();
    document.querySelector(`#ppExp-${_ppState.experiencias.length - 1} input`)?.focus();
}

function ppRemoveExperiencia(i) {
    _ppCollectExperiencias();
    _ppState.experiencias.splice(i, 1);
    _ppRenderExperiencias();
}

function _ppCollectExperiencias() {
    _ppState.experiencias = Array.from(document.querySelectorAll('[id^="ppExp-"]')).map(row => ({
        empresa:        row.querySelector('[data-pp="empresa"]')?.value        || '',
        cargo:          row.querySelector('[data-pp="cargo"]')?.value          || '',
        periodo_inicio: row.querySelector('[data-pp="periodo_inicio"]')?.value || '',
        periodo_fim:    row.querySelector('[data-pp="periodo_fim"]')?.value    || '',
        descricao:      row.querySelector('[data-pp="descricao"]')?.value      || ''
    }));
    return _ppState.experiencias;
}

// ── Formações ─────────────────────────────────────────────────────────────────
function _ppFormRow(f, i) {
    return `<div class="card mb-2 border-start border-success border-3" id="ppForm-${i}">
        <div class="card-body py-2 px-3">
            <div class="row g-2">
                <div class="col-md-5">
                    <input type="text" class="form-control form-control-sm" placeholder="Curso / Certificação"
                        value="${_esc(f.curso)}" data-ppf="curso">
                </div>
                <div class="col-md-3">
                    <input type="text" class="form-control form-control-sm" placeholder="Instituição"
                        value="${_esc(f.instituicao)}" data-ppf="instituicao">
                </div>
                <div class="col-md-2">
                    <input type="text" class="form-control form-control-sm" placeholder="Período / Ano"
                        value="${_esc(f.periodo_fim || f.periodo_inicio)}" data-ppf="periodo_fim">
                </div>
                <div class="col-md-2 text-end">
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="ppRemoveFormacao(${i})">
                        <i class="bi bi-trash3"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}

function _ppRenderFormacoes() {
    const el = document.getElementById('ppFormacoes');
    if (!el) return;
    el.innerHTML = _ppState.formacoes.length
        ? _ppState.formacoes.map((f, i) => _ppFormRow(f, i)).join('')
        : '<p class="text-muted small fst-italic">Nenhuma formação adicionada.</p>';
}

function ppAddFormacao() {
    _ppState.formacoes.push({ curso:'', instituicao:'', periodo_inicio:'', periodo_fim:'' });
    _ppRenderFormacoes();
    document.querySelector(`#ppForm-${_ppState.formacoes.length - 1} input`)?.focus();
}

function ppRemoveFormacao(i) {
    _ppCollectFormacoes();
    _ppState.formacoes.splice(i, 1);
    _ppRenderFormacoes();
}

function _ppCollectFormacoes() {
    _ppState.formacoes = Array.from(document.querySelectorAll('[id^="ppForm-"]')).map(row => ({
        curso:       row.querySelector('[data-ppf="curso"]')?.value       || '',
        instituicao: row.querySelector('[data-ppf="instituicao"]')?.value || '',
        periodo_fim: row.querySelector('[data-ppf="periodo_fim"]')?.value || ''
    }));
    return _ppState.formacoes;
}

// ── Idiomas ───────────────────────────────────────────────────────────────────
const _PP_NIVEIS = ['Básico','Intermediário','Avançado','Fluente','Nativo'];

function _ppIdiomaRow(id, i) {
    const opts = _PP_NIVEIS.map(n =>
        `<option${id.nivel === n ? ' selected' : ''}>${n}</option>`
    ).join('');
    return `<div class="d-flex gap-2 mb-2 align-items-center" id="ppId-${i}">
        <input type="text" class="form-control form-control-sm" placeholder="Idioma (ex: Inglês)"
            value="${_esc(id.idioma)}" data-ppi="idioma" style="max-width:200px;">
        <select class="form-select form-select-sm" data-ppi="nivel" style="max-width:170px;">${opts}</select>
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="ppRemoveIdioma(${i})">
            <i class="bi bi-trash3"></i>
        </button>
    </div>`;
}

function _ppRenderIdiomas() {
    const el = document.getElementById('ppIdiomas');
    if (!el) return;
    el.innerHTML = _ppState.idiomas.length
        ? _ppState.idiomas.map((id, i) => _ppIdiomaRow(id, i)).join('')
        : '<p class="text-muted small fst-italic">Nenhum idioma adicionado.</p>';
}

function ppAddIdioma() {
    _ppState.idiomas.push({ idioma:'', nivel:'Básico' });
    _ppRenderIdiomas();
    document.querySelector(`#ppId-${_ppState.idiomas.length - 1} input`)?.focus();
}

function ppRemoveIdioma(i) {
    _ppCollectIdiomas();
    _ppState.idiomas.splice(i, 1);
    _ppRenderIdiomas();
}

function _ppCollectIdiomas() {
    _ppState.idiomas = Array.from(document.querySelectorAll('[id^="ppId-"]')).map(row => ({
        idioma: row.querySelector('[data-ppi="idioma"]')?.value || '',
        nivel:  row.querySelector('[data-ppi="nivel"]')?.value  || 'Básico'
    }));
    return _ppState.idiomas;
}

// ── Habilidades ───────────────────────────────────────────────────────────────
function _ppRenderHabilidades() {
    const el = document.getElementById('ppHabilidadesTags');
    if (!el) return;
    el.innerHTML = (_ppState.habilidades || []).map((h, i) =>
        `<span class="badge rounded-pill bg-primary d-flex align-items-center gap-1" style="font-size:.8rem;padding:.4em .75em;">
            ${_esc(h)}
            <button type="button" class="btn-close btn-close-white" style="font-size:.55rem;"
                    aria-label="Remover ${_esc(h)}" onclick="ppRemoveHabilidade(${i})"></button>
        </span>`
    ).join('');
}

function ppAddHabilidade() {
    const input = document.getElementById('ppHabilidadeInput');
    const val   = (input?.value || '').trim();
    if (!val) return;
    if (!_ppState.habilidades) _ppState.habilidades = [];
    if (!_ppState.habilidades.includes(val)) {
        _ppState.habilidades.push(val);
        _ppRenderHabilidades();
    }
    if (input) input.value = '';
}

function ppAddHabilidadeOnEnter(e) {
    if (e.key === 'Enter') { e.preventDefault(); ppAddHabilidade(); }
}

function ppRemoveHabilidade(i) {
    _ppState.habilidades = (_ppState.habilidades || []).filter((_, idx) => idx !== i);
    _ppRenderHabilidades();
}

// ── Certificações ─────────────────────────────────────────────────────────────
function _ppCertRow(c, i) {
    return `<div class="card mb-2 border-start border-warning border-3" id="ppCert-${i}">
        <div class="card-body py-2 px-3">
            <div class="row g-2 mb-2">
                <div class="col-md-10">
                    <input type="text" class="form-control form-control-sm" placeholder="Nome do certificado / curso"
                        value="${_esc(c.nome)}" data-ppc="nome">
                </div>
                <div class="col-md-2 text-end">
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="ppRemoveCertificacao(${i})">
                        <i class="bi bi-trash3"></i>
                    </button>
                </div>
            </div>
            <div class="row g-2">
                <div class="col-md-7">
                    <input type="text" class="form-control form-control-sm" placeholder="Instituição emissora"
                        value="${_esc(c.instituicao)}" data-ppc="instituicao">
                </div>
                <div class="col-md-5">
                    <input type="text" class="form-control form-control-sm" placeholder="Data de emissão (ex: jan. 2024)"
                        value="${_esc(c.data_emissao)}" data-ppc="data_emissao">
                </div>
            </div>
        </div>
    </div>`;
}

function _ppRenderCertificacoes() {
    const el = document.getElementById('ppCertificacoes');
    if (!el) return;
    el.innerHTML = (_ppState.certificacoes || []).map((c, i) => _ppCertRow(c, i)).join('');
}

function ppAddCertificacao() {
    _ppState.certificacoes = _ppState.certificacoes || [];
    _ppState.certificacoes.push({ nome: '', instituicao: '', data_emissao: '' });
    _ppRenderCertificacoes();
    const cards = document.querySelectorAll('[id^="ppCert-"]');
    cards[cards.length - 1]?.querySelector('input')?.focus();
}

function ppRemoveCertificacao(i) {
    _ppState.certificacoes = (_ppState.certificacoes || []).filter((_, idx) => idx !== i);
    _ppRenderCertificacoes();
}

function _ppCollectCertificacoes() {
    return Array.from(document.querySelectorAll('[id^="ppCert-"]')).map(card => ({
        nome:         card.querySelector('[data-ppc="nome"]')?.value         || '',
        instituicao:  card.querySelector('[data-ppc="instituicao"]')?.value  || '',
        data_emissao: card.querySelector('[data-ppc="data_emissao"]')?.value || ''
    })).filter(c => c.nome.trim());
}

// ── Salvar ────────────────────────────────────────────────────────────────────
async function savePerfilProfissional() {
    const alunoId = localStorage.getItem('alunoId');
    if (!alunoId) return;

    const payload = {
        resumo:        document.getElementById('ppResumo')?.value || '',
        experiencias:  _ppCollectExperiencias(),
        formacoes:     _ppCollectFormacoes(),
        idiomas:       _ppCollectIdiomas(),
        habilidades:   _ppState.habilidades   || [],
        certificacoes: _ppCollectCertificacoes()
    };
    _ppState = payload;

    try {
        const res = await fetch(`${ALUNO_API}/alunos/${alunoId}/perfil-profissional`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });
        if (res.ok) _showAlunoAlert('Perfil profissional salvo com sucesso!', 'success');
        else        _showAlunoAlert('Erro ao salvar. Tente novamente.', 'danger');
    } catch (_) {
        _showAlunoAlert('Erro de conexão ao salvar perfil.', 'danger');
    }
}

// ── Upload PDF LinkedIn ───────────────────────────────────────────────────────
async function ppHandleLinkedinUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
        _showAlunoAlert('Selecione um arquivo PDF válido.', 'warning');
        return;
    }
    const alunoId = localStorage.getItem('alunoId');
    const formEl  = document.getElementById('perfilProfForm');
    const loadEl  = document.getElementById('perfilProfImportando');

    if (formEl) formEl.style.display = 'none';
    if (loadEl) loadEl.style.display = '';

    try {
        const fd = new FormData();
        fd.append('pdf', file);
        const res = await fetch(`${ALUNO_API}/alunos/${alunoId}/perfil-profissional/upload-pdf`, {
            method: 'POST',
            body:   fd
        });
        if (res.ok) {
            const parsed = await res.json();
            if (parsed.resumo)                _ppState.resumo        = parsed.resumo;
            if (parsed.experiencias?.length)  _ppState.experiencias  = parsed.experiencias;
            if (parsed.formacoes?.length)     _ppState.formacoes     = parsed.formacoes;
            if (parsed.idiomas?.length)       _ppState.idiomas       = parsed.idiomas;
            if (parsed.habilidades?.length)   _ppState.habilidades   = parsed.habilidades;
            if (parsed.certificacoes?.length) _ppState.certificacoes = parsed.certificacoes;
            _ppRenderAll();
            _showAlunoAlert('PDF importado! Revise os campos e clique em Salvar Perfil.', 'success');
        } else {
            _showAlunoAlert('Não foi possível extrair dados do PDF. Preencha manualmente.', 'warning');
        }
    } catch (_) {
        _showAlunoAlert('Erro ao processar PDF. Preencha manualmente.', 'warning');
    } finally {
        if (loadEl) loadEl.style.display = 'none';
        if (formEl) formEl.style.display = '';
        event.target.value = '';
    }
}

// ── ATS: página extra no PDF ──────────────────────────────────────────────────
function _ppAppendAtsPdf(pdf, name, course, email) {
    pdf.addPage();
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

    pdf.setTextColor(0);
    txt(name, 15, 'bold');
    txt(course, 10);
    txt(email,  9);
    y += lineH * 0.5;
    sep();

    if (_ppState.resumo) {
        txt('RESUMO PROFISSIONAL', 11, 'bold');
        y += 1;
        txt(_ppState.resumo, 10);
        y += lineH * 0.5;
        sep();
    }

    if (_ppState.experiencias?.length) {
        txt('EXPERIÊNCIA PROFISSIONAL', 11, 'bold');
        y += 1;
        _ppState.experiencias.forEach(e => {
            const cargo   = [e.cargo, e.empresa].filter(Boolean).join(' — ');
            const periodo = [e.periodo_inicio, e.periodo_fim].filter(Boolean).join(' a ');
            if (cargo)    txt(cargo,   10, 'bold');
            if (periodo)  txt(periodo,  9);
            if (e.descricao) txt(e.descricao, 10);
            y += lineH * 0.4;
        });
        sep();
    }

    if (_ppState.formacoes?.length) {
        txt('FORMAÇÃO COMPLEMENTAR', 11, 'bold');
        y += 1;
        _ppState.formacoes.forEach(f => {
            const linha = [f.curso, f.instituicao].filter(Boolean).join(' — ');
            if (linha)       txt(linha,       10, 'bold');
            if (f.periodo_fim) txt(f.periodo_fim, 9);
            y += lineH * 0.3;
        });
        sep();
    }

    if (_ppState.idiomas?.length) {
        txt('IDIOMAS', 11, 'bold');
        y += 1;
        _ppState.idiomas.forEach(id => txt(`${id.idioma}: ${id.nivel}`, 10));
        y += lineH * 0.5;
        sep();
    }

    if (_ppState.habilidades?.length) {
        txt('HABILIDADES', 11, 'bold');
        y += 1;
        txt(_ppState.habilidades.join(' · '), 10);
    }

    if (_ppState.certificacoes?.length) {
        if (_ppState.habilidades?.length) { y += lineH * 0.5; sep(); }
        txt('CERTIFICAÇÕES E CURSOS COMPLEMENTARES', 11, 'bold');
        y += 1;
        _ppState.certificacoes.forEach(c => {
            const partes = [c.nome, c.instituicao].filter(Boolean).join(' — ');
            const data   = c.data_emissao ? ` (${c.data_emissao})` : '';
            txt(`• ${partes}${data}`, 10);
        });
    }

    y += lineH * 1.5;
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text('Perfil Profissional — Formato ATS — gerado por Ranking+', margin, y);
    pdf.setTextColor(0);
}

// ── Helper: escapa HTML para uso em innerHTML ─────────────────────────────────
function _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function _renderReportFreqChart() {
    const alunoId = localStorage.getItem('alunoId');
    if (!alunoId) return;

    try {
        const res          = await fetch(`${ALUNO_API}/alunos/${alunoId}/boletim-detalhado`);
        let   disciplinas  = await res.json();

        const filtroId = document.getElementById('reportDisciplinaFilter')?.value;
        if (filtroId) {
            // Filtra pelo nome_materia correspondente ao id selecionado
            const selEl = document.getElementById('reportDisciplinaFilter');
            const nomeFiltro = selEl?.options[selEl.selectedIndex]?.text || '';
            disciplinas = disciplinas.filter(d => d.nome_materia === nomeFiltro);
        }

        const labels = disciplinas.map(d => d.nome_materia);
        const values = disciplinas.map(d => Math.max(0, 100 - (d.faltas || 0) * 2));

        const el = document.getElementById('reportRankPreview');
        if (!el || !window.frappe) return;
        el.innerHTML = '';

        new window.frappe.Chart(el, {
            title: filtroId ? `Frequência: ${labels[0] || ''}` : 'Frequência por Disciplina',
            type: 'bar',
            height: 240,
            colors: ['#020122'],
            data: { labels, datasets: [{ name: 'Frequência (%)', values }] },
            axisOptions: { xIsSeries: true },
            barOptions:  { spaceRatio: 0.3 }
        });
    } catch (e) {
        console.warn('Gráfico de frequência:', e);
    }
}

