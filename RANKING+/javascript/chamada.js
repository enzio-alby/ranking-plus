function mostrarChamada() {
    document.getElementById('rankingSection').style.display = 'none';
    document.getElementById('chamadaSection').style.display = 'block';
}

function registrarPresenca(botao, status) {
    const td = botao.parentElement;
    td.innerHTML = status === 'P'
        ? '<span class="text-success fw-bold">Presente</span>'
        : '<span class="text-danger fw-bold">Faltou</span>';
}
function registrarPresencaDireta(botao, status) {
    const td = botao.closest('td');
    const statusText = td.querySelector('.status-text');
    const dataHoraText = td.querySelector('.data-hora');

    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    statusText.textContent = status;
    dataHoraText.textContent = `${dataFormatada} ${horaFormatada}`;
}

