// Injeta automaticamente o token de sessão (Authorization: Bearer <token>) em
// toda chamada fetch() da página — correção do achado S1 (IDOR generalizado).
// Antes, o front só guardava o id do usuário e o backend confiava cegamente
// nele; agora todo fetch já sai com o token, sem precisar editar cada chamada
// nos arquivos de página (areaaluno.js, talentos.js, etc.).
(function () {
  const ORIGINAL_FETCH = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const token = localStorage.getItem('unirank_token');
    if (token) {
      init = init ? { ...init } : {};
      const headers = new Headers(init.headers || {});
      if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
      init.headers = headers;
    }
    const response = await ORIGINAL_FETCH(input, init);
    // Sessão restaurada de storage (sem passar por login) fica sem token válido
    // quando o token expira (8h) ou o servidor reinicia sessões em memória. Sem
    // isto, a página parece "quebrada" (listas vazias, 401 silencioso) em vez de
    // pedir login de novo — trata só quando HAVIA token, pra não recarregar em
    // loop nas chamadas de quem nunca logou.
    if (response.status === 401 && token) {
      localStorage.removeItem('unirank_token');
      localStorage.removeItem('unirank_user');
      localStorage.removeItem('alunoId');
      localStorage.removeItem('professorId');
      sessionStorage.removeItem('empresa_logada');
      localStorage.removeItem('empresa_logada');
      window.location.reload();
    }
    return response;
  };
})();
