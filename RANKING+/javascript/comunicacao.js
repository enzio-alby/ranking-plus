document.addEventListener('DOMContentLoaded', function() {
    const link = document.getElementById('comunicacao-link');
    const modal = document.getElementById('comunicacao-modal');
    const closeBtn = document.getElementById('fechar-comunicacao-modal');

    if(link && modal && closeBtn) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            modal.style.display = 'flex';
        });
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.style.display = 'none';
        });
    }
});