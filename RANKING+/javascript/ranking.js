function mostrarRanking() {
    document.getElementById('rankingSection').style.display = 'block';
    document.getElementById('chamadaSection').style.display = 'none';
}

function toggleTurno(turno) {
    const turnos = [
        'ads-matutino', 'ads-vespertino', 'ads-noturno',
        'cc-matutino', 'cc-vespertino', 'cc-noturno',
        'engcomp-matutino', 'engcomp-vespertino', 'engcomp-noturno'
    ];

    turnos.forEach(t => {
        document.getElementById(t).style.display = (t === turno) ? 'block' : 'none';
    });
}

function toggleTurma(turma) {
    const turmas = [
        'ads-matutino-a', 'ads-matutino-b', 'ads-vespertino-a', 'ads-vespertino-b', 'ads-noturno-a', 'ads-noturno-b',
        'cc-matutino-a', 'cc-matutino-b', 'cc-vespertino-a', 'cc-vespertino-b', 'cc-noturno-a', 'cc-noturno-b',
        'engcomp-matutino-a', 'engcomp-matutino-b', 'engcomp-vespertino-a', 'engcomp-vespertino-b', 'engcomp-noturno-a', 'engcomp-noturno-b'
    ];

    turmas.forEach(t => {
        document.getElementById(t).style.display = (t === turma) ? 'block' : 'none';
    });
}


