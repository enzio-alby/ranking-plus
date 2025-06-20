// filepath: vsls:/javascript/acessibilidade.js

// Inicializa o VLibras
if (window.VLibras) {
    new window.VLibras.Widget('https://vlibras.gov.br/app');
}

// Alterna contraste alto
function toggleContrast() {
    document.body.classList.toggle('high-contrast');
}

// Aumenta tamanho da fonte
function increaseFont() {
    document.body.classList.add('larger-text');
}

// Diminui tamanho da fonte
function decreaseFont() {
    document.body.classList.remove('larger-text');
}

// Exibe ou oculta o menu de visão
function toggleVisionMenu() {
    const menu = document.getElementById('visionMenu');
    menu.style.display = (menu.style.display === 'none' || menu.style.display === '') ? 'block' : 'none';
}

// Acessibilidade auditiva (exemplo simples)
let audioAccessibility = false;
function toggleAudioAccessibility() {
    audioAccessibility = !audioAccessibility;
    alert(audioAccessibility ? "Acessibilidade auditiva ativada!" : "Acessibilidade auditiva desativada!");
}

// CSS para alto contraste e aumento de texto
const style = document.createElement('style');
style.innerHTML = `
    body.high-contrast {
        filter: invert(1) hue-rotate(180deg);
    }
    body.larger-text {
        font-size: 1.25em;
    }
`;
document.head.appendChild(style);