// avaliacaocomportamental.js — Mapeamento de Perfil Comportamental
const AC_API = 'http://localhost:4000';
const AC_POR_PAGINA = 10;

const PERFIL_NOMES = { executor: 'Executor', comunicador: 'Comunicador', planejador: 'Planejador', analista: 'Analista' };
const EIXO_NOMES = {
    execucao: 'Execução & Disciplina', comunicacao: 'Comunicação & Influência',
    colaboracao: 'Colaboração', resiliencia: 'Resiliência sob Pressão', aprendizado: 'Aprendizado & Inovação'
};

let _questionario = null;
let _paginaAtual = 0;
let _totalPaginas = 0;
let _respostas = {}; // pergunta_id -> [opcao_id, ...] (pretensão pode ter até 2, o resto sempre 1)

document.addEventListener('DOMContentLoaded', () => {
    const alunoId = localStorage.getItem('alunoId');
    if (!alunoId || !localStorage.getItem('unirank_token')) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('acBtnComecar').addEventListener('click', _iniciarFormulario);
    document.getElementById('acBtnVoltar').addEventListener('click', () => _irParaPagina(_paginaAtual - 1));
    document.getElementById('acBtnAvancar').addEventListener('click', () => _irParaPagina(_paginaAtual + 1));
    document.getElementById('acBtnEnviar').addEventListener('click', _enviarAvaliacao);

    _verificarPodeResponder(alunoId);
});

async function _verificarPodeResponder(alunoId) {
    try {
        const res = await fetch(`${AC_API}/alunos/${alunoId}/avaliacao-comportamental`);
        if (!res.ok) return; // sem avaliação prévia — pode responder normalmente
        const data = await res.json();
        if (!data.pode_reavaliar_agora) {
            document.getElementById('acBtnComecar').classList.add('d-none');
            const bloqueado = document.getElementById('acBloqueado');
            bloqueado.classList.remove('d-none');
            const data_fmt = new Date(data.proxima_liberacao).toLocaleDateString('pt-BR');
            document.getElementById('acBloqueadoTexto').textContent =
                `Você já respondeu recentemente. A próxima liberação é em ${data_fmt}.`;
        }
    } catch (_) { /* API fora do ar — deixa tentar mesmo assim, o backend valida de novo */ }
}

async function _iniciarFormulario() {
    const btn = document.getElementById('acBtnComecar');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Carregando...';
    try {
        const res = await fetch(`${AC_API}/avaliacao/questionario/ativo`);
        if (!res.ok) throw new Error('Não foi possível carregar o questionário.');
        _questionario = await res.json();
        _totalPaginas = Math.ceil(_questionario.perguntas.length / AC_POR_PAGINA);
        _renderPaginas();
        document.getElementById('acIntro').classList.add('d-none');
        document.getElementById('acForm').classList.remove('d-none');
        _irParaPagina(0);
    } catch (e) {
        btn.disabled = false;
        btn.innerHTML = 'Começar <i class="bi bi-arrow-right ms-1"></i>';
        alert('Erro ao carregar o questionário. Tente novamente.');
    }
}

function _renderPaginas() {
    const container = document.getElementById('acPaginas');
    container.innerHTML = '';
    for (let pg = 0; pg < _totalPaginas; pg++) {
        const inicio = pg * AC_POR_PAGINA;
        const perguntasDaPagina = _questionario.perguntas.slice(inicio, inicio + AC_POR_PAGINA);
        const div = document.createElement('div');
        div.className = 'ac-pagina';
        div.dataset.pagina = pg;
        div.innerHTML = perguntasDaPagina.map((p, i) => {
            const multiplo = p.bloco === 'pretensao';
            const tipoInput = multiplo ? 'checkbox' : 'radio';
            return `
            <div class="ac-pergunta">
                <div class="ac-pergunta-num">Pergunta ${inicio + i + 1} de ${_questionario.perguntas.length}</div>
                <div class="ac-pergunta-enunciado">${_esc(p.enunciado)}</div>
                ${multiplo ? '<div class="ac-pergunta-hint">Pode marcar até 2 opções</div>' : ''}
                <div class="ac-opcoes">
                    ${p.opcoes.map(o => `
                        <label class="ac-opcao" data-pergunta="${p.id}" data-opcao="${o.id}" data-bloco="${p.bloco}">
                            <input type="${tipoInput}" name="pergunta_${p.id}" value="${o.id}">
                            <span>${_esc(o.texto)}</span>
                        </label>
                    `).join('')}
                </div>
            </div>`;
        }).join('');
        container.appendChild(div);
    }

    container.querySelectorAll('.ac-opcao input').forEach(input => {
        input.addEventListener('change', () => {
            const label = input.closest('.ac-opcao');
            const perguntaId = label.dataset.pergunta;
            const opcaoId = parseInt(label.dataset.opcao, 10);
            const multiplo = label.dataset.bloco === 'pretensao';

            if (multiplo) {
                const atual = _respostas[perguntaId] || [];
                if (input.checked) {
                    if (atual.length >= 2) { input.checked = false; return; } // limite de 2
                    _respostas[perguntaId] = [...atual, opcaoId];
                    label.classList.add('selecionada');
                } else {
                    _respostas[perguntaId] = atual.filter(id => id !== opcaoId);
                    label.classList.remove('selecionada');
                }
            } else {
                _respostas[perguntaId] = [opcaoId];
                label.closest('.ac-opcoes').querySelectorAll('.ac-opcao').forEach(l => l.classList.remove('selecionada'));
                label.classList.add('selecionada');
            }
            _atualizarProgresso();
        });
    });
}

function _irParaPagina(novaPagina) {
    if (novaPagina < 0 || novaPagina >= _totalPaginas) return;
    document.querySelectorAll('.ac-pagina').forEach(p => p.classList.remove('active'));
    document.querySelector(`.ac-pagina[data-pagina="${novaPagina}"]`)?.classList.add('active');
    _paginaAtual = novaPagina;

    document.getElementById('acBtnVoltar').disabled = _paginaAtual === 0;
    const ultimaPagina = _paginaAtual === _totalPaginas - 1;
    document.getElementById('acBtnAvancar').classList.toggle('d-none', ultimaPagina);
    document.getElementById('acBtnEnviar').classList.toggle('d-none', !ultimaPagina);

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function _atualizarProgresso() {
    const total = _questionario.perguntas.length;
    const respondidas = Object.values(_respostas).filter(v => v && v.length > 0).length;
    document.getElementById('acProgressFill').style.width = `${(respondidas / total) * 100}%`;
    document.getElementById('acProgressTexto').textContent = `${respondidas} / ${total}`;
}

async function _enviarAvaliacao() {
    const alerta = document.getElementById('acFormAlerta');
    alerta.classList.add('d-none');

    const faltando = _questionario.perguntas.filter(p => !(_respostas[p.id] || []).length);
    if (faltando.length) {
        alerta.textContent = `Faltam ${faltando.length} pergunta(s) sem resposta. Revise antes de enviar.`;
        alerta.classList.remove('d-none');
        return;
    }
    // Achata pra 1 linha por opção marcada — pretensão pode gerar 2 linhas pra mesma pergunta.
    const respostasArray = _questionario.perguntas.flatMap(p =>
        (_respostas[p.id] || []).map(opcaoId => ({ pergunta_id: p.id, opcao_id: opcaoId }))
    );

    const btn = document.getElementById('acBtnEnviar');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Calculando...';

    const alunoId = localStorage.getItem('alunoId');
    const token = localStorage.getItem('unirank_token');
    try {
        const res = await fetch(`${AC_API}/alunos/${alunoId}/avaliacao-comportamental`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ respostas: respostasArray })
        });
        const data = await res.json();
        if (!res.ok) {
            alerta.textContent = data.error || 'Não foi possível enviar sua avaliação.';
            alerta.classList.remove('d-none');
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-send-fill me-1"></i>Enviar e calcular meu perfil';
            return;
        }
        _mostrarResultado(data);
    } catch (e) {
        alerta.textContent = 'Erro de conexão. Tente novamente.';
        alerta.classList.remove('d-none');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-send-fill me-1"></i>Enviar e calcular meu perfil';
    }
}

function _mostrarResultado(data) {
    document.getElementById('acForm').classList.add('d-none');
    document.getElementById('acResultado').classList.remove('d-none');

    document.getElementById('acValidoAte').textContent = new Date(data.valido_ate).toLocaleDateString('pt-BR');
    document.getElementById('acPerfilDominanteNome').textContent = PERFIL_NOMES[data.perfil_dominante] || data.perfil_dominante;

    const perfisGrid = document.getElementById('acPerfisGrid');
    perfisGrid.innerHTML = Object.entries(data.perfis).map(([chave, pct]) => `
        <div class="ac-perfil-item ${chave === data.perfil_dominante ? 'dominante' : ''}">
            <div class="ac-perfil-item-nome">${PERFIL_NOMES[chave] || chave}</div>
            <div class="ac-perfil-item-pct">${pct}%</div>
        </div>
    `).join('');

    const eixosLista = document.getElementById('acEixosLista');
    eixosLista.innerHTML = Object.entries(data.eixos).map(([chave, valor]) => `
        <div class="ac-eixo-item">
            <div class="ac-eixo-topo">
                <span class="ac-eixo-nome">${EIXO_NOMES[chave] || chave}</span>
                <span class="ac-eixo-valor">${valor}</span>
            </div>
            <div class="ac-eixo-barra-fundo"><div class="ac-eixo-barra-fill" style="width:${valor}%"></div></div>
        </div>
    `).join('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}
