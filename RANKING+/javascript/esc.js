// Helper compartilhado de escape de HTML (corrige o achado C2: isso era
// redefinido 4x em admin.js, areaaluno.js, chat.js e talentos.js — uma dessas
// cópias nem escapava aspas simples, um gap real pra XSS em contexto de atributo).
// Global de propósito: chat.js se embrulha numa IIFE e resolve o `_esc` pela
// cadeia normal de escopo do JS, então isso precisa carregar antes de qualquer
// script que o chame.
function _esc(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
