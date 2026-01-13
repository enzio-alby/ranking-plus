
// DOM Elements
const recoveryOptions = document.querySelector('.recovery-options');
const recoveryForms = document.querySelector('.recovery-forms');
const successMessage = document.getElementById('success-message');
const optionCards = document.querySelectorAll('.option-card');
const formContainers = document.querySelectorAll('.form-container');
const forms = document.querySelectorAll('form');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupFormValidation();
    addInputAnimations();
});

// Setup Event Listeners
function setupEventListeners() {
    // Option card clicks
    optionCards.forEach(card => {
        card.addEventListener('click', function() {
            const optionType = this.id.replace('-option', '');
            showForm(optionType);
        });
    });

    // Form submissions
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });

    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', formatPhoneNumber);
    }

    // Add hover effects
    addHoverEffects();
}

// Show specific form
function showForm(formType) {
    // Hide options
    recoveryOptions.style.display = 'none';
    
    // Show forms container
    recoveryForms.style.display = 'block';
    
    // Hide all forms
    formContainers.forEach(container => {
        container.classList.remove('active');
    });
    
    // Show specific form
    const targetForm = document.getElementById(`${formType}-form`);
    if (targetForm) {
        targetForm.classList.add('active');
        
        // Focus on first input
        const firstInput = targetForm.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
        }
    }
    
    // Add animation
    recoveryForms.style.animation = 'slideIn 0.3s ease';
}

// Show options (back button)
function showOptions() {
    recoveryForms.style.display = 'none';
    recoveryOptions.style.display = 'block';
    successMessage.classList.remove('show');
    
    // Reset forms
    forms.forEach(form => form.reset());
    clearValidationStates();
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
    }, 2000);
}

// Form validation
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required]');
    
    inputs.forEach(input => {
        const value = input.value.trim();
        const inputWrapper = input.closest('.input-wrapper');
        
        // Remove previous validation states
        inputWrapper.classList.remove('error', 'success');
        
        // Validate based on input type
        if (!value) {
            showInputError(inputWrapper, 'Este campo é obrigatório');
            isValid = false;
        } else if (input.type === 'email' && !isValidEmail(value)) {
            showInputError(inputWrapper, 'Email inválido');
            isValid = false;
        } else if (input.type === 'tel' && !isValidPhone(value)) {
            showInputError(inputWrapper, 'Número de telefone inválido');
            isValid = false;
        } else {
            showInputSuccess(inputWrapper);
        }
    });
    
    return isValid;
}

// Show input error
function showInputError(wrapper, message) {
    wrapper.classList.add('error');
    
    // Remove existing error message
    const existingError = wrapper.querySelector('.error-message');
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
    
    wrapper.appendChild(errorDiv);
    
    // Add error styles to input
    const input = wrapper.querySelector('input');
    input.style.borderColor = '#dc3545';
    input.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';
}

// Show input success
function showInputSuccess(wrapper) {
    wrapper.classList.add('success');
    
    const input = wrapper.querySelector('input');
    input.style.borderColor = '#28a745';
    input.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.1)';
    
    // Remove error message if exists
    const errorMessage = wrapper.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// Clear validation states
function clearValidationStates() {
    const wrappers = document.querySelectorAll('.input-wrapper');
    wrappers.forEach(wrapper => {
        wrapper.classList.remove('error', 'success');
        const input = wrapper.querySelector('input');
        input.style.borderColor = '#e9ecef';
        input.style.boxShadow = 'none';
        
        const errorMessage = wrapper.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    });
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) || /^\d{8,}$/.test(email); // Email or student ID
}

// Phone validation
function isValidPhone(phone) {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return phoneRegex.test(phone);
}

// Format phone number
function formatPhoneNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length >= 11) {
        value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length >= 7) {
        value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (value.length >= 3) {
        value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    }
    
    e.target.value = value;
}

// Add loading state
function addLoadingState(form) {
    form.classList.add('loading');
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = true;
}

// Remove loading state
function removeLoadingState(form) {
    form.classList.remove('loading');
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = false;
}

// Show success message
function showSuccessMessage(formType, formData) {
    const successText = document.getElementById('success-text');
    let message = '';
    
    switch (formType) {
        case 'emailRecoveryForm':
            const email = formData.get('email');
            message = `Enviamos um link de recuperação para ${email}. Verifique sua caixa de entrada e spam.`;
            break;
        case 'smsRecoveryForm':
            const phone = formData.get('phone');
            message = `Enviamos um código de verificação para ${phone}. O código expira em 10 minutos.`;
            break;
        case 'questionsRecoveryForm':
            message = 'Encontramos suas perguntas de segurança. Você será redirecionado para respondê-las.';
            break;
    }
    
    successText.textContent = message;
    
    // Hide forms and show success
    recoveryForms.style.display = 'none';
    successMessage.classList.add('show');
    
    // Add confetti effect
    createConfetti();
}

// Add input animations
function addInputAnimations() {
    const inputs = document.querySelectorAll('input');
    
    inputs.forEach(input => {
        // Floating label effect
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // Real-time validation
        input.addEventListener('input', function() {
            const wrapper = this.closest('.input-wrapper');
            wrapper.classList.remove('error');
            
            const errorMessage = wrapper.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
            
            // Reset border
            this.style.borderColor = '#e9ecef';
            this.style.boxShadow = 'none';
        });
    });
}

// Add hover effects
function addHoverEffects() {
    // Parallax effect on option cards
    optionCards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    });
}

// Create confetti effect
function createConfetti() {
    const colors = ['#F4442E', '#ff6b4a', '#020122', '#1a1a3a'];
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

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (recoveryForms.style.display === 'block') {
            showOptions();
        }
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    .input-wrapper.focused input {
        border-color: #F4442E !important;
        box-shadow: 0 0 0 3px rgba(244, 68, 46, 0.1) !important;
    }
    
    .input-wrapper.error input {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
    }
    
    .input-wrapper.success input {
        border-color: #28a745 !important;
        box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1) !important;
    }
`;
document.head.appendChild(style);

// PWA features (if needed)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            console.log('ServiceWorker registration successful');
        }).catch(function(err) {
            console.log('ServiceWorker registration failed');
        });
    });
}

// Analytics tracking (placeholder)
function trackEvent(action, category, label) {
    // Google Analytics or other tracking service
    console.log(`Event: ${action}, Category: ${category}, Label: ${label}`);
}

// Track form interactions
optionCards.forEach(card => {
    card.addEventListener('click', function() {
        trackEvent('click', 'recovery_option', this.id);
    });
});

forms.forEach(form => {
    form.addEventListener('submit', function() {
        trackEvent('submit', 'recovery_form', this.id);
    });
});
