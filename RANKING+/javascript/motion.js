// Motion utilities — Camada 1 (reveal on scroll + contadores animados)
// Sem dependências externas. Respeita prefers-reduced-motion.
(function () {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Observa elementos .reveal e adiciona .reveal-visible quando entram na tela,
    // com um leve escalonamento entre irmãos. Pode ser chamado de novo para
    // conteúdo inserido dinamicamente (root = container recém-criado).
    window.initScrollReveal = function (root) {
        const scope = root || document;
        const items = scope.querySelectorAll('.reveal:not(.reveal-visible)');
        if (!items.length) return;

        if (prefersReduced) {
            items.forEach(el => el.classList.add('reveal-visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        items.forEach((el, i) => {
            el.style.transitionDelay = Math.min(i * 70, 350) + 'ms';
            observer.observe(el);
        });
    };

    // Anima um número subindo até o valor real (ease-out, ~900ms).
    // opts: { decimals, prefix, suffix, duration, fallback }
    window.animateCounter = function (el, target, opts) {
        if (!el) return;
        opts = opts || {};
        const decimals = opts.decimals || 0;
        const prefix   = opts.prefix || '';
        const suffix   = opts.suffix || '';
        const duration = opts.duration || 900;
        const num = Number(target);

        if (target === null || target === undefined || target === '—' || isNaN(num)) {
            el.textContent = opts.fallback !== undefined ? opts.fallback : '—';
            return;
        }

        const format = v => prefix + v.toLocaleString('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }) + suffix;

        if (prefersReduced) {
            el.textContent = format(num);
            return;
        }

        const start = performance.now();
        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = format(num * eased);
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    };

    document.addEventListener('DOMContentLoaded', () => window.initScrollReveal());
})();
