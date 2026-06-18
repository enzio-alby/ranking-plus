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

    // OTP 2FA
    const otpForm = document.getElementById('otpForm');
    if (otpForm) {
        otpForm.addEventListener('submit', handleOtpSubmit);
    }
}

// --- NOVA FUNÇÃO: CARREGAR RANKING DO BANCO ---
async function loadRanking() {
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) return;

    rankingList.innerHTML = '<div class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>Carregando...</div>';

    try {
        const response = await fetch(`${API_URL}/ranking`);
        const students = await response.json();

        rankingList.innerHTML = ''; // Limpar loading

        if (students.length === 0) {
            rankingList.innerHTML = '<div class="text-center py-4 text-muted">Nenhum aluno classificado ainda.</div>';
            return;
        }

        // Renderizar Top 5 alunos
        students.slice(0, 5).forEach((student, index) => {
            const position = index + 1;
            const item = createRankingItem(student, position);
            rankingList.appendChild(item);
        });

    } catch (error) {
        console.error('Erro ao carregar ranking:', error);
        rankingList.innerHTML = '<div class="text-center py-4 text-danger">Erro ao carregar o ranking. Tente novamente mais tarde.</div>';
    }
}

// Carrega estatísticas reais da plataforma
async function loadStats() {
    try {
        const res  = await fetch(`${API_URL}/stats`);
        const data = await res.json();
        const fmt  = n => Number(n).toLocaleString('pt-BR');
        const set  = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('statAlunos',   fmt(data.total_alunos      ?? '—'));
        set('statCursos',   fmt(data.total_cursos      ?? '—'));
        set('statProfs',    fmt(data.total_professores ?? '—'));
        set('statEmpresas', fmt(data.total_empresas    ?? '—'));
    } catch (_) { /* stats são opcionais — silencia falha */ }
}

// Helper para criar o HTML de cada item do ranking
function createRankingItem(student, position) {
    const item = document.createElement('div');

    const anonimo     = student.permitir_exibicao_ranking === 0 || student.permitir_exibicao_ranking === '0';
    const nomeExibido = anonimo ? 'Aluno Anônimo' : student.nome;
    const cursoExibido = anonimo ? '—' : (student.curso || '—');

    const posClass = position === 1 ? 'p1' : position === 2 ? 'p2' : position === 3 ? 'p3' : 'pd';
    const avatarUrl = anonimo
        ? 'https://ui-avatars.com/api/?name=?&background=9e9e9e&color=fff&size=80'
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(student.nome)}&background=random&color=fff&size=80`;

    item.className = 'ranking-row';
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

// --- FUNÇÃO DE LOGIN REAL (Corrigida para bater com o HTML) ---
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

// --- FUNÇÃO DE CADASTRO REAL ---
async function handleRegister(e) {
    e.preventDefault();

    const senha = document.getElementById('regSenha').value;
    const senhaConf = document.getElementById('regSenhaConf').value;

    if (senha !== senhaConf) {
        showAlert('As senhas não conferem!', 'warning');
        return;
    }

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
        data_matricula:  new Date().toISOString().split('T')[0]
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

// ─── 2FA — Funções auxiliares ────────────────────────────────────────────────

function finalizarLogin(usuario, tipo) {
    currentUser = usuario;
    isAuthenticated = true;
    localStorage.setItem('unirank_user', JSON.stringify(currentUser));
    if (tipo === 'aluno') {
        localStorage.setItem('alunoId', currentUser.id);
        localStorage.removeItem('professorId');
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
            finalizarLogin(data.usuario, _otpTipo);
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