function verAlunos(turma) {
    const alunosPorTurma = {
        'Turma A': ['Ana', 'Bruno', 'Carlos', 'Diana', 'Eduardo'],
        'Turma B': ['Fernanda', 'Gabriel', 'Helena', 'Igor', 'Juliana'],
        'Turma C': ['Karla', 'Lucas', 'Mariana', 'Nicolas', 'Olivia']
    };

    const listaAlunos = document.getElementById('listaAlunos');
    listaAlunos.innerHTML = '';

    alunosPorTurma[turma].forEach(aluno => {
        const li = document.createElement('li');
        li.textContent = aluno;
        listaAlunos.appendChild(li);
    });

    document.getElementById('modalAlunos').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function fecharModal() {
    document.getElementById('modalAlunos').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function abrirModalPonto() {
    document.getElementById('modalPonto').style.display = 'block';
    document.getElementById('overlayPonto').style.display = 'block';
}

function fecharModalPonto() {
    document.getElementById('modalPonto').style.display = 'none';
    document.getElementById('overlayPonto').style.display = 'none';
}

function registrarPonto() {
    const dia = document.getElementById('diaPonto').value;
    const presenca = document.getElementById('presenca').value;

    const icone = presenca === 'presente' ? '✔️' : '❌';
    alert(`Ponto registrado para ${dia}: ${icone}`);
    fecharModalPonto();
}

function voltarPagina() {
    window.location.href = "login.html";
}

function editarInformacoes() {
    alert("Funcionalidade de edição em desenvolvimento.");
}

function abrirMenu() {
    document.getElementById('menuLateral').classList.add('aberto');
}

function fecharMenu() {
    document.getElementById('menuLateral').classList.remove('aberto');
}

// Dados de exemplo (substitua pelos reais)
const turmasProfessor = [
    {
        nome: "Turma A",
        alunos: [
            { nome: "Ana Souza", trofeus: 2, obs: "" },
            { nome: "Bruno Lima", trofeus: 1, obs: "" }
        ]
    },
    {
        nome: "Turma B",
        alunos: [
            { nome: "Carlos Silva", trofeus: 3, obs: "" },
            { nome: "Daniela Castro", trofeus: 0, obs: "" }
        ]
    },
    {
        nome: "Turma C",
        alunos: [
            { nome: "Eduardo Alves", trofeus: 1, obs: "" },
            { nome: "Fernanda Dias", trofeus: 2, obs: "" }
        ]
    }
];

// Renderiza abas de turmas e alunos
function renderTurmasProfessor() {
    const abas = document.getElementById('prof-turmas-abas');
    const alunosDiv = document.getElementById('prof-turma-alunos');
    abas.innerHTML = '';
    turmasProfessor.forEach((turma, idx) => {
        const btn = document.createElement('button');
        btn.className = 'prof-turma-aba' + (idx === 0 ? ' active' : '');
        btn.textContent = turma.nome;
        btn.onclick = () => {
            document.querySelectorAll('.prof-turma-aba').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderAlunosTurma(idx);
        };
        abas.appendChild(btn);
    });
    renderAlunosTurma(0);
}

function renderAlunosTurma(idx) {
    const turma = turmasProfessor[idx];
    const alunosDiv = document.getElementById('prof-turma-alunos');
    alunosDiv.innerHTML = '';

    // Seletor de período e botão de envio
    alunosDiv.innerHTML += `
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
            <label for="periodo-avaliacao" style="font-weight:600;">Período:</label>
            <select id="periodo-avaliacao" style="padding:4px 10px;border-radius:6px;">
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
                <option value="semestral">Semestral</option>
            </select>
            <button id="enviar-avaliacao" style="background:#6A0DAD;color:#fff;border:none;padding:7px 18px;border-radius:6px;font-weight:600;cursor:pointer;">
                Enviar Avaliação
            </button>
        </div>
    `;

    turma.alunos.forEach((aluno, aidx) => {
        const row = document.createElement('div');
        row.className = 'prof-aluno-row';
        row.innerHTML = `
            <span class="prof-aluno-nome">${aluno.nome}</span>
            <span class="prof-trofeus">
                <img src="../images/trofeu.png" class="prof-trofeu${aluno.trofeus===0?' selected':''}" data-trofeu="0" data-aidx="${aidx}" style="height:28px;filter:grayscale(1);opacity:0.7;" title="Sem troféu">
                ${[1,2,3].map(i => `
                    <img src="../images/trofeu.png" class="prof-trofeu${aluno.trofeus===i?' selected':''}" data-trofeu="${i}" data-aidx="${aidx}" style="height:28px;" title="${i} troféu(s)">
                `).join('')}
            </span>
            <span class="prof-aluno-obs">
                <input type="text" placeholder="Observação..." value="${aluno.obs||''}" data-aidx="${aidx}">
            </span>
        `;
        alunosDiv.appendChild(row);
    });

    // Eventos de avaliação
    alunosDiv.querySelectorAll('.prof-trofeu').forEach(img => {
        img.onclick = function() {
            const aidx = +this.getAttribute('data-aidx');
            const val = +this.getAttribute('data-trofeu');
            turmasProfessor[idx].alunos[aidx].trofeus = val;
            renderAlunosTurma(idx);
        };
    });
    alunosDiv.querySelectorAll('.prof-aluno-obs input').forEach(input => {
        input.onchange = function() {
            const aidx = +this.getAttribute('data-aidx');
            turmasProfessor[idx].alunos[aidx].obs = this.value;
        };
    });

    // Evento do botão de envio
    const btnEnviar = alunosDiv.querySelector('#enviar-avaliacao');
    btnEnviar.onclick = function() {
        const periodo = alunosDiv.querySelector('#periodo-avaliacao').value;
        // Aqui você pode enviar os dados para o backend ou mostrar um resumo
        alert(`Avaliação enviada!\nTurma: ${turma.nome}\nPeríodo: ${periodo}\nAlunos avaliados: ${turma.alunos.length}`);
        // Exemplo: console.log({ turma: turma.nome, periodo, alunos: turma.alunos });
    };
}

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', renderTurmasProfessor);

function alterarImagemProfessor() {
    document.getElementById('input-foto-professor').click();
}

document.getElementById('input-foto-professor').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (evt) {
            document.getElementById('professor-foto').src = evt.target.result;
        };
        reader.readAsDataURL(file);
    }
});

document.addEventListener('DOMContentLoaded', async function () {
    // Recupera o usuário logado do localStorage
    const professorId = localStorage.getItem('professorId');

    // Busca os dados completos do professor no backend
    try {
        const res = await fetch(`http://34.174.93.50:3000/professores/${professorId}`);
        console.log('Buscando professor com ID:', professorId);
        if (!res.ok) throw new Error('Erro ao buscar professor');
        const professor = await res.json();

        if(document.getElementById('professor-foto')) document.getElementById('professor-foto').src = professor.foto || '../images/professor_perfil.jpg';
        if(document.getElementById('nome')) document.getElementById('nome').textContent = professor.nome || '--';
        if(document.getElementById('email')) document.getElementById('email').textContent = professor.email || '--';
        if(document.getElementById('turno')) document.getElementById('turno').textContent = professor.turno || '--';
        if(document.getElementById('curso')) document.getElementById('curso').textContent = professor.curso || '--';
    } catch (err) {
        alert('Erro ao carregar dados do professor.');
        console.error('Erro ao buscar dados do professor:', err);
    }

    // Exemplo de métricas do professor (substitua pelo que vier do backend)
    const metricas = {
        aulasMinistradas: 85,
        avaliacao: 92,
        projetos: 78
    };

    // Gráfico de métricas
    if(document.getElementById('metricsChart')) {
        const ctx = document.getElementById('metricsChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Aulas Ministradas', 'Avaliação', 'Projetos'],
                datasets: [{
                    label: 'Métricas (%)',
                    data: [metricas.aulasMinistradas, metricas.avaliacao, metricas.projetos],
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
});