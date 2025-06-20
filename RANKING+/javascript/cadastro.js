// Olhinho para mostrar/ocultar senha
document.addEventListener('DOMContentLoaded', function() {
    // Senha principal
    const senhaInput = document.getElementById('senha');
    const toggleSenha = document.getElementById('toggleSenha');
    if (senhaInput && toggleSenha) {
        const iconSenha = toggleSenha.querySelector('i');
        toggleSenha.addEventListener('click', function() {
            if (senhaInput.type === 'password') {
                senhaInput.type = 'text';
                iconSenha.classList.remove('fa-eye');
                iconSenha.classList.add('fa-eye-slash');
            } else {
                senhaInput.type = 'password';
                iconSenha.classList.remove('fa-eye-slash');
                iconSenha.classList.add('fa-eye');
            }
        });
    }

    // Confirmar senha
    const confSenhaInput = document.getElementById('conf_senha');
    const toggleConfSenha = document.getElementById('toggleConfSenha');
    if (confSenhaInput && toggleConfSenha) {
        const iconConfSenha = toggleConfSenha.querySelector('i');
        toggleConfSenha.addEventListener('click', function() {
            if (confSenhaInput.type === 'password') {
                confSenhaInput.type = 'text';
                iconConfSenha.classList.remove('fa-eye');
                iconConfSenha.classList.add('fa-eye-slash');
            } else {
                confSenhaInput.type = 'password';
                iconConfSenha.classList.remove('fa-eye-slash');
                iconConfSenha.classList.add('fa-eye');
            }
        });
    }

    // Popup ao finalizar cadastro
    function concluicadastro() {
        const form = document.getElementById('formCadastro');
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();

                // Coleta os dados do formulário
                const nome = document.getElementById('nome').value;
                const email = document.getElementById('email').value;
                const matricula = document.getElementById('matricula').value;
                const cpf = document.getElementById('cpf').value;
                const idade = document.getElementById('idade').value;
                const data_nascimento = document.getElementById('data_nascimento').value;
                const curso = document.getElementById('curso').value;
                const periodo = document.getElementById('semestre').value;
                const turno = document.getElementById('turno').value;
                const campus = document.getElementById('campus').value;
                const senha = document.getElementById('senha').value;
                const conf_senha = document.getElementById('conf_senha').value;

                // Validação simples de senha
                if (senha !== conf_senha) {
                    alert('As senhas não coincidem.');
                    return;
                }

                // Monta o objeto para enviar
                const dados = {
                    nome,
                    email,
                    matricula,
                    cpf,
                    data_nascimento,
                    curso,
                    semestre: periodo,
                    turno,
                    campus,
                    idade,
                    senha
                };

                try {
                    const response = await fetch('http://localhost:3000/alunos', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dados)
                    });

                    if (response.ok) {
                        alert('Cadastro realizado com sucesso!');
                        window.location.href = 'login.html';
                    } else {
                        const erro = await response.json();
                        alert('Erro ao cadastrar: ' + (erro.error || 'Verifique os dados e tente novamente.'));
                    }
                } catch (error) {
                    alert('Erro de conexão com o servidor.');
                }
            })
            }
        };

    // Permitir apenas formato de CPF no campo
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function() {
            let v = this.value.replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            this.value = v;
        });
    }
});