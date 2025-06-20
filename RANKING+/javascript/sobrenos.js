document.addEventListener('DOMContentLoaded', function() {


    // Botão Sobre Nós
    const sobreBtn = Array.from(document.querySelectorAll('.nav-link')).find(link =>
        link.innerText.trim().toLowerCase().includes('sobre nós')
    );
    const sobreModal = document.getElementById('sobre-nos-modal');
    const fecharSobreBtn = document.getElementById('fechar-sobre-nos-modal');

    if (sobreBtn && sobreModal && fecharSobreBtn) {
        sobreBtn.addEventListener('click', function (e) {
            e.preventDefault();
            sobreModal.style.display = 'flex';
        });
        fecharSobreBtn.addEventListener('click', function () {
            sobreModal.style.display = 'none';
        });
        sobreModal.addEventListener('click', function (e) {
            if (e.target === sobreModal) sobreModal.style.display = 'none';
        });
    }
});