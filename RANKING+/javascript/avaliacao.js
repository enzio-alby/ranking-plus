document.addEventListener('DOMContentLoaded', function () {
    const estrelasContainers = document.querySelectorAll('.estrelas');

    estrelasContainers.forEach(function (container) {
        const aluno = container.closest('tr').children[0].innerText;

        container.querySelectorAll('.estrela').forEach(function (estrela) {
            estrela.addEventListener('click', function () {
                const valor = parseInt(this.getAttribute('data-estrela'));
                container.setAttribute('data-avaliacao', valor);
                atualizarEstrelas(container, valor);
                salvarAvaliacao(aluno, valor);
            });
        });
    });

    function atualizarEstrelas(container, valor) {
        container.querySelectorAll('.estrela').forEach(function (estrela) {
            const starVal = parseInt(estrela.getAttribute('data-estrela'));
            if (starVal <= valor) {
                estrela.classList.add('text-warning');
            } else {
                estrela.classList.remove('text-warning');
            }
        });
    }

    function salvarAvaliacao(nomeAluno, nota) {
        let avaliacoes = JSON.parse(localStorage.getItem('avaliacoes')) || {};
        avaliacoes[nomeAluno] = nota;
        localStorage.setItem('avaliacoes', JSON.stringify(avaliacoes));
    }
});

// 👇 Estas funções DEVEM estar fora do DOMContentLoaded
let linhaSelecionada = null;

function abrirEditor(botao) {
    linhaSelecionada = botao.closest('tr');

    const status = linhaSelecionada.querySelector('.status-text').textContent.trim();
    const dataHora = linhaSelecionada.querySelector('.data-hora').textContent.trim();
    const comentario = linhaSelecionada.querySelector('.comentario').value;
    const estrelas = linhaSelecionada.querySelectorAll('.estrela.text-warning').length;

    document.getElementById('presencaModal').value = (status === 'Presente' || status === 'Faltou') ? status : "";
    document.getElementById('dataHoraModal').value = dataHora !== "--/--/---- --:--" ? dataHora.replace(" ", "T") : "";
    document.getElementById('comentarioModal').value = comentario;
    document.getElementById('estrelaModal').value = estrelas;

    const modal = new bootstrap.Modal(document.getElementById('modalEdicao'));
    modal.show();
}

function salvarEdicao() {
    if (!linhaSelecionada) return;

    const presenca = document.getElementById('presencaModal').value;
    const dataHora = document.getElementById('dataHoraModal').value;
    const comentario = document.getElementById('comentarioModal').value;
    const estrelas = parseInt(document.getElementById('estrelaModal').value);

    linhaSelecionada.querySelector('.status-text').textContent = presenca;
    linhaSelecionada.querySelector('.data-hora').textContent = dataHora ? dataHora.replace("T", " ") : "--/--/---- --:--";
    linhaSelecionada.querySelector('.comentario').value = comentario;

    const estrelasContainer = linhaSelecionada.querySelector('.estrelas');
    estrelasContainer.setAttribute("data-avaliacao", estrelas);

    estrelasContainer.querySelectorAll('.estrela').forEach(e => {
        e.classList.remove('text-warning');
        if (parseInt(e.dataset.estrela) <= estrelas) {
            e.classList.add('text-warning');
        }
    });

    bootstrap.Modal.getInstance(document.getElementById('modalEdicao')).hide();
}
