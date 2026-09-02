# RANKING+ — Histórico de Desenvolvimento
**Projeto Integrador III — 7º Semestre**
**Última atualização:** 2026-05-27

---

## Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Estado Inicial — BKP0](#2-estado-inicial--bkp0)
3. [Estado Atual — Versão Vigente](#3-estado-atual--versão-vigente)
4. [Comparativo: Antes × Depois](#4-comparativo-antes--depois)
5. [Registro Cronológico de Evoluções](#5-registro-cronológico-de-evoluções)
6. [Detalhamento Técnico por Módulo](#6-detalhamento-técnico-por-módulo)
7. [Arquitetura e Stack Tecnológica](#7-arquitetura-e-stack-tecnológica)
8. [Problemas Resolvidos](#8-problemas-resolvidos)
9. [Decisões de Projeto](#9-decisões-de-projeto)

---

## 1. Visão Geral do Projeto

**RANKING+** é uma plataforma web universitária de gestão e ranking acadêmico, desenvolvida como Projeto Integrador III do curso de Tecnologia da Informação.

**Objetivo:** Permitir que alunos acompanhem seu desempenho acadêmico (notas, frequência, ranking) e que professores gerenciem suas turmas, gerem relatórios e visualizem estatísticas — tudo conectado a um banco de dados real.

**Stack principal:**
- Frontend: HTML5 + CSS3 + Bootstrap 5 + JavaScript (Vanilla)
- Backend: Node.js + Express.js
- Banco de dados: MySQL (Laragon local, porta 4000)
- Bibliotecas: Frappe Charts, html2canvas, jsPDF, Chart.js

---

## 2. Estado Inicial — BKP0

> Pasta de referência: `RANKING+ BKP0/`
> Data estimada do snapshot: início do semestre 2025.2

### 2.1 Estrutura de Arquivos (BKP0)

```
RANKING+ BKP0/
├── Backend/
│   └── api.js                  (374 linhas)
├── html/                       (13 arquivos — 4.596 linhas total)
│   ├── areaaluno.html          (1.023 linhas)
│   ├── areaprofessor.html      (876 linhas)
│   ├── cadastro.html           (160 linhas)
│   ├── configprof.html         (41 linhas)
│   ├── configuser.html         (37 linhas)
│   ├── homealuno.html          (382 linhas)
│   ├── homeprof.html           (299 linhas)
│   ├── index.html              (645 linhas)
│   ├── lixoprof.html           (122 linhas)
│   ├── login.html              (82 linhas)
│   ├── recuperarsenha.html     (171 linhas)
│   ├── suporte.html            (322 linhas)
│   └── termodeuso.html         (436 linhas)
├── javascript/                 (19 arquivos — 7.220 linhas total)
│   ├── acessibilidade.js       (45 linhas)
│   ├── areaaluno.js            (845 linhas)
│   ├── areaprofessor.js        (1.308 linhas)
│   ├── avaliacao.js            (78 linhas)
│   ├── cadastro.js             (113 linhas)
│   ├── chamada.js              (24 linhas)
│   ├── comunicacao.js          (17 linhas)
│   ├── configprof.js           (65 linhas)
│   ├── configuser.js           (19 linhas)
│   ├── homealuno.js            (1.041 linhas)
│   ├── homeprof.js             (846 linhas)
│   ├── index.js                (638 linhas)
│   ├── login.js                (64 linhas)
│   ├── professor.js            (248 linhas)
│   ├── ranking.js              (30 linhas)
│   ├── recuperar.js            (430 linhas)
│   ├── sobrenos.js             (22 linhas)
│   ├── suporte.js              (737 linhas)
│   └── termodeuso.js           (650 linhas)
└── css/                        (14 arquivos)
```

### 2.2 Características do Estado Inicial

**Backend (api.js):**
- Porta: **3000**
- Banco: **Google Cloud SQL** (IP 34.21.16.113) — servidor remoto
- Rotas disponíveis: login, cadastro aluno, materias, horarios, faltas-mencoes, ranking/alunos, avaliacoes, professores, ranking/alunos
- Autenticação: comparação de senha em plain text (`if (senha !== user.senha)`)
- Sem CORS customizado para `file://` (Origin: null)
- Sem rotas para: boletim-detalhado, metricas completas, disciplinas/stats, talentos, profissional

**Frontend:**
- Navegação por **múltiplas páginas separadas** (login.html, cadastro.html, configprof.html, configuser.html, homealuno.html, homeprof.html)
- `areaaluno.js` (BKP0): apenas navegação de abas — **sem nenhuma chamada real à API**. Dados hardcoded.
- `areaprofessor.js` (BKP0): aba Relatórios com **array hardcoded** `reportsStudentsData` com 8 alunos fictícios de nomes como "Ana Silva", "Rafael Souza", etc.
- `index.js` (BKP0): 638 linhas com fluxo de login/cadastro ainda sem conexão real funcional
- Ranking: sem integração com banco
- Dashboard do aluno: sem puxar CRA, posição, métricas do banco
- Dashboard do professor: gráficos com dados fictícios
- PDF: não funcional / inexistente no fluxo principal
- Portal de Talentos: inexistente
- GitHub/LinkedIn: inexistentes

---

## 3. Estado Atual — Versão Vigente

> Data: 2026-05-11

### 3.1 Estrutura de Arquivos (Atual)

```
RANKING+/
├── Backend/
│   ├── api.js                  (374 linhas — versão legada mantida)
│   └── api2.js                 (~950 linhas — versão ativa)
├── html/                       (8 arquivos)
│   ├── areaaluno.html          (com Perfil Profissional + filtros de gráfico)
│   ├── areaprofessor.html      (com opção ATS no PDF)
│   ├── index.html
│   ├── recuperarsenha.html
│   ├── suporte.html
│   ├── talentos.html
│   ├── admin.html              ← NOVO
│   └── termodeuso.html
├── javascript/                 (13 arquivos)
│   ├── areaaluno.js            (Perfil Profissional, ATS, filtros gráfico, CRA)
│   ├── areaprofessor.js        (PDF com ATS, função _appendAtsPdfProf)
│   ├── acessibilidade.js       (skip-link, ARIA, focus-visible)
│   ├── avaliacao.js
│   ├── cadastro.js
│   ├── comunicacao.js
│   ├── index.js                (MFA: modal OTP, tempToken, verificação 2FA)
│   ├── professor.js
│   ├── ranking.js
│   ├── recuperar.js
│   ├── suporte.js
│   ├── talentos.js
│   └── termodeuso.js
├── css/
│   ├── styleareaaluno.css
│   ├── styleareaprofessor.css
│   └── (demais)
├── banco_sql/
├── dados/
├── docs/
│   └── HISTORICO_DESENVOLVIMENTO.md  ← este arquivo
└── desabilitadas/              (páginas antigas movidas aqui)
```

### 3.2 Características da Versão Atual

**Backend (api2.js):**
- Porta: **4000**
- Banco: **MySQL local via Laragon** (localhost)
- CORS: `res.setHeader('Access-Control-Allow-Origin', '*')` manual (para suportar `file://` com `Origin: null`)
- Arquivos estáticos: `express.static()` serve todo o projeto via HTTP (`http://localhost:4000/html/...`)
- 35+ rotas REST implementadas e funcionais
- Login com suporte a identificador genérico (matrícula ou email)
- **MFA/2FA por e-mail**: OTP de 6 dígitos via nodemailer/Gmail SMTP, validade 10 min
- Cadastro de aluno com github, linkedin, todos os dados complementares
- Rotas novas: boletim-detalhado, metricas, ranking/detalhado, disciplinas/stats, alunos/:id/profissional, talentos/buscar, talentos/filtros, alunos/:id/perfil-profissional, upload-pdf (multer + pdf-parse)

**Frontend:**
- Navegação **consolidada em SPA** (Single Page Application por abas — sem redirecionamentos de página para login/cadastro)
- Login e Cadastro: modais no próprio `index.html`
- **Autenticação em 2 etapas**: após login bem-sucedido, modal de OTP aparece; acesso só liberado após validação
- Todas as abas do aluno e do professor puxam dados reais do banco
- PDF funcional: html2canvas + jsPDF, A4 completo, 1 aluno por página, sem cortes
- **Perfil Profissional (ATS)** na área do aluno: resumo, experiências, formações, idiomas, habilidades — importação automática via PDF do LinkedIn
- **Filtros de gráfico** no dashboard do aluno: Mês/Semestre/Ano (Evolução das Notas) e 2 Anos/3 Anos/Completo (Histórico de CRA)
- **PDF do professor** com opção de incluir página ATS de cada aluno
- Portal de Talentos: página dedicada com filtros LGPD
- LGPD: alunos que optam por não aparecer ficam como "Aluno Anônimo" no ranking público
- Logout direto (sem confirmação) + botão "Início" na sidebar
- **Acessibilidade WCAG**: VLibras widget (gov.br), FAB toolkit flutuante (controle de fonte + alto contraste), skip-link, focus trap em modais Bootstrap, foco visível, ARIA fixes automáticos
- **Certificações e Cursos Complementares**: 6ª tabela do ecossistema Perfil Profissional (ATS) — CRUD completo, importação do PDF LinkedIn com parser dual-format (sidebar / completo), seção no ATS PDF
- **Painel Administrativo**: página `admin.html` com login próprio (e-mail + senha, token em `X-Admin-Token`), visualização de alunos/professores/empresas com busca em tempo real e **impersonation** — admin acessa o sistema como qualquer usuário sem saber a senha

---

## 4. Comparativo: Antes × Depois

| Aspecto                        | BKP0 (Original)                          | Atual                                        |
|-------------------------------|------------------------------------------|----------------------------------------------|
| **Banco de dados**            | Google Cloud SQL (remoto, porta 3000)    | MySQL local / Laragon (porta 4000)           |
| **Autenticação**              | Senha em plain text                      | Identificador flexível (matrícula ou email)  |
| **CORS**                      | Não configurado para `file://`           | Configurado para `Origin: null` (`file://`)  |
| **Nº de páginas HTML**        | 13                                       | 7 (consolidadas)                             |
| **Nº de arquivos JS**         | 19                                       | 12 + 2 backend (mais enxuto)                 |
| **Linhas de código (JS)**     | 7.220 (frontend)                         | 6.243 (frontend) + 1.015 (backend)           |
| **Login/Cadastro**            | Páginas separadas (login.html, cadastro.html) | Modais integrados no index.html         |
| **Dashboard aluno**           | Dados fictícios hardcoded                | CRA, ranking, métricas reais do banco        |
| **Dashboard professor**       | Gráficos fictícios                       | Frappe Charts com dados reais por disciplina |
| **Aba Disciplinas (aluno)**   | Cards estáticos                          | Boletim real com menção, faltas, frequência  |
| **Ranking (aluno)**           | Não funcional                            | Ranking real com filtros por curso/semestre  |
| **Geração de PDF**            | Não funcional / html2pdf problemático    | html2canvas + jsPDF — A4 completo            |
| **Editar Perfil**             | Campos básicos sem salvar no banco       | Todos os campos incluindo endereço, emergência, github, linkedin |
| **GitHub / LinkedIn**         | Inexistentes                             | Cadastro opcional + Quadro Profissional      |
| **Portal de Talentos**        | Inexistente                              | Página completa com filtros e cards LGPD     |
| **LGPD ranking público**      | Sem controle                             | "Aluno Anônimo" para quem optou por privacidade |
| **Termo de uso obrigatório**  | Inexistente                              | Obrigatório no cadastro (checkbox)           |
| **Logout**                    | Redireciona sem limpar localStorage     | localStorage.clear() + redirecionamento direto |
| **Botão "Início" na sidebar** | Inexistente                              | Link direto para index.html sem deslogar     |
| **Grade horária (professor)** | Dados hardcoded                          | Dados reais do banco + eventos fictícios     |
| **Turmas (professor)**        | Não funcional                            | Lista real de disciplinas e alunos do banco  |
| **Acessibilidade**            | Inexistente                              | VLibras, FAB toolkit (fonte A+/A−/alto contraste), skip-link, focus trap modais, ARIA |
| **Autenticação 2FA/MFA**      | Senha única, sem segunda camada          | OTP 6 dígitos por e-mail (nodemailer), modal pós-login |
| **Perfil Profissional (ATS)** | Inexistente                              | CRUD completo, importação de PDF do LinkedIn, 6 tabelas |
| **Importação de currículo**   | Inexistente                              | Upload de PDF LinkedIn → parse automático (multer + pdf-parse) |
| **Filtros de gráfico**        | Sem filtros (dados estáticos)            | Mês/Semestre/Ano (notas) e 2/3 Anos/Completo (CRA) |
| **PDF do professor com ATS**  | Apenas dados acadêmicos visuais          | Opção de anexar página ATS por aluno no PDF  |
| **Certificações no currículo**| Inexistente                              | CRUD de certificações + importação LinkedIn + seção no ATS PDF |
| **Export chips no professor** | Checkboxes Bootstrap grandes (form-check) | Chips compactos modernos com CSS `:has(input:checked)` |
| **Painel Administrativo**     | Inexistente                               | Login próprio (e-mail + token), listagem de alunos/professores/empresas, busca em tempo real, impersonation com modal de confirmação |

---

## 5. Registro Cronológico de Evoluções

> Cada entrada representa uma sessão ou grupo de mudanças implementadas.

---

### [v0.1] — Estado inicial (BKP0)

**Data estimada:** 2025.2 (início do semestre)

**Descrição:**
Projeto em estado inicial de desenvolvimento. Estrutura de páginas criada, layout visual definido com Bootstrap 5. Backend básico com conexão ao Google Cloud SQL. Navegação funcional entre páginas, mas sem integração real com banco de dados no frontend. Dados das telas de aluno e professor eram majoritariamente hardcoded ou fictícios.

**Arquivos principais:**
- `Backend/api.js` — 374 linhas, 12 rotas básicas
- `html/` — 13 páginas separadas
- `javascript/` — 19 scripts fragmentados

**Limitações identificadas:**
- Senha em plain text
- Sem CORS para `file://`
- Frontend sem chamadas reais à API
- PDF inexistente
- Dados do dashboard totalmente fictícios
- Sem LGPD no ranking
- Sem GitHub/LinkedIn
- Sem Portal de Talentos

---

### [v0.2] — Consolidação de estrutura e integração API

**Data:** 2025.2 (iteração 1)

**O que mudou:**
- Criação do `api2.js` na porta 4000 com Laragon local (substituindo Google Cloud SQL)
- Migração do login e cadastro para modais dentro do `index.html` (eliminando `login.html` e `cadastro.html` como páginas separadas)
- Configuração manual de CORS para suportar `Origin: null` (abertura direta de arquivos via `file://`)
- `index.js` reescrito para 355 linhas: login real, cadastro real, carregamento de ranking do banco
- Início da integração real do `areaaluno.js` com a API

**Arquivos alterados:**
- `Backend/api2.js` (criado)
- `html/index.html` (modais de login/cadastro adicionados)
- `javascript/index.js` (reescrito)

---

### [v0.3] — Dashboard do aluno com dados reais

**Data:** 2025.2 (iteração 2)

**O que mudou:**
- `areaaluno.js`: `loadAlunoData()` passa a buscar `/alunos/:id`, `/alunos/:id/metricas`, `/alunos/:id/boletim-detalhado`, `/ranking/detalhado` em paralelo
- Dashboard exibe CRA real, posição no ranking, frequência, atividades entregues
- Aba Disciplinas: cards com menção, faltas, frequência por disciplina vindos do banco
- Ranking: filtros funcionais (por curso, semestre) integrados ao backend
- Nome do aluno preenchido do localStorage imediatamente (sem esperar fetch)

**Rotas adicionadas no backend:**
- `GET /alunos/:id/boletim-detalhado`
- `GET /ranking/detalhado`
- `GET /alunos/:id/metricas` (aprimorada)

---

### [v0.4] — Geração de PDF funcional (aluno)

**Data:** 2025.2 (iteração 3)

**O que mudou:**
- Abandono do `html2pdf.js` (causava cortes e compressão)
- Implementação com `html2canvas` + `jsPDF` (CDN individuais)
- Cada aluno renderizado como div isolado de 730px em `position:absolute;left:-9999px`
- `html2canvas` com `scale:2` para alta resolução
- jsPDF em formato A4 com margem de 8mm
- Conteúdo maior que a página escala proporcionalmente para caber em 1 folha
- Gráficos offscreen com Chart.js para imagem embutida no PDF

**Técnica adotada:**
```
div 730px → html2canvas (scale:2) → toDataURL JPEG → jsPDF.addImage → A4
```

---

### [v0.5] — Área do Professor: integração completa

**Data:** 2025.2 (iteração 4)

**O que mudou:**
- `initializeCharts()` reescrito como `async` — busca `/professores/:id/disciplinas/stats`
- Gráfico 1: Média por Disciplina (barras, yMarker 7.0)
- Gráfico 2: Frequência por Disciplina (barras, yMarker 75)
- Gráfico 3: Distribuição de Menções por Disciplina (barras empilhadas: SS/MS/MM/MI/II)
- Aba Turmas: lista real de disciplinas com alunos do banco
- Aba Alunos: tabela com dados reais (menção ou média, frequência, atividades)
- Grade horária: dados reais do banco com normalização de dias da semana (`_normalizarDia()`)
- Eventos fictícios adicionados como card acima da grade

**Rota adicionada no backend:**
```js
GET /professores/:id/disciplinas/stats
// Retorna: id, nome_materia, total_alunos, media, frequencia, cnt_ss, cnt_ms, cnt_mm, cnt_mi, cnt_ii
```

**Bug crítico corrigido:**
- MySQL retorna aliases em minúsculo: `cnt_SS` → `cnt_ss` — corrigido tanto no SQL quanto no JS

---

### [v0.6] — PDF do Professor: A4 completo por aluno

**Data:** 2025.2 (iteração 5)

**O que mudou:**
- `generateReportsPDF()` completamente reescrito — abandonou renderização única de HTML string
- Adotou a mesma técnica do aluno: loop por aluno, div 730px temporário, html2canvas scale:2, jsPDF A4
- Loading overlay fecha corretamente após `pdf.save()` (bug de loading travado corrigido)
- Cada aluno em página separada, sem cortes
- Relatório inclui: cabeçalho, info do aluno, métricas, gráficos offscreen, boletim, pontos fortes/fracos, observações do professor

---

### [v0.7] — LGPD: ranking público com anonimização

**Data:** 2025.2 (iteração 6)

**O que mudou:**
- `GET /ranking` passou a retornar `COALESCE(a.permitir_exibicao_ranking, 1)` no SQL
- `createRankingItem()` em `index.js` verifica `permitir_exibicao_ranking === 0`
- Alunos que optaram por privacidade aparecem como "Aluno Anônimo" (avatar cinza, nome em itálico, curso "—")
- Alunos normais mantêm nome e curso exibidos

---

### [v0.8] — Editar Perfil completo + campos complementares

**Data:** 2025.2 (iteração 7)

**O que mudou:**
- `areaaluno.html`: Editar Perfil com endereço completo (rua, número, complemento, bairro, cidade, estado, CEP), contato de emergência (nome, telefone, e-mail), preferências (tema, notificações, privacidade)
- `setupFormValidation()` reescrito como `async` — envia `PUT /alunos/:id` com payload completo
- Backend `PUT /alunos/:id` atualizado com lista permitida de campos
- Campos `github` e `linkedin` adicionados ao cadastro e ao editar perfil

---

### [v0.9] — Quadro Profissional + Portal de Talentos

**Data:** 2026-03-01 (estimado)

**O que mudou:**
- **Campos GitHub/LinkedIn** no formulário de cadastro (`regGithub`, `regLinkedin`) e na edição de perfil
- **Quadro Profissional** na aba Meu Perfil do aluno: busca repositórios reais via GitHub API (server-side), exibe cards com linguagem, estrelas. Exibe também resumo LinkedIn.
- **Portal de Talentos** (`talentos.html` + `talentos.js`): página corporativa com hero search, filtros (curso, semestre, github/linkedin), cards de talentos com skill pills. Filtro LGPD: só exibe alunos com `permitir_exibicao_ranking = 1` e média acima de 8.5.

**Rotas adicionadas no backend:**
- `GET /alunos/:id/profissional` — retorna repos GitHub + mock LinkedIn
- `GET /talentos/buscar` — busca com filtros LGPD
- `GET /talentos/filtros` — lista cursos, semestres, habilidades disponíveis

---

### [v1.0] — Polimento final: logout, navegação, loading

**Data:** 2026-04-07

**O que mudou:**
- **Loading do PDF professor** — `hideReportsLoading()` adicionado antes de `pdf.save()` (loading não travava mais)
- **Botão "Início"** adicionado na sidebar de `areaaluno.html` e `areaprofessor.html` — navega para `index.html` sem deslogar
- **Logout sem confirmação** — removido `confirm()` de todos os `confirmLogout()` (areaaluno, areaprofessor). Agora: `localStorage.clear()` + redirect direto
- **Botão "Sair"** renomeado de "Logout" para "Sair" em `areaprofessor.html`

---

### [v1.1] — Acessibilidade: VLibras + acessibilidade.js

**Data:** 2026-05-10

**O que mudou:**
- Widget oficial **VLibras** (Governo Federal — vlibras.gov.br) adicionado em todos os arquivos HTML: `areaaluno.html`, `areaprofessor.html`, `index.html`, `recuperarsenha.html`, `suporte.html`, `talentos.html`, `termodeuso.html`
- Widget injeta o botão de Libras (intérprete virtual de LIBRAS) no canto da tela com um único `<div vw>` + script CDN
- **`javascript/acessibilidade.js`** criado/expandido com:
  - **Skip-link** ("Ir para o conteúdo principal") — posicionado antes de todo o conteúdo, visível só no foco por teclado
  - **`:focus-visible`** — outline vermelho `#F4442E` em todos os elementos focáveis, via `<style>` injetado
  - **`fixImages()`** — adiciona `alt=""` a qualquer `<img>` sem atributo `alt`
  - **`fixButtons()`** — adiciona `aria-label="Botão"` a botões visualmente vazios; `aria-label="Fechar"` a `.btn-close`
  - **`fixForms()`** — vincula `<label>` sem `for` ao seu `<input>` interno gerando IDs aleatórios
  - **`fixNavLandmarks()`** — adiciona `aria-label` a `<nav>` sem label ("Navegação principal", "Navegação 2", etc.)

**Arquivos alterados:**
- `javascript/acessibilidade.js` (reescrito: 101 linhas)
- Todos os HTMLs listados acima (snippet VLibras adicionado)

**Nota técnica:** VLibras exige contexto HTTP (não funciona em `file://`). Para funcionar sem servidor, foi adicionado `express.static()` ao backend — ver v1.3.

---

### [v1.2] — MFA: Autenticação de Dois Fatores por E-mail

**Data:** 2026-05-10

**Nome técnico:** **MFA — Multi-Factor Authentication via TOTP-style OTP por e-mail**

**O que mudou:**

**Backend (`api2.js`):**
- Instalada lib **nodemailer** (`npm install nodemailer`)
- Rota `POST /login` alterada: após validar senha, gera OTP de 6 dígitos aleatório, armazena em `_otpSessions` (Map em memória) com TTL de 10 minutos, envia e-mail com template HTML, retorna `{ tempToken, requiresOtp: true }` em vez dos dados completos do usuário
- Nova rota `POST /login/verify-otp`: recebe `tempToken` + `otp`, valida, apaga entrada do Map, retorna dados completos do usuário + token de sessão
- **DEV_MODE**: variável de ambiente `NODEMAILER_DEV=true` faz o OTP ser impresso no console em vez de enviado por e-mail (facilita desenvolvimento local sem configurar SMTP)
- Configuração SMTP: Gmail com App Password (`process.env.GMAIL_USER`, `process.env.GMAIL_APP_PASSWORD`)

**Frontend (`javascript/index.js`):**
- `handleLogin()` adaptado: verifica `requiresOtp: true` na resposta, salva `tempToken` em variável, abre **modal de verificação OTP**
- Modal com campo de 6 dígitos + timer de expiração exibido
- `handleVerifyOtp()`: POST `/login/verify-otp` → se sucesso, fluxo normal de login (localStorage + redirect)
- Feedback de erro se OTP errado ou expirado

**Fluxo completo:**
```
Usuário digita senha → POST /login
  → OTP gerado → e-mail enviado → { tempToken, requiresOtp: true }
  → Modal OTP aparece no frontend
  → Usuário digita código → POST /login/verify-otp
  → Sucesso → dados do usuário → localStorage → redirect para área
```

**Arquivos alterados:**
- `Backend/api2.js` (nodemailer, rotas MFA)
- `Backend/package.json` (nodemailer adicionado)
- `javascript/index.js` (modal OTP, fluxo de 2 etapas)
- `html/index.html` (modal HTML de verificação OTP)

---

### [v1.3] — Perfil Profissional (ATS) + Importação de PDF LinkedIn

**Data:** 2026-05-10

**Nomes técnicos:**
- **Perfil Profissional**: CRUD de currículo estruturado no banco
- **ATS (Applicant Tracking System)**: formato de PDF texto puro legível por sistemas de RH automatizados
- **LinkedIn PDF Parser**: extração heurística de dados de currículo a partir do PDF exportado do LinkedIn

**O que mudou:**

**Banco de dados — 5 novas tabelas:**
```sql
perfil_profissional    (id, aluno_id, resumo, updated_at)
pp_experiencias        (id, perfil_id, empresa, cargo, periodo, descricao)
pp_formacoes           (id, perfil_id, instituicao, curso, periodo)
pp_idiomas             (id, perfil_id, idioma, nivel)
pp_habilidades         (id, perfil_id, habilidade)
```

**Backend (`api2.js`):**
- `npm install multer pdf-parse` adicionados
- `app.use(express.static(path.join(__dirname, '..')))` — serve o projeto inteiro via HTTP (resolve VLibras em `file://`)
- `GET /alunos/:id/perfil-profissional` — JOIN das 5 tabelas, retorna objeto completo
- `PUT /alunos/:id/perfil-profissional` — transação: delete + insert por sub-tabela
- `POST /alunos/:id/perfil-profissional/upload-pdf` — **parser heurístico de PDF LinkedIn**:
  - Recebe arquivo via `multipart/form-data` (multer, sem gravar em disco)
  - Extrai texto bruto com `pdf-parse`
  - Detecta seções via regex (`SECS`: RESUMO, EXPERIÊNCIA, EDUCAÇÃO, IDIOMAS, COMPETÊNCIAS)
  - Parser de experiências com dois padrões:
    - **Multi-cargo**: empresa → total duration → cargo → datas → descrição
    - **Cargo único**: empresa → cargo → datas → descrição
  - Parser de formações: divide por `·` (curso, datas, notas)
  - Retorna `{ resumo, habilidades, idiomas, experiencias, formacoes }` prontos para exibição

**Frontend — Área do Aluno (`areaaluno.js` + `areaaluno.html`):**
- Nova aba/sub-seção **"Perfil Profissional"** em `initializePerfilPage()`
- `loadPerfilProfissional()`: GET + renderização dos dados
- Seções editáveis: Resumo (textarea), Experiências (formulário add/remove), Formações (formulário add/remove), Idiomas (select + nível), Habilidades (tags com remoção)
- Botão **"Importar PDF LinkedIn"**: upload de arquivo → POST upload-pdf → preenche todos os campos automaticamente
- Botão **"Salvar Perfil"**: PUT com todos os dados atuais do estado local (`_ppState`)
- `_ppRenderHabilidades()`: renderiza tags; remoção por índice numérico (não por valor — evita bug com JSON.stringify em atributos HTML)
- Relatório PDF do aluno (`generateStudentReport()`): checkbox "Incluir Perfil Profissional (ATS)" — se marcado, chama `_ppAppendAtsPdf(pdf, ...)` que adiciona página de texto puro ao final do PDF

**Arquivos alterados:**
- `Backend/api2.js` (3 novas rotas, multer, pdf-parse, express.static)
- `Backend/package.json` (multer, pdf-parse)
- `javascript/areaaluno.js` (Perfil Profissional completo, ~+400 linhas)
- `html/areaaluno.html` (seção Perfil Profissional, checkbox ATS no PDF)

---

### [v1.4] — Filtros de Gráfico no Dashboard do Aluno

**Data:** 2026-05-10

**O que mudou:**
- **"Evolução das Notas"** — card recebeu grupo de botões segmentados (Bootstrap `btn-group`):
  - **Mês**: exibe notas dos últimos 3 meses
  - **Semestre**: exibe notas do semestre atual (6 meses)
  - **Ano**: exibe notas dos últimos 12 meses
- **"Histórico de CRA"** — card recebeu grupo de botões:
  - **2 Anos**: exibe CRA dos últimos 2 anos por semestre
  - **3 Anos**: exibe CRA dos últimos 3 anos por semestre
  - **Completo**: exibe todo o histórico disponível
- Implementação: datasets `_PERF_DATA` e `_CRA_DATA` com todas as séries pré-calculadas; filtro alterna qual série é passada ao `renderChart()` + `clearChart()` do Frappe Charts
- Padrão `replaceWith(cloneNode(true))` usado na vinculação dos botões para evitar acúmulo de event listeners quando o usuário navega entre abas e volta

**Arquivos alterados:**
- `javascript/areaaluno.js` (`_wirePerfFiltro()`, `_wireCraFiltro()`, datasets, `window._wireCraFiltro` exposto)
- `html/areaaluno.html` (btn-groups nos dois cards de gráfico)

---

### [v1.5] — Perfil Profissional (ATS) no Relatório do Professor

**Data:** 2026-05-10

**O que mudou:**
- Aba **Relatórios** do professor ganhou novo checkbox nas opções de PDF: **"Perfil Profissional (ATS)"**
- `generateReportsPDF()` adaptado:
  1. Lê o checkbox `pdfIncPerfilProf`
  2. Para cada aluno selecionado, faz `GET /alunos/:id/perfil-profissional` em paralelo com a renderização visual
  3. Após a página visual de cada aluno, verifica se o perfil tem conteúdo; se sim, chama `_appendAtsPdfProf(pdf, perfil, aluno)`
- **`_appendAtsPdfProf(pdf, perfil, aluno)`**: função de geração de página ATS usando jsPDF text APIs puras (sem html2canvas):
  - Cabeçalho: Nome completo, Curso, Matrícula
  - Seções: RESUMO, EXPERIÊNCIA PROFISSIONAL, FORMAÇÃO COMPLEMENTAR, IDIOMAS, HABILIDADES
  - Paginação automática: `pdf.addPage()` quando o cursor Y ultrapassa a margem inferior
  - Rodapé: "Gerado por RANKING+ — [data]"
  - Texto puro — sem cores, sem imagens — compatível com leitores ATS de RH

**Arquivos alterados:**
- `javascript/areaprofessor.js` (`generateReportsPDF()`, `_appendAtsPdfProf`)
- `html/areaprofessor.html` (checkbox "Perfil Profissional (ATS)" no grid de opções)

---

### [v1.6] — Acessibilidade WCAG Avançada: FAB Toolkit + Focus Trap + Chips de Export

**Data:** 2026-05-26

**O que mudou:**

**`javascript/acessibilidade.js`** — reescrito (~510 linhas):
- **FAB de acessibilidade** (`#a11yFab`): botão flutuante no canto inferior esquerdo (`bottom:24px; left:16px; z-index:9998`) — lado oposto ao VLibras, para não colidir
  - Abre painel `#a11yPanel` com dois controles
  - **Tamanho da fonte**: 3 níveis (100% / 115% / 130%) via `document.documentElement.style.fontSize`, persistido em `localStorage['a11y-font-level']`
  - **Alto contraste**: toggle liga `body.accessibility-high-contrast` → CSS universal `*:not(script):not(style) { background: #000 !important; color: #ffff00 !important; }` com overrides de especificidade para o próprio toolkit. Estado persistido em `localStorage['a11y-contrast']`
  - Fecha com `Escape` ou clique fora do painel
- **Skip-link** (`position:fixed`) — seletor em cadeia: `main` → `#main-content` → `[role="main"]` → `.main-content` → `.container-fluid` → `.container`. Define `tabindex="-1"` no alvo dinamicamente
- **Focus trap em modais Bootstrap 5**: `show.bs.modal` salva `lastFocused`; `shown.bs.modal` instala `trapHandler` (Tab/Shift+Tab ciclam entre focáveis visíveis do modal via `offsetParent !== null`); `hidden.bs.modal` remove handler e restaura foco

**`html/areaprofessor.html`** — seção de export reformulada:
- Removidos 7 `<div class="form-check">` com `<input class="form-check-input">` e `<label class="form-check-label">` (visualmente grandes e pesados)
- Substituídos por `<label class="pdf-chip"><input type="checkbox" hidden><span>Label</span></label>` — padrão chip moderno
- Botões CSV/PDF movidos para o `card-header-custom` como `btn btn-sm btn-light`
- Todos os IDs originais preservados (`pdfIncMetricas`, `pdfIncGraficos`, `pdfIncDisciplinas`, `pdfIncPontos`, `pdfIncRanking`, `pdfIncObs`, `pdfIncPerfilProf`, etc.)

**`css/styleareaprofessor.css`** — adicionado ao final:
```css
.pdf-chip { cursor:pointer; border-radius:20px; border:1.5px solid var(--border-light); ... }
.pdf-chip:has(input:checked) { background:var(--primary-blue); color:#fff; }
.pdf-chip.chip-active { /* fallback para browsers sem :has() */ }
```

**Decisão técnica — alto contraste:**
CSS com `*` seletor universal + `!important` quebraria o próprio toolkit. Resolvido com regras de especificidade mais alta para `.a11y-fab`, `.a11y-panel` e filhos após a regra universal.

**Decisão técnica — FAB lado esquerdo:**
VLibras já ocupa o canto inferior direito em todas as páginas. Posicionar o FAB de acessibilidade à esquerda garante que não haja sobreposição visual ou de clique.

**Arquivos alterados:**
- `javascript/acessibilidade.js` (reescrito: ~510 linhas)
- `html/areaprofessor.html` (seção export, linhas 419–496)
- `css/styleareaprofessor.css` (classes .pdf-chip adicionadas ao final)

---

### [v1.7] — Certificações e Cursos Complementares

**Data:** 2026-05-26

**Nomes técnicos:**
- **pp_certificacoes**: 6ª tabela do ecossistema Perfil Profissional (ATS)
- **Parser dual-format**: detecta automaticamente se o PDF LinkedIn exportou certs em formato sidebar (só nomes) ou formato completo (nome + instituição + data)

**O que mudou:**

**Banco de dados — nova tabela:**
```sql
CREATE TABLE IF NOT EXISTS pp_certificacoes (
  id           INT NOT NULL AUTO_INCREMENT,
  aluno_id     INT NOT NULL,
  nome         VARCHAR(300) NOT NULL,
  instituicao  VARCHAR(200) DEFAULT NULL,
  data_emissao VARCHAR(50)  DEFAULT NULL,
  PRIMARY KEY (id),
  KEY aluno_id (aluno_id),
  CONSTRAINT pp_certificacoes_ibfk_1
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
- `data_emissao VARCHAR(50)` — não `DATE` — para preservar o formato textual do LinkedIn ("jan. 2024", "2024", etc.), igual às outras tabelas pp_*
- Migration segura em `banco_sql/migration_certificacoes.sql` — `IF NOT EXISTS`, sem risco de perda de dados

**Backend (`api2.js`):**
- `GET /alunos/:id/perfil-profissional`: + query `SELECT nome, instituicao, data_emissao FROM pp_certificacoes WHERE aluno_id = ? ORDER BY id`; response inclui `certificacoes: certs`
- `PUT /alunos/:id/perfil-profissional`: destructure `certificacoes = []`; bloco DELETE + INSERT no transaction existente após habilidades
- `POST /alunos/:id/perfil-profissional/upload-pdf`: **parser reescrito com detecção de formato**:
  - `hasDates`: verifica se alguma linha do slice `certs` contém data ou "emitido" → determina qual branch usar
  - **Formato completo** (com datas): nome → [instituição] → [emitido em ...]; usa `isDate`/`isEmitido` para separar campos
  - **Formato sidebar** (só nomes — padrão mais comum do LinkedIn): loop linha a linha com filtros:
    - `isNoiseLine(l)`: descarta linhas com `|` (título profissional), `@` (e-mail), `isLoc` (localização), URLs, linhas > 180 chars
    - Lookahead: se a próxima linha contém `|` ou é `isLoc` → linha atual é o nome da pessoa (cabeçalho de intro), não um cert → descartada
    - Linha começa com `(` → continuação do cert anterior (ex.: "Red Hat System Administration I" + "(RH124) - Ver. 9.0" → unificados)
  - Habilidades deixaram de incluir certs: `const habilidades = slice('habilidades').filter(...)` (sem `...slice('certs')`)

**Frontend — Área do Aluno (`areaaluno.js` + `areaaluno.html`):**
- `_ppState`: adicionado `certificacoes: []` na declaração, na inicialização pós-GET e no fallback do catch
- `_ppRenderAll()`: chamada `_ppRenderCertificacoes()` adicionada ao final
- Novas funções:
  - `_ppCertRow(c, i)`: card com borda amarela (`border-warning`), 2 linhas de campos (nome; instituicao + data_emissao), atributos `data-ppc="..."` para coleta
  - `_ppRenderCertificacoes()`: renderiza todos os cards no `<div id="ppCertificacoes">`
  - `ppAddCertificacao()`: push de `{nome:'', instituicao:'', data_emissao:''}` + re-render + foco no primeiro input
  - `ppRemoveCertificacao(i)`: filtra `_ppState.certificacoes` por índice + re-render
  - `_ppCollectCertificacoes()`: lê cards do DOM via `data-ppc`, filtra `nome.trim()` vazio
- `savePerfilProfissional()`: payload adicionou `certificacoes: _ppCollectCertificacoes()`
- `ppHandleLinkedinUpload()`: adicionado `if (parsed.certificacoes?.length) _ppState.certificacoes = parsed.certificacoes`
- `_ppAppendAtsPdf()`: nova seção ATS após HABILIDADES:
  ```
  CERTIFICAÇÕES E CURSOS COMPLEMENTARES
  • Nome — Instituição (Data)
  ```
  Separador horizontal automático se HABILIDADES também existir
- `html/areaaluno.html`: `<div id="ppCertificacoes"></div>` + botão "Adicionar Certificação" (amarelo, `btn-outline-warning`) inseridos após `#ppHabilidadesTags`

**Frontend — Área do Professor (`areaprofessor.js`):**
- `_appendAtsPdfProf()`: mesma lógica da função do aluno — seção CERTIFICAÇÕES E CURSOS COMPLEMENTARES adicionada após HABILIDADES, com separador condicional

**Arquivos alterados:**
- `banco_sql/migration_certificacoes.sql` (criado)
- `Backend/api2.js` (GET + PUT + POST upload-pdf atualizados)
- `javascript/areaaluno.js` (+~60 linhas: state, funções, ATS)
- `html/areaaluno.html` (div ppCertificacoes + botão Adicionar)
- `javascript/areaprofessor.js` (seção CERTIFICAÇÕES no _appendAtsPdfProf)

**Correção de bug documentada — Parser de Certificações LinkedIn:**

| Sintoma | Causa | Solução |
|---------|-------|---------|
| "(RH124) - Ver. 9.0" virava cert separado | Parser genérico não reconhecia linha como continuação | Linhas que começam com `(` são auto-anexadas ao cert anterior |
| "Enzio Albéfaro" aparecia como certificação | Bloco de intro da pessoa (Nome → Título\|... → Local) está dentro do slice de certs | Lookahead: próxima linha com `\|` ou `isLoc` → linha atual descartada |
| Próximo cert virava "instituição" do anterior | Parser sempre consumia a linha seguinte como institution | Branch sidebar não tenta extrair institution/date — cada linha é um cert independente |
| Linhas de título profissional (com `\|`) no resultado | Sem filtro de caractere `\|` | `isNoiseLine`: descarta qualquer linha com `\|` |

---

### [v1.8] — Painel Administrativo com Impersonation

**Data:** 2026-06-11

**Nomes técnicos:**
- **Painel Admin**: interface de back-office separada do fluxo normal de aluno/professor, com autenticação própria baseada em token
- **Impersonation**: funcionalidade que permite ao administrador acessar o sistema "como" qualquer usuário (aluno, professor ou empresa) sem precisar da senha do usuário, para fins de suporte e diagnóstico

**O que mudou:**

**Novo arquivo `html/admin.html`:**
- Página standalone com duas telas alternadas via classe `d-none`: `#loginScreen` (formulário de e-mail + senha) e `#painelScreen` (painel completo)
- Sidebar fixa com 4 abas de navegação: Dashboard, Alunos, Professores, Empresas
- Topbar com título da aba atual, nome do admin logado e badge "Admin"
- **Dashboard**: 4 stat-cards (Total de Alunos, Professores, Empresas, Relógio em tempo real) + seção de ações rápidas com botões para navegar às listas
- **Tab Alunos**: tabela com colunas #, Nome, E-mail, Matrícula, Curso, Semestre, Situação (badge colorido), Ação (botão impersonation)
- **Tab Professores**: tabela com #, Nome, E-mail, Campus, Ação
- **Tab Empresas**: tabela com #, Razão Social, Nome Fantasia, E-mail, CNPJ, Setor, Ação
- Todas as tabelas têm campo de busca com ícone integrado (`search-wrapper`)
- **Modal de confirmação de impersonation** (`#modalConfirm`): ícone emoji, mensagem personalizada por tipo de usuário, botão confirmar com cor dinâmica (azul = aluno, azul escuro = professor, roxo = empresa)
- **Toast de impersonation** (`#impersonateToast`): banner flutuante exibido 1,6 s antes do redirecionamento, informando para qual perfil o admin está sendo enviado
- VLibras + `acessibilidade.js` incluídos (padrão de todas as páginas)

**Novo arquivo `javascript/admin.js`** (~463 linhas):

**Estado em memória:**
```js
let _adminToken = null;      // token JWT recebido no login
let _adminInfo  = null;      // { id, nome }
let _impersonacoes = 0;      // contador de impersonations na sessão
let _alunos = [], _professores = [], _empresas = [];  // cache para filtro client-side
let _pendingImpersonate = null;  // { id, tipo, nome } — aguardando confirmação
```

**Funções principais:**

| Função | Descrição |
|--------|-----------|
| `handleLogin()` | POST `/admin/login` com `{ email, senha }`. Salva `admin_token` e `admin_info` no `localStorage`; chama `_entrarNoPainel()` |
| `_entrarNoPainel()` | Oculta `#loginScreen`, exibe `#painelScreen`, atualiza nome do admin na sidebar e topbar, dispara `carregarEstatisticas()` + `carregarAlunos()` + `carregarProfessores()` + `carregarEmpresas()` em paralelo |
| `handleLogout()` | POST `/admin/logout`, limpa `_adminToken`, `_adminInfo`, remove entradas do `localStorage`, reverte telas |
| `irParaTab(tab)` | Oculta todas as `div#tab*`, exibe a selecionada, atualiza classe `active` na sidebar e textos do topbar. Mapeamento via `_tabTitles` |
| `carregarEstatisticas()` | 3 fetches paralelos (`Promise.all`) para `/admin/alunos`, `/admin/professores`, `/admin/empresas`; atualiza os stat-cards do dashboard com `.length` de cada lista |
| `carregarAlunos()` | GET `/admin/alunos` → popula `_alunos` → chama `renderAlunos()` |
| `carregarProfessores()` | GET `/admin/professores` → popula `_professores` → chama `renderProfessores()` |
| `carregarEmpresas()` | GET `/admin/empresas` → popula `_empresas` → chama `renderEmpresas()` |
| `renderAlunos(lista)` | Gera `innerHTML` da `#tabelaAlunos` com template string por item. Usa `_esc()` em todos os campos string, `_badgeSituacao()` para a coluna Situação |
| `renderProfessores(lista)` | Gera `innerHTML` da `#tabelaProfessores` |
| `renderEmpresas(lista)` | Gera `innerHTML` da `#tabelaEmpresas` |
| `filtrarAlunos()` | Filtra `_alunos` por `nome`, `email`, `matricula`, `curso` (case-insensitive) → `renderAlunos(filtrado)`. Operação 100% client-side, sem requisição adicional |
| `filtrarProfessores()` | Idem para `nome`, `email`, `campus` |
| `filtrarEmpresas()` | Idem para `razao_social`, `nome_fantasia`, `email_corporativo`, `cnpj`, `setor_nome` |
| `confirmarImpersonation(id, tipo, nome)` | Salva `_pendingImpersonate`; atualiza ícone emoji, mensagem e cor do botão no `#modalConfirm` de acordo com `tipo`; exibe o modal via `bootstrap.Modal.getOrCreateInstance()` |
| `executarImpersonation()` | Lê `_pendingImpersonate`, fecha o modal, exibe o toast, chama POST `/admin/impersonate/{tipo}/{id}`. Se bem-sucedido: escreve `localStorage` exatamente como o login normal faz e redireciona após 1600 ms |
| `_apiGet(path)` | `fetch` com header `X-Admin-Token: _adminToken`. Lança erro se `res.ok === false` |
| `_apiPost(path, body)` | `fetch` POST com `Content-Type: application/json` + `X-Admin-Token` |
| `_mostrarToast(icone, titulo, desc)` | Exibe `#impersonateToast` adicionando classe `show`; remove após 3000 ms |
| `_badgeSituacao(s)` | Retorna HTML de badge Bootstrap por situação do aluno: `Ativo` → verde, `Inativo` → cinza, `Trancado` → amarelo |
| `_esc(str)` | Escapa `& < > " '` para prevenir XSS ao injetar dados do banco no DOM via template strings |
| `_atualizarRelogio()` | Atualiza `#statHora` com `new Date().toLocaleTimeString('pt-BR')`. Chamado no init e em `setInterval` de 1000 ms |

**Fluxo de Impersonation — detalhe técnico:**

```
Admin clica "Acessar como Aluno" (id=42)
  → confirmarImpersonation(42, 'aluno', 'João Silva')
  → Modal abre com ícone 🎓 + cor var(--primary)
  → Admin confirma
  → executarImpersonation()
    → POST /admin/impersonate/aluno/42  (header: X-Admin-Token)
    → Backend valida token, retorna { sucesso: true, usuario: { id:42, nome:'João Silva', tipo:'aluno' } }
    → localStorage.setItem('unirank_user', JSON.stringify(usuario))
    → localStorage.setItem('alunoId', 42)
    → localStorage.removeItem('professorId')
    → Toast: "🎓 Acessando como Aluno · João Silva"
    → setTimeout 1600ms → window.location.href = '../html/areaaluno.html'
```

Para empresas, o fluxo usa `localStorage.setItem('empresa_logada', ...)` e redireciona para `talentos.html`.

**Persistência de sessão admin:**
`localStorage` (não `sessionStorage`) — Edge em modo `file://` bloqueia `sessionStorage`. O token é restaurado no `DOMContentLoaded`: se `admin_token` e `admin_info` existirem, pula a tela de login diretamente.

**Rotas adicionadas no backend (`api2.js`):**
```
POST /admin/login               — valida email+senha do administrador, retorna { sucesso, token, admin }
POST /admin/logout              — invalida o token da sessão
GET  /admin/alunos              — lista completa de alunos (requer X-Admin-Token)
GET  /admin/professores         — lista completa de professores (requer X-Admin-Token)
GET  /admin/empresas            — lista completa de empresas (requer X-Admin-Token)
POST /admin/impersonate/aluno/:id     — retorna dados do aluno para login forçado
POST /admin/impersonate/professor/:id — retorna dados do professor para login forçado
POST /admin/impersonate/empresa/:id   — retorna dados da empresa para login forçado
```

**Arquivos criados/alterados:**
- `html/admin.html` (criado: ~300 linhas)
- `javascript/admin.js` (criado: ~463 linhas)
- `css/admin.css` (criado: estilos exclusivos do painel — sidebar, stat-cards, btn-impersonate, toast, chips)
- `Backend/api2.js` (rotas `/admin/*` adicionadas)

---

## 6. Detalhamento Técnico por Módulo

### 6.1 Backend — api2.js (porta 4000)

**Principais endpoints:**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/login` | Autenticação aluno/professor por identificador+senha |
| POST | `/alunos` | Cadastro de aluno com todos os campos |
| GET | `/alunos/:id` | Dados completos do aluno |
| PUT | `/alunos/:id` | Atualização de perfil |
| GET | `/alunos/:id/metricas` | CRA, frequência, atividades |
| GET | `/alunos/:id/boletim-detalhado` | Boletim por disciplina (menção, faltas, atividades) |
| GET | `/alunos/:id/horarios` | Grade horária |
| GET | `/alunos/:id/profissional` | Repos GitHub + LinkedIn |
| GET | `/ranking` | Top alunos com `permitir_exibicao_ranking` |
| GET | `/ranking/detalhado` | Ranking completo com posições |
| GET | `/professores/:id` | Dados do professor |
| GET | `/professores/:id/disciplinas` | Disciplinas do professor |
| GET | `/professores/:id/disciplinas/stats` | Stats por disciplina (média, frequência, menções) |
| GET | `/professores/:id/alunos` | Todos os alunos do professor |
| GET | `/disciplinas/:id/alunos` | Alunos de uma disciplina específica |
| GET | `/talentos/buscar` | Busca de talentos com filtros LGPD |
| GET | `/talentos/filtros` | Opções de filtro (cursos, semestres, habilidades) |
| POST | `/login` (v2) | Retorna `tempToken + requiresOtp: true` em vez de dados diretos |
| POST | `/login/verify-otp` | Valida OTP de 6 dígitos; retorna dados do usuário se correto |
| GET | `/alunos/:id/perfil-profissional` | Perfil ATS completo (resumo + 4 sub-tabelas) |
| PUT | `/alunos/:id/perfil-profissional` | Salva perfil completo em transação |
| POST | `/alunos/:id/perfil-profissional/upload-pdf` | Upload de PDF LinkedIn, retorna campos parsed |
| POST | `/admin/login` | Autentica administrador por e-mail+senha, retorna token de sessão |
| POST | `/admin/logout` | Invalida token de sessão do admin |
| GET  | `/admin/alunos` | Lista completa de alunos (requer header `X-Admin-Token`) |
| GET  | `/admin/professores` | Lista completa de professores (requer `X-Admin-Token`) |
| GET  | `/admin/empresas` | Lista completa de empresas (requer `X-Admin-Token`) |
| POST | `/admin/impersonate/aluno/:id` | Retorna dados do aluno para impersonation (requer `X-Admin-Token`) |
| POST | `/admin/impersonate/professor/:id` | Retorna dados do professor para impersonation |
| POST | `/admin/impersonate/empresa/:id` | Retorna dados da empresa para impersonation |

### 6.2 Frontend — areaaluno.js

**Fluxo principal:**
1. `DOMContentLoaded` → `initializeApp()` → preenche nome do localStorage
2. `loadAlunoData(id)` → 4 fetches paralelos (aluno, metricas, boletim, ranking)
3. Cada aba tem função dedicada: `loadDisciplinasTab()`, `loadRankingTab()`, `loadScheduleTab()`, `initializePerfilPage()`
4. `initializePerfilPage()` → chama `loadPerfilProfissional()` + `window._wireCraFiltro()` (filtros de gráfico)
5. `generateStudentReport()` → html2canvas + jsPDF; se checkbox ATS marcado → `_ppAppendAtsPdf()` adiciona página texto puro
6. `setupFormValidation()` → PUT /alunos/:id

**Módulo Perfil Profissional (`_ppState`):**
- Estado local: `{ resumo, experiencias, formacoes, idiomas, habilidades, certificacoes }`
- `loadPerfilProfissional()` → GET perfil → popula `_ppState` → renderiza UI
- `_ppRenderHabilidades()` → tags com remoção por índice numérico
- `ppRemoveHabilidade(i)` → filtra por `idx !== i`
- Upload PDF → POST upload-pdf → merge no `_ppState` → re-renderiza todos os campos

**Módulo Gráficos com filtros:**
- `_PERF_DATA` e `_CRA_DATA`: objetos com múltiplas séries (mes/semestre/ano e 2anos/3anos/completo)
- `_wirePerfFiltro()` / `_wireCraFiltro()`: vinculam btn-group → `renderChart()` com `clearChart()` primeiro
- Padrão `replaceWith(cloneNode(true))` evita event listeners duplicados na re-entrada da aba

### 6.3 Frontend — areaprofessor.js

**Fluxo principal:**
1. `DOMContentLoaded` → `initializeProfessorDashboard()`
2. `loadDashboardData()` → professor info + stats
3. `initializeCharts()` (async) → `/disciplinas/stats` → Frappe Charts
4. Cada tab tem handler: `loadClassesTab()`, `loadStudentsTab()`, `loadScheduleTab()`
5. `generateReportsPDF()` → loop por aluno → html2canvas + jsPDF; se `pdfIncPerfilProf` marcado → `_appendAtsPdfProf()` por aluno

**`_appendAtsPdfProf(pdf, perfil, aluno)`:**
- Usa jsPDF text APIs puras (sem imagem/canvas)
- Paginação via cursor Y + `pdf.addPage()` automático
- Seções: cabeçalho, RESUMO, EXPERIÊNCIA, FORMAÇÃO, IDIOMAS, HABILIDADES, CERTIFICAÇÕES E CURSOS COMPLEMENTARES, rodapé com data

### 6.4 index.html + index.js

- Login/Cadastro em modais Bootstrap
- `handleLogin()` → POST /login → localStorage → redirect
- `handleRegister()` → POST /alunos → abre modal de login
- `loadRanking()` → GET /ranking → `createRankingItem()` com LGPD

---

### 6.5 Frontend — admin.js

**Arquivo:** `javascript/admin.js` (~463 linhas)

**Fluxo principal:**
1. `DOMContentLoaded` → tenta restaurar sessão via `localStorage` (`admin_token` + `admin_info`) — se existirem, chama `_entrarNoPainel()` diretamente
2. `handleLogin()` → POST `/admin/login` → salva token + info no `localStorage` → `_entrarNoPainel()`
3. `_entrarNoPainel()` → alterna telas, popula nome do admin, dispara 4 carregamentos em paralelo
4. `irParaTab(tab)` → alterna visibilidade das `div#tab*` + atualiza sidebar/topbar
5. Filtros de busca: `input` event → `filtrar*()` → filtra array em memória → `render*()` — zero requisição extra
6. `confirmarImpersonation()` → abre modal Bootstrap personalizado por tipo de usuário
7. `executarImpersonation()` → POST `/admin/impersonate/{tipo}/{id}` → replica localStorage do login normal → redirect com delay de 1,6 s

**Módulo Impersonation:**
- Suporta 3 tipos: `aluno` → `areaaluno.html`, `professor` → `areaprofessor.html`, `empresa` → `talentos.html`
- Escreve `localStorage` com as mesmas chaves que o login normal usa (`unirank_user`, `alunoId`/`professorId`, `empresa_logada`) — área do usuário não distingue se foi impersonation ou login real
- `_pendingImpersonate` garante que o clique em "Confirmar" sempre execute a ação correta mesmo se o usuário abrisse dois modais rapidamente

**Segurança frontend:**
- `_esc(str)` escapa `& < > " '` em todos os dados vindos do banco antes de inserir no DOM via template string — previne XSS reflexivo
- Token enviado via header `X-Admin-Token` (não via query string ou cookie) — não vaza em URLs ou logs de acesso básicos

---

## 7. Arquitetura e Stack Tecnológica

```
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND (file:// ou http://localhost:4000)         │
│                                                                  │
│  index.html          areaaluno.html        areaprofessor.html   │
│  index.js            areaaluno.js          areaprofessor.js      │
│  talentos.html       talentos.js           acessibilidade.js     │
│                                                                  │
│  Bootstrap 5.3  |  Bootstrap Icons  |  Frappe Charts 1.6        │
│  html2canvas 1.4.1  |  jsPDF 2.5.1  |  Chart.js (offscreen)    │
│  VLibras Widget (gov.br CDN)                                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ fetch() HTTP REST
                            │ (CORS: Access-Control-Allow-Origin: *)
┌───────────────────────────▼─────────────────────────────────────┐
│                   BACKEND (Node.js + Express)                    │
│                   Backend/api2.js — porta 4000                   │
│                                                                  │
│   express           |  mysql2/promise  |  cors                   │
│   node-fetch        |  nodemailer      |  multer                 │
│   pdf-parse         |  express.static  |  crypto (OTP)           │
└──────────┬────────────────────┬────────────────┬────────────────┘
           │ mysql2             │ nodemailer     │ multer+pdf-parse
┌──────────▼──────┐  ┌──────────▼──────┐  ┌─────▼───────────────┐
│ MySQL / Laragon │  │ Gmail SMTP      │  │ PDF buffer em RAM   │
│ localhost:3306  │  │ (App Password)  │  │ (sem gravar disco)  │
│                 │  │ nodemailer 8.x  │  │ pdf-parse → texto   │
│ Tabelas:        │  └─────────────────┘  └─────────────────────┘
│ alunos          │
│ professores     │
│ disciplinas     │
│ boletim         │
│ horarios        │
│ turmas          │
│ atividades      │
│ perfil_profissional  ← ATS
│ pp_experiencias      ← ATS
│ pp_formacoes         ← ATS
│ pp_idiomas           ← ATS
│ pp_habilidades       ← ATS
│ pp_certificacoes     ← ATS
└──────────┬──────┘
           │ (externo)
┌──────────▼──────────────────────────────────────────────────────┐
│  GitHub Public API (server-side)                                 │
│  GET api.github.com/users/{username}/repos?sort=updated&per_page=3 │
└─────────────────────────────────────────────────────────────────┘
```

**Nota sobre CORS e `file://`:**
Navegadores tratam arquivos abertos diretamente (`file://`) com `Origin: null`. O Express com `cors()` padrão bloqueia isso. A solução adotada foi setar manualmente os headers em todas as rotas:
```js
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

**Nota sobre `express.static` e VLibras:**
VLibras carrega via `<iframe>` e requer contexto HTTP com `Origin` válido — falha em `file://`. Com `app.use(express.static(path.join(__dirname, '..')))` o projeto inteiro fica acessível em `http://localhost:4000/html/areaaluno.html`, resolvendo o problema sem alterar o frontend.

**Nota sobre nodemailer e OTP:**
- OTP gerado com `crypto.randomInt(100000, 999999)` (6 dígitos criptograficamente seguros)
- Armazenado em `Map<tempToken, { otp, tipo, userId, exp }>` em memória (sem banco — menor superfície de ataque)
- TTL de 10 minutos; expirado na validação e no verify-otp bem-sucedido
- Em DEV_MODE, OTP é impresso no console — sem depender de SMTP configurado

---

## 8. Problemas Resolvidos

| # | Problema | Causa | Solução |
|---|----------|-------|---------|
| 1 | PDF cortava conteúdo e comprimia tudo em 1 página | `html2pdf` renderiza DOM inteiro de uma vez | Substituído por `html2canvas` + `jsPDF` por aluno |
| 2 | Gráfico de Menções sem dados | MySQL retorna aliases em minúsculo (`cnt_ss`), JS lia `cnt_SS` | Corrigidos aliases no SQL e JS |
| 3 | Login falhou com `Cannot read properties of null` | IDs dos inputs divergiam entre HTML e JS | IDs padronizados: `loginTipo`, `loginUser`, `loginPass` |
| 4 | Cadastro com erro "undefined bind params" | Campo `idade` na API não era enviado pelo form, virava `undefined` | Removido `idade` do INSERT; `n()` helper converte undefined→null |
| 5 | Ranking do aluno não filtrava | Frontend usava variável errada para a lista filtrada | Corrigido para usar `_rankAllData` e `_rankFiltered` |
| 6 | Grade horária sem dados reais | `_normalizarDia()` não normalizava "Segunda-feira" para "Segunda" | Normalização por prefixo após strip de acentos |
| 7 | Loading do PDF travado na tela | `hideReportsLoading()` chamado só no catch, não antes do `save()` | Adicionado `hideReportsLoading()` antes de `pdf.save()` |
| 8 | CORS bloqueando todas as requisições em `file://` | `Origin: null` não aceito pelo middleware cors() padrão | Headers manuais em todas as rotas do api2.js |
| 9 | `permitir_exibicao_ranking` faltando no ranking público | Coluna ausente no SELECT do GET /ranking | Adicionado `COALESCE(a.permitir_exibicao_ranking, 1)` |
| 10 | Editar Perfil com dados do "João Silva" fixos | `loadAlunoData()` não populava os inputs do form | Adicionados `editGithub`, `editLinkedin`, endereço, emergência ao populate |
| 11 | VLibras bloqueado com `ERR_TOO_MANY_REDIRECTS` em `file://` | VLibras carrega iframe com `Origin: null`; sem servidor HTTP, browser bloqueia | `express.static()` adicionado ao backend; projeto acessível via `http://localhost:4000/` |
| 12 | PDF LinkedIn importava apenas o resumo | Rota `upload-pdf` retornava `experiencias: [], formacoes: []` hardcoded | Reescrita com parser heurístico completo — detecta seções por regex e extrai todos os campos |
| 13 | Remoção de habilidades quebrada | `onclick="ppRemoveHabilidade(${JSON.stringify(h)})"` gerava aspas dentro de atributo HTML, quebrando o parser | Substituído por índice numérico: `onclick="ppRemoveHabilidade(${i})"` + filtro por `idx !== i` |
| 14 | Nome da empresa errado em multi-cargos | `empresaCtx = ''` era executado indevidamente após processar um cargo, zerando o contexto antes do próximo cargo da mesma empresa | Removida a linha de reset; contexto só muda quando nova empresa é detectada explicitamente |
| 15 | FAB de acessibilidade quebrando o alto contraste no próprio toolkit | CSS universal `* { background:#000 !important }` sobrescrevia as cores do FAB e do painel | Regras de especificidade mais alta para `.a11y-fab`, `.a11y-panel` e filhos posicionadas APÓS a regra universal no `<style>` injetado |
| 16 | Skip-link não mantinha posição ao rolar a página | `position:absolute` move com o scroll | Alterado para `position:fixed` — sempre visível no topo do viewport ao receber foco |
| 17 | Skip-link apontava para elemento errado no areaprofessor | `querySelector('[class*="content"]')` pegava `<div class="tab-content active">` (container de abas, não conteúdo) | Cadeia de seletores prioriza `.main-content` que é o `<div class="flex-grow-1 main-content">` correto |
| 18 | Certificações do LinkedIn virando campos Institution/Data errados | Parser genérico consumia a próxima linha sempre como "institution" — em sidebar format não há institution | Reescrita com detecção de formato (`hasDates`): branch sidebar trata cada linha como um cert nome independente |
| 19 | Linhas de intro da pessoa ("Enzio Albéfaro", título, cidade) vazando para certs | Bloco de cabeçalho LinkedIn aparece entre o slice de `certs` e `Resumo` no texto flat do PDF | Lookahead: se próxima linha contém `\|` (título profissional) ou é `isLoc` → linha atual é descartada |
| 20 | "(RH124) - Ver. 9.0" virava certificação separada | Sem lógica de continuação de linha | Linhas que começam com `(` são appendadas ao nome do cert anterior, não criadas como nova entrada |

---

## 9. Decisões de Projeto

### 9.1 Migração Google Cloud SQL → Laragon local
**Motivo:** Dependência de IP externo gerava instabilidade no desenvolvimento. Laragon oferece MySQL local sem custo e sem latência de rede.
**Impacto:** Porta mudou de 3000 → 4000 (para não conflitar com api.js legado).

### 9.2 Abandono de páginas separadas para SPA-like
**Motivo:** Login/Cadastro em páginas separadas gerava fluxo quebrado e dificultava manutenção do estado de sessão.
**Impacto:** `login.html`, `cadastro.html`, `configprof.html`, `configuser.html`, `homealuno.html`, `homeprof.html` foram movidas para `desabilitadas/`. Sistema passou a usar modais e abas.

### 9.3 html2canvas + jsPDF ao invés de html2pdf
**Motivo:** `html2pdf.js` renderiza o DOM ao vivo, ficando sujeito a CSS de tela que distorce o layout. A abordagem manual cria um div isolado de 730px, garantindo layout consistente independente do viewport.

### 9.4 LGPD: anonimização no ranking público
**Motivo:** Alunos devem ter o direito de não ter seu nome exposto publicamente no ranking da página inicial.
**Implementação:** Flag `permitir_exibicao_ranking` no banco. Frontend exibe "Aluno Anônimo" com avatar cinza quando `= 0`.

### 9.5 Logout sem confirmação
**Motivo:** O `confirm()` nativo do navegador é bloqueante e considerado UX ruim para ações rotineiras. O botão "Sair" já é explícito o suficiente.

### 9.6 Portal de Talentos com filtro LGPD + média mínima
**Motivo:** A página é voltada para recrutadores. Exibir alunos que pediram privacidade seria uma violação. O filtro de média > 8.5 garante qualidade do "vitrine" de talentos.

### 9.7 MFA por e-mail em vez de TOTP por app autenticador
**Motivo:** TOTP (Google Authenticator etc.) exigiria que o aluno instalasse um app adicional — barreira alta para o público universitário. E-mail é onipresente e já é o canal de comunicação institucional.
**Trade-off:** OTP por e-mail é menos seguro que TOTP (sujeito à segurança do e-mail), mas adequado para o contexto acadêmico sem dado financeiro ou crítico.

### 9.8 Formato ATS: jsPDF text puro em vez de html2canvas
**Motivo:** ATS (Applicant Tracking Systems) de RH não conseguem ler texto dentro de imagens. Um PDF gerado via html2canvas seria apenas uma foto — inútil para sistemas de triagem automática. O formato texto puro garante que palavras-chave (cargo, linguagens, certificações) sejam indexáveis.
**Implementação:** `pdf.text()`, `pdf.setFont()`, `pdf.splitTextToSize()` do jsPDF — sem nenhuma imagem embedada.

### 9.9 Parser heurístico de PDF LinkedIn: dois padrões de detecção
**Motivo:** O LinkedIn exporta PDFs sem tags estruturais — é texto corrido. Não há como usar PDF outline ou marcadores semânticos. A solução heurística detecta dois padrões de layout que o LinkedIn usa para experiências:
- **Multi-cargo** (ex.: 3 posições na mesma empresa): empresa → total duration → cargo → datas
- **Cargo único**: empresa → cargo → datas → descrição
**Trade-off:** Heurística pode falhar em PDFs fora do padrão LinkedIn (perfis muito antigos, idiomas diferentes do português). Para o escopo do projeto, o coverage é suficiente.

### 9.10 FAB de acessibilidade no lado esquerdo (não direito)
**Motivo:** VLibras já ocupa o canto inferior direito com seu próprio botão. Posicionar o FAB de acessibilidade no canto inferior esquerdo evita sobreposição visual e de clique entre os dois widgets.
**Detalhe técnico:** `bottom:24px; left:16px; z-index:9998` (um abaixo do VLibras que usa z-index alto).

### 9.11 Alto contraste via classe CSS no `<body>` (não inline styles)
**Motivo:** Aplicar contraste via `body.accessibility-high-contrast + *` no CSS permite que o estado seja revertido limpando a classe, sem necessidade de memorizar os estilos originais de cada elemento. É também respeitoso com `prefers-contrast: more` do sistema operacional.
**Trade-off:** O seletor universal `*` com `!important` é pesado — CSS engine precisa recomputar todos os elementos. Para o escopo de uma aplicação universitária é aceitável; em apps grandes usaria `color-scheme` ou `filter:invert`.

### 9.12 Certificações com `data_emissao VARCHAR(50)` (não DATE)
**Motivo:** O LinkedIn exporta datas como texto não padronizado ("jan. 2024", "janeiro de 2024", "2024", "Emitido em jan. de 2024"). Converter para `DATE` exigiria um parser de data frágil e poderia perder informação. VARCHAR preserva o texto exato importado, coerente com o padrão já usado em `pp_formacoes` (período como texto).

### 9.13 Parser de certificações com detecção automática de formato (`hasDates`)
**Motivo:** O LinkedIn tem dois formatos de export para a seção de certificações:
- **Sidebar** (mais comum): apenas nomes, sem institution/data, possíveis multi-linhas
- **Completo** (exportações mais antigas ou seção "Licenças e certificações"): nome + institution + "Emitido em ..."

Detectar via `hasDates = certLinhasRaw.some(l => isDate(l) || isEmitido(l))` é mais robusto que tentar parsear os dois formatos com lógica única — evita que o branch "full" consuma linhas erradas em perfis sidebar-only.

### 9.14 express.static para servir projeto inteiro via HTTP
**Motivo:** VLibras exige contexto HTTP. Em vez de configurar um servidor separado (nginx, serve), foi adicionado uma linha ao api2.js que já está rodando, servindo todo o diretório pai do Backend/. Custo zero de infraestrutura.
**Impacto:** A URL de acesso muda de `file:///...areaaluno.html` para `http://localhost:4000/html/areaaluno.html`. CORS com `Origin: null` continua funcionando para quem prefere abrir via `file://`.

---

## Notas para Documentação Final

Este arquivo foi gerado em 2026-04-07 para servir de base para a documentação técnica do Projeto Integrador III. Para expandir em documentação formal, recomenda-se:

1. **Diagrama ER do banco** — exportar do Laragon/MySQL Workbench
2. **Capturas de tela** — dashboard aluno, professor, portal de talentos, PDF gerado
3. **Diagrama de fluxo de login** — index.html → modal → API → localStorage → redirect
4. **Diagrama de arquitetura** — já esboçado na Seção 7
5. **Manual do usuário** — fluxo do aluno e do professor passo a passo
6. **Testes realizados** — documentar os cenários testados manualmente

---

