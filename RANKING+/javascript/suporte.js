
// DOM Elements
const actionCards = document.querySelectorAll('.action-card');
const supportForms = document.getElementById('support-forms');
const formContainers = document.querySelectorAll('.form-container');
const faqItems = document.querySelectorAll('.faq-item');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessage');
const chatMessages = document.getElementById('chat-messages');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupFormValidation();
    setupFAQ();
    setupChat();
    setupSearch();
});

// Setup Event Listeners
function setupEventListeners() {
    // Action card clicks
    actionCards.forEach(card => {
        card.addEventListener('click', function() {
            const action = this.dataset.action;
            showForm(action);
        });
    });

    // Close forms on background click
    supportForms.addEventListener('click', function(e) {
        if (e.target === this) {
            closeForms();
        }
    });

    // Escape key to close forms
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && supportForms.classList.contains('show')) {
            closeForms();
        }
    });

    // File upload handling
    const fileInput = document.getElementById('ticketFile');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
}

// Show specific form
function showForm(formType) {
    // Hide all forms
    formContainers.forEach(container => {
        container.classList.remove('active');
    });
    
    // Show specific form
    const targetForm = document.getElementById(`${formType}-form`);
    if (targetForm) {
        targetForm.classList.add('active');
        supportForms.classList.add('show');
        
        // Focus on first input
        const firstInput = targetForm.querySelector('input, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
        }
    }
    
    // Track event
    trackEvent('open_form', 'support', formType);
}

// Close forms
function closeForms() {
    supportForms.classList.remove('show');
    
    // Reset forms after animation
    setTimeout(() => {
        formContainers.forEach(container => {
            container.classList.remove('active');
        });
        resetForms();
    }, 300);
}

// Reset all forms
function resetForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.reset();
        clearValidationStates(form);
    });
    
    // Reset chat
    const userMessages = chatMessages.querySelectorAll('.user-message');
    userMessages.forEach(msg => msg.remove());
}

// Setup FAQ functionality
function setupFAQ() {
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Close all FAQ items
            faqItems.forEach(faqItem => {
                faqItem.classList.remove('active');
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
            
            // Track event
            trackEvent('faq_click', 'support', question.querySelector('h4').textContent);
        });
    });
}

// Setup Chat functionality
function setupChat() {
    // Send message on button click
    sendMessageBtn.addEventListener('click', sendChatMessage);
    
    // Send message on Enter key
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
    
    // Auto-resize chat input
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
}

// Send chat message
function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    
    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Simulate bot response
    setTimeout(() => {
        const botResponse = generateBotResponse(message);
        addChatMessage(botResponse, 'bot');
    }, 1000 + Math.random() * 2000);
    
    // Track event
    trackEvent('chat_message', 'support', 'user_message');
}

// Add message to chat
function addChatMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const text = document.createElement('p');
    text.textContent = message;
    
    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    content.appendChild(text);
    content.appendChild(time);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Generate bot response
function generateBotResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    if (message.includes('ranking') || message.includes('posição') || message.includes('colocação')) {
        return 'O ranking é atualizado semanalmente com base em suas notas, participação e atividades. Você pode acompanhar sua posição no dashboard!';
    }
    
    if (message.includes('benefício') || message.includes('recompensa') || message.includes('prêmio')) {
        return 'Os melhores colocados têm acesso a bolsas de estudo, intercâmbios, vagas prioritárias em pesquisas e muito mais! Consulte a seção de benefícios no seu perfil.';
    }
    
    if (message.includes('nota') || message.includes('pontuação') || message.includes('score')) {
        return 'Sua pontuação é calculada considerando notas das disciplinas, frequência, participação em atividades extracurriculares e projetos especiais. Cada item tem um peso específico.';
    }
    
    if (message.includes('problema') || message.includes('erro') || message.includes('bug')) {
        return 'Entendo que você está enfrentando um problema técnico. Recomendo abrir um ticket de suporte para que nossa equipe possa ajudá-lo de forma mais detalhada.';
    }
    
    if (message.includes('como') || message.includes('tutorial') || message.includes('ajuda')) {
        return 'Temos uma seção completa de tutoriais disponível! Você também pode acessar o FAQ para respostas rápidas às dúvidas mais comuns.';
    }
    
    // Default responses
    const defaultResponses = [
        'Entendi sua dúvida! Posso ajudá-lo melhor se você abrir um ticket de suporte com mais detalhes.',
        'Essa é uma ótima pergunta! Recomendo verificar nosso FAQ ou entrar em contato via ticket para uma resposta mais completa.',
        'Para questões específicas como essa, nossa equipe de suporte pode ajudá-lo melhor através de um ticket.',
        'Obrigado pela sua mensagem! Para um atendimento mais personalizado, sugiro abrir um ticket de suporte.'
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Setup Search functionality
function setupSearch() {
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Real-time search suggestions
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        if (query.length > 2) {
            highlightFAQMatches(query);
        } else {
            clearFAQHighlights();
        }
    });
}

// Perform search
function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;
    
    // Search in FAQ
    let foundMatches = false;
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question h4').textContent.toLowerCase();
        const answer = item.querySelector('.faq-answer p').textContent.toLowerCase();
        
        if (question.includes(query) || answer.includes(query)) {
            item.style.display = 'block';
            item.classList.add('search-highlight');
            foundMatches = true;
        } else {
            item.style.display = 'none';
            item.classList.remove('search-highlight');
        }
    });
    
    // Scroll to FAQ section if matches found
    if (foundMatches) {
        document.getElementById('faq-section').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    } else {
        // Show "no results" message
        showNoResultsMessage();
    }
    
    // Track search
    trackEvent('search', 'support', query);
}

// Highlight FAQ matches
function highlightFAQMatches(query) {
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question h4').textContent.toLowerCase();
        if (question.includes(query)) {
            item.classList.add('search-match');
        } else {
            item.classList.remove('search-match');
        }
    });
}

// Clear FAQ highlights
function clearFAQHighlights() {
    faqItems.forEach(item => {
        item.classList.remove('search-match', 'search-highlight');
        item.style.display = 'block';
    });
}

// Show no results message
function showNoResultsMessage() {
    // Create or update no results message
    let noResultsDiv = document.getElementById('no-results');
    if (!noResultsDiv) {
        noResultsDiv = document.createElement('div');
        noResultsDiv.id = 'no-results';
        noResultsDiv.className = 'no-results-message';
        noResultsDiv.innerHTML = `
            <div class="no-results-content">
                <i class="fas fa-search"></i>
                <h4>Nenhum resultado encontrado</h4>
                <p>Tente usar palavras-chave diferentes ou abra um ticket de suporte.</p>
                <button onclick="showForm('ticket')" class="btn-primary">Abrir Ticket</button>
            </div>
        `;
        document.getElementById('faq-section').appendChild(noResultsDiv);
    }
    
    noResultsDiv.style.display = 'block';
    setTimeout(() => {
        noResultsDiv.style.display = 'none';
        clearFAQHighlights();
    }, 5000);
}

// Setup Form Validation
function setupFormValidation() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => clearFieldError(input));
        });
    });
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const formType = form.id;
    
    // Validate form
    if (!validateForm(form)) {
        return;
    }
    
    // Add loading state
    addLoadingState(form);
    
    // Simulate API call
    setTimeout(() => {
        removeLoadingState(form);
        showSuccessMessage(formType, formData);
        
        // Close form after success
        setTimeout(() => {
            closeForms();
        }, 2000);
    }, 2000);
    
    // Track submission
    trackEvent('form_submit', 'support', formType);
}

// Validate entire form
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    const fieldType = field.type;
    const fieldName = field.name;
    
    // Clear previous errors
    clearFieldError(field);
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'Este campo é obrigatório');
        return false;
    }
    
    // Email validation
    if (fieldType === 'email' && value && !isValidEmail(value)) {
        showFieldError(field, 'Email inválido');
        return false;
    }
    
    // Category validation
    if (fieldName === 'category' && !value) {
        showFieldError(field, 'Selecione uma categoria');
        return false;
    }
    
    // Subject length validation
    if (fieldName === 'subject' && value.length < 5) {
        showFieldError(field, 'O assunto deve ter pelo menos 5 caracteres');
        return false;
    }
    
    // Description length validation
    if (fieldName === 'description' && value.length < 20) {
        showFieldError(field, 'A descrição deve ter pelo menos 20 caracteres');
        return false;
    }
    
    return true;
}

// Show field error
function showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: #dc3545;
        font-size: 0.8rem;
        margin-top: 5px;
        animation: shake 0.3s ease;
    `;
    
    field.parentElement.appendChild(errorDiv);
}

// Clear field error
function clearFieldError(field) {
    field.classList.remove('error');
    
    const errorMessage = field.parentElement.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// Clear all validation states
function clearValidationStates(form) {
    const fields = form.querySelectorAll('input, textarea, select');
    fields.forEach(field => clearFieldError(field));
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Handle file upload
function handleFileUpload(e) {
    const file = e.target.files[0];
    const fileLabel = e.target.parentElement.querySelector('.file-label span');
    
    if (file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (file.size > maxSize) {
            alert('Arquivo muito grande. Tamanho máximo: 10MB');
            e.target.value = '';
            return;
        }
        
        fileLabel.textContent = `Arquivo selecionado: ${file.name}`;
        fileLabel.style.color = '#28a745';
    } else {
        fileLabel.textContent = 'Clique para anexar ou arraste aqui';
        fileLabel.style.color = '#666';
    }
}

// Add loading state
function addLoadingState(form) {
    form.classList.add('loading');
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
}

// Remove loading state
function removeLoadingState(form) {
    form.classList.remove('loading');
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = false;
    
    // Restore original button content
    if (form.id === 'ticketForm') {
        submitBtn.innerHTML = '<span>Enviar Ticket</span><i class="fas fa-paper-plane"></i>';
    }
}

// Show success message
function showSuccessMessage(formType, formData) {
    let message = '';
    
    switch (formType) {
        case 'ticketForm':
            const ticketId = 'TK' + Date.now().toString().slice(-6);
            message = `Ticket ${ticketId} criado com sucesso! Nossa equipe entrará em contato em até 24 horas.`;
            break;
        default:
            message = 'Solicitação enviada com sucesso!';
    }
    
    // Show toast notification
    showToast(message, 'success');
    
    // Create confetti effect
    createConfetti();
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : '#0c5460'};
        padding: 15px 20px;
        border-radius: 10px;
        border-left: 4px solid ${type === 'success' ? '#28a745' : '#17a2b8'};
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Create confetti effect
function createConfetti() {
    const colors = ['#F4442E', '#ff6b4a', '#020122', '#1a1a3a', '#28a745'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        createConfettiPiece(colors[Math.floor(Math.random() * colors.length)]);
    }
}

function createConfettiPiece(color) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${color};
        top: -10px;
        left: ${Math.random() * 100}vw;
        z-index: 9999;
        pointer-events: none;
        border-radius: 50%;
    `;
    
    document.body.appendChild(confetti);
    
    const fall = confetti.animate([
        {
            transform: `translateY(0) rotate(0deg)`,
            opacity: 1
        },
        {
            transform: `translateY(100vh) rotate(360deg)`,
            opacity: 0
        }
    ], {
        duration: Math.random() * 2000 + 1000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
    
    fall.addEventListener('finish', () => {
        confetti.remove();
    });
}

// Analytics tracking
function trackEvent(action, category, label) {
    console.log(`Event: ${action}, Category: ${category}, Label: ${label}`);
    // Integrate with Google Analytics or other tracking service
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .search-match {
        background: rgba(244, 68, 46, 0.1) !important;
        border-color: #F4442E !important;
    }
    
    .search-highlight {
        animation: pulse 2s infinite;
    }
    
    .no-results-message {
        text-align: center;
        padding: 40px;
        background: #f8f9fa;
        border-radius: 15px;
        margin-top: 20px;
        display: none;
    }
    
    .no-results-content i {
        font-size: 3rem;
        color: #ccc;
        margin-bottom: 20px;
    }
    
    .no-results-content h4 {
        color: #666;
        margin-bottom: 10px;
    }
    
    .no-results-content p {
        color: #999;
        margin-bottom: 20px;
    }
    
    .btn-primary {
        background: linear-gradient(45deg, #F4442E, #ff6b4a);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(244, 68, 46, 0.3);
    }
    
    .error {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
    }
    
    .loading .submit-btn {
        pointer-events: none;
        opacity: 0.7;
    }
`;
document.head.appendChild(style);

// Initialize smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Ctrl/Cmd + Enter to send chat message
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && chatInput === document.activeElement) {
        e.preventDefault();
        sendChatMessage();
    }
});
