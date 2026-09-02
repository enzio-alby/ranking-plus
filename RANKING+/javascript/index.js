// UniRank JavaScript - Conectado à API e com Ranking Real

// CONFIGURAÇÃO DA API
const API_URL = 'http://localhost:4000';

// Estado Global
let currentUser = null;
let isAuthenticated = false;

// Estado 2FA
let _otpTempToken = null;
let _otpTipo = null;
let _otpReenvioTimer = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    initializeAnimations();
    initializeFormHandlers();
    loadRanking();
    loadStats();
});

function initializeApp() {
    // Verificar sessão salva
    const savedUser = localStorage.getItem('unirank_user');
    const alunoId = localStorage.getItem('alunoId');
    const profId = localStorage.getItem('professorId');

    if (savedUser && (alunoId || profId)) {
        currentUser = JSON.parse(savedUser);
        isAuthenticated = true;
        updateAuthUI();
    }
}

function initializeFormHandlers() {
    // Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Cadastro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    setupCadastroMasks();

    // OTP 2FA
    const otpForm = document.getElementById('otpForm');
    if (otpForm) {
        otpForm.addEventListener('submit', handleOtpSubmit);
    }

    // Filtro de curso no ranking público
    document.getElementById('rankingFiltroCurso')?.addEventListener('change', (e) => {
        _rankingCursoFiltro = e.target.value;
        rankingPage = 1;
        renderRankingPage();
    });
}

// CARREGAR RANKING DO BANCO (com paginação de 5 em 5)
let rankingData = [];
let rankingPage = 1;
let _rankingCursoFiltro = '';
const RANKING_PAGE_SIZE = 5;

async function loadRanking() {
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) return;

    rankingList.innerHTML = '<div class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>Carregando...</div>';

    try {
        const response = await fetch(`${API_URL}/ranking`);
        rankingData = await response.json();

        if (rankingData.length === 0) {
            rankingList.innerHTML = '<div class="text-center py-4 text-muted">Nenhum aluno classificado ainda.</div>';
            renderRankingPagination();
            return;
        }

        _popularFiltroCursoRanking();
        rankingPage = 1;
        renderRankingPage();

    } catch (error) {
        console.error('Erro ao carregar ranking:', error);
        rankingList.innerHTML = '<div class="text-center py-4 text-danger">Não foi possível carregar o ranking. <button class="btn btn-sm btn-outline-danger ms-2" onclick="loadRanking()">Tentar de novo</button></div>';
    }
}

// Popula o filtro de curso com os cursos reais presentes no ranking
function _popularFiltroCursoRanking() {
    const select = document.getElementById('rankingFiltroCurso');
    if (!select) return;
    const cursos = [...new Set(rankingData.map(a => a.curso).filter(Boolean))].sort();
    select.innerHTML = '<option value="">Todos os cursos</option>' +
        cursos.map(c => `<option value="${c}">${c}</option>`).join('');
    select.value = _rankingCursoFiltro;
}

function _rankingFiltrado() {
    if (!_rankingCursoFiltro) return rankingData;
    return rankingData.filter(a => a.curso === _rankingCursoFiltro);
}

// Renderiza a página atual do ranking (5 posições por página)
function renderRankingPage() {
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) return;

    rankingList.innerHTML = '';

    const filtrado = _rankingFiltrado();
    if (!filtrado.length) {
        rankingList.innerHTML = '<div class="text-center py-4 text-muted">Nenhum aluno encontrado para esse curso.</div>';
        renderRankingPagination();
        return;
    }

    const start = (rankingPage - 1) * RANKING_PAGE_SIZE;
    filtrado.slice(start, start + RANKING_PAGE_SIZE).forEach((student, i) => {
        const position = start + i + 1;
        rankingList.appendChild(createRankingItem(student, position, i));
    });

    renderRankingPagination();
}

// Monta os controles de paginação do ranking (Bootstrap pagination)
// Prévia pública: só a 1ª página é navegável de verdade — clicar em qualquer
// página além dela (ou em "Próxima" saindo da página 1) abre o convite pra
// criar conta/entrar/falar com a gente em vez de mostrar o resto do ranking.
function renderRankingPagination() {
    const nav = document.getElementById('rankingPagination');
    if (!nav) return;

    const totalPages = Math.ceil(_rankingFiltrado().length / RANKING_PAGE_SIZE);
    nav.innerHTML = '';
    if (totalPages <= 1) return;

    const addPageItem = (label, page, disabled, active) => {
        const li = document.createElement('li');
        li.className = `page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`;
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#ranking';
        a.textContent = label;
        if (!disabled && !active) {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                if (page !== 1) {
                    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalRankingCompleto')).show();
                    return;
                }
                rankingPage = page;
                renderRankingPage();
            });
        }
        li.appendChild(a);
        nav.appendChild(li);
    };

    addPageItem('Anterior', rankingPage - 1, rankingPage === 1, false);
    for (let p = 1; p <= totalPages; p++) {
        addPageItem(String(p), p, false, p === rankingPage);
    }
    addPageItem('Próxima', rankingPage + 1, rankingPage === totalPages, false);
}

// Carrega estatísticas reais da plataforma
async function loadStats() {
    try {
        const res  = await fetch(`${API_URL}/stats`);
        const data = await res.json();
        const set  = (id, val) => animateCounter(document.getElementById(id), val);
        set('statAlunos',   data.total_alunos);
        set('statCursos',   data.total_cursos);
        set('statProfs',    data.total_professores);
        set('statEmpresas', data.total_empresas);
    } catch (_) { /* stats são opcionais — silencia falha */ }
}

// Helper para criar o HTML de cada item do ranking
function createRankingItem(student, position, index) {
    const item = document.createElement('div');

    const anonimo     = student.permitir_exibicao_ranking === 0 || student.permitir_exibicao_ranking === '0';
    const nomeExibido = anonimo ? 'Aluno Anônimo' : student.nome;
    const cursoExibido = anonimo ? '—' : (student.curso || '—');

    const posClass = position === 1 ? 'p1' : position === 2 ? 'p2' : position === 3 ? 'p3' : 'pd';
    const avatarUrl = anonimo
        ? 'https://ui-avatars.com/api/?name=?&background=9e9e9e&color=fff&size=80'
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(student.nome)}&background=random&color=fff&size=80`;

    item.className = 'ranking-row fade-in-item';
    item.style.animationDelay = Math.min((index || 0) * 60, 240) + 'ms';
    item.innerHTML = `
        <div class="rank-pos ${posClass}">${position}</div>
        <img src="${avatarUrl}" alt="${nomeExibido}" class="rank-avatar">
        <div class="rank-info">
            <div class="nome ${anonimo ? 'text-muted fst-italic' : ''}">${nomeExibido}</div>
            <div class="curso">${cursoExibido}</div>
        </div>
        <div class="rank-score">${student.pontuacao || 0}<small>pts</small></div>
    `;
    return item;
}

// FUNÇÃO DE LOGIN REAL (Corrigida para bater com o HTML)
async function handleLogin(e) {
    e.preventDefault();
    
    // CORREÇÃO AQUI: Usando os IDs novos (loginTipo, loginUser, loginPass)
    // Se o JS tentar buscar 'tipoUsuario' ou 'cpf', vai dar o erro de null!
    const tipoUsuarioElement = document.getElementById('loginTipo');
    const identificadorElement = document.getElementById('loginUser');
    const senhaElement = document.getElementById('loginPass');

    // Validação de segurança para evitar o erro "Cannot read properties of null"
    if (!tipoUsuarioElement || !identificadorElement || !senhaElement) {
        console.error("Erro Crítico: Elementos do formulário não encontrados no HTML.");
        showAlert("Erro interno no formulário. Atualize a página (CTRL+F5).", "danger");
        return;
    }

    const tipoUsuario = tipoUsuarioElement.value;
    const identificador = identificadorElement.value; 
    const senha = senhaElement.value;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Entrando...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipoUsuario, identificador, senha })
        });

        const data = await response.json();

        if (data.sucesso) {
            if (data.requerOTP) {
                // Fecha modal de login e abre modal OTP
                _otpTempToken = data.tempToken;
                _otpTipo = tipoUsuario;
                const emailDisplay = document.getElementById('otpEmailDisplay');
                if (emailDisplay) emailDisplay.textContent = data.emailMascarado || 'seu e-mail';
                iniciarContadorReenvio();
                const loginModalEl = document.getElementById('loginModal');
                const loginModal = bootstrap.Modal.getInstance(loginModalEl);
                if (loginModal) loginModal.hide();
                const otpModalEl = document.getElementById('otpModal');
                const otpModal = new bootstrap.Modal(otpModalEl);
                otpModal.show();
                otpModalEl.addEventListener('shown.bs.modal', () => {
                    document.getElementById('otpCodigo')?.focus();
                }, { once: true });
            } else {
                // Fluxo direto (fallback — não deve ocorrer com a API atual)
                const loginModalEl = document.getElementById('loginModal');
                const loginModal = bootstrap.Modal.getInstance(loginModalEl);
                if (loginModal) loginModal.hide();
                finalizarLogin(data.usuario, tipoUsuario);
            }
        } else {
            showAlert(data.mensagem || 'Credenciais inválidas.', 'danger');
        }

    } catch (error) {
        console.error('Erro no login:', error);
        showAlert('Erro ao conectar com o servidor. Verifique a API.', 'danger');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// MÁSCARAS DOS CAMPOS DE CADASTRO
function setupCadastroMasks() {
    const cpfInput = document.getElementById('regCpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', () => {
            let v = cpfInput.value.replace(/\D/g, '').slice(0, 11);
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            cpfInput.value = v;
            cpfInput.classList.remove('is-invalid');
        });
    }

    const telInput = document.getElementById('regTelefone');
    if (telInput) {
        telInput.addEventListener('input', () => {
            let v = telInput.value.replace(/\D/g, '').slice(0, 11);
            v = v.replace(/^(\d{2})(\d)/, '($1) $2');
            v = v.replace(/(\d{5})(\d{1,4})$/, '$1-$2');
            telInput.value = v;
        });
    }

    const matriculaInput = document.getElementById('regMatricula');
    if (matriculaInput) {
        matriculaInput.addEventListener('input', () => {
            matriculaInput.value = matriculaInput.value.replace(/\D/g, '').slice(0, 20);
        });
    }
}

// Validação de CPF por dígito verificador — só se aplica se o campo (opcional) foi preenchido
function isValidCPF(cpf) {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(digits[i]) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(digits[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(digits[i]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    return resto === parseInt(digits[10]);
}

// FUNÇÃO DE CADASTRO REAL
async function handleRegister(e) {
    e.preventDefault();

    const senha = document.getElementById('regSenha').value;
    const senhaConf = document.getElementById('regSenhaConf').value;

    if (senha !== senhaConf) {
        showAlert('As senhas não conferem!', 'warning');
        return;
    }

    const cpfField = document.getElementById('regCpf');
    const cpfValue = cpfField.value.trim();
    if (cpfValue && !isValidCPF(cpfValue)) {
        cpfField.classList.add('is-invalid');
        showAlert('CPF inválido. Verifique os números digitados.', 'warning');
        return;
    }
    cpfField.classList.remove('is-invalid');

    const _v = id => (document.getElementById(id)?.value || '').trim() || null;
    const semestreRaw = document.getElementById('regSemestre')?.value;
    const alunoData = {
        nome:            document.getElementById('regNome').value.trim(),
        email:           document.getElementById('regEmail').value.trim(),
        matricula:       document.getElementById('regMatricula').value.trim(),
        curso:           document.getElementById('regCurso').value,
        senha:           senha,
        cpf:             _v('regCpf'),
        telefone:        _v('regTelefone'),
        data_nascimento: _v('regNascimento'),
        semestre:        semestreRaw ? parseInt(semestreRaw) : null,
        turno:           _v('regTurno'),
        campus:          _v('regCampus'),
        github:          _v('regGithub'),
        linkedin:        _v('regLinkedin'),
        periodo_curso:   new Date().getFullYear() + '.' + (new Date().getMonth() < 6 ? '1' : '2'),
        data_matricula:  new Date().toISOString().split('T')[0],
        termos_aceitos:  document.getElementById('acceptTerms')?.checked || false
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Cadastrando...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/alunos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alunoData)
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Cadastro realizado com sucesso! Faça login para continuar.', 'success');
            document.getElementById('registerForm').reset();
            
            const modalReg = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            if(modalReg) modalReg.hide();

            setTimeout(() => {
                const modalLog = new bootstrap.Modal(document.getElementById('loginModal'));
                modalLog.show();
            }, 1000);
        } else {
            showAlert(`Erro no cadastro: ${data.error || 'Verifique os dados.'}`, 'danger');
        }
    } catch (error) {
        console.error(error);
        showAlert('Erro de conexão ao tentar cadastrar.', 'danger');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Funções de UI Auxiliares
function showLogin() {
    new bootstrap.Modal(document.getElementById('loginModal')).show();
}

function showRegister() {
    new bootstrap.Modal(document.getElementById('registerModal')).show();
}

function logout() {
    currentUser = null;
    isAuthenticated = false;
    localStorage.clear();
    updateAuthUI();
    window.location.reload();
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');

    if (isAuthenticated && currentUser) {
        authButtons.classList.add('d-none');
        authButtons.classList.remove('d-flex');
        userInfo.classList.remove('d-none');
        userInfo.classList.add('d-flex');
        userName.textContent = `Olá, ${currentUser.nome.split(' ')[0]}`;
        const areaBtn = document.getElementById('areaBtn');
        if (areaBtn) {
            const isProfessor = !!localStorage.getItem('professorId');
            areaBtn.href = isProfessor ? 'areaprofessor.html' : 'areaaluno.html';
            areaBtn.textContent = isProfessor ? 'Área do Professor' : 'Área do Aluno';
        }
    } else {
        authButtons.classList.remove('d-none');
        authButtons.classList.add('d-flex');
        userInfo.classList.add('d-none');
        userInfo.classList.remove('d-flex');
    }
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-4`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 4000);
}

function handleGetStarted() {
    if (isAuthenticated) {
        const tipo = localStorage.getItem('professorId') ? 'professor' : 'aluno';
        if(tipo === 'aluno') window.location.href = 'areaaluno.html';
        else window.location.href = 'areaprofessor.html';
    } else {
        showRegister();
    }
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
    } else {
        input.type = "password";
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
    }
}

function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function initializeAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('animate-fade-up');
        });
    });
    document.querySelectorAll('.animate-fade-up').forEach(el => observer.observe(el));
}

// 2FA — Funções auxiliares

function finalizarLogin(usuario, tipo, token, precisaReaceitarTermos) {
    currentUser = usuario;
    isAuthenticated = true;
    localStorage.setItem('unirank_user', JSON.stringify(currentUser));
    if (token) localStorage.setItem('unirank_token', token); // correção do achado S1
    if (tipo === 'aluno') {
        localStorage.setItem('alunoId', currentUser.id);
        localStorage.removeItem('professorId');
        // Termo de uso mudou de versão (ex: cláusula do Perfil Comportamental) —
        // areaaluno.js mostra o modal de reaceite obrigatório antes de liberar o resto.
        if (precisaReaceitarTermos) localStorage.setItem('precisa_reaceitar_termos', '1');
        else localStorage.removeItem('precisa_reaceitar_termos');
    } else {
        localStorage.setItem('professorId', currentUser.id);
        localStorage.removeItem('alunoId');
    }
    showAlert('Login realizado! Redirecionando...', 'success');
    setTimeout(() => {
        window.location.href = tipo === 'aluno' ? 'areaaluno.html' : 'areaprofessor.html';
    }, 1500);
}

async function handleOtpSubmit(e) {
    e.preventDefault();
    const codigo = (document.getElementById('otpCodigo')?.value || '').replace(/\D/g, '');
    if (codigo.length !== 6) {
        showAlert('Digite o código de 6 dígitos recebido no e-mail.', 'warning');
        return;
    }
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Verificando...';
    submitBtn.disabled = true;
    try {
        const response = await fetch(`${API_URL}/verificar-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tempToken: _otpTempToken, codigo })
        });
        const data = await response.json();
        if (data.sucesso) {
            const otpModal = bootstrap.Modal.getInstance(document.getElementById('otpModal'));
            if (otpModal) otpModal.hide();
            clearInterval(_otpReenvioTimer);
            finalizarLogin(data.usuario, _otpTipo, data.token, data.precisaReaceitarTermos);
        } else {
            showAlert(data.mensagem || 'Código inválido. Tente novamente.', 'danger');
            document.getElementById('otpCodigo').value = '';
            document.getElementById('otpCodigo').focus();
        }
    } catch (error) {
        console.error('Erro na verificação OTP:', error);
        showAlert('Erro ao verificar código. Tente novamente.', 'danger');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function reenviarOtp() {
    if (!_otpTempToken) return;
    try {
        const response = await fetch(`${API_URL}/reenviar-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tempToken: _otpTempToken })
        });
        const data = await response.json();
        if (data.sucesso) {
            showAlert('Novo código enviado para seu e-mail.', 'success');
            iniciarContadorReenvio();
        } else {
            showAlert(data.mensagem || 'Erro ao reenviar. Faça login novamente.', 'danger');
        }
    } catch (_) {
        showAlert('Erro ao reenviar código.', 'danger');
    }
}

function iniciarContadorReenvio() {
    clearInterval(_otpReenvioTimer);
    const btn = document.getElementById('otpReenviarBtn');
    const contagem = document.getElementById('otpContagem');
    if (!btn || !contagem) return;
    btn.disabled = true;
    let s = 60;
    contagem.textContent = `(${s}s)`;
    _otpReenvioTimer = setInterval(() => {
        s--;
        if (s <= 0) {
            clearInterval(_otpReenvioTimer);
            contagem.textContent = '';
            btn.disabled = false;
        } else {
            contagem.textContent = `(${s}s)`;
        }
    }, 1000);
}