document.addEventListener('DOMContentLoaded', function() {
    const fotoInput = document.getElementById('foto');
    const preview = document.getElementById('preview-foto');
    const form = document.getElementById('form-config-prof');
    const btnSalvar = document.getElementById('btn-salvar');
    const btnEnviarCodigo = document.getElementById('btn-enviar-codigo');
    const btnVerificarCodigo = document.getElementById('btn-verificar-codigo');

    if (fotoInput) {
        fotoInput.addEventListener('change', function() {
            if (fotoInput.files && fotoInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                }
                reader.readAsDataURL(fotoInput.files[0]);
            } else {
                preview.src = '#';
                preview.style.display = 'none';
            }
        });
    }

    // Notificação ao salvar alterações
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            Swal.fire({
                position: "top-end",
                icon: "success",
                title: "Alterações salvas com sucesso!",
                showConfirmButton: false,
                timer: 1500
            });
            // Aqui você pode adicionar o envio real do formulário se desejar
        });
    }

    // Notificação ao verificar email
    if (btnVerificarCodigo) {
        btnVerificarCodigo.addEventListener('click', function() {
            // Supondo que a verificação foi bem-sucedida (adicione sua lógica real)
            Swal.fire({
                position: "top-end",
                icon: "success",
                title: "Email verificado com sucesso!",
                showConfirmButton: false,
                timer: 1500
            });
        });
    }

    // Notificação ao enviar código de verificação
    if (btnEnviarCodigo) {
        btnEnviarCodigo.addEventListener('click', function() {
            Swal.fire({
                position: "top-end",
                icon: "info",
                title: "Código de verificação enviado!",
                showConfirmButton: false,
                timer: 1500
            });
        });
    }
});