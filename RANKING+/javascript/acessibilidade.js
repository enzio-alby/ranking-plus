// Acessibilidade — Ranking+
// Skip-link · Toolkit flutuante (fonte + alto contraste) · Focus trap para modais Bootstrap 5

(function () {

  // ──────────────────────────────────────────────────────────────────
  // 1. INJEÇÃO DE CSS (único bloco, gerado via JS)
  // ──────────────────────────────────────────────────────────────────
  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'a11y-global-styles';
    style.textContent = `

      /* ── Skip Link ── */
      .skip-link {
        position: fixed;
        top: -100px;
        left: 0;
        background: #020122;
        color: #fff;
        padding: 10px 20px;
        z-index: 999999;
        border-radius: 0 0 8px 0;
        font-size: 14px;
        font-family: inherit;
        text-decoration: none;
        font-weight: 600;
        transition: top 0.15s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,.3);
      }
      .skip-link:focus {
        top: 0;
        outline: 3px solid #F4442E;
        outline-offset: 2px;
      }

      /* ── Foco global visível ── */
      :focus-visible {
        outline: 3px solid #F4442E !important;
        outline-offset: 2px !important;
        border-radius: 3px !important;
      }

      /* ── FAB de Acessibilidade ── */
      .a11y-fab {
        position: fixed;
        bottom: 24px;
        left: 16px;
        z-index: 9998;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #020122;
        color: #fff;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(0,0,0,.35);
        transition: background .2s, transform .2s;
        font-size: 22px;
        padding: 0;
      }
      .a11y-fab:hover        { background: #F4442E; transform: scale(1.08); }
      .a11y-fab[aria-expanded="true"] { background: #F4442E; }

      /* ── Painel de Acessibilidade ── */
      .a11y-panel {
        position: fixed;
        bottom: 80px;
        left: 16px;
        z-index: 9997;
        background: #fff;
        border-radius: 14px;
        box-shadow: 0 8px 32px rgba(0,0,0,.18);
        padding: 16px;
        width: 230px;
        display: none;
        flex-direction: column;
        gap: 12px;
        border: 1px solid #e2e8f0;
        font-family: inherit;
      }
      .a11y-panel.open { display: flex; }

      .a11y-panel-title {
        font-size: 10px;
        font-weight: 700;
        color: #020122;
        text-transform: uppercase;
        letter-spacing: .8px;
        margin: 0;
      }
      .a11y-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .a11y-label {
        font-size: 13px;
        color: #2D3748;
        font-weight: 500;
      }
      .a11y-font-controls {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .a11y-font-size-display {
        font-size: 11px;
        color: #6c757d;
        min-width: 36px;
        text-align: center;
      }
      .a11y-btn {
        width: 30px;
        height: 30px;
        border-radius: 7px;
        border: 1.5px solid #e2e8f0;
        background: #f8f9fa;
        color: #020122;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background .15s, border-color .15s;
        padding: 0;
        line-height: 1;
        flex-shrink: 0;
      }
      .a11y-btn:hover { background: #F4442E; color: #fff; border-color: #F4442E; }

      /* Toggle switch */
      .a11y-toggle {
        position: relative;
        width: 44px;
        height: 24px;
        flex-shrink: 0;
        cursor: pointer;
      }
      .a11y-toggle input {
        opacity: 0;
        width: 0;
        height: 0;
        position: absolute;
      }
      .a11y-toggle-track {
        position: absolute;
        inset: 0;
        background: #cbd5e0;
        border-radius: 12px;
        transition: background .2s;
      }
      .a11y-toggle input:checked + .a11y-toggle-track { background: #020122; }
      .a11y-toggle-thumb {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 18px;
        height: 18px;
        background: #fff;
        border-radius: 50%;
        transition: left .2s;
        box-shadow: 0 1px 4px rgba(0,0,0,.2);
        pointer-events: none;
      }
      .a11y-toggle input:checked ~ .a11y-toggle-thumb { left: 23px; }

      .a11y-divider { height: 1px; background: #e2e8f0; }

      /* ── Alto Contraste ── */
      body.accessibility-high-contrast {
        background-color: #000 !important;
        color: #ffff00 !important;
      }
      body.accessibility-high-contrast *:not(script):not(style) {
        background-color: #000 !important;
        color: #ffff00 !important;
        border-color: #ffff00 !important;
        box-shadow: none !important;
        text-shadow: none !important;
      }
      body.accessibility-high-contrast a {
        color: #ffff00 !important;
        text-decoration: underline !important;
      }
      body.accessibility-high-contrast img {
        filter: grayscale(100%) contrast(120%);
      }

      /* Preserve toolkit no alto contraste */
      body.accessibility-high-contrast .a11y-fab {
        background-color: #ffff00 !important;
        color: #000 !important;
        border-color: #000 !important;
        box-shadow: 0 4px 16px rgba(255,255,0,.4) !important;
      }
      body.accessibility-high-contrast .a11y-panel {
        background-color: #111 !important;
        border-color: #ffff00 !important;
        box-shadow: 0 8px 32px rgba(255,255,0,.2) !important;
      }
      body.accessibility-high-contrast .a11y-panel-title,
      body.accessibility-high-contrast .a11y-label,
      body.accessibility-high-contrast .a11y-font-size-display {
        background-color: transparent !important;
        color: #ffff00 !important;
      }
      body.accessibility-high-contrast .a11y-btn {
        background-color: #222 !important;
        color: #ffff00 !important;
        border-color: #ffff00 !important;
      }
      body.accessibility-high-contrast .a11y-btn:hover {
        background-color: #ffff00 !important;
        color: #000 !important;
      }
      body.accessibility-high-contrast .a11y-toggle-track {
        background-color: #444 !important;
        border-color: #ffff00 !important;
      }
      body.accessibility-high-contrast .a11y-toggle input:checked + .a11y-toggle-track {
        background-color: #ffff00 !important;
      }
      body.accessibility-high-contrast .a11y-toggle-thumb {
        background-color: #fff !important;
        box-shadow: 0 1px 4px rgba(0,0,0,.8) !important;
      }
      body.accessibility-high-contrast .a11y-divider {
        background-color: #ffff00 !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ──────────────────────────────────────────────────────────────────
  // 2. SKIP-LINK
  // ──────────────────────────────────────────────────────────────────
  function addSkipLink() {
    // Evita duplicar se o script rodar duas vezes
    if (document.querySelector('.skip-link')) return;

    // Candidatos ao "conteúdo principal" em ordem de preferência
    const target =
      document.querySelector('main') ||
      document.querySelector('#main-content') ||
      document.querySelector('[role="main"]') ||
      document.querySelector('.main-content') ||
      document.querySelector('.page-content') ||
      document.querySelector('.container-fluid') ||
      document.querySelector('.container');

    if (!target) return;
    if (!target.id) target.id = 'main-content';
    target.setAttribute('tabindex', '-1');

    const skip = document.createElement('a');
    skip.href = '#' + target.id;
    skip.className = 'skip-link';
    skip.textContent = 'Ir para o conteúdo principal';
    skip.setAttribute('aria-label', 'Pular para o conteúdo principal');
    document.body.insertBefore(skip, document.body.firstChild);
  }

  // ──────────────────────────────────────────────────────────────────
  // 3. TOOLKIT FLUTUANTE — Fonte e Alto Contraste
  // ──────────────────────────────────────────────────────────────────
  const FONT_LEVELS = [100, 115, 130];

  function getFontLevel() {
    const idx = parseInt(localStorage.getItem('a11y-font-level') || '0', 10);
    return (idx >= 0 && idx < FONT_LEVELS.length) ? idx : 0;
  }

  function applyFontSize(idx) {
    document.documentElement.style.fontSize = FONT_LEVELS[idx] + '%';
  }

  function applyContrast(on) {
    document.body.classList.toggle('accessibility-high-contrast', on);
  }

  function createToolkit() {
    if (document.getElementById('a11yFab')) return; // guard

    let fontIdx = getFontLevel();
    const contrastOn = localStorage.getItem('a11y-contrast') === '1';

    // Aplica estados salvos imediatamente
    applyFontSize(fontIdx);
    applyContrast(contrastOn);

    // ── FAB ──
    const fab = document.createElement('button');
    fab.id = 'a11yFab';
    fab.className = 'a11y-fab';
    fab.setAttribute('aria-label', 'Abrir opções de acessibilidade');
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-controls', 'a11yPanel');
    fab.setAttribute('title', 'Acessibilidade');
    // Usa Bootstrap Icons se disponível, senão símbolo Unicode
    // Usa BI se carregado, senão cai para símbolo Unicode ♿
    const biLoaded = !!document.querySelector('link[href*="bootstrap-icons"]');
    fab.innerHTML = biLoaded
      ? '<i class="bi bi-universal-access" aria-hidden="true"></i>'
      : '<span aria-hidden="true" style="font-size:20px;line-height:1">&#9855;</span>';

    // ── Painel ──
    const panel = document.createElement('div');
    panel.id = 'a11yPanel';
    panel.className = 'a11y-panel';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Opções de acessibilidade');

    panel.innerHTML = `
      <span class="a11y-panel-title">Acessibilidade</span>

      <div class="a11y-row">
        <span class="a11y-label" id="a11yFontLabel">Tamanho do texto</span>
        <div class="a11y-font-controls" role="group" aria-labelledby="a11yFontLabel">
          <button class="a11y-btn" id="a11yFontDec" aria-label="Diminuir tamanho do texto">A−</button>
          <span class="a11y-font-size-display" id="a11yFontDisplay" aria-live="polite" aria-atomic="true">${FONT_LEVELS[fontIdx]}%</span>
          <button class="a11y-btn" id="a11yFontInc" aria-label="Aumentar tamanho do texto">A+</button>
        </div>
      </div>

      <div class="a11y-divider" role="separator"></div>

      <div class="a11y-row">
        <label class="a11y-label" for="a11yContrastToggle">Alto Contraste</label>
        <label class="a11y-toggle">
          <input type="checkbox" id="a11yContrastToggle" ${contrastOn ? 'checked' : ''} aria-label="Ativar modo de alto contraste">
          <span class="a11y-toggle-track" aria-hidden="true"></span>
          <span class="a11y-toggle-thumb" aria-hidden="true"></span>
        </label>
      </div>
    `;

    document.body.appendChild(panel);
    document.body.appendChild(fab);

    // ── Eventos ──
    fab.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = panel.classList.toggle('open');
      fab.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) panel.querySelector('.a11y-btn').focus();
    });

    document.addEventListener('click', (e) => {
      if (!fab.contains(e.target) && !panel.contains(e.target)) {
        panel.classList.remove('open');
        fab.setAttribute('aria-expanded', 'false');
      }
    });

    // Fechar com Escape
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        panel.classList.remove('open');
        fab.setAttribute('aria-expanded', 'false');
        fab.focus();
      }
    });

    // Controle de fonte
    document.getElementById('a11yFontInc').addEventListener('click', () => {
      if (fontIdx < FONT_LEVELS.length - 1) {
        fontIdx++;
        localStorage.setItem('a11y-font-level', fontIdx);
        applyFontSize(fontIdx);
        document.getElementById('a11yFontDisplay').textContent = FONT_LEVELS[fontIdx] + '%';
      }
    });
    document.getElementById('a11yFontDec').addEventListener('click', () => {
      if (fontIdx > 0) {
        fontIdx--;
        localStorage.setItem('a11y-font-level', fontIdx);
        applyFontSize(fontIdx);
        document.getElementById('a11yFontDisplay').textContent = FONT_LEVELS[fontIdx] + '%';
      }
    });

    // Alto contraste
    document.getElementById('a11yContrastToggle').addEventListener('change', (e) => {
      const on = e.target.checked;
      localStorage.setItem('a11y-contrast', on ? '1' : '0');
      applyContrast(on);
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // 4. FOCUS TRAP — Modais Bootstrap 5
  // ──────────────────────────────────────────────────────────────────
  function setupFocusTrap() {
    const FOCUSABLE_SELECTORS = [
      'a[href]:not([disabled])',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    let lastFocused = null;

    // Captura o elemento focado ANTES do modal abrir
    document.addEventListener('show.bs.modal', () => {
      lastFocused = document.activeElement;
    }, true);

    // Após o modal estar visível: foca primeiro elemento + instala trap
    document.addEventListener('shown.bs.modal', (e) => {
      const modal = e.target;
      const focusable = Array.from(modal.querySelectorAll(FOCUSABLE_SELECTORS))
        .filter(el => !el.closest('[style*="display: none"]') && el.offsetParent !== null);

      if (!focusable.length) return;

      // Foca o primeiro elemento interativo
      focusable[0].focus();

      // Instala o trap de teclado
      function trapHandler(ev) {
        if (ev.key !== 'Tab') return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];

        if (ev.shiftKey) {
          if (document.activeElement === first || !modal.contains(document.activeElement)) {
            ev.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !modal.contains(document.activeElement)) {
            ev.preventDefault();
            first.focus();
          }
        }
      }

      modal._a11yTrapHandler = trapHandler;
      modal.addEventListener('keydown', trapHandler);
    }, true);

    // Ao fechar: remove trap + devolve foco ao elemento que abriu o modal
    document.addEventListener('hidden.bs.modal', (e) => {
      const modal = e.target;
      if (modal._a11yTrapHandler) {
        modal.removeEventListener('keydown', modal._a11yTrapHandler);
        modal._a11yTrapHandler = null;
      }
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
        lastFocused = null;
      }
    }, true);
  }

  // ──────────────────────────────────────────────────────────────────
  // HELPERS ARIA (existentes, mantidos)
  // ──────────────────────────────────────────────────────────────────
  function fixImages() {
    document.querySelectorAll('img:not([alt])').forEach(img => img.setAttribute('alt', ''));
  }

  function fixButtons() {
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
      if (!btn.textContent.trim() && !btn.title) btn.setAttribute('aria-label', 'Botão');
    });
    document.querySelectorAll('.btn-close:not([aria-label])').forEach(btn => {
      btn.setAttribute('aria-label', 'Fechar');
    });
  }

  function fixForms() {
    document.querySelectorAll('label:not([for])').forEach(label => {
      const input = label.querySelector('input, select, textarea');
      if (input && !input.id) {
        input.id = 'field-' + Math.random().toString(36).slice(2, 7);
        label.setAttribute('for', input.id);
      }
    });
  }

  function fixNavLandmarks() {
    document.querySelectorAll('nav:not([aria-label])').forEach((nav, i) => {
      nav.setAttribute('aria-label', i === 0 ? 'Navegação principal' : `Navegação ${i + 1}`);
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // INIT
  // ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    injectStyles();
    addSkipLink();
    createToolkit();
    setupFocusTrap();
    fixImages();
    fixButtons();
    fixForms();
    fixNavLandmarks();
  });

})();
