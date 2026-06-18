# Ranking+

**Plataforma Web de Gestão Acadêmica e Empregabilidade Universitária**

Projeto Integrador III — 7º Semestre — Ciência da Computação — CEUB

---

## Visão Geral

O **Ranking+** é uma plataforma SaaS universitária que resolve um problema real e duplo: alunos de TI não têm ferramentas que consolidem seu desempenho acadêmico de forma rastreável e comunicável; empresas de tecnologia não têm acesso a talentos juniores com mérito comprovado por fonte neutra.

A plataforma transforma o histórico acadêmico bruto — notas por menção, frequência, progressão semestral — em um **ativo de empregabilidade**, exportando currículos em formato ATS (*Applicant Tracking System*) legíveis por robôs de RH, ao mesmo tempo em que oferece aos professores dashboards de turma com estatísticas reais alimentadas por banco de dados relacional.

**Problema que resolve:**
- Lado aluno: desengajamento por falta de feedback contínuo e gamificado sobre o desempenho
- Lado mercado: custo elevado de triagem de candidatos sem verificação de base acadêmica

---

## Destaques do 7º Semestre

Este semestre representou uma virada arquitetural significativa, com três módulos de alto impacto entregues:

### Evolução para Arquitetura SPA
O sistema partiu de 13 páginas HTML fragmentadas e chegou a uma **Single Page Application** com login, cadastro e fluxo completo integrados via modais Bootstrap no `index.html`. As áreas autenticadas (aluno, professor, admin) operam como SPAs baseadas em abas com lazy loading por demanda.

### Módulo de Inteligência ATS — Parsing de PDF do LinkedIn
O Ranking+ implementa um **parser heurístico de PDF** que extrai automaticamente as seções de um currículo exportado do LinkedIn (resumo, experiências, formações, idiomas, habilidades, certificações) e popula o Perfil Profissional do aluno sem preenchimento manual. O PDF exportado é gerado em **formato texto puro via jsPDF** — não como imagem — garantindo que palavras-chave sejam indexáveis por sistemas ATS de RH reais (Greenhouse, Lever, SAP SuccessFactors).

### Segurança, LGPD e Acessibilidade
- **MFA por e-mail:** OTP de 6 dígitos com TTL de 10 minutos, estado em memória RAM (zero escritas no banco durante autenticação)
- **LGPD:** Anonimização dinâmica no ranking público (`"Aluno Anônimo"`) para quem optou por privacidade; Portal de Talentos com consentimento explícito e filtragem por performance (média > 8.5)
- **WCAG 2.1 AA:** VLibras (intérprete de LIBRAS), FAB de acessibilidade com controle de fonte e alto contraste, skip-link, focus trap em modais, correções ARIA automáticas

---

## Stack Tecnológica

### Frontend
| Tecnologia | Uso |
|---|---|
| HTML5 + CSS3 | Estrutura e estilo das páginas |
| JavaScript (Vanilla ES6+) | Lógica de interface, chamadas à API, modais, gráficos |
| Bootstrap 5.3 + Bootstrap Icons | Layout responsivo, componentes UI |
| Frappe Charts 1.6 | Gráficos do dashboard do professor (barras, barras empilhadas) |
| html2canvas 1.4.1 | Renderização de divs como canvas para geração de PDF |
| jsPDF 2.5.1 | Geração de PDFs A4 completos (relatórios visuais + ATS texto puro) |
| Chart.js | Gráficos offscreen renderizados em buffer para embutir no PDF |
| VLibras Widget (gov.br) | Tradução de texto para Língua Brasileira de Sinais (LIBRAS) |

### Backend
| Tecnologia | Uso |
|---|---|
| Node.js 18 | Runtime do servidor |
| Express 4 | Framework REST API |
| mysql2/promise | Driver MySQL com suporte a async/await e pool de conexões |
| nodemailer 8.x | Envio de e-mails OTP via Gmail SMTP (App Password) |
| multer (memoryStorage) | Upload de PDF do LinkedIn sem escrita em disco |
| pdf-parse | Extração de texto bruto do PDF para o parser heurístico |
| crypto (nativo Node) | Geração de OTP criptograficamente seguro (`crypto.randomInt`) |
| node-fetch | Consulta server-side à GitHub Public API |
| express.static | Serve o projeto inteiro via HTTP (resolve VLibras + elimina `file://`) |

### Banco de Dados
| Item | Detalhe |
|---|---|
| SGBD | MySQL |
| Ambiente | Laragon local — `localhost:3306` |
| Porta da API | 4000 |
| Banco | `universidade_ranking` |
| Pool de conexões | `connectionLimit: 10`, `queueLimit: 0` |

### Segurança
| Mecanismo | Implementação |
|---|---|
| MFA/2FA | OTP 6 dígitos por e-mail, `Map<tempToken, sessão>` em memória, TTL 10 min |
| LGPD | `permitir_exibicao_ranking` flag no banco, COALESCE no SQL, anonimização no frontend |
| Admin Token | Header `X-Admin-Token` (não URL/cookie) |
| Anti-XSS | Função `_esc()` para todos os dados do banco injetados via template string |
| Anti-mass-assignment | Allowlist de campos no `PUT /alunos/:id` |
| Transação atômica | DELETE + INSERT transacional no `PUT /perfil-profissional` |

---

## Arquitetura e Topologia

```
┌──────────────────────────────────────────────────────────────┐
│         FRONTEND  (http://localhost:4000/ ou file://)        │
│                                                              │
│  index.html · areaaluno.html · areaprofessor.html            │
│  talentos.html · admin.html · suporte.html                   │
│  acessibilidade.js (script global em todas as páginas)       │
│                                                              │
│  Bootstrap 5 · Frappe Charts · html2canvas · jsPDF           │
│  VLibras Widget (CDN gov.br)                                 │
└────────────────────────┬─────────────────────────────────────┘
                         │ fetch() REST / JSON
                         │ CORS: Access-Control-Allow-Origin: *
┌────────────────────────▼─────────────────────────────────────┐
│         BACKEND  Node.js + Express — porta 4000              │
│         Backend/api2.js  (~1.500 linhas, 35+ rotas)          │
│                                                              │
│  express · mysql2 · nodemailer · multer · pdf-parse          │
│  crypto · node-fetch · express.static                        │
└────────┬──────────────────┬──────────────┬───────────────────┘
         │ mysql2           │ nodemailer   │ multer + pdf-parse
┌────────▼──────┐  ┌────────▼──────────┐  ┌▼─────────────────┐
│ MySQL/Laragon │  │ Gmail SMTP (TLS)   │  │ Buffer em RAM    │
│ localhost:3306│  │ nodemailer 8.x     │  │ pdf-parse → texto│
│ DB: univ_rank │  └───────────────────┘  └──────────────────┘
│               │
│ 12 tabelas:   │       ┌────────────────────────────────────┐
│ core (7)      │       │  GitHub Public API (server-side)   │
│ ATS (5)       │       │  GET api.github.com/users/{u}/repos│
│ B2B futuro    │       └────────────────────────────────────┘
└───────────────┘
```

**Comunicação sem CORS problemático:** O Express seta manualmente `Access-Control-Allow-Origin: *` em um middleware global antes de todas as rotas, suportando `Origin: null` de `file://` e `Origin: http://localhost:4000` de HTTP simultâneo. Sem configuração adicional de proxy.

**VLibras e contexto HTTP:** `app.use(express.static(path.join(__dirname, '..')))` serve o projeto inteiro via `http://localhost:4000/html/...`, resolvendo o VLibras (que exige `Origin` HTTP válido) com uma única linha, sem Nginx ou servidor adicional.

---

## Como Executar

### Pré-requisitos
- Node.js 18 ou superior
- Laragon (ou MySQL local na porta 3306)
- Banco de dados `universidade_ranking` importado (arquivo em `banco_sql/`)

### Passo a passo

```bash
# 1. Acesse a pasta Backend
cd Backend

# 2. Instale as dependências (primeira vez)
npm install

# 3. Configure as variáveis de e-mail para o MFA (opcional — sem isso usa DEV_MODE)
# Edite api2.js e ajuste GMAIL_USER e GMAIL_APP_PASSWORD
# Ou exporte:
# export GMAIL_USER=seuemail@gmail.com
# export GMAIL_APP_PASSWORD=sua_app_password

# 4. Inicie o servidor
node api2.js
```

O servidor sobe em `http://localhost:4000`. Acesse o sistema em:
```
http://localhost:4000/html/index.html
```

> **DEV_MODE de MFA:** Por padrão, sem SMTP configurado, o OTP é impresso no console do terminal — nenhuma configuração adicional necessária para testar localmente.

### Estrutura de Rotas Principais

| Método | Rota | Função |
|---|---|---|
| POST | `/login` | Autenticação + geração de OTP |
| POST | `/verificar-otp` | Validação do código MFA |
| GET | `/alunos/:id/metricas` | CRA, frequência, atividades |
| GET | `/alunos/:id/boletim-detalhado` | Boletim por disciplina |
| GET | `/ranking` | Ranking público com LGPD |
| GET | `/alunos/:id/perfil-profissional` | Perfil ATS completo |
| POST | `/alunos/:id/perfil-profissional/upload-pdf` | Parser LinkedIn |
| GET | `/professores/:id/disciplinas/stats` | Stats para gráficos do professor |
| GET | `/talentos/buscar` | Portal de Talentos com filtros LGPD |
| POST | `/admin/login` | Login do painel administrativo |
| POST | `/admin/impersonate/:tipo/:id` | Impersonation de usuário |

---

## Funcionalidades por Perfil

### Aluno
- Dashboard com CRA real, posição no ranking, frequência e atividades entregues
- Boletim por disciplina com menção, faltas e atividades
- Ranking com filtros por curso e semestre
- Grade horária integrada ao banco
- Perfil Profissional ATS completo (CRUD) com importação de PDF LinkedIn
- Geração de relatório PDF A4 com opção de incluir página ATS texto puro
- Filtros de gráfico temporais (Mês/Semestre/Ano para notas; 2 Anos/3 Anos/Completo para CRA)
- Configurações de privacidade LGPD

### Professor
- Dashboard com 3 gráficos de turma via Frappe Charts (média, frequência, distribuição de menções)
- Lista de turmas e alunos com dados reais do banco
- Grade horária sincronizada
- Geração de relatório PDF por aluno com opção de incluir Perfil ATS

### Administrador
- Painel separado (`admin.html`) com login por e-mail + token
- Listagem de alunos, professores e empresas com busca em tempo real
- Impersonation: acessa o sistema como qualquer usuário para fins de suporte

---

## Módulos Desenvolvidos no 7º Semestre

| Versão | Módulo | Data |
|---|---|---|
| v0.2–v0.3 | SPA consolidada + integração real com API | 2025.2 |
| v0.4 | Geração de PDF A4 funcional (html2canvas + jsPDF) | 2025.2 |
| v0.5–v0.6 | Dashboard do professor com gráficos reais | 2025.2 |
| v0.7 | LGPD — Anonimização no ranking público | 2025.2 |
| v0.8–v0.9 | Editar perfil completo + Portal de Talentos | 2026-03 |
| v1.0 | Polimento de logout, navegação e loading | 2026-04 |
| v1.1 | Acessibilidade — VLibras + acessibilidade.js | 2026-05 |
| v1.2 | MFA — Autenticação de dois fatores por e-mail | 2026-05 |
| v1.3 | ATS — Perfil Profissional + Parser PDF LinkedIn | 2026-05 |
| v1.4 | Filtros de gráfico temporais no dashboard do aluno | 2026-05 |
| v1.5 | ATS no relatório do professor | 2026-05 |
| v1.6 | WCAG 2.1 AA — FAB toolkit + Focus Trap + Chips | 2026-05 |
| v1.7 | Certificações e cursos complementares no ATS | 2026-05 |
| v1.8 | Painel Administrativo com Impersonation | 2026-06 |

---

## Equipe

| Nome | Contribuição |
|---|---|
| Enzio Albéfaro | Arquitetura, backend, módulo ATS, MFA, acessibilidade, admin |
| Kaio Victor | Frontend, estilização, componentes UI |
| Sergio Gabriel Linard | Banco de dados, queries, modelagem |
| João Victor Monteiro Silva | Testes, documentação, coordenação |

---

## Contexto Acadêmico

**Instituição:** Centro Universitário de Brasília (CEUB)
**Curso:** Ciência da Computação — Noturno
**Disciplina:** Projeto Integrador III
**Semestre:** 7º — 2026
**Colaboradores externos (ACE):** Bruno Luiz de Almeida (Prof. FIAP) · Caio Silveira Guimarães Souza (Aluno IESB)

---

*Desenvolvido com suporte externo*
*CEUB — Centro Universitário de Brasília — 2026*
