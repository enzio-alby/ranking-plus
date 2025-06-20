// Função para alternar abas
function showTab(tab) {
    const tabs = ['ranking', 'materias', 'faltas', 'calendario'];
    tabs.forEach(t => {
        document.getElementById('content-' + t).style.display = (t === tab) ? 'block' : 'none';
        document.getElementById('tab-' + t).classList.toggle('active', t === tab);
    });
}

// Matérias
const materias = [
    {
        nome: 'Algoritmos e Lógica de Programação',
        professor: 'Prof. João Martins',
        conteudo: '<ul><li>Introdução à lógica</li><li>Fluxogramas</li><li>Estruturas condicionais e de repetição</li><li>Exercícios práticos em pseudocódigo</li></ul>'
    },
    {
        nome: 'Estruturas de Dados',
        professor: 'Prof. Maria Clara',
        conteudo: '<ul><li>Listas, Pilhas e Filas</li><li>Árvores e Grafos</li><li>Algoritmos de busca e ordenação</li></ul>'
    },
    {
        nome: 'Banco de Dados',
        professor: 'Prof. Pedro Henrique',
        conteudo: '<ul><li>Modelo relacional</li><li>SQL básico e avançado</li><li>Normalização</li><li>Projeto de banco de dados</li></ul>'
    },
    {
        nome: 'Programação Orientada a Objetos',
        professor: 'Prof. Larissa Souza',
        conteudo: '<ul><li>Conceitos de classes e objetos</li><li>Herança e polimorfismo</li><li>Encapsulamento</li><li>Exercícios em Java</li></ul>'
    },
    {
        nome: 'Redes de Computadores',
        professor: 'Prof. Rafael Lima',
        conteudo: '<ul><li>Modelo OSI e TCP/IP</li><li>Protocolos de comunicação</li><li>Endereçamento IP</li><li>Prática de montagem de redes</li></ul>'
    },
    {
        nome: 'Sistemas Operacionais',
        professor: 'Prof. Camila Torres',
        conteudo: '<ul><li>Processos e threads</li><li>Gerenciamento de memória</li><li>Sistemas de arquivos</li><li>Linux na prática</li></ul>'
    },
    {
        nome: 'Engenharia de Software',
        professor: 'Prof. Bruno Silva',
        conteudo: '<ul><li>Modelos de desenvolvimento</li><li>UML</li><li>Testes de software</li><li>Gerenciamento de projetos</li></ul>'
    },
    {
        nome: 'Inteligência Artificial',
        professor: 'Prof. Juliana Castro',
        conteudo: '<ul><li>Introdução à IA</li><li>Machine Learning</li><li>Redes neurais</li><li>Projetos práticos</li></ul>'
    }
];

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

// Simulação de dados do aluno e métricas
document.addEventListener('DOMContentLoaded', function () {
    // Dados simulados do aluno
    const aluno = {
        foto: '../images/user.png',
        nome: 'João petronio',
        email: 'joao.silva@escola.com',
        campus: 'Taguatinga Norte',
        turno: 'Matutino',
        matricula: '123456789',
        curso: 'Engenharia de Software'
    };

    // Métricas simuladas
    const metricas = {
        presenca: 92,
        notas: 88,
        desempenho: 85
    };

    // Preenche os dados do aluno
    if(document.getElementById('aluno-foto')) document.getElementById('aluno-foto').src = aluno.foto;
    if(document.getElementById('aluno-nome')) document.getElementById('aluno-nome').textContent = aluno.nome;
    if(document.getElementById('aluno-email')) document.getElementById('aluno-email').textContent = aluno.email;
    if(document.getElementById('aluno-campus')) document.getElementById('aluno-campus').textContent = aluno.campus;
    if(document.getElementById('aluno-turno')) document.getElementById('aluno-turno').textContent = aluno.turno;
    if(document.getElementById('aluno-matricula')) document.getElementById('aluno-matricula').textContent = aluno.matricula;
    if(document.getElementById('aluno-curso')) document.getElementById('aluno-curso').textContent = aluno.curso;

    // Gráfico de métricas
    if(document.getElementById('metricsChart')) {
        const ctx = document.getElementById('metricsChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Presença', 'Notas', 'Desempenho'],
                datasets: [{
                    label: 'Métricas (%)',
                    data: [metricas.presenca, metricas.notas, metricas.desempenho],
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
    }

    /*
    // Exemplo de como importar os dados do banco de dados futuramente:
    fetch('/api/aluno/metricas')
        .then(res => res.json())
        .then(data => {
            // data = { foto, nome, email, campus, turno, matricula, curso, metricas: {presenca, notas, desempenho} }
            // Preencher os campos e atualizar o gráfico conforme acima
        });
    */
});

// Simulação de dados de ranking
const turmas = [
    { nome: "Turma A", curso: "Engenharia", materias: ["Matemática", "Física", "Química", "Programação", "Gestão"] },
    { nome: "Turma B", curso: "Administração", materias: ["Contabilidade", "Gestão", "Marketing", "RH", "Economia"] },
    { nome: "Turma C", curso: "Direito", materias: ["Civil", "Penal", "Trabalho", "Processual", "Constitucional"] },
    { nome: "Turma D", curso: "Medicina", materias: ["Anatomia", "Fisiologia", "Patologia", "Clínica", "Farmacologia"] }
];

function gerarAlunos(turma, materias) {
    const nomes = [
        "Ana Souza", "Bruno Lima", "Carlos Silva", "Daniela Castro", "Eduardo Alves",
        "Fernanda Rocha", "Gabriel Costa", "Helena Martins", "Igor Mendes", "Juliana Dias"
    ];
    return nomes.map((nome, idx) => {
        let notas = {}, faltas = {}, avals = {};
        materias.forEach(m => {
            notas[m] = +(Math.random() * 6 + 4).toFixed(2); // 4 a 10
            faltas[m] = Math.floor(Math.random() * 10);
            avals[m] = +(Math.random() * 2 + 3).toFixed(2); // 3 a 5
        });
        return {
            nome: nome,
            turma: turma,
            notas,
            faltas,
            avals
        };
    });
}

const dadosTurmas = turmas.map(t => ({
    ...t,
    alunos: gerarAlunos(t.nome, t.materias)
}));

// DOM Elements
const turmaSelect = document.getElementById('turma-select');
const materiaSelect = document.getElementById('materia-select');
const rankingTable = document.getElementById('ranking-table').querySelector('tbody');
let rankingChart;
let aproveitamentoChart;

// Preenche selects
turmas.forEach((t, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${t.nome} - ${t.curso}`;
    turmaSelect.appendChild(opt);
});
function updateMaterias() {
    materiaSelect.innerHTML = "";
    const turmaIdx = turmaSelect.value;
    turmas[turmaIdx].materias.forEach((m, i) => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        materiaSelect.appendChild(opt);
    });
}
turmaSelect.addEventListener('change', () => {
    updateMaterias();
    renderRanking();
});
materiaSelect.addEventListener('change', renderRanking);
updateMaterias();

// Renderiza ranking
function renderRanking() {
    const turmaIdx = turmaSelect.value;
    const materia = materiaSelect.value;
    const turma = dadosTurmas[turmaIdx];
    // Ordena por média da matéria
    const alunos = turma.alunos.slice().sort((a, b) => b.notas[materia] - a.notas[materia]);
    rankingTable.innerHTML = "";
    alunos.forEach((aluno, idx) => {
        // Avaliação do professor em troféus (máx 3)
        const aval = aluno.avals[materia];
        let trofeus = '';
        const fullTrofeus = Math.round((aval - 3) / (2/3)); // 3 a 5 vira 0 a 3 troféus
        for (let i = 1; i <= 3; i++) {
            trofeus += `<img src="../images/trofeu.png" alt="Troféu" style="height:22px;vertical-align:middle;opacity:${i <= fullTrofeus ? 1 : 0.25};margin-right:2px;">`;
        }
        const nomePartes = aluno.nome.split(' ');
        const nomeSobrenome = nomePartes[0] + (nomePartes[1] ? ' ' + nomePartes[1] : '');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align:center">${idx+1}</td>
            <td>${nomeSobrenome}</td>
            <td>${aluno.turma}</td>
            <td style="text-align:center">${aluno.notas[materia].toFixed(2)}</td>
            <td style="text-align:center">${aluno.faltas[materia]}</td>
            <td style="text-align:center">${trofeus}</td>
        `;
        rankingTable.appendChild(tr);
    });

    // Gráfico de barras
    const nomes = alunos.map(a => a.nome);
    const medias = alunos.map(a => a.notas[materia]);
    const faltas = alunos.map(a => a.faltas[materia]);
    const avals = alunos.map(a => a.avals[materia]);
    if (rankingChart) rankingChart.destroy();
    rankingChart = new Chart(document.getElementById('rankingChart'), {
        type: 'bar',
        data: {
            labels: nomes,
            datasets: [
                { label: 'Média', data: medias, backgroundColor: '#6A0DAD' },
                { label: 'Faltas', data: faltas, backgroundColor: '#FFB300' },
                { label: 'Avaliação Prof.', data: avals, backgroundColor: '#1976D2' }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top' } },
            // Remova ou comente a linha abaixo para barras verticais (colunas):
            // indexAxis: 'y',
            scales: {
                y: { beginAtZero: true, max: 10 }
            }
        }
    });

    // Gráfico de pizza de Média de Menções (Notas)
    // Calcula a média das notas dos alunos para a matéria selecionada
    const mediaNota = alunos.reduce((acc, a) => acc + a.notas[materia], 0) / alunos.length;
    // Faixas de menção: Excelente (>=9), Bom (>=7), Regular (>=5), Insuficiente (<5)
    let mencoes = { 'Excelente': 0, 'Bom': 0, 'Regular': 0, 'Insuficiente': 0 };
    alunos.forEach(a => {
        if (a.notas[materia] >= 9) mencoes['Excelente']++;
        else if (a.notas[materia] >= 7) mencoes['Bom']++;
        else if (a.notas[materia] >= 5) mencoes['Regular']++;
        else mencoes['Insuficiente']++;
    });
    if (aproveitamentoChart) aproveitamentoChart.destroy();
    aproveitamentoChart = new Chart(document.getElementById('aproveitamentoChart'), {
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
                title: { display: true, text: 'Média de Menções por Matéria' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
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
renderRanking();

// Simulação de professores por matéria
const professoresPorMateria = {
    "Matemática": "Prof. João Martins",
    "Física": "Prof. Maria Clara",
    "Química": "Prof. Pedro Henrique",
    "Programação": "Prof. Larissa Souza",
    "Gestão": "Prof. Rafael Lima",
    "Contabilidade": "Prof. Camila Torres",
    "Marketing": "Prof. Bruno Silva",
    "RH": "Prof. Juliana Castro",
    "Economia": "Prof. Ana Paula",
    "Civil": "Prof. Lucas Mendes",
    "Penal": "Prof. Mariana Lopes",
    "Trabalho": "Prof. Felipe Rocha",
    "Processual": "Prof. Renata Dias",
    "Constitucional": "Prof. André Souza",
    "Anatomia": "Prof. Carla Martins",
    "Fisiologia": "Prof. Gustavo Lima",
    "Patologia": "Prof. Priscila Alves",
    "Clínica": "Prof. Rodrigo Silva",
    "Farmacologia": "Prof. Vanessa Costa"
};

// Adicione os filtros no HTML, logo acima do canvas do gráfico de pizza:
/*
<div id="filtros-mencoes" style="margin-bottom:12px;">
    <label for="filtro-turma">Turma:</label>
    <select id="filtro-turma"></select>
    <label for="filtro-professor" style="margin-left:12px;">Professor:</label>
    <select id="filtro-professor"></select>
</div>
*/

// Preencher filtros de turma e professor
const filtroTurma = document.getElementById('filtro-turma');
const filtroProfessor = document.getElementById('filtro-professor');

// Preenche filtro de turma
turmas.forEach((t, i) => {
    const opt = document.createElement('option');
    opt.value = t.nome;
    opt.textContent = t.nome;
    filtroTurma.appendChild(opt);
});

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
filtroProfessor.addEventListener('change', renderPieChartWithFilters);
updateFiltroProfessorMen();

// Função para renderizar o gráfico de menções com filtros
function renderPieChartWithFilters() {
    const turmaSelecionada = filtroTurma.value;
    const materiaSelecionada = filtroProfessor.value;
    // Busca a turma e alunos filtrados
    const turmaObj = dadosTurmas.find(t => t.nome === turmaSelecionada);
    if (!turmaObj) return;
    const alunos = turmaObj.alunos;
    // Calcula menções para a matéria/professor selecionado
    let mencoes = { 'Excelente': 0, 'Bom': 0, 'Regular': 0, 'Insuficiente': 0 };
    alunos.forEach(a => {
        const nota = a.notas[materiaSelecionada];
        if (nota >= 9) mencoes['Excelente']++;
        else if (nota >= 7) mencoes['Bom']++;
        else if (nota >= 5) mencoes['Regular']++;
        else mencoes['Insuficiente']++;
    });
    if (aproveitamentoChart) aproveitamentoChart.destroy();
    aproveitamentoChart = new Chart(document.getElementById('aproveitamentoChart'), {
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
                title: { display: true, text: 'Média de Menções por Matéria' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
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

// Chame a função ao carregar a página
renderPieChartWithFilters();

// Função para atualizar a imagem do perfil conforme o gênero
function atualizarImagemPerfil(genero) {
    const imgPerfil = document.getElementById('aluno-foto');
    if (!imgPerfil) return;
    if (genero === 'masculino') {
        imgPerfil.src = '../images/aluno_perfil.jpg';
    } else if (genero === 'feminino') {
        imgPerfil.src = '../images/aluna_perfil.jpg';
    } else {
        imgPerfil.src = '../images/user.png'; // padrão
    }
}

// Exemplo de uso: chame esta função ao carregar os dados do aluno
// atualizarImagemPerfil('masculino'); // ou 'feminino'

// Certifique-se de ter o SweetAlert2 incluído no HTML:

// Função para abrir o popup de recomendação com estrelas (0 a 5)
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
                star.addEventListener('mouseenter', function() {
                    estrelas.forEach((s, i) => s.style.color = i <= idx ? '#FFD700' : '#ccc');
                });
                star.addEventListener('mouseleave', function() {
                    estrelas.forEach((s, i) => s.style.color = i < nota ? '#FFD700' : '#ccc');
                });
                star.addEventListener('click', function() {
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

// Ativa o popup ao clicar no ícone de recomendação na aba matérias
function ativarRecomendacaoBtns() {
    document.querySelectorAll('.recomendacao-btn').forEach(btn => {
        btn.onclick = function(e) {
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

// Função para renderizar recomendações de professores
function renderRecomendacoesProfessores() {
    const tbody = document.getElementById('recomendacoes-table').querySelector('tbody');
    tbody.innerHTML = ''; // Limpa tabela existente

    // Gera as linhas da tabela com base nas recomendações
    for (const materia in recomendacoes) {
        if (recomendacoes.hasOwnProperty(materia)) {
            const nota = recomendacoes[materia];
            const professor = professoresPorMateria[materia] || 'Desconhecido';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${materia}</td>
                <td>${professor}</td>
                <td style="text-align:center">
                    ${'<i class="fa-solid fa-star" style="color:#FFD700;"></i>'.repeat(nota)}
                    ${'<i class="fa-solid fa-star" style="color:#ccc;"></i>'.repeat(5 - nota)}
                </td>
                <td style="text-align:center">
                    <button class="btn btn-primary avaliar-prof-btn" data-materia="${materia}" data-professor="${professor}">
                        <i class="fa-solid fa-pencil"></i> Avaliar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        }
    }

    // Adicione os listeners AQUI, após montar a tabela:
    document.querySelectorAll('.avaliar-prof-btn').forEach(btn => {
        btn.onclick = function(e) {
            e.stopPropagation();
            const materia = this.getAttribute('data-materia');
            const professor = this.getAttribute('data-professor');
            popupRecomendacaoEstrelas(materia, professor);
        };
    });
}

// Preenche selects e estrelas
function preencherAvaliacaoProfessorBox() {
    const selectProf = document.getElementById('select-professor');
    const selectMat = document.getElementById('select-materia');
    const estrelasSpan = document.getElementById('avaliacao-estrelas');
    selectProf.innerHTML = '';
    selectMat.innerHTML = '';
    // Preenche professores únicos
    const profs = [...new Set(Object.values(professoresPorMateria))];
    profs.forEach(prof => {
        const opt = document.createElement('option');
        opt.value = prof;
        opt.textContent = prof;
        selectProf.appendChild(opt);
    });
    // Preenche matérias do professor selecionado
    function atualizarMaterias() {
        selectMat.innerHTML = '';
        const profSel = selectProf.value;
        Object.entries(professoresPorMateria).forEach(([mat, prof]) => {
            if (prof === profSel) {
                const opt = document.createElement('option');
                opt.value = mat;
                opt.textContent = mat;
                selectMat.appendChild(opt);
            }
        });
        atualizarEstrelas();
    }
    selectProf.onchange = atualizarMaterias;
    selectMat.onchange = atualizarEstrelas;

    // Estrelas de avaliação
    
    let nota = 0;
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
    atualizarMaterias();

    // Envio do formulário
    document.getElementById('form-avaliar-prof').onsubmit = function(e) {
        e.preventDefault();
        const materia = selectMat.value;
        if (nota === 0) {
            estrelasSpan.style.animation = 'shake 0.2s';
            setTimeout(() => estrelasSpan.style.animation = '', 250);
            return;
        }
        recomendacoes[materia] = nota;
        document.getElementById('avaliacao-feedback').style.display = 'block';
        setTimeout(() => document.getElementById('avaliacao-feedback').style.display = 'none', 1800);
        renderRecomendacoesProfessores();
    };
}

// Chame ao abrir a aba recomendação
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('avaliacao-professor-box')) preencherAvaliacaoProfessorBox();
});
if (typeof showTab === 'function') {
    const oldShowTab = showTab;
    window.showTab = function(tab) {
        oldShowTab(tab);
        if(tab === 'recomendacao' && document.getElementById('avaliacao-professor-box')) {
            preencherAvaliacaoProfessorBox();
        }
    }
}

// CSS opcional para shake
// Adicione ao seu stylehomeprof.css;
/*
@keyframes shake {
    0% { transform: translateX(0);}
    25% { transform: translateX(-4px);}
    50% { transform: translateX(4px);}
    75% { transform: translateX(-4px);}
    100% { transform: translateX(0);}
}
*/

// Logout funcional
document.getElementById('logout-btn').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = 'login.html';
});



