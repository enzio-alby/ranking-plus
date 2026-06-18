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

function _getExportAlunos() {
    // Usa os selecionados via checkbox; se nenhum, usa todos os filtrados
    const checked = Array.from(document.querySelectorAll('#resultsTableBody input[type="checkbox"]:checked'))
        .map(cb => parseInt(cb.value));
    if (checked.length > 0) {
        return _repFilteredData.filter(a => checked.includes(a.id));
    }
    return _repFilteredData.length ? _repFilteredData : _repAllAlunos;
}

function exportReportsToExcel() {
    const data = _getExportAlunos();
    if (!data.length) { showReportsToast('Nenhum aluno para exportar!', 'error'); return; }

    showReportsLoading('Gerando CSV...');
    const rows = [
        ['ID','Nome','Matrícula','Curso','Semestre','Menção','Frequência (%)','Atividades','Disciplinas','Situação']
    ];
    data.forEach(a => rows.push([
        a.id, a.nome, a.matricula || '', a.curso || '', a.semestre_atual || '',
        a.mencao || a.media || '', a.frequencia ?? '', a.atividades_entregues ?? '',
        a.disciplinas || '', a.situacao || ''
    ]));

    if (typeof XLSX !== 'undefined') {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [8,28,14,30,10,10,14,12,40,12].map(w => ({ wch: w }));
        XLSX.utils.book_append_sheet(wb, ws, 'Alunos');
        const fileName = `relatorio_alunos_${new Date().toISOString().split('T')[0]}.xlsx`;
        setTimeout(() => {
            XLSX.writeFile(wb, fileName);
            hideReportsLoading();
            showReportsToast(`"${fileName}" exportado!`, 'success');
        }, 500);
    } else {
        // fallback CSV puro
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `alunos_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        hideReportsLoading();
        showReportsToast('CSV exportado!', 'success');
    }
}

// ── Helpers de cálculo do boletim ──────────────────────────────────────────
function _calcMediaBoletim(boletim) {
    if (!boletim || !boletim.length) return 0;
    const soma = boletim.reduce((s, d) => s + _mencaoToNotaProf(d.mencao), 0);
    return Math.round((soma / boletim.length) * 10) / 10;
}

function _calcFreqBoletim(boletim) {
    if (!boletim || !boletim.length) return 0;
    const totalFaltas = boletim.reduce((s, d) => s + (d.faltas || 0), 0);
    return Math.max(0, Math.round(100 - (totalFaltas / boletim.length) * 2));
}

async function _gerarGraficoBase64(tipo, dados, labels, cores, titulo) {
    return new Promise(resolve => {
        if (typeof window.Chart === 'undefined') { resolve(''); return; }
        const canvas = document.createElement('canvas');
        canvas.width  = 500;
        canvas.height = 260;
        canvas.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
        document.body.appendChild(canvas);

        const config = tipo === 'doughnut'
            ? {
                type: 'doughnut',
                data: { labels, datasets: [{ data: dados, backgroundColor: cores, borderWidth: 2 }] },
                options: {
                    responsive: false, animation: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 12 } },
                        title: { display: !!titulo, text: titulo, font: { size: 12, weight: 'bold' } }
                    }
                }
            }
            : {
                type: 'bar',
                data: { labels, datasets: [{ data: dados, backgroundColor: cores, borderRadius: 5 }] },
                options: {
                    responsive: false, animation: false,
                    plugins: {
                        legend: { display: false },
                        title: { display: !!titulo, text: titulo, font: { size: 12, weight: 'bold' } }
                    },
                    scales: {
                        y: { beginAtZero: true, max: 10, ticks: { font: { size: 9 } } },
                        x: { ticks: { font: { size: 9 } } }
                    }
                }
            };

        const chart = new window.Chart(canvas.getContext('2d'), config);
        setTimeout(() => {
            const img = canvas.toDataURL('image/png');
            chart.destroy();
            canvas.remove();
            resolve(img);
        }, 350);
    });
}

async function generateReportsPDF() {
    const studentsToExport = _getExportAlunos();
    if (!studentsToExport.length) { showReportsToast('Nenhum aluno para exportar!', 'error'); return; }

    const incMetricas    = document.getElementById('pdfIncMetricas')?.checked    ?? true;
    const incGraficos    = document.getElementById('pdfIncGraficos')?.checked    ?? true;
    const incDisciplinas = document.getElementById('pdfIncDisciplinas')?.checked ?? true;
    const incPontos      = document.getElementById('pdfIncPontos')?.checked      ?? true;
    const incRanking     = document.getElementById('pdfIncRanking')?.checked     ?? true;
    const incObs         = document.getElementById('pdfIncObs')?.checked         ?? false;
    const incPerfilProf  = document.getElementById('pdfIncPerfilProf')?.checked  ?? false;
    const obsGeral       = incObs ? (document.getElementById('pdfObsTexto')?.value || '') : '';
    const profNome       = document.getElementById('dashProfName')?.textContent  || 'Professor';

    showReportsLoading(`Gerando ${studentsToExport.length} relatório(s) em PDF...`);

    try {
        const dataEmissao = new Date().toLocaleDateString('pt-BR');

        // Garante dados de ranking — busca se ainda não carregado
        let rankingBase = _repRankingData;
        if (!rankingBase.length) {
            try {
                const rr = await fetch(`${PROF_API}/ranking/detalhado`);
                const rd = await rr.json();
                rankingBase = rd.alunos || [];
            } catch(_) {}
        }
        const totalAlunos = rankingBase.length || studentsToExport.length;
        const rankMap     = {};
        rankingBase.forEach((a, i) => { rankMap[a.id] = i + 1; });

        const paginas = [];
        const perfis  = []; // perfil profissional por aluno (null se não solicitado)

        for (const aluno of studentsToExport) {

            // ── Busca boletim detalhado do aluno para dados reais ──────────
            let boletim = [];
            try {
                const rb = await fetch(`${PROF_API}/alunos/${aluno.id}/boletim-detalhado`);
                if (rb.ok) boletim = await rb.json();
            } catch(_) {}

            // ── Busca perfil profissional (se checkbox marcado) ────────────
            let perfil = null;
            if (incPerfilProf) {
                try {
                    const rp = await fetch(`${PROF_API}/alunos/${aluno.id}/perfil-profissional`);
                    if (rp.ok) perfil = await rp.json();
                } catch(_) {}
            }
            perfis.push(perfil);

            // ── Calcula métricas a partir dos dados reais ─────────────────
            // media: usa campo "media" (endpoint /alunos), ou "mencao" (endpoint /discId/alunos), ou calcula do boletim
            const mediaNum = (typeof aluno.media === 'number' || (aluno.media !== undefined && aluno.media !== null))
                ? parseFloat(aluno.media)
                : (aluno.mencao ? _mencaoToNotaProf(aluno.mencao) : _calcMediaBoletim(boletim));

            // frequencia: usa campo direto da API ou calcula do boletim
            const freq     = Number(aluno.frequencia ?? _calcFreqBoletim(boletim) ?? 0);

            // faltas e atividades: soma do boletim (mais preciso)
            const totalFaltas = boletim.length
                ? boletim.reduce((s, d) => s + (d.faltas || 0), 0)
                : Number(aluno.faltas ?? 0);
            const totalAtiv = boletim.length
                ? boletim.reduce((s, d) => s + (d.atividades_entregues || 0), 0)
                : Number(aluno.atividades_entregues ?? 0);

            const posicao = rankMap[aluno.id] || '—';

            // ── Gráficos offscreen ────────────────────────────────────────
            let imgDonut = '', imgBar = '';
            if (incGraficos && typeof window.Chart !== 'undefined') {
                // Donut: distribuição de desempenho por disciplina (mencão → nota)
                const mencaoCount = { SS:0, MS:0, MM:0, MI:0, II:0 };
                boletim.forEach(d => { if (d.mencao && mencaoCount[d.mencao] !== undefined) mencaoCount[d.mencao]++; });
                const donutVals   = Object.values(mencaoCount);
                const donutLabels = ['SS (Sup.)', 'MS (Muito S.)', 'MM (Médio)', 'MI (Insuf.)', 'II (Inf.)'];
                const donutCores  = ['#22C55E','#86EFAC','#FACC15','#F97316','#EF4444'];
                // Remove mencões com 0 para não poluir
                const donutFinal  = donutLabels.map((l, i) => ({ l, v: donutVals[i], c: donutCores[i] })).filter(x => x.v > 0);

                if (donutFinal.length) {
                    imgDonut = await _gerarGraficoBase64(
                        'doughnut',
                        donutFinal.map(x => x.v),
                        donutFinal.map(x => x.l),
                        donutFinal.map(x => x.c),
                        'Distribuição de Menções'
                    );
                }

                // Bar: métricas gerais (todas na escala 0-10)
                const barLabels = ['Média (0-10)', 'Freq. (/10)', 'Ativ. Entregues'];
                const barVals   = [
                    Math.min(10, Math.max(0, mediaNum)),
                    Math.min(10, Math.max(0, freq / 10)),
                    Math.min(10, totalAtiv)
                ];
                imgBar = await _gerarGraficoBase64(
                    'bar',
                    barVals,
                    barLabels,
                    ['#020122', '#F4442E', '#FF6B52'],
                    'Métricas Gerais (escala 0-10)'
                );
            }


            // ── Projetos/Atividades por disciplina ────────────────────────
            let projetosHtml = '';
            if (incDisciplinas && boletim.length) {
                const rows = boletim.map(d => {
                    const notaDisc = _mencaoToNotaProf(d.mencao);
                    const freqDisc = Math.max(0, 100 - (d.faltas || 0) * 2);
                    const badgeBg  = notaDisc >= 9 ? '#e8f5e9' : notaDisc >= 7 ? '#fffde7' : '#fce4ec';
                    const badgeFg  = notaDisc >= 9 ? '#2e7d32' : notaDisc >= 7 ? '#f57f17' : '#c62828';
                    return `<tr>
                        <td style="padding:6px 8px;font-size:11px;border-bottom:1px solid #f0f0f0;">${d.nome_materia || '—'}</td>
                        <td style="padding:6px 8px;font-size:11px;border-bottom:1px solid #f0f0f0;text-align:center;">
                            <span style="background:${badgeBg};color:${badgeFg};border-radius:12px;padding:2px 8px;font-weight:bold;">${d.mencao || '—'}</span>
                        </td>
                        <td style="padding:6px 8px;font-size:11px;border-bottom:1px solid #f0f0f0;text-align:center;">${freqDisc}%</td>
                        <td style="padding:6px 8px;font-size:11px;border-bottom:1px solid #f0f0f0;text-align:center;">${d.atividades_entregues ?? 0}</td>
                        <td style="padding:6px 8px;font-size:11px;border-bottom:1px solid #f0f0f0;text-align:center;">${d.faltas ?? 0}</td>
                    </tr>`;
                }).join('');
                projetosHtml = `
                <div style="border:1px solid #eee;border-radius:8px;margin-bottom:18px;overflow:hidden;">
                    <div style="background:#f8f9fb;padding:10px 14px;font-size:12px;font-weight:bold;color:#020122;border-bottom:1px solid #eee;">
                        📋 Desempenho por Disciplina
                    </div>
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#fafafa;">
                                <th style="padding:6px 8px;font-size:10px;color:#888;text-align:left;border-bottom:1px solid #eee;">Disciplina</th>
                                <th style="padding:6px 8px;font-size:10px;color:#888;text-align:center;border-bottom:1px solid #eee;">Menção</th>
                                <th style="padding:6px 8px;font-size:10px;color:#888;text-align:center;border-bottom:1px solid #eee;">Freq.</th>
                                <th style="padding:6px 8px;font-size:10px;color:#888;text-align:center;border-bottom:1px solid #eee;">Atividades</th>
                                <th style="padding:6px 8px;font-size:10px;color:#888;text-align:center;border-bottom:1px solid #eee;">Faltas</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>`;
            }

            // ── Pontos fortes/fracos baseados em dados reais ──────────────
            let pontosHtml = '';
            if (incPontos) {
                const fortes = [];
                const fracos = [];

                if (mediaNum >= 9.0)      fortes.push('Desempenho acadêmico excelente — média ≥ 9.0');
                else if (mediaNum >= 8.0) fortes.push('Bom desempenho acadêmico — média ≥ 8.0');
                else if (mediaNum >= 7.0) fortes.push('Desempenho acadêmico satisfatório — média ≥ 7.0');
                else                      fracos.push(`Média abaixo do esperado (${mediaNum.toFixed(1)}) — requer atenção`);

                if (freq >= 95)           fortes.push(`Frequência exemplar de ${freq}% — comprometimento consistente`);
                else if (freq >= 90)      fortes.push(`Boa frequência (${freq}%) — acima de 90%`);
                else if (freq >= 75)      fortes.push(`Frequência regular (${freq}%)`);
                else                      fracos.push(`Frequência crítica (${freq}%) — abaixo do mínimo de 75%`);

                if (totalAtiv >= 15)      fortes.push(`Alta entrega de atividades (${totalAtiv} entregas)`);
                else if (totalAtiv >= 8)  fortes.push(`Bom número de atividades entregues (${totalAtiv})`);
                else if (totalAtiv > 0)   fracos.push(`Poucas atividades entregues (${totalAtiv}) — pode melhorar`);

                if (totalFaltas === 0)    fortes.push('Sem nenhuma falta registrada');
                else if (totalFaltas > 8) fracos.push(`Alto número de faltas (${totalFaltas}) — impacta a frequência`);

                const posNum = typeof posicao === 'number' ? posicao : parseInt(posicao);
                if (!isNaN(posNum)) {
                    if (posNum <= 3)        fortes.push(`Posição de destaque: #${posNum} no ranking geral`);
                    else if (posNum <= 10)  fortes.push(`Entre os 10 primeiros do ranking (#${posNum})`);
                }

                // Disciplinas com menção abaixo de MM
                const discFracas = boletim.filter(d => ['MI','II','SR'].includes(d.mencao));
                if (discFracas.length) fracos.push(`Atenção em: ${discFracas.map(d => d.nome_materia).join(', ')}`);

                const discFortes = boletim.filter(d => d.mencao === 'SS');
                if (discFortes.length) fortes.push(`Destaque em: ${discFortes.map(d => d.nome_materia).join(', ')}`);

                const _chip = (txt, bg, fg) =>
                    `<span style="display:inline-block;background:${bg};color:${fg};border-radius:20px;padding:3px 10px;font-size:11px;margin:2px 2px 4px;">${txt}</span>`;

                const ftHtml = fortes.map(s => _chip(s, '#e8f5e9', '#2e7d32')).join('');
                const frHtml = fracos.map(s => _chip(s, '#fce4ec', '#c62828')).join('');

                if (ftHtml || frHtml) pontosHtml = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;">
                    ${ftHtml ? `<div style="border:1px solid #eee;border-radius:8px;padding:12px;">
                        <div style="font-size:11px;font-weight:bold;color:#2e7d32;margin-bottom:8px;">✅ Pontos Fortes</div>
                        <div>${ftHtml}</div></div>` : ''}
                    ${frHtml ? `<div style="border:1px solid #eee;border-radius:8px;padding:12px;">
                        <div style="font-size:11px;font-weight:bold;color:#c62828;margin-bottom:8px;">⚠️ Pontos de Melhoria</div>
                        <div>${frHtml}</div></div>` : ''}
                </div>`;
            }

            const situacaoColor = aluno.situacao === 'Ativo' ? { bg:'#e8f5e9', fg:'#2e7d32' } : { bg:'#fce4ec', fg:'#c62828' };

            paginas.push(`
            <div style="font-family:Arial,sans-serif;padding:14px 18px;box-sizing:border-box;background:#fff;width:730px;">

                <!-- Cabeçalho -->
                <div style="background:linear-gradient(135deg,#020122,#1a1a6e);color:#fff;border-radius:10px;padding:16px 22px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="font-size:20px;font-weight:bold;letter-spacing:1px;">RANKING+</div>
                        <div style="font-size:11px;opacity:0.8;margin-top:2px;">Relatório de Desempenho Acadêmico</div>
                    </div>
                    <div style="text-align:right;font-size:11px;opacity:0.8;line-height:1.6;">
                        <div>Emitido em: ${dataEmissao}</div>
                        <div>Por: ${profNome}</div>
                        <div>Semestre: ${aluno.semestre_atual || '—'}º</div>
                    </div>
                </div>

                <!-- Info do aluno -->
                <div style="display:flex;align-items:center;gap:14px;background:#f8f9fb;border-radius:10px;padding:14px 18px;margin-bottom:18px;border-left:5px solid #F4442E;">
                    <div style="width:56px;height:56px;border-radius:50%;background:#020122;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <span style="color:#fff;font-size:22px;font-weight:bold;">${(aluno.nome||'?')[0].toUpperCase()}</span>
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:16px;font-weight:bold;color:#020122;">${aluno.nome || '—'}</div>
                        <div style="font-size:11px;color:#555;margin-top:3px;">
                            <span style="margin-right:14px;">📚 ${aluno.curso || '—'}</span>
                            <span style="margin-right:14px;">🎓 Matrícula: ${aluno.matricula || '—'}</span>
                            <span>📅 ${aluno.semestre_atual || '—'}º Semestre</span>
                        </div>
                    </div>
                    <div style="background:${situacaoColor.bg};color:${situacaoColor.fg};border-radius:20px;padding:4px 14px;font-size:11px;font-weight:bold;">
                        ${aluno.situacao || 'Ativo'}
                    </div>
                </div>

                ${incMetricas ? `
                <!-- Cards de métricas -->
                <div style="display:grid;grid-template-columns:repeat(${incRanking ? 5 : 4},1fr);gap:8px;margin-bottom:18px;">
                    ${incRanking ? `<div style="background:#fff;border:1px solid #eee;border-radius:8px;padding:10px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                        <div style="font-size:9px;color:#888;margin-bottom:4px;text-transform:uppercase;">Ranking</div>
                        <div style="font-size:20px;font-weight:bold;color:#F4442E;">${posicao !== '—' ? '#'+posicao : '—'}</div>
                        <div style="font-size:9px;color:#aaa;">de ${totalAlunos}</div>
                    </div>` : ''}
                    <div style="background:#fff;border:1px solid #eee;border-radius:8px;padding:10px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                        <div style="font-size:9px;color:#888;margin-bottom:4px;text-transform:uppercase;">Média Geral</div>
                        <div style="font-size:20px;font-weight:bold;color:#020122;">${mediaNum.toFixed(1)}</div>
                        <div style="font-size:9px;color:#aaa;">de 10.0</div>
                    </div>
                    <div style="background:#fff;border:1px solid #eee;border-radius:8px;padding:10px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                        <div style="font-size:9px;color:#888;margin-bottom:4px;text-transform:uppercase;">Frequência</div>
                        <div style="font-size:20px;font-weight:bold;color:${freq >= 75 ? '#020122' : '#c62828'};">${freq}%</div>
                        <div style="font-size:9px;color:${freq >= 75 ? '#2e7d32' : '#c62828'};">${freq >= 75 ? 'Regular' : '⚠ Crítica'}</div>
                    </div>
                    <div style="background:#fff;border:1px solid #eee;border-radius:8px;padding:10px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                        <div style="font-size:9px;color:#888;margin-bottom:4px;text-transform:uppercase;">Atividades</div>
                        <div style="font-size:20px;font-weight:bold;color:#020122;">${totalAtiv}</div>
                        <div style="font-size:9px;color:#aaa;">entregues</div>
                    </div>
                    <div style="background:#fff;border:1px solid #eee;border-radius:8px;padding:10px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                        <div style="font-size:9px;color:#888;margin-bottom:4px;text-transform:uppercase;">Faltas</div>
                        <div style="font-size:20px;font-weight:bold;color:${totalFaltas > 5 ? '#c62828' : '#020122'};">${totalFaltas}</div>
                        <div style="font-size:9px;color:#aaa;">registradas</div>
                    </div>
                </div>` : ''}

                ${incGraficos && (imgDonut || imgBar) ? `
                <!-- Gráficos -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;">
                    ${imgDonut ? `<div style="border:1px solid #eee;border-radius:8px;padding:10px;text-align:center;">
                        <img src="${imgDonut}" style="width:100%;max-height:190px;object-fit:contain;">
                    </div>` : ''}
                    ${imgBar ? `<div style="border:1px solid #eee;border-radius:8px;padding:10px;text-align:center;">
                        <img src="${imgBar}" style="width:100%;max-height:190px;object-fit:contain;">
                    </div>` : ''}
                </div>` : ''}

                ${projetosHtml}

                ${pontosHtml}

                ${incObs && obsGeral ? `
                <!-- Observações -->
                <div style="border:1px solid #eee;border-radius:8px;padding:12px;margin-bottom:18px;">
                    <div style="font-size:11px;font-weight:bold;color:#020122;margin-bottom:6px;">📝 Observações do Professor</div>
                    <p style="font-size:11px;color:#444;line-height:1.6;margin:0;">${obsGeral.replace(/\n/g,'<br>')}</p>
                </div>` : ''}

                <!-- Footer -->
                <div style="border-top:1px solid #eee;padding-top:8px;display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
                    <span style="font-size:9px;color:#aaa;">Ranking+ · Relatório Gerado Automaticamente · Prof. ${profNome}</span>
                    <span style="font-size:9px;color:#aaa;">${dataEmissao}</span>
                </div>
            </div>`);
        }

        hideReportsLoading();

        // ── Renderiza cada aluno como canvas individual e monta o PDF ──────────
        // Mesma técnica do areaaluno: html2canvas + jsPDF, garante A4 sem cortes.
        if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
            showReportsToast('Bibliotecas de PDF não carregadas. Recarregue.', 'error');
            return;
        }

        const { jsPDF } = window.jspdf;
        const pdf    = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        const margin = 8;   // mm
        const pdfW   = pdf.internal.pageSize.getWidth();   // 210
        const pdfH   = pdf.internal.pageSize.getHeight();  // 297
        const imgW   = pdfW - margin * 2;                  // 194 mm
        const maxH   = pdfH - margin * 2;                  // 281 mm

        showReportsLoading(`Renderizando ${paginas.length} página(s)...`);

        for (let i = 0; i < paginas.length; i++) {
            showReportsLoading(`Renderizando ${i + 1} de ${paginas.length}...`);

            // Monta wrapper invisível atrás da página
            const wrapper = document.createElement('div');
            Object.assign(wrapper.style, {
                display:       'block',
                position:      'absolute',
                top:           '0',
                left:          '0',
                width:         '730px',
                background:    '#fff',
                fontFamily:    'Arial,sans-serif',
                boxSizing:     'border-box',
                zIndex:        '-1',
                pointerEvents: 'none'
            });
            wrapper.innerHTML = paginas[i];
            document.body.appendChild(wrapper);

            await new Promise(r => requestAnimationFrame(r));
            await new Promise(r => setTimeout(r, 200));

            const canvas = await html2canvas(wrapper, {
                scale:       2,
                useCORS:     true,
                allowTaint:  true,
                logging:     false,
                width:       730,
                height:      wrapper.scrollHeight,
                windowWidth: 730
            });
            wrapper.remove();

            const imgData  = canvas.toDataURL('image/jpeg', 0.95);
            const naturalH = (canvas.height / canvas.width) * imgW;

            if (i > 0) pdf.addPage();

            if (naturalH <= maxH) {
                // Conteúdo cabe na página — posiciona no topo
                pdf.addImage(imgData, 'JPEG', margin, margin, imgW, naturalH);
            } else {
                // Conteúdo maior que a página — escala para caber na folha inteira
                const ratio  = maxH / naturalH;
                const finalW = imgW * ratio;
                const xOff   = margin + (imgW - finalW) / 2;
                pdf.addImage(imgData, 'JPEG', xOff, margin, finalW, maxH);
            }

            // ── Página ATS do perfil profissional (texto limpo, sem imagens) ──
            const perf = perfis[i];
            const temConteudo = perf && !!(perf.resumo || perf.experiencias?.length || perf.formacoes?.length || perf.idiomas?.length || perf.habilidades?.length);
            if (incPerfilProf && temConteudo) {
                pdf.addPage();
                _appendAtsPdfProf(pdf, perf, studentsToExport[i]);
            }
        }

        hideReportsLoading();
        pdf.save(`relatorio_alunos_${new Date().toISOString().split('T')[0]}.pdf`);
        showReportsToast('PDF gerado com sucesso!', 'success');
    } catch (err) {
        console.error('Erro ao gerar PDF:', err);
        hideReportsLoading();
        showReportsToast('Falha ao gerar PDF', 'error');
    }
}

// ── Página ATS de perfil profissional para o PDF do professor ─────────────────
function _appendAtsPdfProf(pdf, perfil, aluno) {
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
    txt(aluno.nome || '—', 15, 'bold');
    if (aluno.curso)     txt(aluno.curso, 10);
    if (aluno.matricula) txt(`Matrícula: ${aluno.matricula}`, 9);
    y += lineH * 0.5;
    sep();

    if (perfil.resumo) {
        txt('RESUMO PROFISSIONAL', 11, 'bold');
        y += 1;
        txt(perfil.resumo, 10);
        y += lineH * 0.5;
        sep();
    }

    if (perfil.experiencias?.length) {
        txt('EXPERIÊNCIA PROFISSIONAL', 11, 'bold');
        y += 1;
        perfil.experiencias.forEach(e => {
            const cargo   = [e.cargo, e.empresa].filter(Boolean).join(' — ');
            const periodo = [e.periodo_inicio, e.periodo_fim].filter(Boolean).join(' a ');
            if (cargo)       txt(cargo,      10, 'bold');
            if (periodo)     txt(periodo,     9);
            if (e.descricao) txt(e.descricao, 10);
            y += lineH * 0.4;
        });
        sep();
    }

    if (perfil.formacoes?.length) {
        txt('FORMAÇÃO COMPLEMENTAR', 11, 'bold');
        y += 1;
        perfil.formacoes.forEach(f => {
            const linha = [f.curso, f.instituicao].filter(Boolean).join(' — ');
            if (linha)         txt(linha,         10, 'bold');
            if (f.periodo_fim) txt(f.periodo_fim,  9);
            y += lineH * 0.3;
        });
        sep();
    }

    if (perfil.idiomas?.length) {
        txt('IDIOMAS', 11, 'bold');
        y += 1;
        perfil.idiomas.forEach(id => txt(`${id.idioma}: ${id.nivel}`, 10));
        y += lineH * 0.5;
        sep();
    }

    if (perfil.habilidades?.length) {
        txt('HABILIDADES', 11, 'bold');
        y += 1;
        txt(perfil.habilidades.join(' · '), 10);
    }

    if (perfil.certificacoes?.length) {
        if (perfil.habilidades?.length) { y += lineH * 0.5; sep(); }
        txt('CERTIFICAÇÕES E CURSOS COMPLEMENTARES', 11, 'bold');
        y += 1;
        perfil.certificacoes.forEach(c => {
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

function viewReportsStudentDetails(studentId) {
    const student = _repFilteredData.find(s => s.id === studentId) || _repAllAlunos.find(s => s.id === studentId);
    if (!student) return;
    showReportsToast(`Visualizando detalhes de ${student.nome}`, 'info');
}

function showReportsLoading(message = 'Carregando...') {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    const text = overlay.querySelector('.loading-text');
    if (text) text.textContent = message;
    overlay.style.display = 'flex';
}

function hideReportsLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
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

// O listener antigo de activateReportsTabFeatures foi removido —
// a aba Relatórios agora é carregada via showTab → loadReportsTab()
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
    
    // Carregar dados da aba ao abrir
    if (tabName === 'dashboard') {
        setTimeout(() => initializeCharts(), 100);
    } else if (tabName === 'classes') {
        loadClasses();
    } else if (tabName === 'students') {
        loadStudentsTab();
    } else if (tabName === 'schedule') {
        loadScheduleTab();
    } else if (tabName === 'reports') {
        loadReportsTab();
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
    loadStudentsTab();
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

const PROF_API = 'http://localhost:4000';
let _profDisciplinas = []; // cache das disciplinas do professor
let _profTodosAlunos = []; // cache de todos os alunos do professor

async function initializePage() {
    const dateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    ['current-date','current-date-prof'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = dateStr;
    });

    showTab('dashboard');

    const profId = localStorage.getItem('professorId');
    const saved  = localStorage.getItem('unirank_user');

    // Nome imediato do localStorage
    if (saved) {
        try {
            const user = JSON.parse(saved);
            ['sidebarProfName','dashProfName','profPerfilNome'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = user.nome || 'Professor';
            });
        } catch(_) {}
    }

    if (!profId) return;

    // Dados completos do professor
    try {
        const res  = await fetch(`${PROF_API}/professores/${profId}`);
        if (!res.ok) return;
        const prof = await res.json();

        ['dashProfEmail','profPerfilEmail'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = prof.email || '—';
        });
        ['dashProfName','sidebarProfName','profPerfilNome'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = prof.nome || '—';
        });
        const campusEl = document.getElementById('profPerfilCampus');
        if (campusEl) campusEl.textContent = prof.campus || '—';

        // Preenche campos de edição
        const fields = { profEditNome: prof.nome, profEditEmail: prof.email,
                         profEditTelefone: prof.telefone, profEditCampus: prof.campus };
        Object.entries(fields).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
        });
    } catch(_) {}

    // Stats do dashboard + perfil
    try {
        const res   = await fetch(`${PROF_API}/professores/${profId}/stats`);
        const stats = await res.json();
        const pairs = [
            ['dashStatAlunos', stats.alunos],
            ['dashStatTurmas', stats.turmas],
            ['dashStatPresenca', stats.presenca_media !== '—' ? stats.presenca_media + '%' : '—'],
            ['dashStatMedia', stats.media_geral],
            ['profStatAlunos', stats.alunos],
            ['profStatTurmas', stats.turmas],
            ['profStatMedia', stats.media_geral],
            ['profStatPresenca', stats.presenca_media !== '—' ? stats.presenca_media + '%' : '—']
        ];
        pairs.forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; });
    } catch(_) {}
}

function setupEventListeners() {
    const classSelector = document.getElementById('class-selector');
    if (classSelector) {
        classSelector.addEventListener('change', function() {
            loadStudentsTab();
        });
    }
}

// ─── ABA TURMAS ──────────────────────────────────────────────────────────────
async function loadClasses() {
    const container = document.getElementById('classes-container');
    const badge     = document.getElementById('turmasTotalBadge');
    const profId    = localStorage.getItem('professorId');
    if (!container || !profId) return;

    container.innerHTML = '<div class="col-12 text-center py-5 text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Carregando turmas...</div>';

    try {
        const res  = await fetch(`${PROF_API}/professores/${profId}/disciplinas`);
        _profDisciplinas = await res.json();

        if (!_profDisciplinas.length) {
            container.innerHTML = '<div class="col-12 text-center py-4 text-muted">Nenhuma turma encontrada.</div>';
            if (badge) badge.textContent = '0 turmas';
            return;
        }

        if (badge) badge.textContent = `${_profDisciplinas.length} turma${_profDisciplinas.length !== 1 ? 's' : ''}`;
        container.innerHTML = '';

        _profDisciplinas.forEach(d => {
            const col = document.createElement('div');
            col.className = 'col-lg-6 mb-4';
            col.innerHTML = `
                <div class="custom-card class-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h5 class="card-title text-primary mb-1">${d.nome_materia}</h5>
                                <p class="text-muted mb-1 small"><i class="fas fa-clock me-1"></i>${d.dia_semana || '—'} ${d.horario || ''}</p>
                                <p class="text-muted mb-0 small"><i class="fas fa-map-marker-alt me-1"></i>${d.sala || '—'} · ${d.campus || '—'}</p>
                            </div>
                            <span class="badge bg-primary">${d.total_alunos} aluno${d.total_alunos !== 1 ? 's' : ''}</span>
                        </div>
                        <button class="btn btn-outline-primary w-100 btn-sm" onclick="verAlunosDisciplina(${d.id}, '${d.nome_materia.replace(/'/g, "\\'")}')">
                            <i class="fas fa-users me-2"></i>Ver Alunos
                        </button>
                    </div>
                </div>`;
            container.appendChild(col);
        });

        // Preenche o select da aba Alunos
        _popularSelectDisciplinas();

    } catch (err) {
        console.error('Erro turmas:', err);
        container.innerHTML = '<div class="col-12 text-center py-4 text-danger">Erro ao carregar turmas.</div>';
    }
}

function _popularSelectDisciplinas() {
    const sel = document.getElementById('class-selector');
    if (!sel) return;
    sel.innerHTML = '<option value="">Todos os alunos</option>';
    _profDisciplinas.forEach(d => {
        sel.insertAdjacentHTML('beforeend', `<option value="${d.id}">${d.nome_materia}</option>`);
    });
}

window.verAlunosDisciplina = function(discId, _nome) {
    const sel = document.getElementById('class-selector');
    if (sel) sel.value = String(discId);
    showTab('students');
    loadStudentsTab();
};

// ─── ABA ALUNOS ──────────────────────────────────────────────────────────────
async function loadStudentsTab() {
    const tbody  = document.getElementById('students-table');
    const topDiv = document.getElementById('top-students');
    const badge  = document.getElementById('alunosTotalBadge');
    const profId = localStorage.getItem('professorId');
    if (!tbody || !profId) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Carregando...</td></tr>';
    if (topDiv) topDiv.innerHTML = '';

    const discId = document.getElementById('class-selector')?.value || '';

    try {
        let url, alunos;
        if (discId) {
            url   = `${PROF_API}/professores/${profId}/disciplinas/${discId}/alunos`;
            const res = await fetch(url);
            alunos = await res.json();
        } else {
            url   = `${PROF_API}/professores/${profId}/alunos`;
            const res = await fetch(url);
            _profTodosAlunos = await res.json();
            alunos = _profTodosAlunos;
        }

        if (badge) badge.textContent = `${alunos.length} aluno${alunos.length !== 1 ? 's' : ''}`;

        // Top 3
        if (topDiv) {
            topDiv.innerHTML = '';
            alunos.slice(0, 3).forEach((a, i) => {
                const icons = ['🥇','🥈','🥉'];
                const notaNum = a.mencao ? _mencaoToNotaProf(a.mencao) : parseFloat(a.media) || 0;
                const perf    = notaNum >= 9 ? ['success','Excelente'] : notaNum >= 7 ? ['success','Bom'] : ['warning','Regular'];
                const desempenhoLabel = a.mencao || (a.media != null ? Number(a.media).toFixed(1) : '—');
                topDiv.innerHTML += `
                    <div class="col-lg-4 mb-3">
                        <div class="custom-card student-card h-100">
                            <div class="card-body text-center">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <span style="font-size:1.5rem;">${icons[i]}</span>
                                    <span class="badge bg-${perf[0]}">${perf[1]}</span>
                                </div>
                                <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style="width:64px;height:64px;">
                                    <i class="fas fa-user text-white fs-4"></i>
                                </div>
                                <h5 class="mb-1">${a.nome}</h5>
                                <p class="text-muted small mb-2">${a.curso || '—'}</p>
                                <div class="row text-center">
                                    <div class="col-6"><div class="fw-bold text-primary">${desempenhoLabel}</div><small class="text-muted">${a.mencao ? 'Menção' : 'Média'}</small></div>
                                    <div class="col-6"><div class="fw-bold text-primary">${a.frequencia ?? '—'}%</div><small class="text-muted">Freq.</small></div>
                                </div>
                            </div>
                        </div>
                    </div>`;
            });
        }

        // Tabela completa
        tbody.innerHTML = '';
        if (!alunos.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Nenhum aluno encontrado.</td></tr>';
            return;
        }
        alunos.forEach((a, i) => {
            const pos = i + 1;
            const posIcon = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `${pos}º`;
            // mencao existe para endpoint por disciplina; media existe para todos os alunos
            const notaNum = a.mencao ? _mencaoToNotaProf(a.mencao) : parseFloat(a.media) || 0;
            const badgeCls = notaNum >= 9 ? 'bg-success' : notaNum >= 7 ? 'bg-warning' : notaNum >= 5 ? 'bg-secondary' : 'bg-danger';
            const desempenhoLabel = a.mencao || (a.media != null ? Number(a.media).toFixed(1) : '—');
            tbody.innerHTML += `
                <tr ${i < 3 ? 'class="table-warning"' : ''}>
                    <td>${posIcon}</td>
                    <td><div class="fw-semibold">${a.nome}</div><small class="text-muted">${a.matricula || ''}</small></td>
                    <td><small>${a.curso || '—'}</small></td>
                    <td><span class="badge ${badgeCls}">${desempenhoLabel}</span></td>
                    <td>${a.frequencia ?? '—'}%</td>
                    <td>${a.atividades_entregues ?? a.total_atividades ?? '—'}</td>
                    <td><small class="text-muted">${a.disciplinas || '—'}</small></td>
                </tr>`;
        });
    } catch (err) {
        console.error('Erro alunos:', err);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Erro ao carregar alunos.</td></tr>';
    }
}

function _mencaoToNotaProf(mencao) {
    const map = { SS: 10, MS: 9, MM: 7, MI: 5, II: 2, SR: 0 };
    return map[mencao] ?? 0;
}

// ─── ABA HORÁRIOS ─────────────────────────────────────────────────────────────
async function loadScheduleTab() {
    const profId = localStorage.getItem('professorId');
    if (!profId) return;

    // Garante que as disciplinas estejam carregadas
    if (!_profDisciplinas.length) {
        const res = await fetch(`${PROF_API}/professores/${profId}/disciplinas`);
        _profDisciplinas = await res.json();
    }

    _renderEventos();
    _renderScheduleGrid();
    _renderProximasAulas();
    _renderScheduleResumo();
}

// Normaliza variações de nome de dia para a forma curta padrão
function _normalizarDia(dia) {
    if (!dia) return dia;
    const d = dia.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove acentos
    if (d.startsWith('seg'))  return 'Segunda';
    if (d.startsWith('ter'))  return 'Terça';
    if (d.startsWith('qua'))  return 'Quarta';
    if (d.startsWith('qui'))  return 'Quinta';
    if (d.startsWith('sex'))  return 'Sexta';
    if (d.startsWith('sab'))  return 'Sábado';
    if (d.startsWith('dom'))  return 'Domingo';
    return dia.trim(); // devolve original se não reconhecido
}

// Eventos fictícios do período letivo (gerados a partir da data atual)
function _renderEventos() {
    const list = document.getElementById('eventosList');
    if (!list) return;

    const hoje = new Date();

    // Gera eventos relativos à data de hoje para ficarem sempre "relevantes"
    const addDias = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
    const fmt     = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

    const eventos = [
        { icon: 'fa-file-alt',    cor: 'warning',  titulo: 'Entrega de Notas – 1ª Avaliação',   data: fmt(addDias(hoje, 5)),  desc: 'Prazo para lançamento no sistema' },
        { icon: 'fa-chalkboard',  cor: 'primary',  titulo: 'Reunião Pedagógica',                data: fmt(addDias(hoje, 8)),  desc: 'Sala dos professores — 19h' },
        { icon: 'fa-graduation-cap', cor: 'success', titulo: 'Semana Acadêmica',               data: fmt(addDias(hoje, 14)), desc: 'Palestras, workshops e apresentações' },
        { icon: 'fa-calendar-times', cor: 'danger', titulo: 'Feriado — Recesso Acadêmico',     data: fmt(addDias(hoje, 21)), desc: 'Sem aulas — remanejamento a critério do prof.' },
        { icon: 'fa-trophy',      cor: 'info',     titulo: 'Divulgação do Ranking+ Semestral',  data: fmt(addDias(hoje, 28)), desc: 'Publicação no portal acadêmico' },
        { icon: 'fa-file-export', cor: 'secondary',titulo: 'Entrega de Notas – Avaliação Final',data: fmt(addDias(hoje, 45)), desc: 'Prazo improrrogável para fechamento' },
    ];

    list.innerHTML = '';
    eventos.forEach(ev => {
        list.innerHTML += `
        <div class="col-md-4 col-sm-6">
            <div class="d-flex align-items-start gap-3 p-3 border rounded bg-light h-100">
                <div class="bg-${ev.cor} text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width:42px;height:42px;">
                    <i class="fas ${ev.icon}"></i>
                </div>
                <div>
                    <div class="fw-semibold small">${ev.titulo}</div>
                    <div class="text-muted" style="font-size:0.78rem;">${ev.desc}</div>
                    <span class="badge bg-${ev.cor} mt-1" style="font-size:0.72rem;">${ev.data}</span>
                </div>
            </div>
        </div>`;
    });
}

const DIAS_SEMANA = ['Segunda','Terça','Quarta','Quinta','Sexta'];
const HORARIOS    = ['07:00','08:00','09:00','10:00','11:00','12:00',
                     '13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];

function _renderScheduleGrid() {
    const tbody = document.getElementById('scheduleGridBody');
    if (!tbody) return;

    // Mapeia dia → disciplina(s), normalizando variações de nome
    const map = {};
    _profDisciplinas.forEach(d => {
        if (!d.dia_semana) return;
        const dia = _normalizarDia(d.dia_semana);
        if (!map[dia]) map[dia] = [];
        map[dia].push({ ...d, _diaNorm: dia });
    });

    // Detecta horários únicos e ordena
    const horariosUsados = [...new Set(_profDisciplinas.map(d => d.horario).filter(Boolean))].sort();
    if (!horariosUsados.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Sem aulas cadastradas no banco.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    horariosUsados.forEach(h => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="fw-bold small">${h}</td>`;
        DIAS_SEMANA.forEach(dia => {
            const disc = (map[dia] || []).filter(d => d.horario === h);
            if (disc.length) {
                tr.innerHTML += `<td class="bg-light">${disc.map(d => `
                    <div class="p-1 border-start border-primary border-3">
                        <strong class="small">${d.nome_materia}</strong><br>
                        <small class="text-muted">Sala ${d.sala || '—'} · ${d.total_alunos} alunos</small>
                    </div>`).join('')}</td>`;
            } else {
                tr.innerHTML += '<td></td>';
            }
        });
        tbody.appendChild(tr);
    });
}

function _renderProximasAulas() {
    const list   = document.getElementById('proximasAulasList');
    if (!list) return;
    const diaIdx = new Date().getDay(); // 0=dom,1=seg,...

    const mapDia = { 'Segunda':1,'Terça':2,'Quarta':3,'Quinta':4,'Sexta':5,'Sábado':6 };
    const sorted = _profDisciplinas
        .filter(d => d.dia_semana)
        .map(d => ({ ...d, _diaNorm: _normalizarDia(d.dia_semana), _idx: mapDia[_normalizarDia(d.dia_semana)] ?? 9 }))
        .sort((a, b) => {
            const da = ((a._idx - diaIdx + 7) % 7) || 7;
            const db = ((b._idx - diaIdx + 7) % 7) || 7;
            return da - db || (a.horario || '').localeCompare(b.horario || '');
        })
        .slice(0, 5);

    if (!sorted.length) {
        list.innerHTML = '<div class="text-center text-muted small py-3">Sem aulas cadastradas.</div>';
        return;
    }

    list.innerHTML = '';
    sorted.forEach((d, i) => {
        const diff = ((d._idx - diaIdx + 7) % 7);
        const badgeTxt = diff === 0 ? 'Hoje' : diff === 1 ? 'Amanhã' : d._diaNorm || d.dia_semana;
        const badgeCls = diff === 0 ? 'bg-primary' : diff === 1 ? 'bg-secondary' : 'bg-light text-dark';
        list.innerHTML += `
            <div class="list-group-item d-flex justify-content-between align-items-center px-0 ${i < sorted.length-1 ? 'border-bottom' : ''}">
                <div>
                    <h6 class="mb-1">${d.nome_materia}</h6>
                    <p class="mb-0 text-muted small">${d._diaNorm || d.dia_semana}, ${d.horario || '—'}</p>
                    <small>${d.sala || '—'} · ${d.campus || '—'}</small>
                </div>
                <span class="badge ${badgeCls} rounded-pill">${badgeTxt}</span>
            </div>`;
    });
}

function _renderScheduleResumo() {
    const tbody = document.getElementById('scheduleResumoBody');
    if (!tbody) return;
    if (!_profDisciplinas.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-muted">Sem dados.</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    _profDisciplinas.forEach(d => {
        tbody.innerHTML += `
            <tr>
                <td class="fw-semibold small">${d.nome_materia}</td>
                <td class="small">${d.dia_semana || '—'} ${d.horario || ''}</td>
                <td class="small">${d.sala || '—'}</td>
                <td class="small">${d.campus || '—'}</td>
            </tr>`;
    });
}

// ─── ABA RELATÓRIOS ───────────────────────────────────────────────────────────
let _repAllAlunos      = [];
let _repFilteredData   = [];
let _repRankingData    = [];
let _repListenersAdded = false;

async function loadReportsTab() {
    const profId = localStorage.getItem('professorId');
    if (!profId) return;

    // Carrega filtros se ainda não populados
    try {
        const resFiltros = await fetch(`${PROF_API}/filtros`);
        const filtros    = await resFiltros.json();

        _popularSelect('repFiltCurso',  filtros.cursos,      c => `<option value="${c}">${c}</option>`);
        _popularSelect('repRankCurso',  filtros.cursos,      c => `<option value="${c}">${c}</option>`);
        _popularSelect('repRankSemestre', filtros.semestres, s => `<option value="${s}">${s}º Sem.</option>`);
        _popularSelect('repRankDisc',   filtros.disciplinas, d => `<option value="${d.id}">${d.nome_materia}</option>`);

        // Disciplinas do professor para filtro "suas disciplinas"
        const selDisc = document.getElementById('repFiltDisc');
        if (selDisc) {
            selDisc.innerHTML = '<option value="">Todas</option>';
            _profDisciplinas.forEach(d => {
                selDisc.insertAdjacentHTML('beforeend', `<option value="${d.id}">${d.nome_materia}</option>`);
            });
        }
    } catch(_) {}

    // Carrega todos os alunos do professor
    await _carregarRepAlunos();

    // Ranking geral
    await _carregarRepRanking();

    // Botões de filtro + exportação — vincula apenas uma vez
    if (!_repListenersAdded) {
        _repListenersAdded = true;

        document.getElementById('repFiltBtn')?.addEventListener('click', _carregarRepAlunos);
        document.getElementById('repRankBtn')?.addEventListener('click', _carregarRepRanking);
        document.getElementById('searchName')?.addEventListener('input', _carregarRepAlunos);

        // Exportação
        document.getElementById('exportExcel')?.addEventListener('click', exportReportsToExcel);
        document.getElementById('generatePDF')?.addEventListener('click', (e) => {
            e.preventDefault();
            generateReportsPDF();
        });

        // Toggle área de observações
        document.getElementById('pdfIncObs')?.addEventListener('change', function() {
            const area = document.getElementById('pdfObsArea');
            if (area) area.style.display = this.checked ? 'block' : 'none';
        });

        // Select all
        document.getElementById('selectAll')?.addEventListener('change', handleReportsSelectAll);
    }
}

function _popularSelect(id, items, fn) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const first = sel.options[0]?.outerHTML || '';
    sel.innerHTML = first;
    items.forEach(item => sel.insertAdjacentHTML('beforeend', fn(item)));
}

async function _carregarRepAlunos() {
    const tbody  = document.getElementById('resultsTableBody');
    const profId = localStorage.getItem('professorId');
    if (!tbody || !profId) return;

    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm me-2"></div></td></tr>';

    const discId = document.getElementById('repFiltDisc')?.value;
    const curso  = document.getElementById('repFiltCurso')?.value;
    const status = document.getElementById('repFiltStatus')?.value;
    const nome   = document.getElementById('searchName')?.value?.toLowerCase() || '';

    try {
        let alunos;
        if (discId) {
            const res = await fetch(`${PROF_API}/professores/${profId}/disciplinas/${discId}/alunos`);
            alunos = await res.json();
        } else {
            const res = await fetch(`${PROF_API}/professores/${profId}/alunos`);
            alunos = await res.json();
        }

        _repAllAlunos = alunos;

        // Filtros client-side
        _repFilteredData = alunos.filter(a => {
            if (nome   && !a.nome.toLowerCase().includes(nome))   return false;
            if (curso  && a.curso !== curso)                       return false;
            if (status && a.situacao !== status)                   return false;
            return true;
        });

        document.getElementById('totalStudents').textContent   = alunos.length;
        document.getElementById('filteredStudents').textContent = _repFilteredData.length;
        document.getElementById('resultsCount').textContent    = `${_repFilteredData.length} alunos`;

        tbody.innerHTML = '';
        if (!_repFilteredData.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">Nenhum aluno encontrado.</td></tr>';
            return;
        }
        _repFilteredData.forEach(a => {
            const nota = _mencaoToNotaProf(a.mencao);
            const badgeCls = nota >= 9 ? 'bg-success' : nota >= 7 ? 'bg-warning' : nota >= 5 ? 'bg-secondary' : 'bg-danger';
            tbody.innerHTML += `
                <tr>
                    <td><input type="checkbox" class="form-check-input" value="${a.id}" onchange="handleReportsStudentSelection(${a.id}, this.checked)"></td>
                    <td><div class="fw-semibold">${a.nome}</div><small class="text-muted">${a.matricula || ''}</small></td>
                    <td><small>${a.curso || '—'}</small></td>
                    <td>${a.semestre_atual ?? '—'}º</td>
                    <td><span class="badge ${badgeCls}">${a.mencao || a.media || '—'}</span></td>
                    <td>${a.frequencia ?? '—'}%</td>
                    <td><span class="badge ${a.situacao === 'Ativo' ? 'bg-success' : 'bg-secondary'}">${a.situacao || '—'}</span></td>
                    <td><small class="text-muted">${a.disciplinas || '—'}</small></td>
                </tr>`;
        });
    } catch (err) {
        console.error('Erro relatório alunos:', err);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Erro ao carregar.</td></tr>';
    }
}

async function _carregarRepRanking() {
    const tbody = document.getElementById('repRankingBody');
    const badge = document.getElementById('repRankTotalBadge');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-muted"><div class="spinner-border spinner-border-sm me-2"></div></td></tr>';

    const params = new URLSearchParams();
    const curso    = document.getElementById('repRankCurso')?.value;
    const semestre = document.getElementById('repRankSemestre')?.value;
    const disc     = document.getElementById('repRankDisc')?.value;
    if (curso)    params.set('curso', curso);
    if (semestre) params.set('semestre', semestre);
    if (disc)     params.set('disciplina_id', disc);

    try {
        const res  = await fetch(`${PROF_API}/ranking/detalhado?${params}`);
        const data = await res.json();
        _repRankingData = data.alunos || [];

        if (badge) badge.textContent = `${data.total} aluno${data.total !== 1 ? 's' : ''}`;

        tbody.innerHTML = '';
        if (!_repRankingData.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-muted">Nenhum resultado.</td></tr>';
            return;
        }
        _repRankingData.forEach((a, i) => {
            const pos = i + 1;
            const posIcon = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `${pos}º`;
            const nota = parseFloat(a.pontuacao) || 0;
            const st   = nota >= 9 ? ['success','Excelente'] : nota >= 7 ? ['success','Bom'] : nota >= 5 ? ['warning','Regular'] : ['danger','Atenção'];
            tbody.innerHTML += `
                <tr ${pos <= 3 ? 'class="table-warning"' : ''}>
                    <td>${posIcon}</td>
                    <td><span class="fw-semibold">${a.nome}</span></td>
                    <td><small class="text-muted">${a.curso || '—'}</small></td>
                    <td><span class="badge bg-primary">${a.pontuacao ?? '—'}</span></td>
                    <td>${a.frequencia ?? '—'}%</td>
                    <td><span class="badge bg-${st[0]}">${st[1]}</span></td>
                </tr>`;
        });
    } catch (err) {
        console.error('Erro ranking relatório:', err);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-danger">Erro ao carregar.</td></tr>';
    }
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

async function initializeCharts() {
    if (typeof frappe === 'undefined') {
        console.warn('Frappe Charts não carregado, tentando novamente em 500ms...');
        setTimeout(initializeCharts, 500);
        return;
    }

    const profId = localStorage.getItem('professorId');

    // Limpar gráficos anteriores
    ['performanceChart', 'attendanceChart', 'evolutionChart'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
    charts = {};

    // Busca stats por disciplina do banco
    let disciplinasStats = [];
    if (profId) {
        try {
            const res = await fetch(`${PROF_API}/professores/${profId}/disciplinas/stats`);
            if (res.ok) disciplinasStats = await res.json();
        } catch(_) {}
    }

    // Fallback: sem dados → exibe aviso
    if (!disciplinasStats.length) {
        ['performanceChart', 'attendanceChart', 'evolutionChart'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<div class="text-center text-muted py-4 small">Sem dados suficientes no banco.</div>';
        });
        return;
    }

    // Abreviações para labels longos
    const abreviar = nome => nome.length > 18 ? nome.substring(0, 16) + '…' : nome;
    const labels   = disciplinasStats.map(d => abreviar(d.nome_materia));

    // ── Gráfico 1: Média por Turma (barra) ───────────────────────────────────
    const performanceEl = document.getElementById('performanceChart');
    if (performanceEl) {
        charts.performance = new frappe.Chart('#performanceChart', {
            title: 'Média por Turma (escala 0-10)',
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { name: 'Média', values: disciplinasStats.map(d => parseFloat(d.media) || 0) }
                ]
            },
            colors: ['#F4442E'],
            height: 280,
            barOptions: { spaceRatio: 0.4 },
            axisOptions: { xIsSeries: false },
            yMarkers: [{ label: 'Mín. aprovação (7.0)', value: 7, options: { labelPos: 'left' } }]
        });
    }

    // ── Gráfico 2: Frequência por Disciplina (barra horizontal / bar) ────────
    const attendanceEl = document.getElementById('attendanceChart');
    if (attendanceEl) {
        charts.attendance = new frappe.Chart('#attendanceChart', {
            title: 'Frequência média (%)',
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { name: 'Frequência (%)', values: disciplinasStats.map(d => parseFloat(d.frequencia) || 0) }
                ]
            },
            colors: ['#020122'],
            height: 280,
            barOptions: { spaceRatio: 0.4 },
            yMarkers: [{ label: 'Mín. 75%', value: 75, options: { labelPos: 'left' } }]
        });
    }

    // ── Gráfico 3: Distribuição de Menções (barras empilhadas por disciplina) ─
    const evolutionEl = document.getElementById('evolutionChart');
    if (evolutionEl) {
        const n = (d, k) => parseInt(d[k], 10) || 0;
        const totalMencoes = disciplinasStats.reduce((s, d) =>
            s + n(d,'cnt_ss') + n(d,'cnt_ms') + n(d,'cnt_mm') + n(d,'cnt_mi') + n(d,'cnt_ii'), 0);

        if (totalMencoes === 0) {
            evolutionEl.innerHTML = '<div class="text-center text-muted py-4 small"><i class="fas fa-info-circle me-2"></i>Nenhuma menção registrada no banco ainda.</div>';
        } else {
            charts.evolution = new frappe.Chart('#evolutionChart', {
                title: 'Distribuição de Menções por Disciplina',
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        { name: 'SS (Sup.)',   values: disciplinasStats.map(d => n(d,'cnt_ss')) },
                        { name: 'MS (M.Sup.)', values: disciplinasStats.map(d => n(d,'cnt_ms')) },
                        { name: 'MM (Médio)',  values: disciplinasStats.map(d => n(d,'cnt_mm')) },
                        { name: 'MI (Insuf.)', values: disciplinasStats.map(d => n(d,'cnt_mi')) },
                        { name: 'II (Inf.)',   values: disciplinasStats.map(d => n(d,'cnt_ii')) }
                    ]
                },
                colors: ['#22C55E', '#86EFAC', '#FACC15', '#F97316', '#EF4444'],
                height: 280,
                barOptions: { stacked: true, spaceRatio: 0.4 },
                axisOptions: { xIsSeries: false }
            });
        }
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

window.addEventListener('load', function() {
    initializeCharts();
});

window.confirmLogout = function(event) {
    event.preventDefault();
    localStorage.clear();
    window.location.href = '../html/index.html';
};

// ─── EDITAR LANÇAMENTOS ───────────────────────────────────────────────────────
window.abrirModalLancamentos = function() {
    const profId = localStorage.getItem('professorId');
    if (!profId) return;

    // Popula select de disciplinas com as já carregadas
    const sel = document.getElementById('lancDiscSel');
    if (sel) {
        sel.innerHTML = '<option value="">Todos os alunos</option>';
        _profDisciplinas.forEach(d => {
            sel.insertAdjacentHTML('beforeend', `<option value="${d.id}">${d.nome_materia}</option>`);
        });
        // Espelha filtro atual da aba alunos
        const curDisc = document.getElementById('class-selector')?.value;
        if (curDisc) sel.value = curDisc;
    }

    const tbody = document.getElementById('lancTbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">Selecione uma disciplina e clique em Carregar.</td></tr>';

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalLancamentos')).show();
};

window.carregarLancamentos = async function() {
    const profId = localStorage.getItem('professorId');
    const discId = document.getElementById('lancDiscSel')?.value || '';
    const tbody  = document.getElementById('lancTbody');
    const badge  = document.getElementById('lancBadge');
    if (!profId || !tbody) return;

    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-3"><div class="spinner-border spinner-border-sm me-2"></div>Carregando...</td></tr>';

    try {
        const url = `${PROF_API}/professores/${profId}/lancamentos${discId ? `?discId=${discId}` : ''}`;
        const res = await fetch(url);
        const rows = await res.json();

        if (badge) badge.textContent = `${rows.length} registro${rows.length !== 1 ? 's' : ''}`;

        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">Nenhum lançamento encontrado.</td></tr>';
            return;
        }

        const mencoes = ['SS','MS','MM','MI','II','SR'];
        tbody.innerHTML = '';
        rows.forEach(r => {
            const tr = document.createElement('tr');
            tr.id = `lanc-row-${r.boletim_id}`;
            tr.innerHTML = `
                <td class="fw-semibold small">${r.nome}</td>
                <td class="text-muted small">${r.matricula || '—'}</td>
                <td class="small">${r.nome_materia}</td>
                <td>
                    <select class="form-select form-select-sm" id="lancMencao_${r.boletim_id}">
                        <option value="">—</option>
                        ${mencoes.map(m => `<option value="${m}" ${r.mencao === m ? 'selected' : ''}>${m}</option>`).join('')}
                    </select>
                </td>
                <td><input type="number" class="form-control form-control-sm" id="lancFaltas_${r.boletim_id}" value="${r.faltas ?? ''}" min="0" step="1"></td>
                <td><input type="number" class="form-control form-control-sm" id="lancNota_${r.boletim_id}" value="${r.nota_avaliacao ?? ''}" min="0" max="10" step="0.1"></td>
                <td><input type="number" class="form-control form-control-sm" id="lancAtiv_${r.boletim_id}" value="${r.atividades_entregues ?? ''}" min="0" step="1"></td>
                <td><input type="number" class="form-control form-control-sm" id="lancPart_${r.boletim_id}" value="${r.participacao_nota ?? ''}" min="0" max="10" step="0.1"></td>
                <td>
                    <button class="btn btn-success btn-sm px-2" title="Salvar" onclick="salvarLancamento(${r.boletim_id}, ${r.aluno_id}, ${r.disciplina_id})">
                        <i class="fas fa-save"></i>
                    </button>
                </td>`;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Erro lancamentos:', err);
        if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-danger">Erro ao carregar lançamentos.</td></tr>';
    }
};

window.salvarLancamento = async function(boletimId, alunoId, discId) {
    const profId = localStorage.getItem('professorId');
    if (!profId) return;

    const btn = document.querySelector(`#lanc-row-${boletimId} button`);
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>'; }

    const payload = {
        mencao:              document.getElementById(`lancMencao_${boletimId}`)?.value || null,
        faltas:              document.getElementById(`lancFaltas_${boletimId}`)?.value,
        nota_avaliacao:      document.getElementById(`lancNota_${boletimId}`)?.value,
        atividades_entregues:document.getElementById(`lancAtiv_${boletimId}`)?.value,
        participacao_nota:   document.getElementById(`lancPart_${boletimId}`)?.value
    };
    // Converte strings vazias em null
    for (const k of Object.keys(payload)) {
        if (payload[k] === '' || payload[k] === undefined) payload[k] = null;
        else if (k !== 'mencao' && payload[k] !== null) payload[k] = parseFloat(payload[k]);
    }

    const alerta = document.getElementById('lancAlerta');

    try {
        const res = await fetch(`${PROF_API}/professores/${profId}/disciplinas/${discId}/alunos/${alunoId}/boletim`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            // Feedback visual: linha fica verde por 1.5s
            const row = document.getElementById(`lanc-row-${boletimId}`);
            if (row) { row.classList.add('table-success'); setTimeout(() => row.classList.remove('table-success'), 1500); }
            if (alerta) { alerta.className = 'alert alert-success m-3'; alerta.textContent = `✅ Lançamento de ${document.querySelector(`#lanc-row-${boletimId} td`)?.textContent || 'aluno'} salvo.`; alerta.classList.remove('d-none'); setTimeout(() => alerta.classList.add('d-none'), 3000); }
        } else {
            if (alerta) { alerta.className = 'alert alert-danger m-3'; alerta.textContent = `❌ Erro: ${data.error || 'Não foi possível salvar.'}`; alerta.classList.remove('d-none'); }
        }
    } catch (e) {
        if (alerta) { alerta.className = 'alert alert-danger m-3'; alerta.textContent = '❌ Erro de conexão.'; alerta.classList.remove('d-none'); }
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i>'; }
    }
};


