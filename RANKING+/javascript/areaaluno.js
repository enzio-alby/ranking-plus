// Main JavaScript for Student Academic System
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
    
    // Navigation functionality
    setupNavigation();
    
    // Sidebar toggle for mobile
    setupSidebarToggle();
    
    // Initialize tooltips and other Bootstrap components
    initializeBootstrapComponents();
});

function initializeApp() {
    console.log('Student Academic System initialized');
    
    // Set default active page
    showPage('dashboard');
    
    // Add fade-in animation to content
    const content = document.getElementById('pageContent');
    if (content) {
        content.classList.add('fade-in');
    }
}

function setupNavigation() {
    // Get all navigation links
    const navLinks = document.querySelectorAll('.nav-link[data-page]');
    const dropdownLinks = document.querySelectorAll('.dropdown-item[data-page]');
    
    // Add click event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
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
        link.addEventListener('click', function(e) {
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

function initializePageSpecificFeatures(pageId) {
    switch(pageId) {
        case 'dashboard':
            // Dashboard is initialized by charts.js
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
    }
}

function initializeDisciplinasPage() {
    // Add any specific functionality for Disciplinas page
    console.log('Disciplinas page initialized');
    
    // Example: Add click handlers for subject cards
    const subjectCards = document.querySelectorAll('.subject-card');
    subjectCards.forEach(card => {
        card.addEventListener('click', function() {
            // Add subtle animation on click
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}

function initializeColegasPage() {
    console.log('Colegas page initialized');
    
    // Initialize grade distribution chart if not already done
    if (typeof initializeGradeDistributionChart === 'function') {
        initializeGradeDistributionChart();
    }
}

function initializePerfilPage() {
    console.log('Perfil page initialized');
    
    // Initialize CRA history chart if not already done
    if (typeof initializeCRAHistoryChart === 'function') {
        initializeCRAHistoryChart();
    }
    
    // Add hover effects to achievement items
    const achievementItems = document.querySelectorAll('.achievement-item');
    achievementItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
}

function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(e) {
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
window.addEventListener('resize', function() {
    // Close sidebar on desktop if it was open on mobile
    if (window.innerWidth > 991.98) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('show');
        }
    }
});

// Handle keyboard navigation
document.addEventListener('keydown', function(e) {
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
    // Bootstrap form validation
    form.addEventListener('submit', function(event) {
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        form.classList.add('was-validated');
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
        input.addEventListener('input', function(e) {
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
        cepInput.addEventListener('input', function(e) {
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
        uploadBtn.addEventListener('click', function() {
            // Create a file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/jpeg,image/png';
            fileInput.style.display = 'none';
            
            fileInput.addEventListener('change', function(e) {
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
        removeBtn.addEventListener('click', function() {
            // Simulate photo removal
            showPhotoRemoved();
        });
    }
}

// Charts JavaScript for Student Academic System
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all charts when DOM is loaded
    initializeAllCharts();
});

function initializeAllCharts() {
    // Dashboard charts
    initializePerformanceChart();
    initializeFrequencyChart();
    
    // Other page charts (will be initialized when pages are shown)
    // Grade distribution chart for Colegas page
    // CRA history chart for Perfil page
}

// Performance Chart (Line Chart)
function initializePerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [
                {
                    label: 'Suas Notas',
                    data: [7.5, 8.1, 8.7, 8.4, 9.2, 8.9],
                    borderColor: '#F4442E',
                    backgroundColor: 'rgba(244, 68, 46, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#F4442E',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                },
                {
                    label: 'Média da Turma',
                    data: [7.2, 7.8, 8.0, 7.9, 8.3, 8.1],
                    borderColor: '#020122',
                    backgroundColor: 'rgba(2, 1, 34, 0.05)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#020122',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    borderDash: [5, 5],
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12,
                            family: 'Inter'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#020122',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#F4442E',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            family: 'Inter'
                        },
                        color: '#666666'
                    }
                },
                y: {
                    beginAtZero: false,
                    min: 6,
                    max: 10,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            size: 11,
                            family: 'Inter'
                        },
                        color: '#666666',
                        callback: function(value) {
                            return value.toFixed(1);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            elements: {
                point: {
                    hoverBackgroundColor: '#F4442E'
                }
            }
        }
    });
}

// Frequency Chart (Bar Chart)
function initializeFrequencyChart() {
    const ctx = document.getElementById('frequencyChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Algoritmos', 'BD', 'Cálculo', 'POO', 'Redes', 'Eng. Software'],
            datasets: [
                {
                    label: 'Frequência (%)',
                    data: [96, 92, 88, 98, 94, 96],
                    backgroundColor: [
                        'rgba(244, 68, 46, 0.8)',
                        'rgba(2, 1, 34, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(168, 85, 247, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ],
                    borderColor: [
                        '#F4442E',
                        '#020122',
                        '#22C55E',
                        '#3B82F6',
                        '#A855F7',
                        '#F59E0B'
                    ],
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#020122',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#F4442E',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return `Frequência: ${context.parsed.y}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 10,
                            family: 'Inter'
                        },
                        color: '#666666',
                        maxRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            size: 11,
                            family: 'Inter'
                        },
                        color: '#666666',
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        },
    });
}

// Grade Distribution Chart (Doughnut Chart) - For Colegas page
function initializeGradeDistributionChart() {
    const ctx = document.getElementById('gradeDistributionChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['9.0-10.0', '8.0-8.9', '7.0-7.9', '6.0-6.9', 'Abaixo de 6.0'],
            datasets: [{
                data: [15, 35, 30, 15, 5],
                backgroundColor: [
                    '#22C55E',
                    '#3B82F6',
                    '#F59E0B',
                    '#EF4444',
                    '#6B7280'
                ],
                borderColor: '#fff',
                borderWidth: 2,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 11,
                            family: 'Inter'
                        },
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: '#020122',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#F4442E',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            const percentage = ((context.parsed / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                            return `${context.label}: ${percentage}% (${context.parsed} alunos)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// CRA History Chart (Area Chart) - For Perfil page
function initializeCRAHistoryChart() {
    const ctx = document.getElementById('craHistoryChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['2021.1', '2021.2', '2022.1', '2022.2', '2023.1', '2023.2', '2024.1'],
            datasets: [{
                label: 'CRA',
                data: [7.8, 8.1, 8.3, 8.0, 8.4, 8.6, 8.7],
                borderColor: '#020122',
                backgroundColor: 'rgba(2, 1, 34, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#020122',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#020122',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#F4442E',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return `CRA: ${context.parsed.y.toFixed(1)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            family: 'Inter'
                        },
                        color: '#666666'
                    }
                },
                y: {
                    beginAtZero: false,
                    min: 7,
                    max: 10,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            size: 11,
                            family: 'Inter'
                        },
                        color: '#666666',
                        callback: function(value) {
                            return value.toFixed(1);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Utility function to destroy existing chart before creating new one
function destroyChart(chartId) {
    const existingChart = Chart.getChart(chartId);
    if (existingChart) {
        existingChart.destroy();
    }
}

// Function to update chart data (for future dynamic updates)
function updateChartData(chartId, newData) {
    const chart = Chart.getChart(chartId);
    if (chart) {
        chart.data = newData;
        chart.update();
    }
}

// Export chart functions for use in other scripts
window.ChartSystem = {
    initializePerformanceChart,
    initializeFrequencyChart,
    initializeGradeDistributionChart,
    initializeCRAHistoryChart,
    destroyChart,
    updateChartData
};

// Make chart initialization functions available globally
window.initializeGradeDistributionChart = initializeGradeDistributionChart;
window.initializeCRAHistoryChart = initializeCRAHistoryChart;

// Export functions for use in other scripts
window.StudentAcademicSystem = {
    showPage,
    updateActiveNavLink,
    showLoading,
    hideLoading,
    initializePageSpecificFeatures
};

document.addEventListener('DOMContentLoaded', function() {
  // Adiciona funcionalidade de mostrar/ocultar senha ao segurar o botão
  const senhaInput = document.getElementById('senhaInput');
  const toggleSenha = document.getElementById('toggleSenha');
  const eyeIcon = document.getElementById('eyeIcon');

  if (senhaInput && toggleSenha && eyeIcon) {
    toggleSenha.addEventListener('mousedown', function() {
      senhaInput.type = 'text';
      eyeIcon.classList.remove('bi-eye');
      eyeIcon.classList.add('bi-eye-slash');
    });

    toggleSenha.addEventListener('mouseup', function() {
      senhaInput.type = 'password';
      eyeIcon.classList.remove('bi-eye-slash');
      eyeIcon.classList.add('bi-eye');
    });

    toggleSenha.addEventListener('mouseleave', function() {
      senhaInput.type = 'password';
      eyeIcon.classList.remove('bi-eye-slash');
      eyeIcon.classList.add('bi-eye');
    });
  }
});
/*
  Observação: este arquivo preserva o código existente (inicialização de gráficos e navegação de páginas).
  A seguir são adicionadas as rotinas necessárias para popular a aba Relatórios e gerar o PDF do próprio aluno.
*/

document.addEventListener('DOMContentLoaded', () => {
    // Atualiza valores do cartão de relatório a partir do DOM do perfil (se disponível)
    function populateReportInfo() {
        const userData = getLoggedUserData(); // Função que retorna os dados do usuário logado
        if (!userData) return;

        document.getElementById('reportName').textContent = userData.name || 'Aluno';
        document.getElementById('reportEmail').textContent = userData.email || '';
        document.getElementById('reportCourse').textContent = userData.course || '';
        document.getElementById('reportAvatarPreview').src = userData.avatar || '../images/default-avatar.png';
    }

    populateReportInfo();

    // Ao navegar para a aba relatorios, atualiza pré-visualização de gráficos (se houver)
    const observer = new MutationObserver(() => {
        // reaplica dados se DOM mudar (útil quando perfil é carregado assincronamente)
        populateReportInfo();
    });
    observer.observe(document.getElementById('pageContent') || document.body, { childList: true, subtree: true });

    // Handler do botão de gerar relatório
    const genBtn = document.getElementById('generateReportBtn');
    if (genBtn) {
        genBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await generateStudentReport();
        });
    }
});

// Função auxiliar para pegar texto com fallback
function _getText(selector, fallback = '') {
    const el = document.querySelector(selector);
    if (!el) return fallback;
    return (el.value || el.textContent || '').trim();
}

// Gera o PDF do aluno com jsPDF, incluindo imagens de canvas (se existirem)
async function generateStudentReport() {
    try {
        const jspdfLib = window.jspdf;
        if (!jspdfLib || !jspdfLib.jsPDF) {
            alert('Biblioteca jsPDF não encontrada. Atualize a página e tente novamente.');
            return;
        }
        const { jsPDF } = jspdfLib;
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });

        const name = _getText('#reportName', 'Aluno');
        const matricula = _getText('#reportMatricula', '');
        const course = _getText('#reportCourse', '');
        const cra = _getText('#reportCRA', '');
        const freq = _getText('#reportFreq', '');

        // Cabeçalho
        doc.setFontSize(18);
        doc.text(`Relatório Acadêmico — ${name}`, 40, 50);
        doc.setFontSize(11);
        doc.text(`Gerado em: ${new Date().toLocaleString()}`, 40, 68);

        // Dados principais
        let y = 100;
        doc.setFontSize(12);
        doc.text(`Nome: ${name}`, 40, y); y += 18;
        doc.text(`Matrícula: ${matricula}`, 40, y); y += 18;
        doc.text(`Curso: ${course}`, 40, y); y += 18;
        doc.text(`CRA: ${cra}`, 40, y); y += 18;
        doc.text(`Frequência: ${freq}`, 40, y); y += 26;

        // Incluir gráficos (se existirem) a partir de canvas
        const canvasIds = ['performanceChart', 'performanceChartPreview', 'frequencyChart', 'frequencyChartPreview'];
        for (const id of canvasIds) {
            const canvas = document.getElementById(id);
            if (canvas && canvas.toDataURL) {
                try {
                    const imgData = canvas.toDataURL('image/png');
                    // calcula largura proporcional no PDF (A4 ~ 595pt largura)
                    const maxWidth = 515; // margem lateral 40pt
                    const imgProps = await _getImageProps(imgData);
                    const ratio = imgProps.width / imgProps.height;
                    const imgWidth = Math.min(maxWidth, imgProps.width);
                    const imgHeight = imgWidth / ratio;
                    if (y + imgHeight > 820) { // nova página se necessário
                        doc.addPage();
                        y = 40;
                    }
                    doc.addImage(imgData, 'PNG', 40, y, imgWidth, imgHeight);
                    y += imgHeight + 14;
                } catch (err) {
                    // se erro ao capturar imagem, ignora
                }
            }
        }

        // Adicionar Notas Recentes (tabela)
        const rows = [];
        const table = document.getElementById('recentGradesForReport');
        if (table) {
            const trs = table.querySelectorAll('tbody tr');
            for (const tr of trs) {
                const cols = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
                if (cols.length) rows.push(cols);
            }
        }

        if (rows.length) {
            if (y + 120 > 820) { doc.addPage(); y = 40; }
            doc.setFontSize(13);
            doc.text('Notas Recentes', 40, y); y += 18;
            doc.setFontSize(10);
            // cabeçalho da tabela
            const startX = 40;
            const colWidths = [200, 140, 60, 80];
            let x = startX;
            const header = ['Disciplina','Avaliação','Nota','Data'];
            for (let i=0;i<header.length;i++){
                doc.text(header[i], x + 2, y);
                x += colWidths[i];
            }
            y += 12;
            doc.setDrawColor(200);
            // linhas
            for (const r of rows) {
                x = startX;
                for (let i=0;i<r.length;i++){
                    doc.text(String(r[i]), x + 2, y);
                    x += colWidths[i];
                }
                y += 14;
                if (y > 780) { doc.addPage(); y = 40; }
            }
            y += 8;
        }

        // Rodapé / Observações
        if (y + 40 > 820) { doc.addPage(); y = 40; }
        doc.setFontSize(9);
        doc.text('Relatório gerado automaticamente pelo Sistema de Ranking Acadêmico.', 40, 820);

        // Salvar arquivo
        const safeName = name.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_\-]/g,'');
        doc.save(`${safeName}_relatorio.pdf`);
    } catch (err) {
        console.error('Erro ao gerar relatório:', err);
        alert('Ocorreu um erro ao gerar o relatório. Verifique o console para detalhes.');
    }
}

// utilitário para obter dimensões da imagem (DataURL)
function _getImageProps(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = dataUrl;
    });
}

// --- Helpers para gerar PDF iguais ao areaprofessor (PDF-Lib + charts offscreen) ---
async function ensurePDFLib(timeout = 8000) {
    return new Promise((resolve, reject) => {
        if (window.PDFLib) return resolve(window.PDFLib);
        const existing = document.querySelector('script[data-pdf-lib-cdn]');
        if (existing) {
            existing.addEventListener('load', () => resolve(window.PDFLib));
            existing.addEventListener('error', () => reject(new Error('Falha ao carregar PDF-Lib')));
            return;
        }
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/pdf-lib/dist/pdf-lib.min.js';
        s.async = true;
        s.setAttribute('data-pdf-lib-cdn', '1');
        s.onload = () => resolve(window.PDFLib);
        s.onerror = () => reject(new Error('Falha ao carregar PDF-Lib'));
        document.head.appendChild(s);
        setTimeout(() => {
            if (window.PDFLib) return resolve(window.PDFLib);
            reject(new Error('Timeout carregando PDF-Lib'));
        }, timeout);
    });
}

async function _embedImageFromUrl(pdfDoc, url) {
    if (!url) return null;
    try {
        if (typeof url === 'string' && url.startsWith('data:')) {
            const comma = url.indexOf(',');
            const meta = url.substring(5, comma);
            const isJpg = meta.includes('jpeg') || meta.includes('jpg');
            const base64 = url.substring(comma + 1);
            const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            return isJpg ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes);
        }
        const res = await fetch(url);
        if (!res.ok) return null;
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        const arrayBuffer = await res.arrayBuffer();
        if (contentType.includes('jpeg') || contentType.includes('jpg')) {
            return await pdfDoc.embedJpg(arrayBuffer);
        } else {
            return await pdfDoc.embedPng(arrayBuffer);
        }
    } catch (err) {
        console.warn('Falha ao embutir imagem para PDF:', err);
        return null;
    }
}

function _wrapText(text, maxChars = 95) {
    if (!text) return [];
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
        if ((line + ' ' + w).trim().length <= maxChars) {
            line = (line + ' ' + w).trim();
        } else {
            if (line) lines.push(line);
            line = w;
        }
    }
    if (line) lines.push(line);
    return lines;
}

// cria canvases offscreen com Chart.js: pizza (com percentuais) e barra Jan-Dez
async function _createStudentChartImages(student) {
    if (typeof Chart === 'undefined') return { pie: null, rank: null };

    const makeCanvas = (w = 900, h = 360) => {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.style.display = 'none';
        document.body.appendChild(c);
        return c;
    };

    // preparar dados
    const avg = Number(student.averageGrade ?? student.grade ?? 7.5);
    const gradePerc = Math.round((avg / 10) * 100);
    const attendancePerc = Number(student.attendance ?? 0);
    const activitiesPerc = Number(student.projectsCompleted ? Math.min(100, student.projectsCompleted * 10) : (student.assignments ?? 0));
    const participationPerc = Number(student.participation ?? 0);

    // Pie com plugin simples de percentuais
    const pieCanvas = makeCanvas(700, 380);
    const pieCtx = pieCanvas.getContext('2d');
    const pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: ['CRA (%)', 'Frequência (%)', 'Atividades (%)', 'Participação (%)'],
            datasets: [{
                data: [gradePerc, attendancePerc, activitiesPerc, participationPerc],
                backgroundColor: ['#F4442E', '#020122', '#FFB4A6', '#FFA94D'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: false,
            plugins: { legend: { position: 'bottom' } }
        },
        plugins: [{
            id: 'piePercentQuick',
            afterDatasetsDraw(chart) {
                const ctx = chart.ctx;
                chart.data.datasets.forEach((dataset, di) => {
                    const meta = chart.getDatasetMeta(di);
                    const total = dataset.data.reduce((a,b)=>a+(Number(b)||0),0);
                    meta.data.forEach((arc, i) => {
                        const val = Number(dataset.data[i]) || 0;
                        const percent = total ? Math.round((val/total)*100) : 0;
                        const pos = arc.tooltipPosition();
                        ctx.save();
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 12px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.lineWidth = 3;
                        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
                        ctx.strokeText(`${percent}%`, pos.x, pos.y);
                        ctx.fillText(`${percent}%`, pos.x, pos.y);
                        ctx.restore();
                    });
                });
            }
        }]
    });

    // Rank Jan-Dez (12 meses)
    const monthsCount = 12;
    let rankData = student.rankingHistory ? [...student.rankingHistory] : null;
    if (!rankData) {
        const base = student.positionInCourse || student.ranking || Math.max(2, Math.round(Math.random()*10));
        rankData = Array.from({length: monthsCount}, (_,i) => {
            const variation = Math.round((Math.random()-0.5)*2);
            return Math.max(1, base + variation + Math.round((i - monthsCount/2) * 0.1));
        });
    } else {
        if (rankData.length > monthsCount) rankData = rankData.slice(-monthsCount);
        while (rankData.length < monthsCount) rankData.unshift(rankData[0] || Math.round(Math.random()*10));
    }
    const monthLabels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const rankCanvas = makeCanvas(900, 360);
    const rankCtx = rankCanvas.getContext('2d');
    const totalInCourse = student._totalInCourse || student.totalInCourse || 10;
    const rankChart = new Chart(rankCtx, {
        type: 'bar',
        data: { labels: monthLabels, datasets: [{ label: 'Posição', data: rankData, backgroundColor: '#020122' }] },
        options: {
            responsive: false,
            scales: {
                y: { beginAtZero: true, suggestedMax: Number(totalInCourse)+1, ticks: { stepSize: 1 } },
                x: { ticks: { autoSkip: false } }
            },
            plugins: { legend: { display: false } }
        }
    });

    await new Promise(r => setTimeout(r, 200));
    const pieDataUrl = pieCanvas.toDataURL('image/png');
    const rankDataUrl = rankCanvas.toDataURL('image/png');

    try { pieChart.destroy(); rankChart.destroy(); } catch (e) {}
    pieCanvas.remove(); rankCanvas.remove();

    return { pie: pieDataUrl, rank: rankDataUrl };
}

// Gera PDF do próprio aluno (mesmo template do areaprofessor)
async function generateStudentReport() {
    try {
        await ensurePDFLib();
    } catch (err) {
        console.error('PDF-Lib não carregado:', err);
        alert('Biblioteca PDF-Lib não carregada. Recarregue a página.');
        return;
    }

    showLoading && showLoading('pageContent'); // Exibe carregamento

    try {
        // Montar objeto student a partir da UI
        const name = document.getElementById('reportName')?.textContent.trim() || 'Aluno';
        const email = document.getElementById('reportEmail')?.textContent.trim() || '';
        const course = document.getElementById('reportCourse')?.textContent.trim() || '';
        const obs = document.getElementById('reportObservations')?.value || '';
        const avatarSrc = document.getElementById('reportAvatarPreview')?.src || '';

        const student = {
            name, email, course,
            averageGrade: parseFloat(document.querySelector('.stat-card h3')?.textContent) || undefined,
            attendance: parseFloat(document.querySelector('.stat-card:nth-child(2) h3')?.textContent) || undefined,
            observations: obs,
            avatar: avatarSrc
        };

        const chartsImages = await _createStudentChartImages(student);

        const { PDFDocument, StandardFonts, rgb } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const page = pdfDoc.addPage([595, 842]);
        const { width, height } = page.getSize();
        const topY = height - 40;

        page.drawText('RELATÓRIO DE DESEMPENHO PESSOAL - Ranking+', { x: 40, y: topY, size: 16, font: helveticaBold, color: rgb(0.02,0.01,0.38) });
        page.drawText(`Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, { x: 40, y: topY - 18, size: 10, font: helvetica, color: rgb(0.35,0.35,0.35) });

        // Avatar (direita)
        const avatarImage = await _embedImageFromUrl(pdfDoc, student.avatar);
        if (avatarImage) {
            const avW = 64, avH = 64;
            page.drawImage(avatarImage, { x: width - 40 - avW, y: topY - avH + 8, width: avW, height: avH });
        }

        // Infos
        const infoX = 40;
        page.drawText(`Nome: ${student.name}`, { x: infoX, y: topY - 40, size: 12, font: helveticaBold });
        page.drawText(`Curso/Semestre: ${student.course}`, { x: infoX, y: topY - 60, size: 10, font: helvetica });
        page.drawText(`Email: ${student.email}`, { x: infoX, y: topY - 80, size: 10, font: helvetica });

        let cursorY = topY - 96;
        page.drawText('1. Destaques de Desempenho', { x: 40, y: cursorY, size: 12, font: helveticaBold });
        cursorY -= 18;
        page.drawText(`CRA (Média Geral): ${student.averageGrade ?? '—'}`, { x: 48, y: cursorY, size: 11, font: helvetica });
        cursorY -= 16;
        page.drawText(`Frequência Geral: ${student.attendance ?? '—'}%`, { x: 48, y: cursorY, size: 11, font: helvetica });
        cursorY -= 24;

        page.drawText('2. Jornada de Evolução (Gráficos)', { x: 40, y: cursorY, size: 12, font: helveticaBold });
        cursorY -= 18;

        if (chartsImages.pie) {
            const imgPie = await pdfDoc.embedPng(chartsImages.pie);
            const imgW = Math.min(300, imgPie.width);
            const imgH = (imgPie.height / imgPie.width) * imgW;
            page.drawImage(imgPie, { x: 20, y: cursorY - imgH, width: imgW, height: imgH });
        }
        if (chartsImages.rank) {
            const imgRank = await pdfDoc.embedPng(chartsImages.rank);
            const imgW2 = Math.min(500, imgRank.width);
            const imgH2 = (imgRank.height / imgRank.width) * imgW2;
            page.drawImage(imgRank, { x: 40, y: cursorY - 380 , width: imgW2, height: imgH2 });
            cursorY -= imgH2 + 20; // Move o cursor para baixo após desenhar o gráfico
        }
        cursorY -= 196;

        // Observações
        if (student.observations) {
            cursorY -= 8;
            page.drawText('Observações:', { x: 40, y: cursorY, size: 11, font: helveticaBold });
            cursorY -= 14;
            const obsLines = _wrapText(student.observations, 95);
            obsLines.forEach(ln => {
                page.drawText(ln, { x: 48, y: cursorY, size: 10, font: helvetica });
                cursorY -= 12;
            });
        }

        page.drawText('Ranking+ — Relatório Gerado Automaticamente', { x: 40, y: 20, size: 9, font: helvetica, color: rgb(0.4,0.4,0.4) });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${student.name.replace(/\s+/g,'_')}_relatorio.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Erro ao gerar relatório (PDF-Lib):', err);
        alert('Erro ao gerar relatório. Veja console.');
    } finally {
        hideLoading && hideLoading(); // Oculta carregamento
    }
}

// --- Binding dos botões da aba Relatórios (inicializar ao carregar) ---
document.addEventListener('DOMContentLoaded', () => {
    // se a aba Relatórios/render foi adicionada, inicializar previews e bindings
    const genBtn = document.getElementById('generateReportBtn');
    if (genBtn) genBtn.addEventListener('click', (e) => { e.preventDefault(); generateStudentReport(); });

    const exportBtn = document.getElementById('exportMyExcel');
    if (exportBtn) exportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // export simples: criar CSV com dados visíveis (pode ser adaptado para xlsx)
        const name = document.getElementById('reportName')?.textContent.trim() || '';
        const email = document.getElementById('reportEmail')?.textContent.trim() || '';
        const course = document.getElementById('reportCourse')?.textContent.trim() || '';
        const rows = [
            ['Nome','Curso/Semestre','Email','CRA','Frequência'],
            [name, course, email, document.querySelector('.stat-card h3')?.textContent || '', document.querySelector('.stat-card:nth-child(2) h3')?.textContent || '']
        ];
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name.replace(/\s+/g,'_')}_dados.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });

    // inicializar previews (desenhar charts dentro da aba)
    try {
        const previewStudent = {
            name: document.getElementById('reportName')?.textContent.trim(),
            email: document.getElementById('reportEmail')?.textContent.trim(),
            course: document.getElementById('reportCourse')?.textContent.trim(),
            averageGrade: parseFloat(document.querySelector('.stat-card h3')?.textContent) || 7.5,
            attendance: parseFloat(document.querySelector('.stat-card:nth-child(2) h3')?.textContent) || 90,
            avatar: document.getElementById('reportAvatarPreview')?.src || ''
        };
        // draw preview charts (non-blocking)
        _createStudentChartImages(previewStudent).then(imgs => {
            // render small previews into canvases by creating image elements
            if (imgs.pie) {
                const ctx = document.getElementById('reportPiePreview')?.getContext?.('2d');
                if (ctx) {
                    const img = new Image();
                    img.onload = () => { ctx.clearRect(0,0,480,220); ctx.drawImage(img,0,0,480,220); };
                    img.src = imgs.pie;
                }
            }
            if (imgs.rank) {
                const ctx2 = document.getElementById('reportRankPreview')?.getContext?.('2d');
                if (ctx2) {
                    const img2 = new Image();
                    img2.onload = () => { ctx2.clearRect(0,0,480,220); ctx2.drawImage(img2,0,0,480,220); };
                    img2.src = imgs.rank;
                }
            }
        }).catch(e => console.warn('Preview charts falharam:', e));
    } catch (e) { /* ignore preview errors */ }
});

