
// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    setupScrollSpy();
    setupAccessibility();
    setupPrintFunctionality();
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

    // Sections
    contentSections.forEach(section => {
        const sectionTitle = section.querySelector('h2').textContent.trim();
        section.setAttribute('aria-label', sectionTitle);
        section.setAttribute('role', 'region');
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
    }
`;
document.head.appendChild(style);

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
