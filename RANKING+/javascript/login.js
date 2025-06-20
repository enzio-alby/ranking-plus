document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const tipoUsuario = document.getElementById('tipoUsuario').value;
      const cpfOuEmail = document.getElementById('cpf').value;
      const senha = document.getElementById('senha').value;

      // Detecta se é e-mail ou CPF (simples, pode ser melhorado)
      const isEmail = cpfOuEmail.includes('@');

      try {
        // Envia para a API o campo correto
        const resposta = await fetch('http://34.174.93.50:3000/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tipoUsuario,
            email: isEmail ? cpfOuEmail : undefined,
            cpf: !isEmail ? cpfOuEmail : undefined,
            senha
          })
        }).then(res => res.json());

        if (resposta.sucesso) {
          // Após login bem-sucedido - salvar dados
          if (tipoUsuario === 'professor') {
            localStorage.setItem('professorId', resposta.usuario.id);
            window.location.href = 'areadoprofessor.html';
          } else {
            localStorage.setItem('alunoId', resposta.usuario.id);
            window.location.href = 'index.html'; // ajuste para sua página de destino
          }
        } else {
          alert(resposta.mensagem || 'Usuário ou senha inválidos.');
        }
      } catch (error) {
        alert('Erro ao conectar com o servidor. Tente novamente.');
      }
    });
  }

  // Mostrar/ocultar senha
  const senhaInput = document.getElementById('senha');
  const toggleSenha = document.getElementById('toggleSenha');
  const iconSenha = document.getElementById('iconSenha');
  if (toggleSenha && senhaInput && iconSenha) {
    toggleSenha.addEventListener('click', function () {
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
});
