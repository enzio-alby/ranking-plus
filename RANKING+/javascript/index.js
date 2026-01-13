// UniRank JavaScript - Conectado à API e com Ranking Real

// CONFIGURAÇÃO DA API
// IMPORTANTE: IP da sua VM se estiver rodando no Google Cloud (Ex: 'http://34.139.180.202:3000')
const API_URL = 'http://34.27.195.110:3000';

// Estado Global
let currentUser = null;
let isAuthenticated = false;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    initializeAnimations();
    initializeFormHandlers();
    loadRanking(); // <--- Adicionado: Carrega o ranking do banco ao iniciar
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
}

// --- NOVA FUNÇÃO: CARREGAR RANKING DO BANCO ---
async function loadRanking() {
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) return;

    // Mostrar estado de carregamento
    rankingList.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Carregando ranking...</p></div>';

    try {
        const response = await fetch(`${API_URL}/ranking`);
        const students = await response.json();

        rankingList.innerHTML = ''; // Limpar loading

        if (students.length === 0) {
            rankingList.innerHTML = '<div class="text-center py-4 text-muted">Nenhum aluno classificado ainda.</div>';
            return;
        }

        // Renderizar Top 5 (ou mais) alunos
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

// Helper para criar o HTML de cada item do ranking
function createRankingItem(student, position) {
    const item = document.createElement('div');
    item.className = 'ranking-item mb-3 p-3 bg-white rounded shadow-sm';
    
    // Define estilos baseados na posição
    let positionBadgeClass = 'bg-light text-dark';
    let trophyIcon = '';
    
    if (position === 1) { positionBadgeClass = 'bg-warning text-dark'; trophyIcon = '🏆'; }
    else if (position === 2) { positionBadgeClass = 'bg-secondary text-white'; trophyIcon = '🥈'; }
    else if (position === 3) { positionBadgeClass = 'bg-danger text-white'; trophyIcon = '🥉'; }

    // Avatar aleatório (já que não temos upload de foto ainda)
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.nome)}&background=random&color=fff`;

    item.innerHTML = `
        <div class="d-flex align-items-center">
            <!-- Posição -->
            <div class="flex-shrink-0 me-4 text-center" style="width: 40px;">
                <span class="badge rounded-pill ${positionBadgeClass} fs-5" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                    ${position}
                </span>
            </div>
            
            <!-- Avatar -->
            <div class="flex-shrink-0 me-3">
                <img src="${avatarUrl}" alt="${student.nome}" class="rounded-circle border" style="width: 50px; height: 50px; object-fit: cover;">
            </div>
            
            <!-- Info -->
            <div class="flex-grow-1">
                <div class="d-flex align-items-center mb-1">
                    <h5 class="fw-bold mb-0 me-2 text-dark">${student.nome}</h5>
                    <span>${trophyIcon}</span>
                </div>
                <p class="text-muted mb-0 small"><i class="bi bi-book me-1"></i>${student.curso}</p>
            </div>
            
            <!-- Pontuação -->
            <div class="flex-shrink-0 text-end">
                <div class="display-6 fw-bold text-primary mb-0" style="font-size: 1.5rem;">
                    ${student.pontuacao || 0}
                </div>
                <div class="small text-muted" style="font-size: 0.75rem;">pontos</div>
            </div>
        </div>
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
            currentUser = data.usuario;
            isAuthenticated = true;
            localStorage.setItem('unirank_user', JSON.stringify(currentUser));
            
            if (tipoUsuario === 'aluno') {
                localStorage.setItem('alunoId', currentUser.id);
                localStorage.removeItem('professorId');
                showAlert('Login realizado! Redirecionando...', 'success');
                setTimeout(() => window.location.href = 'homealuno.html', 1500);
            } else {
                localStorage.setItem('professorId', currentUser.id);
                localStorage.removeItem('alunoId');
                showAlert('Login realizado! Redirecionando...', 'success');
                setTimeout(() => window.location.href = 'areadoprofessor.html', 1500);
            }
            
            // Fecha o modal com segurança
            const modalEl = document.getElementById('loginModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if(modal) modal.hide();
            
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

    const alunoData = {
        nome: document.getElementById('regNome').value,
        email: document.getElementById('regEmail').value,
        cpf: document.getElementById('regCpf').value,
        telefone: document.getElementById('regTelefone').value,
        data_nascimento: document.getElementById('regNascimento').value,
        matricula: document.getElementById('regMatricula').value,
        curso: document.getElementById('regCurso').value,
        semestre: parseInt(document.getElementById('regSemestre').value),
        turno: document.getElementById('regTurno').value,
        campus: document.getElementById('regCampus').value,
        senha: senha,
        periodo_curso: '2024.1',
        data_matricula: new Date().toISOString().split('T')[0]
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
        if(tipo === 'aluno') window.location.href = 'homealuno.html';
        else window.location.href = 'areadoprofessor.html';
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