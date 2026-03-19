// Certifique-se de declarar recomendacoes no topo do arquivo
const recomendacoes = {};

// Função para alternar abas
function showTab(tab) {
    const tabs = ['ranking', 'materias', 'faltas', 'calendario'];
    tabs.forEach(t => {
        document.getElementById('content-' + t).style.display = (t === tab) ? 'block' : 'none';
        document.getElementById('tab-' + t).classList.toggle('active', t === tab);
    });
    if (tab === 'materias') carregarHorariosMaterias();
    if (tab === 'recomendacao') {
        if (typeof preencherAvaliacaoProfessorBox === 'function') preencherAvaliacaoProfessorBox();
        if (typeof renderRecomendacoesProfessores === 'function') renderRecomendacoesProfessores();
    }
}


// Chame ao carregar a aba de matérias:
document.addEventListener('DOMContentLoaded', carregarHorariosMaterias);

function mostrarMateriaDetalhe(idx) {
    document.getElementById('materia-nome').innerText = materias[idx].nome;
    document.getElementById('materia-prof').innerText = materias[idx].professor;
    document.getElementById('materia-conteudo').innerHTML = materias[idx].conteudo;
    document.getElementById('materia-detalhe').style.display = 'block';
    window.scrollTo({top: document.getElementById('content-materias').offsetTop-40, behavior:'smooth'});
}
function fecharMateriaDetalhe() {
    document.getElementById('materia-detalhe').style.display = 'none';
}

// Matérias dinâmicas do backend conforme o aluno logado
async function carregarHorariosMaterias() {
  const alunoId = localStorage.getItem('alunoId');
  if (!alunoId) return;

  try {
    const res = await fetch(`http://34.174.93.50:3000/alunos/${alunoId}/horarios`);
    if (!res.ok) throw new Error('Erro ao buscar horários');
    const horarios = await res.json();

    // Filtrar duplicatas por matéria + dia
    const materiasUnicas = [];
    const chaves = new Set();

    horarios.forEach(h => {
      const chave = `${h.materia}-${h.dia}`;
      if (!chaves.has(chave)) {
        chaves.add(chave);
        materiasUnicas.push(h);
      }
    });

    const tabela = document.getElementById('materias-horarios-tabela');
    if (!tabela) {
      console.error('Elemento materias-horarios-tabela não encontrado!');
      return;
    }
    tabela.innerHTML = '';

    materiasUnicas.forEach(h => {
      const bloco = document.createElement('div');
      bloco.className = 'dia-bloco';
      bloco.innerHTML = `
        <div class="dia-nome">${h.dia}</div>
        <div class="materia-info">
          <span class="materia-nome">${h.materia}</span>
          <span class="materia-horario">${h.horario}</span>
          <span class="materia-turma">Turma: ${h.turma}</span>
          <span class="materia-faltas">Faltas: ${h.faltas}</span>
          <span class="materia-campus">${h.campus}</span>
          <span class="materia-professor">Prof. ${h.professor}</span>
        </div>
      `;
      tabela.appendChild(bloco);
    });

  } catch (err) {
    console.error('Erro ao carregar horários:', err);
    document.getElementById('materias-horarios-tabela').innerHTML = '<div>Erro ao carregar horários.</div>';
  }
}

//Aba Faltas e Menções
document.addEventListener('DOMContentLoaded', async function () {
  const alunoId = localStorage.getItem('alunoId');
  if (!alunoId) return;

  try {
    const res = await fetch(`http://34.174.93.50:3000/alunos/${alunoId}/faltas-mencoes`);
    if (!res.ok) throw new Error('Erro ao buscar faltas e menções');
    const dados = await res.json();

    const tbody = document.querySelector('#faltas-mencoes-table tbody');
    tbody.innerHTML = '';

    dados.forEach(item => {
      const tr = document.createElement('tr');
      // Tenta usar o campo correto para o nome da matéria
      const nomeMateria = item.disciplina || item.materia || item.nome || '--';
      tr.innerHTML = `
        <td>${nomeMateria}</td>
        <td class="faltas-verde">${item.faltas ?? '--'}</td>
        <td class="mencao-verde">${item.mencao ?? '--'}</td>
        <td>--</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error('Erro ao carregar faltas e menções:', err);
    document.querySelector('#faltas-mencoes-table tbody').innerHTML = `
      <tr><td colspan="4">Erro ao carregar dados.</td></tr>
    `;
  }
});

// Sidebar moderna com overlay
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    let overlay = document.getElementById('sidebar-overlay');
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');

    // Cria overlay se não existir
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('active');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }

    toggleSidebarBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (sidebar.classList.contains('open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    overlay.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeSidebar();
    });

    sidebar.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', closeSidebar);
    });

    sidebar.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function () {
            sidebar.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
});
document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('calendar')) return;

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    let today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();
    let events = JSON.parse(localStorage.getItem('calendarEvents') || '{}');

    function renderCalendar(month, year) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const tbody = document.querySelector('#calendar tbody');
        tbody.innerHTML = '';
        document.getElementById('calendar-month-year').textContent = `${monthNames[month]} ${year}`;

        let date = 1;
        for (let i = 0; i < 6; i++) {
            let row = document.createElement('tr');
            for (let j = 0; j < 7; j++) {
                let cell = document.createElement('td');
                if (i === 0 && j < firstDay) {
                    cell.innerHTML = '';
                } else if (date > daysInMonth) {
                    cell.innerHTML = '';
                } else {
                    cell.textContent = date;
                    let dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                    if (dateStr === formatDate(today)) cell.classList.add('today');
                    if (events[dateStr] && events[dateStr].length > 0) cell.classList.add('has-event');
                    cell.onclick = function() { openEventModal(dateStr); };
                    date++;
                }
                row.appendChild(cell);
            }
            tbody.appendChild(row);
            if (date > daysInMonth) break;
        }
    }

    function formatDate(date) {
        return date.toISOString().slice(0,10);
    }

    document.getElementById('prev-month').onclick = function () {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    };
    document.getElementById('next-month').onclick = function () {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    };

    let dataSelecionada = null;

    function openEventModal(dateStr) {
        dataSelecionada = dateStr;
        document.getElementById('evento-data').value = dateStr;
        document.getElementById('evento-titulo').value = '';
        document.getElementById('evento-descricao').value = '';
        document.getElementById('modal-evento').classList.add('active');
        document.getElementById('evento-titulo').focus();
    }

    // Fechar modal
    function fecharModalEvento() {
        document.getElementById('modal-evento').classList.remove('active');
    }

    // Eventos do modal
    document.getElementById('fechar-modal-evento').onclick = fecharModalEvento;
    document.getElementById('cancelar-modal-evento').onclick = fecharModalEvento;

    // Submissão do formulário do modal
    document.getElementById('form-evento').onsubmit = function(e) {
        e.preventDefault();
        const titulo = document.getElementById('evento-titulo').value.trim();
        const descricao = document.getElementById('evento-descricao').value.trim();
        if (titulo && dataSelecionada) {
            if (!events[dataSelecionada]) events[dataSelecionada] = [];
            events[dataSelecionada].push({ title: titulo, desc: descricao });
            localStorage.setItem('calendarEvents', JSON.stringify(events));
            fecharModalEvento();
            renderCalendar(currentMonth, currentYear);
            showEventList();
        }
    };

    function showEventList() {
        const eventList = document.getElementById('event-list');
        const dates = Object.keys(events).sort();
        let html = '<h2 style="margin-bottom:10px;">Eventos Agendados:</h2>';
        if (dates.length === 0) {
            html += '<p style="color:#888;">Nenhum evento cadastrado.</p>';
        } else {
            html += '<ul class="event-list-modern">';
            dates.forEach(date => {
                events[date].forEach((ev, idx) => {
                    html += `
                    <li>
                        <span class="event-date"><i class="fa-regular fa-calendar"></i> ${date}</span>
                        <span class="event-title">${ev.title}</span>
                        ${ev.desc ? `<span class="event-desc">${ev.desc}</span>` : ''}
                        <button class="event-remove" onclick='removeEvent("${date}",${idx})'><i class="fa-solid fa-trash"></i> Remover</button>
                    </li>`;
                });
            });
            html += '</ul>';
        }
        eventList.innerHTML = html;
    }

    window.removeEvent = function(date, idx) {
        if (events[date]) {
            events[date].splice(idx, 1);
            if (events[date].length === 0) delete events[date];
            localStorage.setItem('calendarEvents', JSON.stringify(events));
            renderCalendar(currentMonth, currentYear);
            showEventList();
        }
    };

    renderCalendar(currentMonth, currentYear);
    showEventList();
});

document.addEventListener('DOMContentLoaded', async function () {
    // Recupera o usuário logado do localStorage
    const usuario = localStorage.getItem('alunoId');

    // Busca os dados completos do aluno no backend (caso precise de mais campos)
    try {
        const res = await fetch(`http://34.174.93.50:3000/alunos/${usuario}`);
        if (!res.ok) throw new Error('Erro ao buscar aluno');
        const aluno = await res.json();

        if(document.getElementById('aluno-foto')) document.getElementById('aluno-foto').src = aluno.foto || '../images/aluno_perfil.jpg';
        if(document.getElementById('nome')) document.getElementById('nome').textContent = aluno.nome || '--';
        if(document.getElementById('email')) document.getElementById('email').textContent = aluno.email || '--';
        if(document.getElementById('campus')) document.getElementById('campus').textContent = aluno.campus || '--';
        if(document.getElementById('turno')) document.getElementById('turno').textContent = aluno.turno || '--';
        if(document.getElementById('matricula')) document.getElementById('matricula').textContent = aluno.matricula || '--';
        if(document.getElementById('curso')) document.getElementById('curso').textContent = aluno.curso || '--';
    } catch (err) {
        alert('Erro ao carregar dados do aluno.');
    }
});
document.addEventListener('DOMContentLoaded', async function () {
    if (document.getElementById('metricsChart')) {
        try {
            const usuario = localStorage.getItem('alunoId');
            // Busque as métricas diretamente do endpoint de métricas
            const res = await fetch(`http://34.174.93.50:3000/alunos/${usuario}/metricas`);
            if (!res.ok) throw new Error('Erro ao buscar métricas');
            const metricas = await res.json();

            console.log('Métricas recebidas:', metricas);

            const ctx = document.getElementById('metricsChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Presença', 'Notas', 'Desempenho'],
                    datasets: [{
                        label: 'Métricas (%)',
                        data: [
                            metricas.presenca ?? 0,
                            metricas.notas ?? 0,
                            metricas.desempenho ?? 0
                        ],
                        backgroundColor: ['#4CAF50', '#FF9800', '#2196F3'],
                        borderColor: ['#388E3C', '#F57C00', '#1976D2'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    indexAxis: 'y',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(tooltipItem) {
                                    return tooltipItem.raw + '%';
                                }
                            }
                        }
                    },
                    scales: {
                        x: { beginAtZero: true, max: 100 }
                    }
                }
            });
        } catch (err) {
            console.error('Erro ao carregar métricas do aluno.', err);
        }
    }
});

/*
    // Exemplo de como importar os dados do banco de dados futuramente:
    fetch('/api/aluno/metricas')
        .then(res => res.json())
        .then(data => {
            // data = { foto, nome, email, campus, turno, matricula, curso, metricas: {presenca, notas, desempenho} }
            // Preencher os campos e atualizar o gráfico conforme acima
        });
    */

let rankingCompleto = [];

async function carregarRankingAlunos() {
    const res = await fetch('http://34.174.93.50:3000/ranking/alunos');
    rankingCompleto = await res.json();
    preencherFiltros(rankingCompleto);
    filtrarRankingVisual();
}

function preencherFiltros(ranking) {
    // Preenche cursos
    const cursos = [...new Set(ranking.map(a => a.curso))];
    const selectCurso = document.getElementById('filtro-curso');
    selectCurso.innerHTML = '<option value="">Todos</option>';
    cursos.forEach(curso => {
        const opt = document.createElement('option');
        opt.value = curso;
        opt.textContent = curso;
        selectCurso.appendChild(opt);
    });

    // Preenche turmas (opcional, se existir campo turma)
    const turmas = [...new Set(rankingCompleto.map(a => a.turma).filter(Boolean))];
    const selectTurma = document.getElementById('filtro-turma');
    selectTurma.innerHTML = '<option value="">Todas</option>';
    turmas.forEach(turma => {
        const opt = document.createElement('option');
        opt.value = turma;
        opt.textContent = turma;
        selectTurma.appendChild(opt);
    });

    selectCurso.addEventListener('change', filtrarRankingVisual);
    selectTurma.addEventListener('change', filtrarRankingVisual);
}

async function filtrarRankingVisual() {
    const curso = document.getElementById('filtro-curso').value;
    const turma = document.getElementById('filtro-turma').value;
    let filtrado = rankingCompleto;

    if (curso) filtrado = filtrado.filter(a => a.curso === curso);
    if (turma) filtrado = filtrado.filter(a => a.turma === turma);

    const tabela = document.getElementById('tabela-ranking-alunos');
    tabela.innerHTML = '';
    let pos = 1;
    for (let aluno of filtrado) {
        let avaliacao = '--';
        try {
            const avalRes = await fetch(`http://34.174.93.50:3000/alunos/${aluno.id}/avaliacoes`);
            const avaliacoes = await avalRes.json();
            if (avaliacoes.length > 0) {
                const maisFrequente = avaliacoes.reduce((acc, curr) => {
                    acc[curr.avaliacao_professor] = (acc[curr.avaliacao_professor] || 0) + 1;
                    return acc;
                }, {});
                avaliacao = Object.entries(maisFrequente).sort((a, b) => b[1] - a[1])[0][0];
            }
        } catch (err) {
            console.warn('Erro ao buscar avaliação do aluno ID:', aluno.id);
        }
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${pos++}</td>
            <td>${aluno.nome}</td>
            <td>${aluno.curso}</td>
            <td>${aluno.media_notas}</td>
            <td>${avaliacao}</td>
        `;
        tabela.appendChild(tr);
    }

    // Gráfico de barras horizontal com os dados do ranking exibido
    if (window.rankingChart && typeof window.rankingChart.destroy === 'function') {
        window.rankingChart.destroy();
    }
    const nomes = filtrado.map(a => a.nome);
    const medias = filtrado.map(a => a.media_notas);

    // Destroi gráfico anterior, se existir
    if (window.rankingBarChart && typeof window.rankingBarChart.destroy === 'function') {
        window.rankingBarChart.destroy();
    }

    const ctxBar = document.getElementById('rankingBarChart').getContext('2d');
    const chartHeight = Math.min(Math.max(filtrado.length * 50, 400), 900);
    document.getElementById('rankingBarChart').height = chartHeight;

    window.rankingBarChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: nomes,
            datasets: [{
                label: 'Média',
                data: medias,
                backgroundColor: '#6A0DAD'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { beginAtZero: true, max: 10 }
            }
        }
    });

}

document.addEventListener('DOMContentLoaded', carregarRankingAlunos);


// Preencher filtros de turma e professor
const filtroTurma = document.getElementById('filtro-turma');

// Atualiza filtro de professor conforme turma selecionada
function updateFiltroProfessorMen() {
    filtroProfessor.innerHTML = '';
    const turmaSelecionada = filtroTurma.value;
    const turmaObj = turmas.find(t => t.nome === turmaSelecionada);
    if (!turmaObj) return;
    turmaObj.materias.forEach(materia => {
        const opt = document.createElement('option');
        opt.value = materia;
        opt.textContent = professoresPorMateria[materia] || materia;
        filtroProfessor.appendChild(opt);
    });
}
filtroTurma.addEventListener('change', () => {
    updateFiltroProfessorMen();
    renderPieChartWithFilters();
});

// Função para renderizar o gráfico de pizza menções com filtros usando dados do backend
async function renderPieChartWithFilters() {
    const cursoSelecionado = document.getElementById('filtro-curso-pizza').value;
    const professorSelecionado = document.getElementById('filtro-professor-pizza')?.value;

    let alunosFiltrados = rankingCompleto;
    if (cursoSelecionado) {
        alunosFiltrados = alunosFiltrados.filter(a => a.curso === cursoSelecionado);
    }

    let mencoes = { 'Excelente': 0, 'Bom': 0, 'Regular': 0, 'Insuficiente': 0 };

    for (const aluno of alunosFiltrados) {
        try {
            const res = await fetch(`http://34.174.93.50:3000/alunos/${aluno.id}/faltas-mencoes`);
            if (!res.ok) continue;
            const materias = await res.json();

            materias.forEach(m => {
                const professor = m.professor;
                const mencao = m.mencao;

                if (professorSelecionado && professor !== professorSelecionado) return;

                if (['SS', 'MS'].includes(mencao)) mencoes['Excelente']++;
                else if (mencao === 'MM') mencoes['Bom']++;
                else if (['MI', 'II'].includes(mencao)) mencoes['Regular']++;
                else mencoes['Insuficiente']++;
            });
        } catch (err) {
            console.error('[Erro gráfico de menções]', err);
        }
    }

    const totalMen = Object.values(mencoes).reduce((a, b) => a + b, 0);
    if (totalMen === 0) return;

    if (window.aproveitamentoChart && typeof window.aproveitamentoChart.destroy === 'function') {
        window.aproveitamentoChart.destroy();
    }

    const ctx = document.getElementById('aproveitamentoChart');
    if (!ctx) return;

    window.aproveitamentoChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Excelente (SS, MS)', 'Bom (MM)', 'Regular (MI, II)', 'Insuficiente (outras)'],
            datasets: [{
                data: [
                    mencoes['Excelente'],
                    mencoes['Bom'],
                    mencoes['Regular'],
                    mencoes['Insuficiente']
                ],
                backgroundColor: ['#4CAF50', '#1976D2', '#FFC107', '#F44336']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: {
                    display: true,
                    text: 'Distribuição de Menções por Professor'
                }
            }
        }
    });
}

// Filtros do gráfico de pizza: IDs corretos
function preencherFiltrosPizza() {
    const selectCursoPizza = document.getElementById('filtro-curso-pizza');
    const cursos = [...new Set(rankingCompleto.map(a => a.curso).filter(Boolean))];
    if (!selectCursoPizza) return;
    selectCursoPizza.innerHTML = '<option value="">Todos</option>';
    cursos.forEach(curso => {
        const opt = document.createElement('option');
        opt.value = curso;
        opt.textContent = curso;
        selectCursoPizza.appendChild(opt);
    });
    selectCursoPizza.addEventListener('change', preencherFiltroProfessorPizza);
    preencherFiltroProfessorPizza();
}

async function preencherFiltroProfessorPizza() {
    const selectCursoPizza = document.getElementById('filtro-curso-pizza');
    const selectProfessorPizza = document.getElementById('filtro-professor-pizza');
    if (!selectCursoPizza || !selectProfessorPizza) return;
    const cursoSelecionado = selectCursoPizza.value;
    const alunosCurso = rankingCompleto.filter(a => !cursoSelecionado || a.curso === cursoSelecionado);
    let professores = new Set();
    for (const aluno of alunosCurso) {
        try {
            const res = await fetch(`http://34.174.93.50:3000/alunos/${aluno.id}/horarios`);
            if (res.ok) {
                const dados = await res.json();
                dados.forEach(m => {
                    if (m.professor) professores.add(m.professor);
                });
            }
        } catch (err) {}
    }
    selectProfessorPizza.innerHTML = '';
    Array.from(professores).forEach(prof => {
        const opt = document.createElement('option');
        opt.value = prof;
        opt.textContent = prof;
        selectProfessorPizza.appendChild(opt);
    });
    renderPieChartWithFilters();
}

document.addEventListener('DOMContentLoaded', preencherFiltrosPizza);
const selectProfessorPizza = document.getElementById('filtro-professor-pizza');
if (selectProfessorPizza) selectProfessorPizza.addEventListener('change', renderPieChartWithFilters);

// Atualize a função do gráfico para usar os filtros corretos
async function renderPieChartWithFilters() {
    const selectCursoPizza = document.getElementById('filtro-curso-pizza');
    const selectProfessorPizza = document.getElementById('filtro-professor-pizza');
    if (!selectCursoPizza || !selectProfessorPizza) return;
    const cursoSelecionado = selectCursoPizza.value;
    const professorSelecionado = selectProfessorPizza.value;
    let alunos = rankingCompleto.filter(a => (!cursoSelecionado || a.curso === cursoSelecionado));
    let mencoes = { 'Excelente': 0, 'Bom': 0, 'Regular': 0, 'Insuficiente': 0 };
    for (const aluno of alunos) {
        try {
            const res = await fetch(`http://34.174.93.50:3000/alunos/${aluno.id}/horarios`);
            if (!res.ok) continue;
            const materias = await res.json();
            materias.filter(m => m.professor === professorSelecionado).forEach(materia => {
                // Se vier nota, use nota. Se vier mencao, converta para nota
                let nota = materia.nota;
                if (nota === undefined && materia.mencao) {
                    switch (materia.mencao) {
                        case 'MM': nota = 7; break;
                        case 'MS': nota = 8; break;
                        case 'SS': nota = 9; break;
                        case 'MI': nota = 5; break;
                        case 'II': nota = 3; break;
                        default: nota = 0;
                    }
                }
                if (typeof nota === 'number') {
                    if (nota >= 9) mencoes['Excelente']++;
                    else if (nota >= 7) mencoes['Bom']++;
                    else if (nota >= 5) mencoes['Regular']++;
                    else mencoes['Insuficiente']++;
                }
            });
        } catch (err) {}
    }
    if (window.aproveitamentoChart && typeof window.aproveitamentoChart.destroy === 'function') window.aproveitamentoChart.destroy();
    window.aproveitamentoChart = new Chart(document.getElementById('aproveitamentoChart'), {
        type: 'pie',
        data: {
            labels: ['Excelente (≥9)', 'Bom (≥7)', 'Regular (≥5)', 'Insuficiente (<5)'],
            datasets: [{
                data: [
                    mencoes['Excelente'],
                    mencoes['Bom'],
                    mencoes['Regular'],
                    mencoes['Insuficiente']
                ],
                backgroundColor: ['#4CAF50', '#1976D2', '#FFB300', '#F44336']
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Distribuição de Menções' },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value} aluno(s)`;
                        }
                    }
                }
            }
        }
    });
}

// Corrigir tabela de recomendação para mostrar apenas professores que realmente lecionam cada matéria
async function renderRecomendacoesProfessores() {
    const tbody = document.querySelector('#tabela-recomendacoes tbody');
    tbody.innerHTML = '';
    try {
        // Buscar professores e matérias do backend
        const [profRes, matRes] = await Promise.all([
            fetch('http://34.174.93.50:3000/professores'),
            fetch('http://34.174.93.50:3000/materias')
        ]);
        const professores = profRes.ok ? await profRes.json() : [];
        const materias = matRes.ok ? await matRes.json() : [];
        // Buscar relação professores-materias
        const relRes = await fetch('http://34.174.93.50:3000/professores-materias');
        const relacoes = relRes.ok ? await relRes.json() : [];
        // Exemplo: montar tabela apenas para professores que lecionam cada matéria
        relacoes.forEach(rel => {
            const prof = professores.find(p => p.id === rel.professor_id);
            const mat = materias.find(m => m.id === rel.materia_id);
            if (prof && mat) {
                // Padronizar chave: "Matéria - Professor"
                const chave = mat.nome + ' - ' + prof.nome;
                let media = '--';
                if (window.recomendacoes && window.recomendacoes[chave]) {
                    media = window.recomendacoes[chave];
                }
                // Renderizar estrelas visuais (simuladas se não houver avaliação)
                let nota;
                if (media !== '--') {
                    nota = parseInt(media);
                } else {
                    // Simula uma nota aleatória entre 2 e 5 para cada professor/matéria
                    // Usa um hash simples para manter "consistência" visual
                    const hash = (prof.nome + mat.nome).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                    nota = 2 + (hash % 4); // 2, 3, 4 ou 5
                }
                let estrelasHTML = '';
                for (let i = 1; i <= 5; i++) {
                    estrelasHTML += `<span style="color:${i <= nota ? '#FFD700' : '#ccc'};font-size:1.3em;">★</span>`;
                }
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${prof.nome}</td>
                    <td>${mat.nome}</td>
                    <td>${estrelasHTML}</td>
                `;
                tbody.appendChild(tr);
            }
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="3">Erro ao carregar professores, matérias ou relações.</td></tr>';
    }
}

// Ativa o popup ao clicar no ícone de recomendação na aba matérias
function ativarRecomendacaoBtns() {
    document.querySelectorAll('.recomendacao-btn').forEach(btn => {
        btn.onclick = function (e) {
            e.stopPropagation();
            const materia = this.getAttribute('data-materia');
            let professor = this.parentElement?.innerText?.replace(/\n/g, '').trim() || '';
            if (!professor && typeof professoresPorMateria === 'object') {
                professor = professoresPorMateria[materia] || '';
            }
            popupRecomendacaoEstrelas(materia, professor);
        };
    });
}

function popupRecomendacaoEstrelas(materia, professor) {
    const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
            confirmButton: "btn btn-success",
            cancelButton: "btn btn-danger"
        },
        buttonsStyling: false
    });

    let nota = 0;
    swalWithBootstrapButtons.fire({
        title: `Avalie o professor<br><b>${professor}</b>`,
        html: `
            <div id="swal-estrelas" style="font-size:2.2em; margin: 12px 0;">
                <span class="swal-estrela" data-estrela="1" style="cursor:pointer;color:#ccc;">★</span>
                <span class="swal-estrela" data-estrela="2" style="cursor:pointer;color:#ccc;">★</span>
                <span class="swal-estrela" data-estrela="3" style="cursor:pointer;color:#ccc;">★</span>
                <span class="swal-estrela" data-estrela="4" style="cursor:pointer;color:#ccc;">★</span>
                <span class="swal-estrela" data-estrela="5" style="cursor:pointer;color:#ccc;">★</span>
            </div>
            <div style="font-size:0.95em;color:#888;">Clique para dar de 0 a 5 estrelas</div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Salvar",
        cancelButtonText: "Cancelar",
        reverseButtons: true,
        focusConfirm: false,
        didOpen: () => {
            const estrelas = Swal.getHtmlContainer().querySelectorAll('.swal-estrela');
            estrelas.forEach((star, idx) => {
                star.addEventListener('mouseenter', function () {
                    estrelas.forEach((s, i) => s.style.color = i <= idx ? '#FFD700' : '#ccc');
                });
                star.addEventListener('mouseleave', function () {
                    estrelas.forEach((s, i) => s.style.color = i < nota ? '#FFD700' : '#ccc');
                });
                star.addEventListener('click', function () {
                    nota = idx + 1;
                    estrelas.forEach((s, i) => s.style.color = i < nota ? '#FFD700' : '#ccc');
                    Swal.enableConfirmButton();
                });
            });
            Swal.disableConfirmButton();
        },
        preConfirm: () => {
            return nota;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            recomendacoes[materia] = result.value;
            swalWithBootstrapButtons.fire({
                title: "Recomendação salva!",
                text: `Você recomendou ${result.value} estrela(s) para ${professor}.`,
                icon: "success"
            });
            renderRecomendacoesProfessores();
        }
    });
}

// BLOCO COMPLETO DE AVALIAÇÃO DE PROFESSORES E RENDERIZAÇÃO

let professores = [];
let materias = [];
let materiasPorProfessor = {}; // Ex: { 'Lucas Martins': ['Matéria A', 'Matéria B'] }

// Preenche selects e estrelas
async function preencherAvaliacaoProfessorBox() {
    const selectProf = document.getElementById('select-professor');
    const selectMat = document.getElementById('select-materia');
    const estrelasSpan = document.getElementById('avaliacao-estrelas');
    selectProf.innerHTML = '';
    selectMat.innerHTML = '';
    let nota = 0;

    try {
        const [resProf, resMat] = await Promise.all([
            fetch('http://34.174.93.50:3000/professores'),
            fetch('http://34.174.93.50:3000/materias')
        ]);

        professores = await resProf.json();
        materias = await resMat.json();

        materiasPorProfessor = {};
        professores.forEach(p => {
            materiasPorProfessor[p.nome] = materias.map(m => m.nome);
        });

        professores.forEach(prof => {
            const opt = document.createElement('option');
            opt.value = prof.nome;
            opt.textContent = prof.nome;
            selectProf.appendChild(opt);
        });

        function atualizarMaterias() {
            selectMat.innerHTML = '';
            const profSel = selectProf.value;
            const materiasDoProf = materiasPorProfessor[profSel] || [];
            materiasDoProf.forEach(mat => {
                const opt = document.createElement('option');
                opt.value = mat;
                opt.textContent = mat;
                selectMat.appendChild(opt);
            });
            atualizarEstrelas();
        }

        function atualizarEstrelas() {
            estrelasSpan.innerHTML = '';
            for (let i = 1; i <= 5; i++) {
                const star = document.createElement('span');
                star.textContent = i <= nota ? '★' : '☆';
                star.style.color = i <= nota ? '#FFD700' : '#ccc';
                star.style.cursor = 'pointer';
                star.onclick = () => {
                    nota = i;
                    atualizarEstrelas();
                };
                estrelasSpan.appendChild(star);
            }
        }

        selectProf.onchange = atualizarMaterias;
        selectMat.onchange = atualizarEstrelas;

        atualizarMaterias();

        document.getElementById('form-avaliar-prof').onsubmit = function (e) {
            e.preventDefault();
            const materia = selectMat.value;
            const professor = selectProf.value;
            if (nota === 0) {
                estrelasSpan.style.animation = 'shake 0.2s';
                setTimeout(() => estrelasSpan.style.animation = '', 250);
                return;
            }
            const chave = `${materia} - ${professor}`;
            recomendacoes[chave] = nota;
            document.getElementById('avaliacao-feedback').style.display = 'block';
            setTimeout(() => document.getElementById('avaliacao-feedback').style.display = 'none', 1800);
            renderRecomendacoesProfessores();
        };

    } catch (err) {
        console.error('[ERRO] Falha ao carregar professores/matérias:', err);
    }
}

// Renderiza tabela com recomendações
async function renderRecomendacoesProfessores() {
    const tbody = document.querySelector('#tabela-recomendacoes tbody');
    tbody.innerHTML = '';
    try {
        // Buscar professores e matérias do backend
        const [profRes, matRes] = await Promise.all([
            fetch('http://34.174.93.50:3000/professores'),
            fetch('http://34.174.93.50:3000/materias')
        ]);
        const professores = profRes.ok ? await profRes.json() : [];
        const materias = matRes.ok ? await matRes.json() : [];
        // Buscar relação professores-materias
        const relRes = await fetch('http://34.174.93.50:3000/professores-materias');
        const relacoes = relRes.ok ? await relRes.json() : [];
        // Exemplo: montar tabela apenas para professores que lecionam cada matéria
        relacoes.forEach(rel => {
            const prof = professores.find(p => p.id === rel.professor_id);
            const mat = materias.find(m => m.id === rel.materia_id);
            if (prof && mat) {
                // Padronizar chave: "Matéria - Professor"
                const chave = mat.nome + ' - ' + prof.nome;
                let media = '--';
                if (window.recomendacoes && window.recomendacoes[chave]) {
                    media = window.recomendacoes[chave];
                }
                // Renderizar estrelas visuais (simuladas se não houver avaliação)
                let nota;
                if (media !== '--') {
                    nota = parseInt(media);
                } else {
                    // Simula uma nota aleatória entre 2 e 5 para cada professor/matéria
                    // Usa um hash simples para manter "consistência" visual
                    const hash = (prof.nome + mat.nome).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                    nota = 2 + (hash % 4); // 2, 3, 4 ou 5
                }
                let estrelasHTML = '';
                for (let i = 1; i <= 5; i++) {
                    estrelasHTML += `<span style="color:${i <= nota ? '#FFD700' : '#ccc'};font-size:1.3em;">★</span>`;
                }
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${prof.nome}</td>
                    <td>${mat.nome}</td>
                    <td>${estrelasHTML}</td>
                `;
                tbody.appendChild(tr);
            }
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="3">Erro ao carregar professores, matérias ou relações.</td></tr>';
    }
}

// Chamar no onload ou init da aba recomendação
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('select-professor')) {
        preencherAvaliacaoProfessorBox();
    }
});

// Chame ao abrir a aba recomendação
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('avaliacao-professor-box')) preencherAvaliacaoProfessorBox();
});
if (typeof showTab === 'function') {
    const oldShowTab = showTab;
    window.showTab = function (tab) {
        oldShowTab(tab);
        if (tab === 'recomendacao' && typeof preencherAvaliacaoProfessorBox === 'function') {
            preencherAvaliacaoProfessorBox();
        }
        if (tab === 'recomendacao' && typeof renderRecomendacoesProfessores === 'function') {
            renderRecomendacoesProfessores();
        }
    }
}

// Logout funcional
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) logoutBtn.addEventListener('click', function (e) {
    e.preventDefault();
    window.location.href = 'login.html';
});

// Modal Sobre Nós
document.addEventListener('DOMContentLoaded', function () {
    // Seleciona o botão "Sobre nós" na sidebar
    const sobreBtn = Array.from(document.querySelectorAll('.nav-link')).find(link =>
        link.textContent.trim().toLowerCase().includes('sobre nós')
    );
    const modal = document.getElementById('sobre-nos-modal');
    const fecharBtn = document.getElementById('fechar-sobre-nos-modal');

    if (sobreBtn && modal && fecharBtn) {
        sobreBtn.addEventListener('click', function (e) {
            e.preventDefault();
            modal.style.display = 'flex';
        });
        fecharBtn.addEventListener('click', function () {
            modal.style.display = 'none';
        });
        modal.addEventListener('click', function (e) {
            if (e.target === modal) modal.style.display = 'none';
        });
    }
});

