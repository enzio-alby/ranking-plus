
// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');
const acceptTermsCheckbox = document.getElementById('acceptTerms');
const acceptPrivacyCheckbox = document.getElementById('acceptPrivacy');
const confirmAcceptanceBtn = document.getElementById('confirmAcceptance');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    setupAcceptanceValidation();
    setupScrollSpy();
    setupAccessibility();
    setupPrintFunctionality();
    loadUserPreferences();
});

// Setup Navigation
function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId);
            updateActiveNavLink(this);
            
            // Track navigation
            trackEvent('navigation', 'terms', targetId);
        });
    });
}

// Show specific section
function showSection(sectionId) {
    // Hide all sections
    contentSections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Smooth scroll to section
        setTimeout(() => {
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    }
}

// Update active navigation link
function updateActiveNavLink(activeLink) {
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// Setup Acceptance Validation
function setupAcceptanceValidation() {
    // Check initial state
    validateAcceptance();
    
    // Add event listeners
    acceptTermsCheckbox.addEventListener('change', validateAcceptance);
    acceptPrivacyCheckbox.addEventListener('change', validateAcceptance);
    
    // Confirm acceptance button
    confirmAcceptanceBtn.addEventListener('click', handleAcceptanceConfirmation);
}

// Validate acceptance checkboxes
function validateAcceptance() {
    const termsAccepted = acceptTermsCheckbox.checked;
    const privacyAccepted = acceptPrivacyCheckbox.checked;
    const allAccepted = termsAccepted && privacyAccepted;
    
    confirmAcceptanceBtn.disabled = !allAccepted;
    
    // Update button appearance
    if (allAccepted) {
        confirmAcceptanceBtn.style.opacity = '1';
        confirmAcceptanceBtn.style.cursor = 'pointer';
    } else {
        confirmAcceptanceBtn.style.opacity = '0.6';
        confirmAcceptanceBtn.style.cursor = 'not-allowed';
    }
    
    // Save preferences
    saveUserPreferences();
}

// Handle acceptance confirmation
function handleAcceptanceConfirmation() {
    if (!confirmAcceptanceBtn.disabled) {
        // Record acceptance
        const acceptanceData = {
            termsAccepted: true,
            privacyAccepted: true,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ipAddress: 'logged_separately' // IP would be logged server-side
        };
        
        // Save acceptance record
        localStorage.setItem('rankingplus_acceptance', JSON.stringify(acceptanceData));
        
        // Show success message
        showAcceptanceSuccess();
        
        // Track acceptance
        trackEvent('acceptance', 'terms', 'confirmed');
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 3000);
    }
}

// Show acceptance success message
function showAcceptanceSuccess() {
    const successMessage = document.createElement('div');
    successMessage.className = 'success-overlay';
    successMessage.innerHTML = `
        <div class="success-content">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3>Termos Aceitos com Sucesso!</h3>
            <p>Obrigado por aceitar nossos termos e políticas.</p>
            <p>Você será redirecionado para o dashboard em alguns segundos...</p>
            <div class="loading-bar">
                <div class="loading-progress"></div>
            </div>
        </div>
    `;
    
    successMessage.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    document.body.appendChild(successMessage);
    
    // Animate loading bar
    const progressBar = successMessage.querySelector('.loading-progress');
    progressBar.style.animation = 'loadingProgress 3s ease-in-out';
    
    // Create confetti effect
    createConfetti();
}

// Setup Scroll Spy
function setupScrollSpy() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.classList.contains('active')) {
                const sectionId = entry.target.id;
                const correspondingNavLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
                
                if (correspondingNavLink) {
                    updateActiveNavLink(correspondingNavLink);
                }
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '-100px 0px -100px 0px'
    });
    
    contentSections.forEach(section => {
        observer.observe(section);
    });
}

// Setup Accessibility
function setupAccessibility() {
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        // Tab navigation for sections
        if (e.key === 'Tab' && e.ctrlKey) {
            e.preventDefault();
            navigateToNextSection();
        }
        
        // Enter key for acceptance
        if (e.key === 'Enter' && e.target.type === 'checkbox') {
            e.target.checked = !e.target.checked;
            e.target.dispatchEvent(new Event('change'));
        }
        
        // Escape key to close any overlays
        if (e.key === 'Escape') {
            const overlay = document.querySelector('.success-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
    });
    
    // Add ARIA labels
    addAriaLabels();
    
    // Focus management
    setupFocusManagement();
}

// Navigate to next section
function navigateToNextSection() {
    const activeSection = document.querySelector('.content-section.active');
    const allSections = Array.from(contentSections);
    const currentIndex = allSections.indexOf(activeSection);
    const nextIndex = (currentIndex + 1) % allSections.length;
    const nextSection = allSections[nextIndex];
    
    if (nextSection) {
        const nextSectionId = nextSection.id;
        const nextNavLink = document.querySelector(`.nav-link[href="#${nextSectionId}"]`);
        
        if (nextNavLink) {
            nextNavLink.click();
        }
    }
}

// Add ARIA labels
function addAriaLabels() {
    // Navigation links
    navLinks.forEach(link => {
        const sectionName = link.textContent.trim();
        link.setAttribute('aria-label', `Navegar para seção: ${sectionName}`);
    });
    
    // Checkboxes
    acceptTermsCheckbox.setAttribute('aria-label', 'Aceitar Termos de Uso');
    acceptPrivacyCheckbox.setAttribute('aria-label', 'Aceitar Política de Privacidade');
    
    // Confirm button
    confirmAcceptanceBtn.setAttribute('aria-label', 'Confirmar aceitação dos termos e políticas');
    
    // Sections
    contentSections.forEach(section => {
        const sectionTitle = section.querySelector('h2').textContent.trim();
        section.setAttribute('aria-label', sectionTitle);
        section.setAttribute('role', 'region');
    });
}

// Setup Focus Management
function setupFocusManagement() {
    // Focus trap for acceptance section
    const acceptanceSection = document.querySelector('.acceptance-section');
    const focusableElements = acceptanceSection.querySelectorAll(
        'input[type="checkbox"], button:not([disabled])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    acceptanceSection.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
    });
}

// Setup Print Functionality
function setupPrintFunctionality() {
    // Add print button
    const printButton = document.createElement('button');
    printButton.className = 'print-btn';
    printButton.innerHTML = '<i class="fas fa-print"></i> Imprimir Termos';
    printButton.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: linear-gradient(45deg, #F4442E, #ff6b4a);
        color: white;
        border: none;
        padding: 15px 20px;
        border-radius: 50px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 5px 20px rgba(244, 68, 46, 0.3);
        transition: all 0.3s ease;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    
    printButton.addEventListener('click', function() {
        // Show all sections for printing
        contentSections.forEach(section => {
            section.style.display = 'block';
        });
        
        window.print();
        
        // Restore original display
        setTimeout(() => {
            contentSections.forEach(section => {
                if (!section.classList.contains('active')) {
                    section.style.display = 'none';
                }
            });
        }, 100);
        
        trackEvent('print', 'terms', 'print_terms');
    });
    
    printButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px)';
        this.style.boxShadow = '0 8px 25px rgba(244, 68, 46, 0.4)';
    });
    
    printButton.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 5px 20px rgba(244, 68, 46, 0.3)';
    });
    
    document.body.appendChild(printButton);
}

// Save user preferences
function saveUserPreferences() {
    const preferences = {
        termsAccepted: acceptTermsCheckbox.checked,
        privacyAccepted: acceptPrivacyCheckbox.checked,
        lastVisited: new Date().toISOString()
    };
    
    localStorage.setItem('rankingplus_preferences', JSON.stringify(preferences));
}

// Load user preferences
function loadUserPreferences() {
    const saved = localStorage.getItem('rankingplus_preferences');
    if (saved) {
        try {
            const preferences = JSON.parse(saved);
            acceptTermsCheckbox.checked = preferences.termsAccepted || false;
            acceptPrivacyCheckbox.checked = preferences.privacyAccepted || false;
            validateAcceptance();
        } catch (e) {
            console.warn('Could not load saved preferences');
        }
    }
    
    // Check if user has already accepted terms
    const acceptance = localStorage.getItem('rankingplus_acceptance');
    if (acceptance) {
        try {
            const acceptanceData = JSON.parse(acceptance);
            showPreviousAcceptance(acceptanceData);
        } catch (e) {
            console.warn('Could not load acceptance data');
        }
    }
}

// Show previous acceptance info
function showPreviousAcceptance(acceptanceData) {
    const acceptanceDate = new Date(acceptanceData.timestamp).toLocaleDateString('pt-BR');
    const acceptanceTime = new Date(acceptanceData.timestamp).toLocaleTimeString('pt-BR');
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'previous-acceptance-info';
    infoDiv.innerHTML = `
        <div class="info-content">
            <i class="fas fa-info-circle"></i>
            <div class="info-text">
                <strong>Termos já aceitos anteriormente</strong>
                <p>Data: ${acceptanceDate} às ${acceptanceTime}</p>
            </div>
        </div>
    `;
    
    infoDiv.style.cssText = `
        background: #d4edda;
        border: 2px solid #c3e6cb;
        border-radius: 10px;
        padding: 15px 20px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 15px;
        color: #155724;
    `;
    
    const acceptanceSection = document.querySelector('.acceptance-content');
    acceptanceSection.insertBefore(infoDiv, acceptanceSection.firstChild);
}

// Create confetti effect
function createConfetti() {
    const colors = ['#F4442E', '#ff6b4a', '#020122', '#1a1a3a', '#28a745', '#ffc107'];
    const confettiCount = 100;
    
    for (let i = 0; i < confettiCount; i++) {
        createConfettiPiece(colors[Math.floor(Math.random() * colors.length)]);
    }
}

function createConfettiPiece(color) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
        position: fixed;
        width: 12px;
        height: 12px;
        background: ${color};
        top: -20px;
        left: ${Math.random() * 100}vw;
        z-index: 10001;
        pointer-events: none;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        transform: rotate(${Math.random() * 360}deg);
    `;
    
    document.body.appendChild(confetti);
    
    const fall = confetti.animate([
        {
            transform: `translateY(0) rotate(0deg) scale(1)`,
            opacity: 1
        },
        {
            transform: `translateY(100vh) rotate(${360 + Math.random() * 360}deg) scale(0)`,
            opacity: 0
        }
    ], {
        duration: Math.random() * 3000 + 2000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
    
    fall.addEventListener('finish', () => {
        confetti.remove();
    });
}

// Analytics tracking
function trackEvent(action, category, label) {
    console.log(`Event: ${action}, Category: ${category}, Label: ${label}`);
    
    // Google Analytics or other tracking service integration
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: category,
            event_label: label,
            value: 1
        });
    }
}

// Reading progress indicator
function setupReadingProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0;
        height: 4px;
        background: linear-gradient(90deg, #F4442E, #ff6b4a);
        z-index: 1001;
        transition: width 0.3s ease;
    `;
    
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', function() {
        const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        progressBar.style.width = Math.min(scrolled, 100) + '%';
    });
}

// Initialize reading progress
setupReadingProgress();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes loadingProgress {
        from { width: 0%; }
        to { width: 100%; }
    }
    
    .success-content {
        background: white;
        border-radius: 20px;
        padding: 50px;
        text-align: center;
        max-width: 500px;
        animation: slideUp 0.5s ease;
    }
    
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(50px) scale(0.9); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }
    
    .success-icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(45deg, #28a745, #34ce57);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        animation: bounce 0.6s ease;
    }
    
    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
    }
    
    .success-icon i {
        font-size: 2.5rem;
        color: white;
    }
    
    .success-content h3 {
        color: #020122;
        font-size: 1.8rem;
        font-weight: 600;
        margin-bottom: 15px;
    }
    
    .success-content p {
        color: #666;
        margin-bottom: 15px;
        line-height: 1.5;
    }
    
    .loading-bar {
        width: 100%;
        height: 6px;
        background: #e9ecef;
        border-radius: 3px;
        overflow: hidden;
        margin-top: 20px;
    }
    
    .loading-progress {
        height: 100%;
        background: linear-gradient(90deg, #F4442E, #ff6b4a);
        width: 0%;
        border-radius: 3px;
    }
    
    .info-content {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .info-content i {
        font-size: 1.5rem;
        color: #28a745;
    }
    
    .info-text strong {
        display: block;
        margin-bottom: 5px;
    }
    
    .info-text p {
        margin: 0;
        font-size: 0.9rem;
        opacity: 0.8;
    }
    
    .reading-progress {
        transition: width 0.3s ease;
    }
    
    @media (max-width: 768px) {
        .print-btn {
            bottom: 20px !important;
            right: 20px !important;
            padding: 12px 16px !important;
            font-size: 0.9rem !important;
        }
        
        .success-content {
            padding: 30px 20px !important;
            margin: 20px !important;
        }
    }
`;
document.head.appendChild(style);

// Auto-save form data
setInterval(saveUserPreferences, 30000); // Save every 30 seconds

// Handle page visibility change
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        saveUserPreferences();
    }
});

// Handle beforeunload
window.addEventListener('beforeunload', function() {
    saveUserPreferences();
});

// Initialize smooth scrolling for all anchor links
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
