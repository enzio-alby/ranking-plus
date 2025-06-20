document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('recuperarForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            Swal.fire({
                title: "E-mail enviado!",
                text: "Se o e-mail informado estiver cadastrado, você receberá as instruções para redefinir sua senha.",
                icon: "success"
            });
            form.reset();
        });
    }
});