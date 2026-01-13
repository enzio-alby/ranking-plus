// --- ABA RELATÓRIOS: Funções e dados isolados ---
const reportsStudentsData = [
    {
        id: 1,
        name: "Ana Silva",
        email: "ana.silva@uni.edu",
        course: "Ciência da Computação",
        semester: 3,
        score: 950,
        attendance: 95,
        averageGrade: 9.2,
        projectsCompleted: 8,
        status: "Ativo",
        avatar: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop&crop=face",
        strongSubjects: ["Algoritmos", "Estruturas de Dados", "Programação Web"],
        weakSubjects: ["Matemática Discreta", "Física"],
        projects: [
            { name: "Sistema de Gestão Acadêmica", description: "Desenvolvimento de plataforma web para gestão de alunos e professores" },
            { name: "App Mobile de Estudos", description: "Aplicativo mobile para organização de estudos e cronogramas" },
            { name: "API REST para E-commerce", description: "Backend completo para sistema de vendas online" }
        ]
    },
    // ...demais alunos conforme fornecido...
    {
        id: 8,
        name: "Rafael Souza",
        email: "rafael.souza@uni.edu",
        course: "Ciência da Computação",
        semester: 2,
        score: 780,
        attendance: 82,
        averageGrade: 7.8,
        projectsCompleted: 3,
        status: "Trancado",
        avatar: "https://images.pexels.com/photos/3184295/pexels-photo-3184295.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop&crop=face",
        strongSubjects: ["Programação Básica", "Lógica"],
        weakSubjects: ["Cálculo", "Física", "Estatística"],
        projects: [
            { name: "Calculadora Científica", description: "Aplicação desktop para cálculos avançados" }
        ]
    }
];

let reportsFilteredData = [...reportsStudentsData];
let reportsSelectedStudents = new Set();

function activateReportsTabFeatures() {
    setupReportsEventListeners();
    renderReportsTable();
    updateReportsStats();
    initializeReportsRangeSliders();
}

function setupReportsEventListeners() {
    const search = document.getElementById('searchName');
    if (search) search.addEventListener('input', applyReportsFilters);

    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) clearBtn.addEventListener('click', clearReportsAllFilters);

    const checkboxGroups = ['courseFilters', 'semesterFilters', 'statusFilters'];
    checkboxGroups.forEach(groupId => {
        const group = document.getElementById(groupId);
        if (!group) return;
        const checkboxes = group.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.addEventListener('change', applyReportsFilters));
    });

    const rangeInputs = document.querySelectorAll('.range-input');
    rangeInputs.forEach(input => input.addEventListener('input', handleReportsRangeChange));

    const exportBtn = document.getElementById('exportExcel') || document.querySelector('.export-reports-excel');
    if (exportBtn) exportBtn.addEventListener('click', exportReportsToExcel);

    // Binding do botão gerar PDF - tentativa direta e fallback por delegação
    const genBtn = document.getElementById('generatePDF') || document.querySelector('.generate-reports-btn');
    if (genBtn) {
        genBtn.addEventListener('click', (e) => {
            e.preventDefault();
            generateReportsPDF();
        });
    } else {
        // delegação: funciona mesmo que o botão seja inserido dinamicamente depois
        document.body.addEventListener('click', (e) => {
            const target = e.target;
            if (target.closest && (target.closest('#generatePDF') || target.closest('.generate-reports-btn'))) {
                e.preventDefault();
                generateReportsPDF();
            }
        }, { once: false });
    }

    const selectAll = document.getElementById('selectAll');
    if (selectAll) selectAll.addEventListener('change', handleReportsSelectAll);
}

function initializeReportsRangeSliders() {
    updateReportsRangeDisplay('score', 0, 1000);
    updateReportsRangeDisplay('attendance', 0, 100);
}

function handleReportsRangeChange(e) {
    const id = e.target.id;
    if (id.includes('score')) {
        const minValue = parseInt(document.getElementById('scoreRangeMin').value);
        const maxValue = parseInt(document.getElementById('scoreRangeMax').value);
        if (id === 'scoreRangeMin' && minValue > maxValue) {
            document.getElementById('scoreRangeMax').value = minValue;
        }
        if (id === 'scoreRangeMax' && maxValue < minValue) {
            document.getElementById('scoreRangeMin').value = maxValue;
        }
        updateReportsRangeDisplay('score', 
            parseInt(document.getElementById('scoreRangeMin').value),
            parseInt(document.getElementById('scoreRangeMax').value)
        );
    }
    if (id.includes('attendance')) {
        const minValue = parseInt(document.getElementById('attendanceRangeMin').value);
        const maxValue = parseInt(document.getElementById('attendanceRangeMax').value);
        if (id === 'attendanceRangeMin' && minValue > maxValue) {
            document.getElementById('attendanceRangeMax').value = minValue;
        }
        if (id === 'attendanceRangeMax' && maxValue < minValue) {
            document.getElementById('attendanceRangeMin').value = maxValue;
        }
        updateReportsRangeDisplay('attendance', 
            parseInt(document.getElementById('attendanceRangeMin').value),
            parseInt(document.getElementById('attendanceRangeMax').value)
        );
    }
    applyReportsFilters();
}

function updateReportsRangeDisplay(type, min, max) {
    if (type === 'score') {
        document.getElementById('scoreMin').textContent = min;
        document.getElementById('scoreMax').textContent = max;
    } else if (type === 'attendance') {
        document.getElementById('attendanceMin').textContent = min + '%';
        document.getElementById('attendanceMax').textContent = max + '%';
    }
}

function applyReportsFilters() {
    const searchName = document.getElementById('searchName').value.toLowerCase();
    const selectedCourses = Array.from(document.querySelectorAll('#courseFilters input:checked')).map(cb => cb.value);
    const selectedSemesters = Array.from(document.querySelectorAll('#semesterFilters input:checked')).map(cb => parseInt(cb.value));
    const selectedStatus = Array.from(document.querySelectorAll('#statusFilters input:checked')).map(cb => cb.value);
    const scoreMin = parseInt(document.getElementById('scoreRangeMin').value);
    const scoreMax = parseInt(document.getElementById('scoreRangeMax').value);
    const attendanceMin = parseInt(document.getElementById('attendanceRangeMin').value);
    const attendanceMax = parseInt(document.getElementById('attendanceRangeMax').value);
    reportsFilteredData = reportsStudentsData.filter(student => {
        const nameMatch = student.name.toLowerCase().includes(searchName);
        const courseMatch = selectedCourses.length === 0 || selectedCourses.includes(student.course);
        const semesterMatch = selectedSemesters.length === 0 || selectedSemesters.includes(student.semester);
        const statusMatch = selectedStatus.length === 0 || selectedStatus.includes(student.status);
        const scoreMatch = student.score >= scoreMin && student.score <= scoreMax;
        const attendanceMatch = student.attendance >= attendanceMin && student.attendance <= attendanceMax;
        return nameMatch && courseMatch && semesterMatch && statusMatch && scoreMatch && attendanceMatch;
    });
    renderReportsTable();
    updateReportsStats();
}

function clearReportsAllFilters() {
    document.getElementById('searchName').value = '';
    const allCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    allCheckboxes.forEach(cb => cb.checked = false);
    document.getElementById('scoreRangeMin').value = 0;
    document.getElementById('scoreRangeMax').value = 1000;
    document.getElementById('attendanceRangeMin').value = 0;
    document.getElementById('attendanceRangeMax').value = 100;
    updateReportsRangeDisplay('score', 0, 1000);
    updateReportsRangeDisplay('attendance', 0, 100);
    applyReportsFilters();
    showReportsToast('Filtros limpos com sucesso!', 'info');
}

function renderReportsTable() {
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = '';
    if (reportsFilteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: var(--dark-gray);">
                    <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔍</div>
                    Nenhum aluno encontrado com os filtros aplicados
                </td>
            </tr>
        `;
        return;
    }
    reportsFilteredData.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <label class="checkbox-item">
                    <input type="checkbox" value="${student.id}" onchange="handleReportsStudentSelection(${student.id}, this.checked)">
                    <span class="checkbox-custom"></span>
                </label>
            </td>
            <td>
                <div class="student-info">
                    <div class="student-avatar">
                        <img src="${student.avatar}" alt="${student.name}">
                    </div>
                    <div class="student-details">
                        <h4>${student.name}</h4>
                        <p>${student.email}</p>
                    </div>
                </div>
            </td>
            <td>${student.course}</td>
            <td>${student.semester}º</td>
            <td>
                <span class="score-badge">${student.score}</span>
            </td>
            <td>
                <div class="attendance-bar">
                    <div class="attendance-fill" style="width: ${student.attendance}%"></div>
                </div>
                <small>${student.attendance}%</small>
            </td>
            <td>
                <span class="status-badge status-${student.status.toLowerCase()}">${student.status}</span>
            </td>
            <td>
                <button class="action-btn" onclick="viewReportsStudentDetails(${student.id})" title="Ver Detalhes">
                    👁️
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateReportsStats() {
    const totalStudents = reportsStudentsData.length;
    const filteredStudents = reportsFilteredData.length;
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('filteredStudents').textContent = filteredStudents;
    document.getElementById('resultsCount').textContent = `${filteredStudents} alunos encontrados`;
}

function handleReportsSelectAll(e) {
    const isChecked = e.target.checked;
    const studentCheckboxes = document.querySelectorAll('#resultsTableBody input[type="checkbox"]');
    studentCheckboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        const studentId = parseInt(checkbox.value);
        if (isChecked) {
            reportsSelectedStudents.add(studentId);
        } else {
            reportsSelectedStudents.delete(studentId);
        }
    });
}

function handleReportsStudentSelection(studentId, isSelected) {
    if (isSelected) {
        reportsSelectedStudents.add(studentId);
    } else {
        reportsSelectedStudents.delete(studentId);
    }
    const totalCheckboxes = document.querySelectorAll('#resultsTableBody input[type="checkbox"]').length;
    const selectAllCheckbox = document.getElementById('selectAll');
    if (reportsSelectedStudents.size === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
    } else if (reportsSelectedStudents.size === totalCheckboxes) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
    } else {
        selectAllCheckbox.indeterminate = true;
    }
}

function exportReportsToExcel() {
    if (reportsFilteredData.length === 0) {
        showReportsToast('Nenhum dado para exportar!', 'error');
        return;
    }
    showReportsLoading('Gerando planilha Excel...');
    const exportData = reportsFilteredData.map(student => ({
        'ID do Aluno': student.id,
        'Nome Completo': student.name,
        'E-mail': student.email,
        'Curso': student.course,
        'Semestre': student.semester + 'º',
        'Pontuação Geral': student.score,
        'Média de Notas': student.averageGrade,
        'Frequência (%)': student.attendance + '%',
        'Número de Projetos Concluídos': student.projectsCompleted,
        'Status': student.status
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    const colWidths = [
        { wch: 12 },
        { wch: 25 },
        { wch: 30 },
        { wch: 25 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 12 }
    ];
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório de Alunos');
    const fileName = `relatorio_alunos_${new Date().toISOString().split('T')[0]}.xlsx`;
    setTimeout(() => {
        XLSX.writeFile(wb, fileName);
        hideReportsLoading();
        showReportsToast(`Planilha "${fileName}" exportada com sucesso!`, 'success');
    }, 1500);
}

// Substitui generateReportsPDF e _createStudentChartImages para ajustar layout, usar pie chart e corrigir orientação do bar chart
async function generateReportsPDF() {
    const studentsToExport = reportsSelectedStudents.size > 0
        ? reportsFilteredData.filter(student => reportsSelectedStudents.has(student.id))
        : reportsFilteredData;

    if (studentsToExport.length === 0) {
        showReportsToast('Selecione pelo menos um aluno ou aplique filtros!', 'error');
        return;
    }

    showReportsLoading(`Gerando ${studentsToExport.length} relatório(s) em PDF...`);

    try {
        const { PDFDocument, StandardFonts, rgb } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        for (let i = 0; i < studentsToExport.length; i++) {
            const student = studentsToExport[i];

            // gerar imagens dos charts no cliente (offscreen canvases)
            const chartsImages = await _createStudentChartImages(student);

            // nova página A4
            const page = pdfDoc.addPage([595, 842]);
            const { width, height } = page.getSize();
            const topY = height - 40;

            // TÍTULO E DATA (esquerda)
            page.drawText('RELATÓRIO DE DESEMPENHO - Ranking+', {
                x: 40, y: topY, size: 16, font: helveticaBold, color: rgb(0.02, 0.01, 0.38)
            });
            page.drawText(`Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, {
                x: 40, y: topY - 18, size: 10, font: helvetica, color: rgb(0.35, 0.35, 0.35)
            });

            // AVATAR e INFORMAÇÕES DO ALUNO abaixo do título, alinhado à esquerda
            const avW = 40;
            const avH = 40;
            const avX = 40; // margem esquerda
            const avY = topY - 42 - avH; // posiciona abaixo do título/data

            const avatarImage = await _embedImageFromUrl(pdfDoc, student.avatar);
            if (avatarImage) {
                page.drawImage(avatarImage, { x: avX, y: avY, width: avW, height: avH });
            }

            // Área de texto do aluno (à direita do avatar)
            const infoX = avX + avW + 8; // espaço entre avatar e bloco de info
            const infoY = topY - 55; // alinhar próximo ao título/data
            page.drawText(`Nome: ${student.name || '—'}`, { x: infoX, y: infoY, size: 12, font: helveticaBold });
            page.drawText(`Curso/Semestre: ${student.course || '—'} / ${student.semester || '—'}`, { x: infoX, y: infoY - 14, size: 10, font: helvetica });
            page.drawText(`Email: ${student.email || '—'}`, { x: infoX, y: infoY - 28, size: 10, font: helvetica });

            // cursor para conteúdo abaixo do cabeçalho (abaixo do avatar)
            let cursorY = avY - 24;

            // 1. Destaques de Desempenho
            page.drawText('1. Destaques de Desempenho', { x: 40, y: cursorY, size: 12, font: helveticaBold });
            cursorY -= 18;

            const boxW = (width - 2 * 40 - 10) / 2;
            const drawBox = (x, y, w, h, label, value) => {
                page.drawRectangle({ x, y: y - h, width: w, height: h, color: rgb(0.97, 0.97, 0.98) });
                page.drawText(label, { x: x + 8, y: y - 18, size: 9, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
                page.drawText(value, { x: x + 8, y: y - 34, size: 12, font: helveticaBold, color: rgb(0.02, 0.01, 0.38) });
            };

            const totalInCourse = student._totalInCourse || student.totalInCourse || reportsStudentsData.filter(s => s.course === student.course).length || '—';
            drawBox(40, cursorY, boxW, 48, 'Ranking (Curso)', `#${student.positionInCourse || student.ranking || '—'} / ${totalInCourse}`);
            drawBox(40 + boxW + 10, cursorY, boxW, 48, 'Ranking (Geral)', `#${student.positionOverall || student.rankingOverall || '—'} / ${student.totalOverall || '—'}`);
            cursorY -= 56;
            drawBox(40, cursorY, boxW, 48, 'CRA (Média Geral)', `${student.averageGrade ?? student.grade ?? '—'}`);
            drawBox(40 + boxW + 10, cursorY, boxW, 48, 'Pontuação Total', `${student.score ?? '—'}`);
            cursorY -= 64;
            page.drawRectangle({ x: 40, y: cursorY - 48, width: width - 80, height: 48, color: rgb(0.97, 0.97, 0.98) });
            page.drawText('Frequência Geral', { x: 48, y: cursorY - 22, size: 9, font: helvetica });
            page.drawText(`${student.attendance ?? '—'}%`, { x: 48, y: cursorY - 38, size: 12, font: helveticaBold, color: rgb(0.02, 0.01, 0.38) });
            cursorY -= 72;

            // 2. Jornada de Evolução (gráficos)
            page.drawText('2. Gráfico de Evolução', { x: 40, y: cursorY, size: 12, font: helveticaBold });
            cursorY -= 18;

            // inserir imagens dos charts gerados (limitar tamanho)
            const leftChartX = 40;
            const rightChartX = 40 + 260;
            if (chartsImages.pie) {
                const imgPie = await pdfDoc.embedPng(chartsImages.pie);
                const imgW = Math.min(260, imgPie.width);
                const imgH = (imgPie.height / imgPie.width) * imgW;
                page.drawImage(imgPie, { x: leftChartX, y: cursorY - imgH, width: imgW, height: imgH });
            }
            if (chartsImages.rank) {
                const imgRank = await pdfDoc.embedPng(chartsImages.rank);
                const imgW2 = Math.min(260, imgRank.width);
                const imgH2 = (imgRank.height / imgRank.width) * imgW2;
                page.drawImage(imgRank, { x: rightChartX, y: cursorY - imgH2, width: imgW2, height: imgH2 });
            }
            cursorY -= 180;

            // PONTOS FORTES e Habilidades
            page.drawText('Habilidades Comportamentais:', { x: 40, y: cursorY, size: 12, font: helveticaBold });
            cursorY -= 16;

            const bulletStartX = 48;
            const liSize = 10;
            const skills = (student.strongSubjects || []).slice(0, 6);
            const behaviors = (student.behavioralSkills || []).slice(0, 6);
            let lineY = cursorY;
            skills.forEach(s => {
                page.drawText(`• ${s} (validada por Projeto)`, { x: bulletStartX, y: lineY, size: liSize, font: helvetica });
                lineY -= 14;
            });
            behaviors.forEach(b => {
                page.drawText(`• ${b} (validada por Badge)`, { x: bulletStartX, y: lineY, size: liSize, font: helvetica });
                lineY -= 14;
            });

            // Observações simples (se houver)
            const obs = student.observations || student.notes || '';
            if (obs) {
                lineY -= 8;
                page.drawText('Observações:', { x: 40, y: lineY, size: 11, font: helveticaBold });
                lineY -= 14;
                const obsLines = _wrapText(obs, 95);
                obsLines.forEach(ln => {
                    page.drawText(ln, { x: 48, y: lineY, size: 10, font: helvetica });
                    lineY -= 12;
                });
            }

            // footer
            page.drawText('Ranking+ — Relatório Gerado Automaticamente', { x: 40, y: 20, size: 9, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
        }

        // Finalizar e baixar
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorios_alunos_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        hideReportsLoading();
        showReportsToast('Relatório(s) PDF gerado(s) com sucesso!', 'success');
    } catch (err) {
        console.error('Erro ao gerar PDF (PDF-Lib):', err);
        hideReportsLoading();
        showReportsToast('Falha ao gerar PDF no cliente', 'error');
    }
}

/*
  Helpers e guard-rails adicionados para geração de PDF (PDF-Lib + imagens de Chart.js)
  - ensurePDFLib(): injeta/aguarda PDF-Lib caso não esteja presente
  - _embedImageFromUrl(): embebe imagem (jpg/png / dataURL) no pdfDoc
  - _wrapText(): quebra linhas para desenho no PDF
  - _safeCreateChartImages(): cria imagens só se Chart.js estiver presente; caso contrário retorna nulls
*/

function ensurePDFLib(timeout = 8000) {
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
        // suporta data: URLs
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

/* Safe chart image creator: se Chart.js não estiver disponível, retorna placeholders (null)
   para que o PDF continue sendo gerado sem quebrar a página inteira. */
async function _safeCreateStudentChartImages(student) {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js não disponível — gerando PDF sem gráficos.');
        return { pie: null, rank: null };
    }
    // delegar para a função existente que cria os canvases
    return _createStudentChartImages ? await _createStudentChartImages(student) : { pie: null, rank: null };
}

// helper: gera canvases offscreen com Chart.js e retorna dataURLs (PNG)
// agora cria pie (composição) + rank bar (corrigida orientação)
async function _createStudentChartImages(student) {
    const makeCanvas = (w = 800, h = 400) => {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.style.display = 'none';
        document.body.appendChild(c);
        return c;
    };

    // preparar dados para pie: normalize alguns indicadores em percentuais
    const avg = Number(student.averageGrade ?? student.grade ?? 7.5);
    const gradePerc = Math.round((avg / 10) * 100);
    const attendancePerc = Number(student.attendance ?? 0);
    const activitiesPerc = Number(student.projectsCompleted ? Math.min(100, student.projectsCompleted * 10) : (student.assignments ?? 0));
    const participationPerc = Number(student.participation ?? 0);

    const pieCanvas = makeCanvas(800, 400);
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
        }
    });

    // Rank chart (vertical bar, y not reversed)
    const months = student.rankingHistory ? student.rankingHistory.length : 6;
    const rankData = student.rankingHistory || Array.from({length: months}, (_,i) => {
        const base = student.positionInCourse || student.ranking || Math.max(2, Math.round(Math.random()*10));
        const variation = Math.round((Math.random()-0.5)*2);
        return Math.max(1, base + variation);
    });
    const rankCanvas = makeCanvas(800, 400);
    const rankCtx = rankCanvas.getContext('2d');
    const totalInCourse = student._totalInCourse || student.totalInCourse || reportsStudentsData.filter(s => s.course === student.course).length || 10;
    const rankLabels = Array.from({length: rankData.length}, (_,i) => {
        const d = new Date(); d.setMonth(d.getMonth() - (rankData.length - 1 - i));
        return d.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
    });
    const rankChart = new Chart(rankCtx, {
        type: 'bar',
        data: {
            labels: rankLabels,
            datasets: [{
                label: 'Posição (menor = melhor)',
                data: rankData,
                backgroundColor: '#020122'
            }]
        },
        options: {
            responsive: false,
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: Number(totalInCourse) + 1,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: { legend: { display: false } }
        }
    });

    // dar tempo para desenhar
    await new Promise(r => setTimeout(r, 200));

    const pieDataUrl = pieCanvas.toDataURL('image/png');
    const rankDataUrl = rankCanvas.toDataURL('image/png');

    // cleanup
    try { pieChart.destroy(); rankChart.destroy(); } catch(e) {}
    pieCanvas.remove(); rankCanvas.remove();

    return { pie: pieDataUrl, rank: rankDataUrl };
}

function viewReportsStudentDetails(studentId) {
    const student = reportsStudentsData.find(s => s.id === studentId);
    if (!student) return;
    showReportsToast(`Visualizando detalhes de ${student.name}`, 'info');
}

function showReportsLoading(message = 'Carregando...') {
    const overlay = document.getElementById('loadingOverlay');
    const text = overlay.querySelector('.loading-text');
    text.textContent = message;
    overlay.style.display = 'flex';
}

function hideReportsLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'none';
}

function showReportsToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.2rem;">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span>${message}</span>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }, 4000);
}

// Ativar recursos da aba Relatórios ao mostrar a tab
document.addEventListener('DOMContentLoaded', function() {
    const reportsTab = document.getElementById('reports-tab');
    if (reportsTab && reportsTab.classList.contains('active')) {
        activateReportsTabFeatures();
    }
    // Se trocar de aba, ativa recursos novamente
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            setTimeout(() => {
                if (reportsTab && reportsTab.classList.contains('active')) {
                    activateReportsTabFeatures();
                }
            }, 200);
        });
    });
});
// Definir funções globais primeiro
window.showTab = function(tabName) {
    // Esconder todas as tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar tab selecionada
    const activeTab = document.getElementById(tabName + '-tab');
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Atualizar navegação
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    const activeNavLink = document.querySelector(`.sidebar .nav-link[onclick*="'${tabName}'"]`);
    if (activeNavLink) {
        activeNavLink.classList.add('active');
    }
    
    // Recarregar gráficos se necessário
    if (tabName === 'dashboard') {
        setTimeout(() => {
            initializeCharts();
        }, 100);
    }
};

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('show');
    if (window.innerWidth <= 768) {
        if (sidebar.classList.contains('show')) {
            mainContent.style.marginLeft = '250px';
        } else {
            mainContent.style.marginLeft = '0';
        }
    }
};

// Dados dos estudantes e turmas
const studentsData = {
    1: [ // Algoritmos e Estruturas de Dados
        {
            id: 1,
            name: 'Ana Silva',
            email: 'ana.silva@uni.edu',
            course: 'Ciência da Computação',
            attendance: 95,
            grade: 9.2,
            assignments: 88,
            participation: 92,
            ranking: 1,
            avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
        },
        {
            id: 2,
            name: 'Carlos Santos',
            email: 'carlos.santos@uni.edu',
            course: 'Engenharia de Software',
            attendance: 87,
            grade: 8.5,
            assignments: 82,
            participation: 85,
            ranking: 2,
            avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
        },
        {
            id: 3,
            name: 'Maria Oliveira',
            email: 'maria.oliveira@uni.edu',
            course: 'Sistemas de Informação',
            attendance: 92,
            grade: 8.8,
            assignments: 90,
            participation: 88,
            ranking: 3,
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
        },
        {
            id: 4,
            name: 'João Costa',
            email: 'joao.costa@uni.edu',
            course: 'Ciência da Computação',
            attendance: 78,
            grade: 7.5,
            assignments: 75,
            participation: 80,
            ranking: 4,
            avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
        },
        {
            id: 5,
            name: 'Beatriz Lima',
            email: 'beatriz.lima@uni.edu',
            course: 'Sistemas de Informação',
            attendance: 85,
            grade: 8.0,
            assignments: 78,
            participation: 82,
            ranking: 5,
            avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
        }
    ],
    2: [ // Banco de Dados Avançado
        {
            id: 6,
            name: 'Pedro Lima',
            email: 'pedro.lima@uni.edu',
            course: 'Sistemas de Informação',
            attendance: 90,
            grade: 8.7,
            assignments: 85,
            participation: 87,
            ranking: 1,
            avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
        },
        {
            id: 7,
            name: 'Lucia Fernandes',
            email: 'lucia.fernandes@uni.edu',
            course: 'Engenharia de Software',
            attendance: 85,
            grade: 8.2,
            assignments: 80,
            participation: 83,
            ranking: 2,
            avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
        }
    ],
    3: [ // Engenharia de Software
        {
            id: 8,
            name: 'Rafael Santos',
            email: 'rafael.santos@uni.edu',
            course: 'Engenharia de Software',
            attendance: 93,
            grade: 9.0,
            assignments: 91,
            participation: 89,
            ranking: 1,
            avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
        }
    ]
};

const classesData = [
    {
        id: 1,
        name: 'Algoritmos e Estruturas de Dados',
        code: 'AED-2024',
        schedule: 'Seg/Qua 14:00-16:00',
        room: 'Lab 101',
        students: studentsData[1]
    },
    {
        id: 2,
        name: 'Banco de Dados Avançado',
        code: 'BDA-2024',
        schedule: 'Ter/Qui 08:00-10:00',
        room: 'Lab 203',
        students: studentsData[2]
    },
    {
        id: 3,
        name: 'Engenharia de Software',
        code: 'ES-2024',
        schedule: 'Sex 10:00-12:00',
        room: 'Sala 305',
        students: studentsData[3]
    }
];

let currentClassId = 1;
let currentStudent = null;
let charts = {};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    loadClasses();
    loadStudents(currentClassId);
    initializeCharts();
    setupEventListeners();
    
    // Troca de abas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-tab')).classList.add('active');
        });
    });

    // Troca de abas internas de configurações
    document.querySelectorAll('.config-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.config-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.config-tab-content').forEach(tc => tc.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-tab')).classList.add('active');
        });
    });

    // Exemplo de validação simples para os formulários
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Dados salvos com sucesso!');
        });
    });
});

function initializePage() {
    // Definir data atual
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('pt-BR');
    
    // Mostrar tab dashboard por padrão
    showTab('dashboard');
}

function setupEventListeners() {
    // Class selector
    const classSelector = document.getElementById('class-selector');
    if (classSelector) {
        classSelector.addEventListener('change', function(e) {
            currentClassId = parseInt(e.target.value);
            loadStudents(currentClassId);
            updateSelectedClassName();
        });
    }
}

function loadClasses() {
    const container = document.getElementById('classes-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    classesData.forEach(classItem => {
        const avgGrade = classItem.students.length > 0 
            ? (classItem.students.reduce((acc, s) => acc + s.grade, 0) / classItem.students.length).toFixed(1)
            : '0.0';
        const avgAttendance = classItem.students.length > 0
            ? Math.round(classItem.students.reduce((acc, s) => acc + s.attendance, 0) / classItem.students.length)
            : 0;
        const avgAssignments = classItem.students.length > 0
            ? Math.round(classItem.students.reduce((acc, s) => acc + s.assignments, 0) / classItem.students.length)
            : 0;
        
        const classCard = `
            <div class="col-lg-6 mb-4">
                <div class="custom-card class-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h5 class="card-title text-primary">${classItem.name}</h5>
                                <p class="text-muted mb-1">
                                    <i class="fas fa-code me-2"></i>
                                    ${classItem.code}
                                </p>
                                <p class="text-muted mb-1">
                                    <i class="fas fa-clock me-2"></i>
                                    ${classItem.schedule}
                                </p>
                                <p class="text-muted mb-0">
                                    <i class="fas fa-map-marker-alt me-2"></i>
                                    ${classItem.room}
                                </p>
                            </div>
                            <span class="badge bg-primary">${classItem.students.length} alunos</span>
                        </div>
                        
                        <div class="row text-center mb-3">
                            <div class="col-4">
                                <div class="class-stats">
                                    <div class="fw-bold text-primary">${avgGrade}</div>
                                    <small class="text-muted">Média</small>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="class-stats">
                                    <div class="fw-bold text-primary">${avgAttendance}%</div>
                                    <small class="text-muted">Presença</small>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="fw-bold text-primary">${avgAssignments}%</div>
                                <small class="text-muted">Atividades</small>
                            </div>
                        </div>

                        <button class="btn btn-outline-primary w-100" onclick="viewClassStudents(${classItem.id})">
                            <i class="fas fa-users me-2"></i>
                            Ver Alunos
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML += classCard;
    });
}

window.viewClassStudents = function(classId) {
    currentClassId = classId;
    loadStudents(classId);
    updateSelectedClassName();
    showTab('students');
};

function updateSelectedClassName() {
    const selectedClass = classesData.find(c => c.id === currentClassId);
    if (selectedClass) {
        const nameElement = document.getElementById('selected-class-name');
        const selectorElement = document.getElementById('class-selector');
        if (nameElement) nameElement.textContent = selectedClass.name;
        if (selectorElement) selectorElement.value = currentClassId;
    }
}

function loadStudents(classId) {
    const students = studentsData[classId] || [];
    
    // Carregar top 3
    loadTopStudents(students.slice(0, 3));
    
    // Carregar tabela completa
    loadStudentsTable(students);
}

function loadTopStudents(topStudents) {
    const container = document.getElementById('top-students');
    if (!container) return;
    
    container.innerHTML = '';
    
    topStudents.forEach((student, index) => {
        const performanceBadge = getPerformanceBadge(student.grade);
        const performanceText = getPerformanceText(student.grade);
        
        const studentCard = `
            <div class="col-lg-4 mb-3">
                <div class="custom-card student-card">
                    <div class="card-body text-center">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="ranking-badge ${index < 3 ? 'top-3' : ''}">
                                ${index + 1}°
                            </div>
                            <span class="badge badge-custom ${performanceBadge}">
                                ${performanceText}
                            </span>
                        </div>
                        
                        <img src="${student.avatar}" alt="${student.name}" 
                             class="rounded-circle mb-3" 
                             style="width: 80px; height: 80px; object-fit: cover;">
                        
                        <h5 class="card-title">${student.name}</h5>
                        <p class="text-muted small mb-3">${student.course}</p>
                        
                        <div class="row text-center mb-3">
                            <div class="col-6">
                                <div class="fw-bold text-primary">${student.grade}</div>
                                <small class="text-muted">Nota</small>
                            </div>
                            <div class="col-6">
                                <div class="fw-bold text-primary">${student.attendance}%</div>
                                <small class="text-muted">Presença</small>
                            </div>
                        </div>
                        
                        <button class="btn btn-outline-primary btn-sm" onclick="openEvaluationModal(${student.id})">
                            <i class="fas fa-edit me-1"></i>
                            Avaliar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML += studentCard;
    });
}

function loadStudentsTable(students) {
    const tbody = document.getElementById('students-table');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    students.forEach((student, index) => {
        const performanceBadge = getPerformanceBadge(student.grade);
        
        const row = `
            <tr>
                <td>
                    <div class="ranking-badge ${index < 3 ? 'top-3' : ''}">
                        ${index + 1}°
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${student.avatar}" alt="${student.name}" 
                             class="rounded-circle me-3" 
                             style="width: 40px; height: 40px; object-fit: cover;">
                        <div>
                            <div class="fw-semibold">${student.name}</div>
                            <small class="text-muted">${student.email}</small>
                        </div>
                    </div>
                </td>
                <td>${student.course}</td>
                <td>
                    <span class="badge badge-custom ${performanceBadge}">
                        ${student.grade}
                    </span>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="progress progress-custom me-2" style="width: 80px;">
                            <div class="progress-bar progress-bar-custom" 
                                 style="width: ${student.attendance}%"></div>
                        </div>
                        <span class="small">${student.attendance}%</span>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="progress progress-custom me-2" style="width: 80px;">
                            <div class="progress-bar progress-bar-custom" 
                                 style="width: ${student.assignments}%"></div>
                        </div>
                        <span class="small">${student.assignments}%</span>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="progress progress-custom me-2" style="width: 80px;">
                            <div class="progress-bar progress-bar-custom" 
                                 style="width: ${student.participation}%"></div>
                        </div>
                        <span class="small">${student.participation}%</span>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="progress progress-custom me-2" style="width: 80px;">
                            <div class="progress-bar progress-bar-custom" 
                                 style="width: ${student.participation}%"></div>
                        </div>
                        <span class="small">${student.participation}%</span>
                    </div>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-outline-primary btn-sm" onclick="openEvaluationModal(${student.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="viewStudent(${student.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        
        tbody.innerHTML += row;
    });
}

function getPerformanceBadge(grade) {
    if (grade >= 9) return 'badge-excellent';
    if (grade >= 8) return 'badge-good';
    if (grade >= 7) return 'badge-average';
    return 'badge-poor';
}

function getPerformanceText(grade) {
    if (grade >= 9) return 'Excelente';
    if (grade >= 8) return 'Bom';
    if (grade >= 7) return 'Regular';
    return 'Insuficiente';
}

window.openEvaluationModal = function(studentId) {
    // Encontrar o estudante
    let student = null;
    for (let classId in studentsData) {
        student = studentsData[classId].find(s => s.id === studentId);
        if (student) break;
    }
    
    if (!student) return;
    
    currentStudent = student;
    
    // Preencher modal
    const modalName = document.getElementById('modal-student-name');
    const modalName2 = document.getElementById('modal-student-name-2');
    const modalCourse = document.getElementById('modal-student-course');
    const modalAvatar = document.getElementById('modal-student-avatar');
    
    if (modalName) modalName.textContent = student.name;
    if (modalName2) modalName2.textContent = student.name;
    if (modalCourse) modalCourse.textContent = student.course;
    if (modalAvatar) {
        modalAvatar.src = student.avatar;
        modalAvatar.alt = student.name;
    }
    
    // Preencher formulário
    const gradeInput = document.getElementById('student-grade');
    const attendanceInput = document.getElementById('student-attendance');
    const assignmentsInput = document.getElementById('student-assignments');
    const participationInput = document.getElementById('student-participation');
    
    if (gradeInput) gradeInput.value = student.grade;
    if (attendanceInput) attendanceInput.value = student.attendance;
    if (assignmentsInput) assignmentsInput.value = student.assignments;
    if (participationInput) participationInput.value = student.participation;
    
    // Mostrar modal
    const modalElement = document.getElementById('evaluationModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
};

window.saveEvaluation = function() {
    if (!currentStudent) return;
    
    // Pegar valores do formulário
    const gradeInput = document.getElementById('student-grade');
    const attendanceInput = document.getElementById('student-attendance');
    const assignmentsInput = document.getElementById('student-assignments');
    const participationInput = document.getElementById('student-participation');
    const observationsInput = document.getElementById('student-observations');
    
    if (gradeInput) {
        const grade = parseFloat(gradeInput.value);
        const attendance = parseInt(attendanceInput.value);
        const assignments = parseInt(assignmentsInput.value);
        const participation = parseInt(participationInput.value);
        
        // Atualizar dados do estudante
        currentStudent.grade = grade;
        currentStudent.attendance = attendance;
        currentStudent.assignments = assignments;
        currentStudent.participation = participation;
        
        // Recarregar visualizações
        loadStudents(currentClassId);
        loadClasses();
        
        // Fechar modal
        const modalElement = document.getElementById('evaluationModal');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }
        
        // Mostrar mensagem de sucesso
        showAlert('Avaliação salva com sucesso!', 'success');
    }
};

window.viewStudent = function(studentId) {
    // Implementar visualização detalhada do estudante
    console.log('Visualizar estudante:', studentId);
};

function showAlert(message, type = 'info') {
    // Criar e mostrar alerta temporário
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-custom position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-check-circle me-2"></i>
            ${message}
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Remover após 3 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

function initializeCharts() {
    // Verificar se Chart.js está disponível
    if (typeof Chart === 'undefined') {
        console.log('Chart.js não carregado ainda');
        return;
    }
    
    // Destruir gráficos existentes
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    
    // Gráfico de Performance
    const performanceCtx = document.getElementById('performanceChart');
    if (performanceCtx) {
        const students = studentsData[currentClassId] || [];
        charts.performance = new Chart(performanceCtx, {
            type: 'bar',
            data: {
                labels: students.map(s => s.name.split(' ')[0]),
                datasets: [
                    {
                        label: 'Notas',
                        data: students.map(s => s.grade),
                        backgroundColor: 'rgba(244, 68, 46, 0.8)',
                        borderColor: '#F4442E',
                        borderWidth: 2,
                        borderRadius: 8,
                    },
                    {
                        label: 'Presença (%)',
                        data: students.map(s => s.attendance),
                        backgroundColor: 'rgba(2, 1, 34, 0.8)',
                        borderColor: '#020122',
                        borderWidth: 2,
                        borderRadius: 8,
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
                                family: 'Inter',
                                size: 12,
                                weight: '500'
                            }
                        }
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0,0,0,0.1)',
                        },
                        ticks: {
                            font: {
                                family: 'Inter',
                                size: 11
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                        },
                        ticks: {
                            font: {
                                family: 'Inter',
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Gráfico de Presença
    const attendanceCtx = document.getElementById('attendanceChart');
    if (attendanceCtx) {
        charts.attendance = new Chart(attendanceCtx, {
            type: 'doughnut',
            data: {
                labels: ['Presentes', 'Ausentes', 'Atrasados'],
                datasets: [
                    {
                        data: [85, 10, 5],
                        backgroundColor: ['#F4442E', '#020122', '#FF6B52'],
                        borderWidth: 0,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                family: 'Inter',
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Gráfico de Evolução
    const evolutionCtx = document.getElementById('evolutionChart');
    if (evolutionCtx) {
        charts.evolution = new Chart(evolutionCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [
                    {
                        label: 'Desempenho Médio da Turma',
                        data: [7.5, 7.8, 8.1, 8.3, 8.5, 8.7],
                        borderColor: '#F4442E',
                        backgroundColor: 'rgba(244, 68, 46, 0.1)',
                        tension: 0.4,
                        pointBackgroundColor: '#F4442E',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        fill: true
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
                            font: {
                                family: 'Inter',
                                size: 12,
                                weight: '500'
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        grid: {
                            color: 'rgba(0,0,0,0.1)',
                        },
                        ticks: {
                            font: {
                                family: 'Inter',
                                size: 11
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                        },
                        ticks: {
                            font: {
                                family: 'Inter',
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    }
}

// Responsividade
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        if (sidebar) sidebar.classList.remove('show');
        if (mainContent) mainContent.style.marginLeft = '250px';
    } else {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) mainContent.style.marginLeft = '0';
    }
});

// Aguardar Chart.js carregar
window.addEventListener('load', function() {
    setTimeout(() => {
        initializeCharts();
    }, 500);
});

window.confirmLogout = function(event) {
    event.preventDefault();
    if (confirm('Tem certeza que deseja sair?')) {
        window.location.href = '../html/index.html';
    }
};


