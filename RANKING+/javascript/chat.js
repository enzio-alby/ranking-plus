// chat.js — Mensagens (aluno<->aluno, aluno<->professor)
// Script compartilhado entre areaaluno.html e areaprofessor.html — detecta quem
// está logado via localStorage (mesmo padrão já usado no resto do projeto).
(function () {
    const CHAT_API = 'http://localhost:4000';
    const POLL_MS = 4000;

    let _meuTipo = null, _meuId = null;
    let _conversas = [];
    let _conversaAtivaId = null;
    let _conversaAtivaOutroTipo = null;
    let _conversaAtivaOutroNome = null;

    const CHIPS_ALUNO_PARA_EMPRESA = ['Tenho interesse, quando podemos conversar?', 'Pode me enviar mais detalhes da vaga?', 'Vamos agendar uma call?'];
    const CHIPS_EMPRESA_PARA_ALUNO = ['Vamos agendar uma call?', 'Aguardando seu retorno.', 'Pode me enviar seu currículo atualizado?', 'Vaga encerrada, obrigado pelo interesse.'];
    let _ultimoMsgId = 0;
    let _pollTimer = null;
    let _contatos = null;
    let _anexoPendente = null; // { anexo_id, nome } — selecionado mas ainda não enviado
    let _enviandoMensagem = false; // trava contra duplo envio (clique + Enter em sequência rápida)

    const EMOJIS = ['😀','😂','😊','😍','🥰','😉','😎','🤔','😅','😢','😭','😡','👍','👎','👏','🙏','💪','🔥','🎉','✅',
                     '❌','❤️','💯','⭐','📚','📎','⏰','📌','🤝','🙌'];

    function _init() {
        const alunoId = localStorage.getItem('alunoId');
        const professorId = localStorage.getItem('professorId');
        const empresaSalva = sessionStorage.getItem('empresa_logada') || localStorage.getItem('empresa_logada');
        if (alunoId) { _meuTipo = 'aluno'; _meuId = alunoId; }
        else if (professorId) { _meuTipo = 'professor'; _meuId = professorId; }
        else if (empresaSalva) {
            try { _meuTipo = 'empresa'; _meuId = String(JSON.parse(empresaSalva).id); }
            catch (_) { return; }
        }
        else return; // nenhuma sessão ativa — nada a inicializar

        const emptyState = document.getElementById('chatEmptyState');
        if (!emptyState) return; // página não tem a seção de chat no DOM ainda

        _renderEmojiPicker();
        _wireEventos();
        _carregarConversas();
        // Antes o polling só começava ao abrir a aba Mensagens (initChat) ou
        // clicar numa notificação — badge de não lidas e conversa aberta ficavam
        // parados em segundo plano. Agora começa junto com a página (item 4).
        _iniciarPolling();
    }

    // Chamado sempre que a aba/página de Mensagens é aberta (dashboards fazem
    // lazy-init das outras seções, chat segue o mesmo padrão)
    window.initChat = function () {
        if (!_meuTipo) { _init(); return; }
        _carregarConversas();
        _iniciarPolling();
    };

    // Chamado pelo clique numa notificação de "nova_mensagem" — abre direto a conversa.
    window.abrirConversaPorId = async function (conversaId) {
        if (!_meuTipo) { _init(); }
        await _carregarConversas();
        _abrirConversa(conversaId);
        _iniciarPolling();
    };

    function _wireEventos() {
        document.getElementById('chatNovaBtn')?.addEventListener('click', _abrirModalNovaConversa);
        document.getElementById('chatBuscaContato')?.addEventListener('input', _filtrarContatos);
        document.getElementById('chatSendBtn')?.addEventListener('click', _enviarMensagem);
        document.getElementById('chatMsgInput')?.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); _enviarMensagem(); }
        });
        document.getElementById('chatEmojiBtn')?.addEventListener('click', e => {
            e.stopPropagation();
            document.getElementById('chatEmojiPicker')?.classList.toggle('d-none');
        });
        document.addEventListener('click', () => document.getElementById('chatEmojiPicker')?.classList.add('d-none'));
        document.getElementById('chatAttachBtn')?.addEventListener('click', () => document.getElementById('chatFileInput')?.click());
        document.getElementById('chatFileInput')?.addEventListener('change', _selecionarAnexo);
    }

    function _renderEmojiPicker() {
        const picker = document.getElementById('chatEmojiPicker');
        if (!picker) return;
        picker.innerHTML = EMOJIS.map(e => `<button type="button">${e}</button>`).join('');
        picker.addEventListener('click', e => {
            e.stopPropagation();
            const btn = e.target.closest('button');
            if (!btn) return;
            const input = document.getElementById('chatMsgInput');
            input.value += btn.textContent;
            input.focus();
        });
    }

    // LISTA DE CONVERSAS
    async function _carregarConversas() {
        try {
            const res = await fetch(`${CHAT_API}/chat/conversas/participante/${_meuTipo}/${_meuId}`);
            _conversas = res.ok ? await res.json() : [];
            _renderListaConversas();
            _atualizarBadgeNav();
        } catch (_) { /* silencioso — lista simplesmente não atualiza neste ciclo */ }
    }

    function _renderListaConversas() {
        const lista = document.getElementById('chatConversasList');
        if (!lista) return;
        if (!_conversas.length) {
            lista.innerHTML = '<div class="chat-lista-vazia">Nenhuma conversa ainda.<br>Clique em <strong>+</strong> pra começar.</div>';
            return;
        }
        lista.innerHTML = _conversas.map(c => `
            <div class="chat-conversa-item ${c.outro_tipo} ${c.id === _conversaAtivaId ? 'active' : ''}" data-conversa-id="${c.id}">
                <div class="chat-avatar-mini">${_esc((c.outro_nome || '?')[0].toUpperCase())}</div>
                <div class="chat-conversa-texto">
                    <div class="chat-conversa-nome"><span class="chat-conversa-nome-txt">${_esc(c.outro_nome)}</span>${c.outro_tipo === 'professor' ? '<span class="chat-tipo-badge">Professor</span>' : c.outro_tipo === 'empresa' ? '<span class="chat-tipo-badge">Empresa</span>' : ''}</div>
                    ${c.vaga_titulo ? `<div class="chat-conversa-vaga"><i class="bi bi-briefcase"></i> ${_esc(c.vaga_titulo)}</div>` : ''}
                    <div class="chat-conversa-previa">${_esc(c.previa || '')}</div>
                </div>
                <div class="chat-conversa-meta">
                    <div class="chat-conversa-hora">${_horaCurta(c.ultima_em)}</div>
                    ${c.nao_lidas > 0 ? `<span class="chat-badge-naolidas">${c.nao_lidas}</span>` : ''}
                </div>
            </div>
        `).join('');
        lista.querySelectorAll('.chat-conversa-item').forEach(el => {
            el.addEventListener('click', () => _abrirConversa(parseInt(el.dataset.conversaId, 10)));
        });
        lista.querySelectorAll('.chat-conversa-excluir').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.stopPropagation(); // não abre a conversa ao clicar na lixeira
                const conversaId = btn.dataset.conversaId;
                const nome = btn.dataset.conversaNome;
                if (!confirm(`Excluir esta conversa da sua lista? Ela some só pra você — ${nome} continua vendo o histórico normalmente, e a conversa volta a aparecer pra você se chegar mensagem nova.`)) return;
                try {
                    const res = await fetch(`${CHAT_API}/chat/conversas/${conversaId}`, { method: 'DELETE' });
                    if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        alert(data.error || 'Erro ao excluir conversa.');
                        return;
                    }
                    _conversas = _conversas.filter(c => String(c.id) !== String(conversaId));
                    if (String(_conversaAtivaId) === String(conversaId)) {
                        _conversaAtivaId = null;
                        document.getElementById('chatThread')?.classList.add('d-none');
                        document.getElementById('chatEmptyState')?.classList.remove('d-none');
                    }
                    _renderListaConversas();
                    _atualizarBadgeNav();
                } catch (err) {
                    alert('Erro ao excluir conversa: ' + err.message);
                }
            });
        });
    }

    function _atualizarBadgeNav() {
        const total = _conversas.reduce((s, c) => s + (c.nao_lidas || 0), 0);
        const badge = document.getElementById('chatNavBadge');
        if (!badge) return;
        badge.textContent = total;
        badge.classList.toggle('d-none', total === 0);
    }

    // CONVERSA ABERTA
    async function _abrirConversa(conversaId) {
        _conversaAtivaId = conversaId;
        _ultimoMsgId = 0;
        document.getElementById('chatEmptyState')?.classList.add('d-none');
        document.getElementById('chatThread')?.classList.remove('d-none');
        document.getElementById('chatMessages').innerHTML = '<div class="text-center text-muted small py-4"><div class="spinner-border spinner-border-sm"></div></div>';
        _renderListaConversas();

        const conversa = _conversas.find(c => c.id === conversaId);
        if (conversa) {
            document.getElementById('chatThreadNome').textContent = conversa.outro_nome;
            document.getElementById('chatThreadAvatar').textContent = (conversa.outro_nome || '?')[0].toUpperCase();
            _conversaAtivaOutroTipo = conversa.outro_tipo;
            _conversaAtivaOutroNome = conversa.outro_nome;
            _renderVagaSubtitulo(conversa.vaga_titulo);
        }
        _renderAgendarCallBtn();
        _renderChipsRapidos();

        await _carregarMensagens(true);
        await fetch(`${CHAT_API}/chat/conversas/${conversaId}/marcar-lida`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ meu_tipo: _meuTipo, meu_id: _meuId })
        }).catch(() => {});
        _carregarConversas();
    }

    async function _carregarMensagens(scrollParaFinal) {
        if (!_conversaAtivaId) return;
        try {
            const res = await fetch(`${CHAT_API}/chat/conversas/${_conversaAtivaId}/mensagens?meu_tipo=${_meuTipo}&meu_id=${_meuId}${_ultimoMsgId ? `&apos_id=${_ultimoMsgId}` : ''}`);
            if (!res.ok) return;
            const mensagens = await res.json();
            if (!mensagens.length) return;
            const container = document.getElementById('chatMessages');
            if (_ultimoMsgId === 0) container.innerHTML = '';
            mensagens.forEach(m => container.insertAdjacentHTML('beforeend', _bolhaHtml(m)));
            _ultimoMsgId = mensagens[mensagens.length - 1].id;
            if (scrollParaFinal || mensagens.some(m => m.remetente_tipo !== _meuTipo)) {
                container.scrollTop = container.scrollHeight;
            }
        } catch (_) { /* próxima rodada de polling tenta de novo */ }
    }

    function _bolhaHtml(m) {
        const minha = m.remetente_tipo === _meuTipo && String(m.remetente_id) === String(_meuId);
        const hora = new Date(m.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        let corpo = m.texto ? _linkify(_esc(m.texto)) : '';
        let anexoHtml = '';
        if (m.anexo) {
            anexoHtml = m.anexo.expirado
                ? `<div class="chat-bubble-anexo expirado"><i class="bi bi-file-earmark-pdf"></i> ${_esc(m.anexo.nome)} (expirado)</div>`
                : `<a class="chat-bubble-anexo" href="${CHAT_API}/chat/anexos/${m.anexo.id}/download" target="_blank"><i class="bi bi-file-earmark-pdf-fill"></i> ${_esc(m.anexo.nome)}</a>`;
        }
        // Sem quebra de linha/indentação entre o corpo e a hora aqui dentro: a bolha
        // usa white-space:pre-wrap (pra preservar quebras de linha que o próprio
        // usuário digitou), então qualquer espaço/newline "de formatação" do template
        // literal seria renderizado como linha em branco de verdade na bolha.
        let botaoExcluir = '';
        if (minha) {
            botaoExcluir = `<button type="button" class="chat-bubble-excluir" title="Excluir mensagem"><i class="bi bi-trash3"></i></button>`;
        }
        // Check simples = chegou ao servidor; check duplo = o outro lado já
        // abriu a conversa e leu (campo `lida`, já existia pra contagem de não
        // lidas — só faltava aparecer na própria bolha). Item 7/feedback Caio.
        const checkEnviada = minha
            ? (m.lida
                ? '<i class="bi bi-check2-all chat-bubble-check lida" title="Visualizada"></i>'
                : '<i class="bi bi-check2 chat-bubble-check" title="Enviada"></i>')
            : '';
        const conteudoBolha = `${corpo}${anexoHtml}<span class="chat-bubble-time">${hora}${checkEnviada}</span>`;
        return `
            <div class="chat-bubble-row ${minha ? 'mine' : ''}">
                <div class="chat-bubble">
                    ${corpo}${anexoHtml}
                    <span class="chat-bubble-time">${hora}</span>
                </div>
            </div>`;
    }

    // Subtítulo "Vaga: X" no cabeçalho da conversa (item 6/feedback Caio) — a
    // empresa recebia "tenho interesse" sem saber em qual vaga era. O elemento
    // não existe no HTML estático das 3 páginas (o nome fica solto dentro de um
    // header flex-row), então na primeira vez ele é envolvido num wrapper em
    // coluna pra caber o subtítulo embaixo, sem editar as 3 páginas na mão.
    function _renderVagaSubtitulo(vagaTitulo) {
        const nomeEl = document.getElementById('chatThreadNome');
        if (!nomeEl) return;
        let wrap = document.getElementById('chatThreadTextos');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.id = 'chatThreadTextos';
            wrap.className = 'chat-thread-textos';
            nomeEl.replaceWith(wrap);
            wrap.appendChild(nomeEl);
        }
        let subEl = document.getElementById('chatThreadVaga');
        if (!vagaTitulo) { subEl?.remove(); return; }
        if (!subEl) {
            subEl = document.createElement('div');
            subEl.id = 'chatThreadVaga';
            subEl.className = 'chat-thread-vaga';
            wrap.appendChild(subEl);
        }
        subEl.innerHTML = `<i class="bi bi-briefcase"></i> ${_esc(vagaTitulo)}`;
    }

    // Botão "Agendar call" — só aparece em conversa aluno<->empresa. Opção A
    // (link do Google Calendar pré-preenchido, sem OAuth/API) — decidida pelo
    // Enzio como a mais prática pro escopo atual (27/08/2026).
    function _renderAgendarCallBtn() {
        const header = document.querySelector('#chatThread .chat-thread-header');
        if (!header) return;
        let btn = document.getElementById('chatAgendarCallBtn');
        // A conversa é aluno<->empresa se EU sou empresa OU o outro participante é
        // empresa (cobre os dois lados — quem está vendo a conversa muda quem é "eu").
        if (_meuTipo === 'empresa' || _conversaAtivaOutroTipo === 'empresa') {
            if (!btn) {
                btn = document.createElement('button');
                btn.type = 'button';
                btn.id = 'chatAgendarCallBtn';
                btn.className = 'btn btn-sm btn-outline-primary ms-auto';
                btn.innerHTML = '<i class="bi bi-calendar-plus me-1"></i>Agendar call';
                btn.addEventListener('click', _abrirAgendarCall);
                header.appendChild(btn);
            }
            btn.classList.remove('d-none');
        } else {
            btn?.classList.add('d-none');
        }
    }

    function _abrirAgendarCall() {
        const inicio = new Date(Date.now() + 24 * 60 * 60 * 1000);
        inicio.setHours(15, 0, 0, 0);
        const fim = new Date(inicio.getTime() + 30 * 60 * 1000);
        const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: `Ranking+ — conversa com ${_conversaAtivaOutroNome || ''}`,
            dates: `${fmt(inicio)}/${fmt(fim)}`,
            details: 'Agendado a partir do chat do Ranking+. Ajuste o horário se precisar e clique em "Adicionar Google Meet" antes de salvar.'
        });
        window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank', 'noopener');
    }

    // Chips de resposta rápida — só pré-preenchem o campo, nunca enviam sozinhos.
    function _renderChipsRapidos() {
        const composer = document.querySelector('#chatThread .chat-composer');
        if (!composer) return;
        let wrap = document.getElementById('chatChipsRapidos');
        const chips = _meuTipo === 'empresa' ? CHIPS_EMPRESA_PARA_ALUNO
            : _conversaAtivaOutroTipo === 'empresa' ? CHIPS_ALUNO_PARA_EMPRESA
            : null;
        if (!chips) { wrap?.remove(); return; }
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.id = 'chatChipsRapidos';
            wrap.className = 'chat-chips-rapidos';
            composer.parentNode.insertBefore(wrap, composer);
        }
        wrap.innerHTML = chips.map(c => `<button type="button" class="chat-chip">${_esc(c)}</button>`).join('');
        wrap.querySelectorAll('.chat-chip').forEach((el, i) => {
            el.addEventListener('click', () => {
                const input = document.getElementById('chatMsgInput');
                input.value = chips[i];
                input.focus();
            });
        });
    }

    function _linkify(textoEscapado) {
        return textoEscapado.replace(/(https?:\/\/[^\s<]+)/g, url => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
    }

    // ENVIAR
    async function _enviarMensagem() {
        if (_enviandoMensagem) return; // Enter dispara direto e ignora o disabled do botão — a trava real é esta flag
        const input = document.getElementById('chatMsgInput');
        const texto = input.value.trim();
        if (!texto && !_anexoPendente) return;
        if (!_conversaAtivaId) return;

        _enviandoMensagem = true;
        const btn = document.getElementById('chatSendBtn');
        btn.disabled = true;
        try {
            const res = await fetch(`${CHAT_API}/chat/conversas/${_conversaAtivaId}/mensagens`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ remetente_tipo: _meuTipo, remetente_id: _meuId, texto, anexo_id: _anexoPendente?.anexo_id || null })
            });
            const data = await res.json();
            if (!res.ok) { alert(data.error || 'Não foi possível enviar a mensagem.'); return; }
            input.value = '';
            _anexoPendente = null;
            _atualizarPreviewAnexo();
            await _carregarMensagens(true);
            _carregarConversas();
        } catch (_) {
            alert('Erro de conexão ao enviar a mensagem.');
        } finally {
            _enviandoMensagem = false;
            btn.disabled = false;
            input.focus();
        }
    }

    // ANEXO (PDF)
    async function _selecionarAnexo(e) {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;
        if (file.type !== 'application/pdf') { alert('Apenas arquivos PDF são aceitos.'); return; }
        if (file.size > 5 * 1024 * 1024) { alert('O arquivo deve ter até 5 MB.'); return; }

        const formData = new FormData();
        formData.append('pdf', file);
        const attachBtn = document.getElementById('chatAttachBtn');
        attachBtn.disabled = true;
        try {
            const res = await fetch(`${CHAT_API}/chat/anexos`, { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) { alert(data.error || 'Erro ao anexar arquivo.'); return; }
            _anexoPendente = { anexo_id: data.anexo_id, nome: data.nome };
            _atualizarPreviewAnexo();
        } catch (_) {
            alert('Erro de conexão ao enviar o anexo.');
        } finally {
            attachBtn.disabled = false;
        }
    }

    function _atualizarPreviewAnexo() {
        const input = document.getElementById('chatMsgInput');
        if (!input) return;
        input.placeholder = _anexoPendente ? `📎 ${_anexoPendente.nome} — escreva algo (opcional) e envie` : 'Escreva uma mensagem...';
    }

    // NOVA CONVERSA
    async function _abrirModalNovaConversa() {
        const modalEl = document.getElementById('modalNovaConversa');
        if (!modalEl) return;
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
        document.getElementById('chatContatosList').innerHTML = '<div class="text-center text-muted small py-3"><div class="spinner-border spinner-border-sm"></div></div>';
        try {
            const res = await fetch(`${CHAT_API}/chat/contatos/${_meuTipo}/${_meuId}`);
            _contatos = res.ok ? await res.json() : { professores: [], alunos: [] };
        } catch (_) { _contatos = { professores: [], alunos: [] }; }
        _renderContatos(_contatos);
    }

    function _renderContatos(dados) {
        const lista = document.getElementById('chatContatosList');
        const grupos = [];
        if (dados.professores?.length) {
            grupos.push('<div class="text-muted small fw-semibold px-1 mt-1 mb-1">PROFESSORES</div>' +
                dados.professores.map(p => _contatoItemHtml('professor', p.id, p.nome, true)).join(''));
        }
        if (dados.alunos?.length) {
            grupos.push('<div class="text-muted small fw-semibold px-1 mt-2 mb-1">COLEGAS</div>' +
                dados.alunos.map(a => _contatoItemHtml('aluno', a.id, a.nome, a.permitir_contato !== 0)).join(''));
        }
        lista.innerHTML = grupos.join('') || '<p class="text-muted small text-center py-3">Nenhum contato disponível.</p>';
        lista.querySelectorAll('[data-contato]').forEach(el => {
            el.addEventListener('click', () => {
                if (el.classList.contains('disabled')) return;
                const [tipo, id] = el.dataset.contato.split(':');
                _iniciarConversa(tipo, id);
            });
        });
    }

    function _contatoItemHtml(tipo, id, nome, disponivel) {
        return `
            <div class="chat-conversa-item ${tipo} ${disponivel ? '' : 'disabled'}" data-contato="${tipo}:${id}" style="${disponivel ? '' : 'opacity:.5;cursor:default;'}">
                <div class="chat-avatar-mini">${_esc((nome || '?')[0].toUpperCase())}</div>
                <div class="chat-conversa-texto">
                    <div class="chat-conversa-nome">${_esc(nome)}</div>
                    ${disponivel ? '' : '<div class="chat-conversa-previa">Contato desativado</div>'}
                </div>
            </div>`;
    }

    function _filtrarContatos() {
        if (!_contatos) return;
        const q = document.getElementById('chatBuscaContato').value.toLowerCase();
        _renderContatos({
            professores: _contatos.professores.filter(p => p.nome.toLowerCase().includes(q)),
            alunos: _contatos.alunos.filter(a => a.nome.toLowerCase().includes(q))
        });
    }

    async function _iniciarConversa(outroTipo, outroId) {
        try {
            const res = await fetch(`${CHAT_API}/chat/conversas`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meu_tipo: _meuTipo, meu_id: _meuId, outro_tipo: outroTipo, outro_id: outroId })
            });
            const data = await res.json();
            if (!res.ok) { alert(data.error || 'Não foi possível iniciar a conversa.'); return; }
            bootstrap.Modal.getInstance(document.getElementById('modalNovaConversa'))?.hide();
            await _carregarConversas();
            _abrirConversa(data.conversa_id);
        } catch (_) {
            alert('Erro de conexão ao iniciar a conversa.');
        }
    }

    // POLLING
    function _iniciarPolling() {
        if (_pollTimer) return;
        _pollTimer = setInterval(() => {
            if (_conversaAtivaId) _carregarMensagens(false);
            _carregarConversas();
        }, POLL_MS);
    }

    // HELPERS
    // _esc vem de javascript/esc.js (carregado antes deste arquivo)
    function _horaCurta(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        const hoje = new Date();
        const mesmodia = d.toDateString() === hoje.toDateString();
        return mesmodia
            ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }

    document.addEventListener('DOMContentLoaded', _init);
})();
