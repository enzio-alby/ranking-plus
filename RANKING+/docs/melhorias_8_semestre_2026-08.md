# RANKING+ — Melhorias de UI/UX e Portal de Talentos
**Projeto Integrador IV — 8º Semestre**
**Período da sessão:** 20-21/08/2026 (+ correção pós-entrega em 21/08/2026)
**Última atualização:** 2026-08-21

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Sumário Executivo](#2-sumário-executivo)
3. [Parte 1 — Correções Pontuais de Telas e Funções](#3-parte-1--correções-pontuais-de-telas-e-funções)
4. [Parte 2 — Portal de Talentos: 14 Melhorias](#4-parte-2--portal-de-talentos-14-melhorias)
5. [Extra — Exportação de Relatório + Currículo ATS (PDF)](#5-extra--exportação-de-relatório--currículo-ats-pdf)
6. [Detalhamento Técnico — Backend (API)](#6-detalhamento-técnico--backend-api)
7. [Detalhamento Técnico — Banco de Dados](#7-detalhamento-técnico--banco-de-dados)
8. [Detalhamento Técnico — Frontend (arquivos e funções)](#8-detalhamento-técnico--frontend-arquivos-e-funções)
9. [Decisões de Projeto e Limitações Conhecidas](#9-decisões-de-projeto-e-limitações-conhecidas)
10. [Metodologia de Teste](#10-metodologia-de-teste)
11. [Pendências Fora do Escopo Desta Sessão](#11-pendências-fora-do-escopo-desta-sessão)
12. [Correção Pós-Entrega — Remoção do "Resumo Profissional" Fake](#12-correção-pós-entrega--remoção-do-resumo-profissional-fake)
13. [Nova Função — Área de Interesse do Aluno](#13-nova-função--área-de-interesse-do-aluno)
14. [LGPD, Cadastro Real e Suporte com Chamados por E-mail](#14-lgpd-cadastro-real-e-suporte-com-chamados-por-e-mail)
15. [Refinamento Visual — index, areaaluno e areaprofessor](#15-refinamento-visual--index-areaaluno-e-areaprofessor-21082026)
16. [Motion Camada 1 — Reveal ao Rolar e Contadores Animados](#16-motion-camada-1--reveal-ao-rolar-e-contadores-animados-21082026)
17. [Motion Camada 2, Notificações e Histórico Real de Notas](#17-motion-camada-2-notificações-e-histórico-real-de-notas-21082026)
18. [Limpeza de Código — CSS Morto e Tokens Compartilhados](#18-limpeza-de-código--css-morto-e-tokens-compartilhados-21082026)
19. [Backlog de Melhorias Funcionais — Status Real](#19-backlog-de-melhorias-funcionais--status-real-21082026)

---

## 1. Visão Geral

Esta sessão de trabalho (20-21/08/2026) cobriu duas frentes, ambas de front-end/UX e novas funcionalidades — **sem tocar em segurança** (bcrypt, IDOR, validação de entrada, etc., que continuam pendentes e documentados separadamente em `ranking-plus-plano-correcoes-gcp.md` no vault de anotações do projeto):

- **Parte 1:** 6 correções pontuais pedidas em telas específicas (index, dashboard do aluno, Meu Perfil, Portal de Talentos).
- **Parte 2:** um pacote de 14 melhorias no Portal de Talentos (visual, filtros/praticidade, funções novas para empresas recrutadoras), implementado em 5 blocos incrementais, cada um validado manualmente antes do próximo.
- **Extra:** exportação de relatório acadêmico + currículo ATS em PDF, direto do Portal de Talentos.

Todas as mudanças foram testadas ao vivo no navegador (Chrome, via automação) contra o backend real rodando localmente (`node Backend/api2.js`, porta 4000) e o MySQL do Laragon (`universidade_ranking`), não apenas lidas no código.

---

## 2. Sumário Executivo

| # | Item | Onde | Status |
|---|---|---|---|
| 1 | Paginação do ranking (5 em 5) | `html/index.html` | ✅ |
| 2 | Gráfico "Evolução das Notas" sem opção mensal | Dashboard aluno | ✅ |
| 3 | "Histórico de CRA" com períodos reais + filtro "1 Ano" | Meu Perfil | ✅ |
| 4 | Perfil Profissional (ATS) mais compacto | Meu Perfil | ✅ |
| 5 | "8º Semestre" no filtro do Portal de Talentos | Portal de Talentos | ✅ |
| 6 | Gráfico de desempenho por período em qualquer visualização de aluno | Aluno/Professor/Empresa | ✅ |
| 7 | Fonte, textura no hero, skeleton loaders | Portal de Talentos | ✅ |
| 8 | Badge de destaque (top 3 por CRA) | Portal de Talentos | ✅ |
| 9 | Busca multi-habilidade (chips) | Portal de Talentos | ✅ |
| 10 | Ordenação de resultados | Portal de Talentos | ✅ |
| 11 | Filtro por CRA mínimo | Portal de Talentos | ✅ |
| 12 | Paginação de candidatos (9/página) | Portal de Talentos | ✅ |
| 13 | Lembrar último filtro usado | Portal de Talentos | ✅ |
| 14 | Favoritos/Shortlist (empresa) | Portal de Talentos | ✅ |
| 15 | Exportar CSV dos candidatos filtrados | Portal de Talentos | ✅ |
| 16 | Histórico "quem eu já vi" (empresa) | Portal de Talentos | ✅ |
| 17 | Badge "Novo pra você" | Portal de Talentos | ✅ |
| 18 | Comparação lado a lado (até 3 candidatos) | Portal de Talentos | ✅ |
| 19 | Exportar Relatório + Currículo ATS em PDF | Portal de Talentos (drawer) | ✅ |

---

## 3. Parte 1 — Correções Pontuais de Telas e Funções

### 3.1 Paginação do ranking no index (`html/index.html`, `javascript/index.js`)

- **Antes:** só o Top 5 do ranking aparecia na página inicial.
- **Depois:** ranking completo, paginado de 5 em 5 (Bootstrap `pagination`).
- Backend não precisou mudar — `GET /ranking` já retornava até 50 alunos.
- Funções novas em `javascript/index.js`: `renderRankingPage()`, `renderRankingPagination()`. Variáveis de estado: `rankingData`, `rankingPage`, `RANKING_PAGE_SIZE = 5`.
- Título da seção alterado de "Top 5 do Ranking" para "O Ranking Completo".

### 3.2 Gráfico "Evolução das Notas" — remoção da opção mensal (`html/areaaluno.html`, `javascript/areaaluno.js`)

- Removido o botão "Mês" do filtro do gráfico (dashboard do aluno) — notas não têm granularidade mensal, só fazia sentido Semestre/Ano.
- `_PERF_DATA.mes` removido; default de `initializePerformanceChart()` mudou de `'mes'` para `'semestre'`.

### 3.3 "Histórico de CRA" com períodos reais (`html/areaaluno.html`, `javascript/areaaluno.js`)

- **Problema:** anos hardcoded (2021–2024), sem relação com a matrícula real do aluno; opção "Completo" mostrava 7 semestres fixos, não a duração real do curso.
- **Solução:**
  - `window._alunoInfo` exposto em `loadAlunoData()` com curso, período atual, data de matrícula e CRA real.
  - `_duracaoSemestresCurso(curso)`: 8 semestres (4 anos) para cursos de TI padrão, 5 semestres (2,5 anos) se curso contém "ADS"/"Análise e Desenvolvimento".
  - `_periodosAteAgora(periodoAtual, quantidade)`: gera períodos retroativos ao período atual do aluno (usado em "1/2/3 Anos").
  - `_periodosDesdeMatricula(dataMatricula, quantidade)`: gera períodos a partir da matrícula (usado em "Completo").
  - `_curvaCraMock(quantidade, craFinal)`: curva ilustrativa terminando no CRA real do aluno (não existe histórico de CRA por semestre persistido no banco — ver seção 9).
  - Formato de rótulo mudado de `YYYY.S` para `YY.S` (ex: `26.1`) — o formato longo estourava a largura do gráfico Frappe Charts e truncava os textos ("20...").
  - **Adicionado depois, a pedido:** botão "1 Ano" (além de 2/3 Anos/Completo). Grupo de filtros compactado via CSS (`css/styleareaaluno.css`, classe `.cra-filtro-grupo`) pra caber as 4 opções numa linha.

### 3.4 Perfil Profissional (ATS) mais compacto (`html/areaaluno.html`, `css/styleareaaluno.css`)

- Só CSS — nenhum `id`, `data-pp`/`data-ppf`/`data-ppi`/`data-ppc` ou estrutura tocados, para não quebrar o parser do PDF do LinkedIn nem o salvamento (`savePerfilProfissional()`).
- Classe `.pp-compact` no card: título 16px, padding do `card-body` reduzido, labels menores, espaçamento entre seções reduzido, cards internos (experiência/formação/certificação) mais compactos.
- `ppResumo` (textarea) e `ppHabilidadeInput` mudaram para `form-control-sm` / `input-group-sm`.

### 3.5 "8º Semestre" no filtro do Portal de Talentos (`html/talentos.html`, `javascript/talentos.js`)

- **Causa raiz:** o filtro `#filtSemestre` era populado dinamicamente via `SELECT DISTINCT semestre_atual FROM alunos` — como nenhum aluno visível estava no 8º semestre, a opção nunca aparecia.
- **Solução:** lista estática de 1º a 8º semestre no HTML (igual ao `#intSemestreMin` que a empresa já usa nos "Interesses de Perfil"). Removido o `forEach` que populava dinamicamente em `carregarFiltros()`.
- Backend já filtrava com `semestre_atual >= ?` (não era match exato) — nenhuma mudança necessária ali.

### 3.6 Gráfico de desempenho em qualquer visualização de aluno (multi-tela)

O pedido mais crítico: mostrar um gráfico de evolução de desempenho de qualquer aluno específico, visível para aluno (vendo colega), professor (vendo aluno da turma) e empresa (vendo candidato) — ver detalhes completos do endpoint `/alunos/:id/desempenho-semestral` na seção 6.

- **Empresa** (`javascript/talentos.js`): dentro do drawer (`abrirPerfilAluno`), gráfico SVG de linha (`_buildLineSvg`) — a página não tinha Frappe Charts carregado, então foi usado SVG desenhado à mão no mesmo estilo do donut de menções que já existia ali.
- **Professor** (`html/areaprofessor.html`, `javascript/areaprofessor.js`): nova coluna "Desempenho" na tabela de alunos com botão por linha → novo modal `#modalDesempenhoAluno` com gráfico Frappe Charts (já carregado nessa página). Função `abrirDesempenhoAluno(alunoId, nome, curso)`.
- **Aluno vendo colega** (`html/areaaluno.html`, `javascript/areaaluno.js`, aba Ranking): nova coluna "Desempenho" na tabela de ranking, botão por linha → modal `#modalDesempenhoColega`, gráfico Frappe Charts. Função `abrirDesempenhoColega(alunoId, nome, curso)`.
  - **Importante — LGPD:** o botão só aparece para o próprio aluno (`isMe`) ou para colegas que **não** marcaram a preferência de anonimato no ranking (`permitir_exibicao_ranking`). Testado: de 21 alunos, 17 com botão e 4 anônimos corretamente sem.
- **Filtros de período:** Semestral (2 semestres) / Anual (4 semestres) / Curso Todo (8 ou 5 semestres, conforme curso) — implementados nos 3 lugares, reaproveitando o mesmo endpoint parametrizado.

---

## 4. Parte 2 — Portal de Talentos: 14 Melhorias

Implementadas em 5 blocos incrementais, cada um validado manualmente antes do próximo.

### Bloco 1 — Visual (sem banco)

- **Fonte:** `'Segoe UI', Arial` → **Plus Jakarta Sans** (Google Fonts), mais profissional. `font-variant-numeric: tabular-nums` nos números da barra de estatísticas.
- **Textura no hero:** `::before` com SVG de ruído (`feTurbulence`), opacidade 0.5, `mix-blend-mode: overlay` — quebra o gradiente antes totalmente liso.
- **Skeleton loaders:** trocado o overlay de tela cheia (`#loadingOverlay`, removido) por cards-esqueleto no formato exato do `.talent-card` real, com animação shimmer CSS. Função `renderSkeletonCards()`.

### Bloco 2 — Descoberta de candidatos

- **Badge de destaque (🥇🥈🥉):** top 3 por CRA geral **dentro do conjunto filtrado atual** (independe da ordenação escolhida na tela). Precisou adicionar `media_geral` por aluno no backend (`GET /talentos/buscar`, query extra batched por `aluno_id IN (...)`).
- **Busca multi-habilidade:** campo de busca virou um sistema de chips — Enter ou clique na lupa adiciona um termo; pode combinar vários (ex: "Algoritmos" + "Banco de Dados", resultado = OR). Backend aceita `habilidade` como lista separada por vírgula.
- **Ordenação:** select com CRA (maior/menor), Nome (A-Z), Semestre (mais avançado) — reordena `_todosOsTalentos` no client, sem nova chamada à API.

### Bloco 3 — Praticidade

- **Filtro CRA mínimo:** select com 7.0+/8.0+/8.5+/9.0+, filtro client-side sobre `media_geral`.
- **Paginação de candidatos:** 9 por página (grade 3×3), mesmo padrão de paginação do item 3.1.
- **Lembrar último filtro:** salvo em `localStorage` (`talentos_ultimo_filtro`) a cada busca — curso, semestre, CRA mínimo, GitHub/LinkedIn, chips de habilidade, ordenação. Restaurado automaticamente no carregamento da página (aguarda `carregarFiltros()` popular os `<option>` de curso antes de aplicar os valores salvos).

### Bloco 4 — Funções para empresa (envolveu banco de dados)

- **Migração aplicada diretamente no MySQL local** (ver seção 7) — tabela `empresa_favoritos`.
- **Favoritos/Shortlist:** estrela nos cards (grid e lista) e no drawer, visível só para empresa logada. Toggle via `POST`/`DELETE /empresas/:id/favoritos`. Filtro "Somente favoritos" no sidebar.
  - Bug encontrado e corrigido durante o teste: no modo lista, a estrela (posicionamento absoluto) sobrepunha o botão do GitHub. Corrigido restringindo o posicionamento absoluto ao wrapper `.talent-actions-top` (usado só no modo grid); no modo lista os botões seguem o fluxo normal.
- **Exportar CSV:** exporta os candidatos atualmente filtrados (nome, curso, semestre, CRA, GitHub, LinkedIn) via `Blob` + link de download.
- **Histórico "quem eu já vi":** reaproveita a tabela `interacoes_empresas_alunos` que **já existia** no projeto (não precisou de tabela nova) — só faltava expor via `GET /empresas/:id/historico-visualizacoes` e um modal (`#modalHistoricoVisualizacoes`) clicável, que reabre o drawer do candidato.

### Bloco 5 — Descoberta avançada + comparação

- **Badge "Novo pra você":** aparece quando o candidato bate o `curso_preferido`/`semestre_minimo` salvo nos "Interesses de Perfil" da empresa **e** ainda não foi visualizado por ela. Decisão consciente: o projeto não tem infraestrutura de notificação real (sem e-mail transacional além do OTP, sem WebSocket), então isso é implementado como um badge sobre dado real já existente, não como uma notificação simulada.
- **Comparação lado a lado (até 3 candidatos):** checkbox "comparar" em cada card (disponível a qualquer usuário que já possa ver perfis — aluno, professor ou empresa logados), barra flutuante fixa no rodapé com chips removíveis, modal grande (`modal-xl`) com uma coluna por candidato: avatar, nome/curso/semestre, CRA/Frequência/Ranking, **gráfico de desempenho do curso todo** (ajustado a pedido — inicialmente usava só 2 anos), disciplinas de destaque, GitHub/LinkedIn.

---

## 5. Extra — Exportação de Relatório + Currículo ATS (PDF)

- **Local certo (corrigido após mal-entendido inicial):** botão no topo do **drawer do Portal de Talentos**, não na página "Meu Perfil" do aluno logado — a exportação é uma ferramenta do recrutador ao avaliar um candidato específico.
- **Implementação:** função `exportarPerfilCompletoPDF(alunoId, nome, btnEl)` em `javascript/talentos.js`, usando jsPDF em modo texto puro (sem `html2canvas` — o drawer não tem acesso à sessão/DOM do aluno visualizado, então o PDF é montado buscando os dados direto do backend pelo ID).
- **PDF de 2 páginas:**
  - **Página 1 — Relatório Acadêmico:** nome/curso/semestre, CRA geral, frequência, posição no ranking, disciplinas cursadas/atividades/faltas, **"Evolução do CRA — Curso Todo"** (mini-relatório textual leve, sem gráfico — uma linha tipo `23.1: 8.2 • 23.2: 8.4 • ...`, pedido explicitamente "prático de ler, sem gráfico"), disciplinas de destaque, GitHub/LinkedIn.
  - **Página 2 — Currículo ATS:** resumo profissional, experiências, formação complementar, idiomas, habilidades, certificações — puxado de `GET /alunos/:id/perfil-profissional` (o mesmo endpoint que a página "Meu Perfil" do próprio aluno usa).
- Testado com aluno sem ATS preenchido (gera só página 2 com nome/curso, sem erro) e com aluno com ATS completo (8 experiências, 11 habilidades).

---

## 6. Detalhamento Técnico — Backend (API)

Todos os endpoints abaixo estão em `Backend/api2.js`.

### 6.1 Novo — `GET /alunos/:id/desempenho-semestral`

Retorna a evolução de CRA de um aluno específico, parametrizável.

**Query params:** `filtro` = `semestral` (2 semestres) | `anual` (4 semestres, default) | `completo` (duração nominal do curso: 8 semestres/4 anos padrão TI, 5 semestres/2,5 anos se curso contém "ADS"/"Análise e Desenvolvimento").

**Resposta:**
```json
{
  "curso": "Ciência da Computação",
  "filtro": "completo",
  "labels": ["23.1", "23.2", "24.1", "24.2", "25.1", "25.2", "26.1", "26.2"],
  "values": [8.2, 8.4, 8.6, 8.8, 9.0, 9.2, 9.4, 9.6],
  "media_geral": 9.6
}
```

- `filtro=completo`: períodos calculados a partir de `data_matricula`, avançando.
- `filtro=semestral|anual`: períodos calculados retroativamente a partir de `periodo_curso` (período atual do aluno).
- A curva de `values` é **ilustrativa** — interpola de `media_geral - 1.4` até `media_geral` real (não existe histórico de CRA por semestre persistido no schema atual). Ver seção 9.

### 6.2 Novo — `GET /empresas/:id/historico-visualizacoes`

Reaproveita a tabela `interacoes_empresas_alunos` (já existente, criada na migração B2B original) — agrupa por aluno pegando a visualização mais recente, ordenado por mais recente primeiro.

```sql
SELECT a.id, a.nome, a.curso, a.semestre_atual AS semestre, MAX(i.data_interacao) AS ultima_visualizacao
FROM interacoes_empresas_alunos i JOIN alunos a ON a.id = i.aluno_id
WHERE i.empresa_id = ? AND i.tipo_interacao = 'VISUALIZACAO'
GROUP BY a.id, a.nome, a.curso, a.semestre_atual
ORDER BY ultima_visualizacao DESC
```

### 6.3 Novo — Favoritos/Shortlist

- `GET /empresas/:id/favoritos` — lista alunos favoritados (join com `empresa_favoritos`).
- `POST /empresas/:id/favoritos` — body `{ aluno_id }`, `INSERT IGNORE` (idempotente).
- `DELETE /empresas/:id/favoritos/:alunoId` — remove.

### 6.4 Modificado — `GET /talentos/buscar`

- **Antes:** `habilidade` era um único termo, `LIKE '%termo%'`.
- **Depois:** aceita múltiplos termos separados por vírgula, casando qualquer um deles (`OR` entre `d.nome_materia LIKE ?`).
- Adicionado: query extra batched (`SELECT aluno_id, AVG(...) AS media_geral FROM boletim WHERE aluno_id IN (...) GROUP BY aluno_id`) para incluir `media_geral` no payload de cada aluno — usado pelo badge de destaque, ordenação e filtro de CRA mínimo no frontend.

---

## 7. Detalhamento Técnico — Banco de Dados

**Migração aplicada diretamente no MySQL local** (`universidade_ranking`, via `C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe`, sem passo manual) e salva em `banco_sql/migration_talentos_features.sql`, seguindo o padrão das migrações anteriores do projeto (`migration_b2b.sql`, `migration_certificacoes.sql`).

```sql
CREATE TABLE IF NOT EXISTS empresa_favoritos (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  aluno_id   INT NOT NULL,
  criado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_empresa_aluno (empresa_id, aluno_id),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY (aluno_id)   REFERENCES alunos(id)   ON DELETE CASCADE
);
```

- `UNIQUE KEY (empresa_id, aluno_id)` permite favoritar/desfavoritar sem duplicar linhas (`INSERT IGNORE` no favoritar).
- `ON DELETE CASCADE` em ambas as FKs — se a empresa ou o aluno for removido, os favoritos somem junto (mesma convenção de `interacoes_empresas_alunos`).
- **Nenhuma outra tabela/coluna nova foi necessária** — "quem eu já vi" reaproveitou `interacoes_empresas_alunos`; "novo pra você" reaproveitou `empresa_interesses` + o histórico de visualizações; o desempenho por período reaproveitou `alunos` (curso, periodo_curso, data_matricula) + `boletim` (média).

---

## 8. Detalhamento Técnico — Frontend (arquivos e funções)

### 8.1 `html/index.html` + `javascript/index.js`
- Paginação do ranking (seção 3.1).

### 8.2 `html/areaaluno.html` + `javascript/areaaluno.js` + `css/styleareaaluno.css`
- Gráfico "Evolução das Notas" sem opção mensal (3.2).
- "Histórico de CRA" com períodos reais + filtro "1 Ano" (3.3).
- Perfil Profissional compacto via CSS (3.4).
- Coluna "Desempenho" + modal `#modalDesempenhoColega` na aba Ranking, com respeito à anonimização LGPD (3.6).
- Funções novas: `_duracaoSemestresCurso`, `_periodosAteAgora`, `_periodosDesdeMatricula`, `_curvaCraMock`, `abrirDesempenhoColega`, `_carregarDesempenhoColega`.

### 8.3 `html/areaprofessor.html` + `javascript/areaprofessor.js`
- Coluna "Desempenho" na tabela de alunos + modal `#modalDesempenhoAluno` (3.6).
- Funções novas: `abrirDesempenhoAluno`, `_carregarDesempenhoAluno`.

### 8.4 `html/talentos.html` + `javascript/talentos.js`
O arquivo mais alterado desta sessão. Principais adições:

**HTML:**
- `<link>` Google Fonts (Plus Jakarta Sans) + CSS de textura do hero, skeleton loaders, chips de busca, filtro CRA mínimo, paginação, favoritos/comparação (`.talent-actions-top`, `.talent-fav-btn`, `.talent-compare-btn`, `.talent-new-badge`, `.compare-bar`, `.compare-col`).
- `<script>` jsPDF (CDN) — nova dependência só desta página.
- Novos elementos: `#searchChips`, `#ordenarPor`, `#talentosPaginacao`, `#filtCraMin`, `#filtSoFavoritosWrap`/`#filtSoFavoritos`, `#exportarCsv`, `#compareBar`/`#compareChips`, modais `#modalHistoricoVisualizacoes` e `#modalComparacao`, botão "Já Visualizados" na nav.

**JavaScript — funções novas:**
| Função | Papel |
|---|---|
| `renderSkeletonCards()` | skeleton loader nos cards |
| `_addSearchChipFromInput`, `renderSearchChips`, `_removeSearchChip` | busca multi-habilidade |
| `_ordenarTalentos` | ordenação client-side |
| `_salvarUltimoFiltro`, `_restaurarUltimoFiltro` | lembrar filtro (localStorage) |
| `_renderTalentosPaginacao` | paginação de candidatos |
| `_buildLineSvg` | gráfico SVG leve (sem Frappe) |
| `exportarPerfilCompletoPDF` | PDF relatório + ATS (seção 5) |
| `_carregarFavoritos`, `toggleFavorito` | favoritos/shortlist |
| `_carregarHistoricoVisualizados`, `abrirHistoricoVisualizacoes` | "quem eu já vi" |
| `_exportarTalentosCsv` | exportar CSV |
| `toggleComparar`, `_renderCompareBar`, `limparComparacao`, `abrirComparacao` | comparação lado a lado |

---

## 9. Decisões de Projeto e Limitações Conhecidas

1. **Não existe histórico de CRA por semestre persistido no banco.** O schema atual (`boletim`) não é segmentado por período — só reflete o semestre corrente do aluno. Todos os gráficos de "desempenho por período" (Histórico de CRA no Meu Perfil, gráfico de desempenho em qualquer visualização de aluno, comparação de candidatos) usam uma **curva ilustrativa** que interpola até o CRA real atual do aluno — os rótulos de período (`23.1`, `23.2`...) são reais (calculados a partir da matrícula/período do aluno), mas os valores intermediários não são histórico real. Isso está documentado no próprio código-fonte (`Backend/api2.js`, comentário acima do endpoint).
2. **"Novo pra você" não é uma notificação real.** O projeto não tem e-mail transacional (além do OTP de login) nem WebSocket/push. Em vez de simular um alerta que não dispara de verdade, foi implementado como um badge calculado on-demand a partir de dados reais e persistidos (interesses da empresa + histórico de visualizações).
3. **Migração de banco aplicada direto**, sem passo manual — usando o cliente `mysql.exe` do Laragon já disponível no ambiente (`C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe`).
4. **Cirurgia mínima no Perfil Profissional (ATS):** a compactação visual foi feita 100% via CSS, sem alterar nenhum `id`/`data-attribute` usado pelo parser de PDF do LinkedIn (upload → `pdf-parse` no backend) ou pelas funções de salvar/coletar (`savePerfilProfissional`, `_ppCollect*`).

---

## 10. Metodologia de Teste

Cada item foi:
1. Implementado (frontend e/ou backend).
2. Backend reiniciado quando necessário (processo Node parado e religado — sem `nodemon` configurado no projeto).
3. Testado ao vivo em navegador Chrome real, via automação de navegador, incluindo:
   - Chamadas diretas às funções JS via console para validar lógica isoladamente.
   - Interações reais (clique, digitação) para validar UI.
   - Screenshots para validação visual.
   - Consultas diretas ao MySQL (`mysql.exe`) para confirmar persistência real no banco (ex: favoritos).
   - Verificação do console do navegador (sem erros reais — alguns avisos de "message channel closed" são ruído de extensão do Chrome, não do código da aplicação).
4. Dados de teste (favoritos, sessões simuladas de empresa) limpos ao final de cada verificação, sem deixar resíduo no banco.

---

## 11. Pendências Fora do Escopo Desta Sessão

Documentadas em detalhe em `ranking-plus-plano-correcoes-gcp.md` (vault de anotações do projeto):

- **Segurança (Frente A):** bcrypt nas senhas, validação de entrada (email/CPF/CNPJ), IDOR (rotas sem autenticação de sessão para aluno/professor), App Password do Gmail vazada no código-fonte, `express.static('..')` expondo o projeto inteiro por HTTP, rate limiting, `crypto.randomInt` vs `Math.random()` no OTP.
- **Migração para GCP (Frente B):** ainda não iniciada — arquitetura (Cloud Run vs Compute Engine vs App Engine), Cloud SQL, orçamento de 300 créditos do semestre.
- **Outras pendências já mapeadas:** testes unitários/E2E, parser de PDF do LinkedIn (heurística frágil), dados hardcoded em `areaprofessor.js` (array fictício), consolidação do backend único.

---

## 12. Correção Pós-Entrega — Remoção do "Resumo Profissional" Fake

**Data:** 21/08/2026, após revisão manual do Enzio.

### 12.1 Problema encontrado

No card "Quadro Profissional" (Meu Perfil do aluno, seção `#quadroProfissionalSection`) havia um bloco "Resumo Profissional" que **não vinha de lugar nenhum real** — era um texto fixo por curso, hardcoded no backend, idêntico para todos os alunos do mesmo curso, sem relação com o LinkedIn de fato ou com o resumo real que o aluno escreve no Perfil Profissional (ATS).

**Importante:** este card é **diferente** do "Perfil Profissional" (ATS) editável em Meu Perfil — aquele usa o campo real `perfil_profissional.resumo` (preenchido manualmente ou importado do PDF do LinkedIn) e **não foi tocado**.

### 12.2 Origem do texto fake

`Backend/api2.js`, rota `GET /alunos/:id/profissional` (linha ~762, comentário original do próprio código: `// LinkedIn: mock baseado no curso`):

```js
const resumoMap = {
  'Ciência da Computação':            'Estudante apaixonado por algoritmos, estruturas de dados e desenvolvimento de software.',
  'Engenharia de Software':           'Focado em boas práticas de engenharia, testes e entrega de software de qualidade.',
  'Sistemas de Informação':           'Interessado em integração entre tecnologia e negócios, com foco em análise de sistemas.',
  'Análise e Desenvolvimento de Sistemas': 'Desenvolvedor Full Stack em formação, com experiência em projetos práticos.',
  'Redes de Computadores':            'Especialista em infraestrutura, segurança de redes e protocolos de comunicação.',
  'Inteligência Artificial':          'Entusiasta de Machine Learning, Deep Learning e aplicações de IA no mundo real.',
  'Gestão de TI':                     'Gestão de projetos ágeis e alinhamento de TI com objetivos estratégicos de negócio.'
};
const resumoLinkedIn = resumoMap[aluno.curso] || `Estudante de ${aluno.curso || 'Tecnologia'} em busca de oportunidades no mercado.`;
```

O valor de `resumoMap[curso]` era enviado no JSON como `linkedin_resumo` e renderizado direto no frontend (`javascript/areaaluno.js`, função `loadQuadroProfissional()`), sem nenhuma indicação visual de que era um texto padrão.

### 12.3 Correção aplicada

- **`Backend/api2.js`:** removidos `resumoMap`, `resumoLinkedIn` e o campo `linkedin_resumo` da resposta de `GET /alunos/:id/profissional`. A rota agora retorna só `nome`, `curso`, `github`, `linkedin` e `repos` (repositórios reais, buscados ao vivo na API do GitHub).
- **`javascript/areaaluno.js`:** removido o bloco HTML "Resumo Profissional" de `loadQuadroProfissional()`. O restante da função (botões GitHub/LinkedIn, lista de repositórios reais, fallback "Nenhuma informação profissional disponível") foi mantido sem alterações.
- Testado ao vivo: `GET /alunos/:id/profissional` não retorna mais `linkedin_resumo`; o card "Quadro Profissional" no Meu Perfil não mostra mais "Resumo Profissional", mas continua mostrando "Repositórios Recentes" normalmente.

---

## 13. Nova Função — Área de Interesse do Aluno

**Data:** 21/08/2026.

**Pedido:** um campo no Perfil Profissional (Meu Perfil) onde o aluno escolhe e pode trocar quando quiser a área de trabalho que procura, visível para a empresa no drawer do Portal de Talentos.

### 13.1 Banco de dados

Migração `banco_sql/migration_area_interesse.sql`, aplicada diretamente via `mysql.exe`:

```sql
ALTER TABLE perfil_profissional
  ADD COLUMN area_interesse_id INT DEFAULT NULL AFTER resumo;

ALTER TABLE perfil_profissional
  ADD CONSTRAINT fk_pp_area_interesse
  FOREIGN KEY (area_interesse_id) REFERENCES dom_areas_foco(id) ON DELETE SET NULL;
```

- Reaproveita o domínio `dom_areas_foco` **já existente** (mesma tabela que as empresas usam em `empresa_interesses.area_foco_id`) — não criou taxonomia nova.
- Fica em `perfil_profissional`, não em `alunos`, porque é dado do ATS/Perfil Profissional, editável a qualquer momento.
- **Nota técnica:** `ADD COLUMN IF NOT EXISTS ... AFTER` deu erro de sintaxe neste MySQL 8.4.3 específico (via `mysql.exe` do Laragon) — funcionou removendo o `IF NOT EXISTS`. Registrado no próprio arquivo de migração para referência futura.

### 13.2 Backend (`Backend/api2.js`)

- `GET /alunos/:id/perfil-profissional` — passa a retornar `area_interesse_id` e `area_interesse_nome` (join com `dom_areas_foco`).
- `PUT /alunos/:id/perfil-profissional` — aceita `area_interesse_id` no body e salva no upsert (`INSERT ... ON DUPLICATE KEY UPDATE`).
- `GET /talentos/aluno/:id/perfil` (dados do drawer da empresa) — passa a retornar `area_interesse` (nome), com query extra buscando `perfil_profissional` + `dom_areas_foco` pelo `aluno_id`.

### 13.3 Frontend — Meu Perfil (`html/areaaluno.html`, `javascript/areaaluno.js`)

- Novo `<select id="ppAreaInteresse">` na seção Perfil Profissional, logo abaixo do Resumo Profissional, com opção padrão "Ainda não defini".
- `_ppCarregarAreasFoco()`: busca `GET /dom/areas-foco` (endpoint que já existia, reaproveitado) e popula o select — com cache em `_ppAreasFoco` pra não recarregar toda vez.
- `_ppState.area_interesse_id` adicionado ao estado; carregado em `loadPerfilProfissional()`, aplicado ao select em `_ppRenderAll()`, e incluído no payload de `savePerfilProfissional()`.

### 13.4 Frontend — Portal de Talentos (`html/talentos.html`, `javascript/talentos.js`)

- Novo badge `#drawerAreaInteresse` no cabeçalho do drawer (ao lado do badge de semestre), oculto por padrão (`d-none`), mostrado apenas quando o aluno tiver área de interesse definida.
- `abrirPerfilAluno()` atualizado para popular/ocultar esse badge com base em `d.area_interesse`.

### 13.5 Teste realizado

- Definido "Cloud Computing / Infraestrutura" como área de interesse do Enzio (aluno_id 21) via Meu Perfil, salvo.
- Confirmado direto no MySQL: `perfil_profissional.area_interesse_id = 7`.
- Recarregada a página — select volta com o valor salvo corretamente.
- Aberto o drawer desse aluno no Portal de Talentos (como empresa) — badge laranja "Cloud Computing / Infraestrutura" aparece ao lado do "7º Semestre" no cabeçalho.

---

## 14. LGPD, Cadastro Real e Suporte com Chamados por E-mail

**Data:** 21/08/2026. Sessão focada em três frentes: comprovação real do aceite dos Termos de Uso (LGPD), robustez do cadastro de aluno, e transformação da página de Suporte de mockup em fluxo real (ticket → banco → e-mail).

### 14.1 Aceite dos Termos — comprovação real (`Backend/api2.js`, `javascript/index.js`, `banco_sql/migration_aceite_termos.sql`)

**Problema:** o checkbox "Li e aceito os termos de uso" no cadastro bloqueava o envio do formulário (HTML5 `required`), mas o valor marcado nunca era lido nem enviado ao backend — a tabela `alunos` não guardava nenhum registro do aceite, o que não atende à LGPD Art. 8º §1º (comprovação do consentimento).

- **Migration:** `ALTER TABLE alunos ADD COLUMN termos_aceitos_em TIMESTAMP NULL DEFAULT NULL AFTER situacao;`
- **Backend (`POST /alunos`):** agora exige `termos_aceitos` no corpo da requisição — rejeita com `400` se ausente/falso — e grava `termos_aceitos_em = NOW()` na hora do cadastro.
- **Frontend (`handleRegister()` em `index.js`):** o payload passou a enviar `termos_aceitos: document.getElementById('acceptTerms')?.checked`, que antes não existia no objeto enviado.
- **Teste:** cadastro de teste via curl confirmou rejeição (`400`) sem o campo e sucesso (`201`) com `termos_aceitos_em` populado; registro de teste removido após validação.

### 14.2 Termo de Uso — restruturação e conteúdo LGPD (`html/termodeuso.html`)

- Removido o mecanismo de "aceite" da própria página (checkboxes + botão "Confirmar Aceite" que só gravava em `localStorage`, sem nenhuma ligação com o backend) — era redundante com o aceite real, que agora acontece no cadastro. A página permanece 100% legível, só não pede mais confirmação nela.
- Navegação do cabeçalho tinha dois links diferentes ("Dashboard" e "Ranking") apontando para o mesmo `index.html` — consolidados em um único link "Início".
- Datas corrigidas para 2026 (cabeçalho, rodapé) e o `&copy;` do rodapé, que estava em 2024 enquanto a data de atualização já dizia 2025/2026 — inconsistência corrigida.
- Item "1. Aceitação dos Termos" reescrito: antes descrevia aceite implícito por uso ("o uso da plataforma implica aceitação"); agora descreve corretamente o aceite explícito no cadastro, com data/hora registrada.
- Item "3. Sistema de Ranking": "Atualizações semanais do ranking" (afirmação incorreta — o ranking é recalculado a cada atualização de dados, não semanalmente) corrigido para refletir o comportamento real.
- **Política de Privacidade** ganhou citação explícita da Lei nº 13.709/2018 e duas subseções novas: **"Base Legal do Tratamento"** (Art. 7º — consentimento, execução de contrato, obrigação legal, legítimo interesse) e **"Retenção e Eliminação de Dados"**.
- **Direitos do Usuário** expandido de 4 para 8 direitos, adicionando os que faltavam: **Revogação do Consentimento**, **Confirmação da Existência de Tratamento**, **Revisão de Decisões Automatizadas** (ligado explicitamente ao algoritmo do ranking) e **Direito de Petição à ANPD** (com link para gov.br/anpd).
- Todos os e-mails de contato (Encarregado de Dados, Departamento Jurídico, Suporte Geral — antes 3 endereços `@rankingplus.edu.br` fictícios e distintos) consolidados no único e-mail real do projeto: **admin.rankingplus@gmail.com**.

### 14.3 Cadastro de Aluno — validação e máscaras (`html/index.html`, `javascript/index.js`)

- **CPF:** campo (opcional) ganhou máscara automática (`000.000.000-00`) e validação de dígito verificador real (`isValidCPF()`) — só bloqueia o envio se o CPF for preenchido e inválido, já que continua opcional.
- **Telefone:** máscara automática `(XX) 99999-9999`.
- **Matrícula:** agora aceita só dígitos (bloqueado no `input`).
- **Semestre e Turno:** passaram de opcionais para **obrigatórios** — o restante da plataforma (ranking, gráficos de desempenho, filtros do Portal de Talentos) depende desses dois campos para funcionar corretamente; deixá-los `null` gerava dados incompletos silenciosamente.
- **Teste real de cadastro** (não apenas curl — pelo formulário de verdade no navegador): aluno **Sérgio Gabriel de Lima Linard**, matrícula `22305512`, e-mail `sergio.llinard@sempreceub.com`, curso Ciência da Computação, 8º semestre, turno Noturno, campus Asa Norte, CPF de teste válido (111.444.777-35), senha `senha123`. Cadastro confirmado no banco (`alunos.id = 24`) com `termos_aceitos_em` preenchido — fluxo de cadastro→banco end-to-end validado.

### 14.4 Suporte — chamados reais (banco + e-mail) e chat com ponte para ticket (`Backend/api2.js`, `html/suporte.html`, `javascript/suporte.js`, `banco_sql/migration_chamados_suporte.sql`)

**Problema:** a página de Suporte era inteiramente mockada — o envio de ticket simulava uma chamada de API com `setTimeout` e nunca persistia nada; o chat era só respostas por palavra-chave, sem nenhuma ação real.

- **Nova tabela `chamados_suporte`** (id, nome, email, categoria, prioridade, assunto, descrição, origem `formulario`/`chat`, status, criado_em).
- **Nova rota `POST /suporte/chamados`:** valida campos obrigatórios, insere no banco e envia um e-mail real para **admin.rankingplus@gmail.com** (reaproveitando o transporte SMTP/Gmail já configurado para o 2FA do login, com `replyTo` apontando para o e-mail do solicitante). Se o envio de e-mail falhar, o chamado continua salvo no banco (não se perde a solicitação).
- **Formulário de ticket:** ganhou campos obrigatórios de **Nome** e **E-mail** do solicitante (não existiam — sem eles não havia como identificar quem abriu o chamado nem responder). Pré-preenche o nome automaticamente se o visitante já estiver logado.
- **Envio real:** `handleFormSubmit` trocado de simulação para `fetch(POST /suporte/chamados)`; mensagem de sucesso agora mostra o número real do chamado (`#id`), não mais um código fake gerado no front.
- **Chat aprimorado:** `generateBotResponse()` passou a retornar `{ texto, offerTicket }`. Quando o bot não resolve a dúvida com uma resposta mapeada (mensagens sobre problema/erro/bug, "como/tutorial", ou qualquer mensagem sem correspondência), a resposta do bot ganha um botão **"Abrir chamado com esta conversa"** que troca para o formulário de ticket já preenchido com o histórico da conversa na descrição e um resumo no assunto — o usuário só completa nome/e-mail e envia. Isso "leva a abrir um chamado" a partir do chat sem depender de uma IA real, com respostas mapeadas por palavra-chave.
- **Reset de formulários** corrigido: antes só limpava as mensagens do usuário no chat, deixando respostas antigas do bot acumuladas entre uma abertura e outra; agora limpa tudo exceto a saudação inicial.
- **Links mortos corrigidos:** rodapé apontava para `termos.html`, `privacidade.html`, `sobre.html`, `tutoriais.html`, `status.html` — nenhuma dessas páginas existe no projeto. Corrigidos para `termodeuso.html` (+ âncora da política de privacidade), `index.html`, e ações reais de abrir chat/ticket. Os cards "FAQ" e "Tutoriais" do Acesso Rápido também eram links mortos (tentavam abrir formulários inexistentes) — agora rolam até a seção de FAQ.
- **E-mail de contato** consolidado para `admin.rankingplus@gmail.com` (antes `suporte@rankingplus.edu.br`, fictício). Copyright do rodapé corrigido de 2024 para 2026.
- Fonte da página trocada de `'Segoe UI'` (padrão do sistema, destoando do resto do site) para `'Inter'`, alinhando com as demais páginas.
- **Teste real:** ticket aberto via formulário direto e via ponte do chat — ambos confirmados no MySQL (`chamados_suporte`) e no log do backend (`[SUPORTE EMAIL] Chamado #N notificado para admin.rankingplus@gmail.com`, sem erro de SMTP). Registros de teste removidos após validação.

### 14.5 Arquivos alterados nesta seção

| Arquivo | Mudança |
|---|---|
| `Backend/api2.js` | `POST /alunos` grava aceite; nova rota `POST /suporte/chamados` + template de e-mail |
| `banco_sql/migration_aceite_termos.sql` | Nova coluna `alunos.termos_aceitos_em` |
| `banco_sql/migration_chamados_suporte.sql` | Nova tabela `chamados_suporte` |
| `html/termodeuso.html` | Aceite removido da página, LGPD expandida, datas/e-mails corrigidos, nav duplicada consolidada |
| `html/index.html` | Campos CPF/telefone/matrícula com máscara; semestre/turno obrigatórios |
| `javascript/index.js` | Envio de `termos_aceitos`; máscaras + validação de CPF |
| `html/suporte.html` | Campos nome/e-mail no ticket; rodapé e contatos corrigidos |
| `javascript/suporte.js` | Ticket real via API; chat com ponte para chamado; reset de formulário corrigido |
| `css/stylesuporte.css` | Fonte alinhada a `'Inter'` |

### 14.6 Pendências desta frente (fora do escopo desta etapa)

- ~~Polimento visual ainda pendente em `index.html`, `areaaluno.html` e no restante de `areaprofessor.html`~~ — feito na seção 15 abaixo.

---

## 15. Refinamento Visual — index, areaaluno e areaprofessor (21/08/2026)

**Contexto:** com a Turmas do professor já refinada, o pedido foi continuar o mesmo tratamento nas demais telas, corrigir dois bugs visuais pontuais (ícone de scroll sobrepondo dados, cabeçalho do Termo de Uso fora do padrão) e dar uma opinião sobre a direção visual do projeto **antes** de qualquer mudança de identidade — sem trocar cor/logo, só refinar.

### 15.1 Opinião de design entregue

A paleta (laranja `#F4442E` + azul-marinho `#020122`) é distinta o bastante para não precisar mudar. Os três pontos que pesavam contra uma leitura "produto B2B sério": **texto em gradiente nos títulos** (assinatura visual clássica de "gerado por IA"), **fonte inconsistente** (`Inter` — a fonte mais genérica possível — em quase todo o site, exceto o Portal de Talentos que já usava `Plus Jakarta Sans` e ficava com identidade mais forte), e **cards genéricos** sem hierarquia nas telas internas. Recomendação aplicada: manter marca/cores, unificar tipografia em `Plus Jakarta Sans` em todo o site e substituir texto em gradiente por cor sólida.

### 15.2 Bugs pontuais corrigidos

- **Ícone de scroll sobre as estatísticas** (`index.html`): o indicador de "role para baixo" (`.scroll-indicator`/`.scroll-dot`) era posicionado absoluto no rodapé do hero e, em telas mais baixas, ficava por cima da barra de estatísticas (alunos/cursos/professores/empresas). Removido (HTML + CSS morto).
- **Cabeçalho do Termo de Uso e do Suporte fora do padrão**: as duas páginas usavam um logo improvisado (ícone de troféu Font Awesome + texto em gradiente) e links em estilo "pílula com gradiente ao passar o mouse" — completamente diferente do navbar real usado em `index.html`/áreas logadas. Trocado pela logo real (`images/logob.png`) e nav simplificada (texto + cor laranja no hover/ativo), igual ao padrão do resto do site. Border do cabeçalho também trocado de laranja para azul-marinho, alinhado ao navbar principal.

### 15.3 Unificação tipográfica e remoção de gradiente decorativo

- `index.html`, `areaaluno.html` e `areaprofessor.html` (+ `termodeuso.html`, `suporte.html`) passaram a carregar `Plus Jakarta Sans` via Google Fonts, mesma fonte já usada no Portal de Talentos — projeto inteiro com uma única identidade tipográfica agora.
- `index.html`: as 3 ocorrências de `.gradient-text` (título do hero, "Como Funciona", "O Ranking Completo") trocadas por uma nova classe `.text-accent` (cor sólida laranja) — a definição CSS do gradiente, que ficou sem uso, foi removida.

### 15.4 Correções de cor fora da marca

- `index.html`: posições 4+ do ranking (`.rank-pos.pd`) usavam um azul genérico (`#3b82f6`) sem relação com a paleta do site — trocado para `var(--primary-blue)`.
- `areaaluno.html`: o banner "Bem-vindo" do dashboard usava um gradiente navy→azul-royal (`#1e3a8a`) só levemente parecido com a marca — trocado para o mesmo gradiente navy→laranja já validado no hero do Portal de Talentos (`var(--primary-blue) → #1a1a6e → var(--accent-orange)`), com textura sutil de grain via `::before` (mesma técnica do Portal de Talentos). Correção de erro do meio do processo: o primeiro ajuste usou o stop do laranja em `130%`, o que criava um gradiente navy→**roxo** por interpolação incompleta (bug clássico de "gradiente AI"); corrigido para `100%`, igual ao Portal de Talentos, resultando no navy→laranja pretendido.
- `areaprofessor.html`: badge do card "Calendário Acadêmico" (aba Horários) ficava laranja sobre fundo laranja, quase ilegível — trocado para pílula navy, mesmo padrão já usado na aba Turmas.

### 15.5 Números tabulares (dados de ranking/dashboard)

Aplicado `font-variant-numeric: tabular-nums` em: barra de estatísticas e posições do ranking (`index.html`), CRA/métricas dos stat-cards (`areaaluno.html`), KPIs do dashboard e contadores de relatórios (`areaprofessor.html`) — números não "tremem" mais visualmente ao trocar de página/filtro.

### 15.6 Variação nos 4 cards "Como Funciona" (`index.html`)

Os 4 ícones eram todos laranja idêntico (padrão clássico "N cards iguais"). Alternado laranja/navy/laranja/navy para quebrar a monotonia sem mudar estrutura/layout.

### 15.7 Execução e teste

O refinamento de `areaprofessor.html` (Dashboard, Alunos, Horários, Relatórios, Perfil — Turmas já estava pronta de uma sessão anterior) foi delegado a um subagente em paralelo enquanto `index.html` e `areaaluno.html` eram trabalhados diretamente. Testado ao vivo no navegador (Chrome, sessões de aluno/professor simuladas via `localStorage`) em todas as três páginas + `termodeuso.html` + `suporte.html`: sem erros novos de console, `showInRanking`/`permitir_exibicao_ranking` confirmado intacto e funcionando, nenhuma função quebrada (navegação entre abas, filtros, ranking, paginação).

---

## 16. Motion Camada 1 — Reveal ao Rolar e Contadores Animados (21/08/2026)

**Contexto:** pedido explícito de motion "sem exagerar" — premium e atrativo, mas profissional, sem poluir. Definida em duas camadas na conversa anterior (ver seção 15 para o refinamento estático que veio antes); esta seção cobre só a Camada 1, zero dependência nova, aplicada com moderação em `index.html`, `areaaluno.html`, `areaprofessor.html` e `talentos.html`.

### 16.1 Utilitário compartilhado (`javascript/motion.js`)

Arquivo novo, sem dependências externas, incluído como `<script>` extra (mesmo padrão já usado para `acessibilidade.js` em todas as páginas). Expõe duas funções globais:

- **`initScrollReveal(root)`** — observa elementos `.reveal` com `IntersectionObserver` e adiciona `.reveal-visible` quando entram na tela (threshold 15%), com escalonamento de até 350ms entre irmãos. Roda automaticamente no `DOMContentLoaded` e pode ser chamado de novo para conteúdo dinâmico.
- **`animateCounter(el, target, opts)`** — anima um número subindo até o valor real (ease-out cúbico, ~900ms), com suporte a `decimals`, `prefix`, `suffix` e `fallback` para exibir `—` quando o valor ainda não chegou. Formata em `pt-BR` (vírgula decimal).

Ambas respeitam `prefers-reduced-motion: reduce` — usuários com essa preferência do sistema veem o resultado final direto, sem animação.

### 16.2 Aplicado por página

- **`index.html`**: `.reveal` nos 4 cards de "Como Funciona" e no cabeçalho da seção "Ranking Completo"; contadores animados na barra de estatísticas do hero (alunos/cursos/professores/empresas parceiras); linhas do ranking ganharam entrada escalonada (`fade-in-item`, até 5 itens por página, delay de 60ms cada) toda vez que a página é trocada.
- **`areaaluno.html`**: `.reveal` nos 4 stat-cards do dashboard (CRA, Frequência, Posição, Disciplinas) e nos 2 chart-cards (Evolução das Notas, Frequência por Disciplina); os 4 números do dashboard passaram a contar até o valor real em vez de aparecer estático.
- **`areaprofessor.html`**: `.reveal` nos 4 KPIs do Dashboard e nos 4 KPIs do "Resumo Acadêmico" (aba Perfil); todos os 8 pontos de dado (turmas, alunos, presença, média — duplicados entre as duas telas) animados via `animateCounter`.
- **`talentos.html`** (só um toque leve, já estava madura): cards de candidato ganharam entrada escalonada (`fade-in-item`, até 50ms por card, cap de 300ms) ao carregar/filtrar — reaproveita a técnica dos itens dinâmicos, sem precisar do `motion.js` (CSS + JS inline já resolviam). Os contadores da barra de estatísticas (Talentos encontrados/Com GitHub/Com LinkedIn) **não** foram animados de propósito — atualizam a cada filtro, e animar isso a cada tecla/clique seria o exagero que o pedido pediu pra evitar.

### 16.3 Testado

Ao vivo no navegador, sessões de aluno/professor simuladas via `localStorage`, nas 4 páginas: contadores chegam no valor correto (`23`/`3`/`5`/`1` no index; `9,6`/`80%`/`#3`/`11` no aluno; `10`/`2`/`96%`/`8,8` no professor, nas duas telas onde aparecem), reveal dispara ao rolar tanto na primeira carga quanto em abas que só ficam visíveis depois de trocar de página (ex: aba Perfil do professor), paginação do ranking e navegação entre abas continuam funcionando, sem novos erros de console.

---

## 17. Motion Camada 2, Notificações e Histórico Real de Notas (21/08/2026)

### 17.1 Motion Camada 2

Upgrade tasteful sobre a Camada 1, ainda sem bibliotecas externas:

- Nova variável CSS `--spring-ease: cubic-bezier(0.34, 1.56, 0.64, 1)` em `index.html`, `areaaluno.html` e `areaprofessor.html` — trocou a easing linear/ease dos hovers de card e da entrada `.reveal` por uma curva com leve *overshoot* (efeito de mola), sensação mais premium sem exagero.
- Ícones (`.feature-icon` no index, `.stat-icon` no aluno) ganharam um leve `scale + rotate` no hover do card pai.
- Botões `.btn-gradient` (index) ganharam feedback de pressão (`scale(0.96)` no `:active`).
- **Spotlight border** nos cards do Portal de Talentos (`talentos.html`): um brilho radial segue o cursor dentro do card (`--mx`/`--my` atualizados via `mousemove` delegado em `talentosGrid`, sem listener por card), com borda sutil que acende no hover. É o elemento de maior impacto visual desta camada — só nos cards de candidato, não espalhado por todo o site, para não poluir.

### 17.2 Notificações — aluno e empresa

**Problema:** nenhum dos dois lados do Portal de Talentos era avisado de nada — aluno não sabia quando uma empresa via seu perfil, empresa não sabia quando surgia um candidato novo que batia com os Interesses de Perfil salvos (o badge "Novo pra você" só aparecia se a empresa entrasse e olhasse).

- **Nova tabela `notificacoes`** (`banco_sql/migration_notificacoes.sql`): `destinatario_tipo` (`aluno`/`empresa`) + `destinatario_id`, em vez de FK dupla, já que as duas entidades compartilham a mesma tabela mas não têm relação entre si.
- **Aluno é notificado** quando uma empresa visualiza seu perfil — hook direto em `POST /interacoes` (rota que já existia para registrar `VISUALIZACAO` em `interacoes_empresas_alunos`): ao inserir a interação, cria também uma notificação pro aluno, com o nome da empresa. Janela de 30 minutos de deduplicação por par empresa/aluno, pra não spammar se o drawer for reaberto várias vezes.
- **Empresa é notificada** de candidatos novos que batem com os Interesses de Perfil salvos (mesma regra do badge "Novo pra você" do `talentos.js`, agora replicada em SQL e persistida): a rota `GET /empresas/:id/notificacoes` sincroniza antes de responder — busca alunos que batem com `curso_preferido`/`semestre_minimo`, ainda não visualizados e ainda não notificados, cria as notificações que faltarem, e só então retorna a lista.
- **Endpoints:** `GET` + `PUT .../lida` + `PUT .../marcar-todas-lidas`, espelhados para `/alunos/:id/notificacoes` e `/empresas/:id/notificacoes`.
- **Frontend:** sino com badge de não-lidas no cabeçalho de `areaaluno.html` (ao lado do menu do usuário) e no nav de empresa logada em `talentos.html` (ao lado de "Já Visualizados"); dropdown com a lista, clique marca como lida, botão "Marcar todas como lidas".
- **Testado ao vivo:** aluno recebeu "Tech Solutions visualizou seu perfil" após simular uma visualização via `POST /interacoes`; empresa 1 recebeu 6 notificações reais de "Novo candidato disponível" (batendo com o Interesses de Perfil salvo de verdade no banco, incluindo o cadastro de teste do Sérgio Gabriel de Lima Linard); marcar como lida (individual e em massa) confirmado nos dois lados, badge some corretamente.

### 17.3 Histórico real de notas por semestre — gráficos deixam de ser iguais para todo aluno

**Descoberta importante:** a tabela `boletim` **já tinha** a coluna `semestre_cursado` com histórico real e multi-semestral — só que apenas o aluno id=21 (conta real do Enzio) tinha esse histórico populado (7 semestres, 2023.1 a 2026.1). Os outros 20 alunos (dados de demonstração) só tinham o semestre atual (2026.1) cadastrado. Por isso o gráfico "Evolução das Notas" usava uma curva sintética por interpolação linear até o CRA atual — a limitação já estava documentada na seção "Decisões técnicas relevantes" deste arquivo.

**Pior ainda:** o gráfico "Evolução das Notas" do **Dashboard** do aluno nem usava essa interpolação — usava um dataset `_PERF_DATA` 100% hardcoded (rótulos "Jan"-"Dez", valores fixos), **idêntico para absolutamente todo aluno**, sem nenhuma personalização, nem pelo CRA. Era o pior caso do problema relatado.

**Correção aplicada:**
1. **`banco_sql/seed_historico_notas.js`** (script Node, executado uma vez): para os 20 alunos de demonstração, gera boletim histórico real cobrindo os semestres anteriores ao atual (`semestre_atual - 1` períodos, contados pra trás a partir de 2026.1). Cada aluno recebe um "perfil de desempenho" sorteado entre 5 (consistente-alto, consistente-médio, crescente, decrescente, oscilante), gerando notas/menções/faltas/atividades realistas e coerentes com o perfil — não só terminando em alturas diferentes, mas com formato de curva genuinamente diferente. **112 linhas novas** inseridas em `boletim`; os 2 calouros (semestre 1) ficaram sem histórico anterior, corretamente.
2. **`GET /alunos/:id/desempenho-semestral`** (`Backend/api2.js`) reescrito: em vez de gerar uma curva sintética, agrupa `boletim` por `semestre_cursado` e calcula a média real de cada período; os filtros `semestral`/`anual`/`completo` agora recortam uma janela dos dados reais disponíveis (2/4/todos os períodos) em vez de forçar um tamanho fixo com preenchimento sintético.
3. **`initializePerformanceChart()`** (`javascript/areaaluno.js`) reescrito: removido o dataset `_PERF_DATA` estático inteiro; a função agora busca dados reais do mesmo endpoint acima (`filtro=semestral` para o botão "Semestre", `filtro=anual` para "Ano") e renderiza uma única série "Suas Notas" com rótulos reais de período (ex: `25.2`, `26.1`).
4. Os outros pontos que já consumiam o mesmo endpoint (`GET /alunos/:id/desempenho-semestral`) — gráfico de "Desempenho" ao ver um colega no Ranking, drawer do Portal de Talentos, visão do professor sobre um aluno — herdaram a correção automaticamente, sem precisar de mudança de código, já que só o backend mudou o que retorna.

**Efeito colateral esperado e aceito:** como o ranking (`GET /ranking`, `GET /ranking/detalhado`) calcula a pontuação com `AVG()` sobre **todo** o histórico de `boletim` de cada aluno (CRA é cumulativo, não só do semestre atual — comportamento correto), adicionar histórico real mudou a posição de vários alunos no ranking (antes baseada em 1 único semestre de dados). Conferido antes/depois do seed: Enzio segue em 1º, os valores ficaram espalhados de forma realista (8.5–9.7), nada quebrou.

**Terceiro gráfico encontrado com o mesmo problema, também corrigido:** o "Histórico de CRA" em Meu Perfil (filtros 1 Ano/2 Anos/3 Anos/Completo) usava sua própria curva sintética local (`_curvaCraMock()` em `areaaluno.js`), independente da correção acima. Corrigido do mesmo jeito: `initializeCRAHistoryChart()` agora busca do mesmo endpoint `/alunos/:id/desempenho-semestral`. Como esse gráfico tem uma janela de "3 Anos" (6 semestres) que não existia como opção fixa no backend (só `semestral`=2/`anual`=4/`completo`=todos), adicionei um parâmetro opcional `?periodos=N` no endpoint que sobrepõe o padrão do filtro quando presente — sem criar um quarto valor de filtro nem duplicar lógica.

**Limpeza decorrente:** com os 3 gráficos migrados pra dados reais, as funções `_curvaCraMock()`, `_periodosAteAgora()`, `_periodosDesdeMatricula()` e `_duracaoSemestresCurso()` em `areaaluno.js` ficaram genuinamente órfãs (zero chamadores) — removidas, junto com a atribuição de `window._alunoInfo` que só existia pra alimentá-las.

**Não coberto nesta rodada (mesmo problema, mas fora do pedido):** o gráfico "Frequência por Disciplina" do Dashboard do aluno ainda é 100% estático/idêntico para todo aluno (`labels`/`values` fixos em `initializeFrequencyChart()`). Registrado como pendência — ver seção 18.

### 17.4 Testado

Backend: `curl` confirmando curvas reais e distintas por aluno via `/desempenho-semestral?filtro=completo` (ex: aluno 1 estável 9-10, aluno 6 oscilando 5.3-9.5, aluno 13 caindo de 10 para 7.5) e via `?periodos=6`. Frontend: Dashboard do aluno 6 (Felipe Rocha) mostrando a curva oscilante real nos filtros Semestre e Ano; modal "Desempenho" de um colega no Ranking (Ana Silva) mostrando 3 pontos reais coerentes com seu perfil consistente-alto; "Histórico de CRA" em Meu Perfil do aluno 13 (Pedro Henrique) mostrando os 7 semestres reais em formato decrescente, filtro "Completo". Sem novos erros de console.

**Limitação cosmética conhecida (não corrigida):** o Frappe Charts 1.6.2 (biblioteca de gráficos já usada no projeto) renderiza o eixo Y de forma estranha (escala 0-60 em vez de 0-10) quando os dois pontos do filtro "Semestre" são exatamente iguais — ex: aluno 21 com nota 10.0 em dois semestres seguidos. É uma peculiaridade da biblioteca com dados perfeitamente constantes, não um erro nos dados (conferido via `curl`, os valores retornados estão corretos) nem algo que a curva sintética antiga jamais expunha (ela nunca gerava dois valores idênticos). Ocorre só nesse caso específico; o filtro "Ano" (4 pontos) sempre renderiza corretamente. Registrado aqui para não ser confundido com um bug de dados no futuro.

---

## 18. Limpeza de Código — CSS Morto e Tokens Compartilhados (21/08/2026)

Depois de sugerir duas listas de limpeza de código (o que remover vs. o que só está poluído/poderia ser mais enxuto), a pedido do Enzio, corrigi tudo **exceto os itens que exigiam mexer em `Backend/api2.js`** (explicitamente deixado de fora por instrução dele — o backend fica como está por enquanto).

### 18.1 CSS morto removido — `css/styleindex.css`

Investigação mais profunda do que a lista original pedia: ao remover os 3 itens confirmados na lista original (`.badge-custom`, o conjunto antigo de ranking `.ranking-item`/`.position-badge`/etc., `:root` duplicado no professor), percebi que `styleindex.css` carregava um sistema de design legado inteiro, paralelo ao atual, nunca removido de uma refatoração anterior do `index.html`. Fiz uma varredura sistemática (todo seletor de classe do arquivo comparado contra uso real em `index.html`/`index.js`) e removi, além do que já estava na lista:

- Sistema de "Ranking Tiers" completo (`.ranking-tiers`, `.tier-card`, `.tier-gold/silver/bronze`, `.tier-icon`, `.tier-name` — ~70 linhas, zero uso).
- `.stats-card`, `.how-it-works-card`, `.icon-wrapper`, `.benefit-card`, `.benefit-image`, `.stats-overview` — outro conjunto de cards de uma versão anterior do layout, também sem nenhum uso.
- `.loading` + `@keyframes spin`, `.shadow-custom`, `.border-radius-custom`, `.backdrop-blur`, `.text-vanilla`, `.bg-purple`, `.bg-gradient-light` — utilitários soltos, nunca referenciados.
- Referências órfãs dentro de `@media` queries que citavam classes já removidas.

Confirmado por script (grep de cada seletor contra `class="..."`, `classList.*`, `className =`, `querySelector`): **0 classes mortas restantes** no arquivo depois da limpeza. `.ranking-row` e `.fade-in-item` foram checados e confirmados como uso real (atribuídos via `item.className = ...` no JS, por isso não apareciam num grep ingênuo por `class="..."`).

### 18.2 `:root` duplicado — `css/styleareaprofessor.css`

O arquivo tinha dois blocos `:root` separados (um no topo, outro a ~640 linhas de distância) e um `* { margin:0; padding:0; box-sizing:border-box }` repetido. Alguns nomes de variável apareciam nos dois blocos com **valores diferentes** (`--success-green`: `#48BB78` vs `#28a745`; `--warning-yellow`: `#ECC94B` vs `#ffc107`) — como CSS usa a última declaração em caso de empate de especificidade, o valor do primeiro bloco já estava sendo silenciosamente ignorado. Mesclado em um único `:root` no topo, mantendo o valor que já estava efetivamente em uso (o do segundo bloco, que vinha depois no arquivo) — sem mudança visual, só removendo a ambiguidade.

### 18.3 Tokens de marca compartilhados — `css/design-tokens.css` (novo arquivo)

Cada página redeclarava a mesma cor de marca com nomes diferentes: `--primary-blue`/`--accent-orange` (index, aluno), `--primary-orange` (professor), `--primary`/`--accent` (talentos, no `<style>` inline). Mesmos valores (`#020122` e `#F4442E`) em todo lugar — conferido antes de mexer, para não presumir que eram intercambiáveis sem checar.

Criado `css/design-tokens.css` com um único `:root` contendo os 3 nomes como aliases do mesmo valor (`--primary-blue`/`--primary`, `--accent-orange`/`--primary-orange`/`--accent`) mais `--spring-ease` (que também estava redeclarado idêntico nas 3 páginas com CSS externo). Incluído via `<link>` antes da folha de estilo própria de cada página (`index.html`, `areaaluno.html`, `areaprofessor.html`, `talentos.html`); removidas as declarações duplicadas de cada `:root` local, mantendo só as variáveis realmente específicas de cada página (tons de cinza, cores de status, larguras de sidebar etc., que **divergem entre páginas de verdade** e por isso não foram tocadas).

### 18.4 Terceiro gráfico "igual pra todo aluno" corrigido — Frequência por Disciplina

Identificado durante a lista de limpeza: `initializeFrequencyChart()` no Dashboard do aluno também era um array 100% fixo (`['Algoritmos','BD','Cálculo',...], [96,92,88,98,94,96]`), idêntico pra todo mundo — o mesmo problema já corrigido nos outros 3 gráficos na seção 17, mas esse item específico tinha ficado de fora por não ter sido pedido na hora.

Corrigido **sem tocar no backend**: a função agora busca `GET /alunos/:id/boletim-detalhado` (endpoint que já existia e já é chamado em `loadAlunoData`) e calcula a frequência real por disciplina a partir de `boletim.faltas`. Como essa rota não filtra por semestre e não expõe um total de aulas, duas limitações honestas ficaram documentadas no código: (1) o array pode misturar disciplinas de semestres diferentes quando o nome se repete entre eles (mantém a ocorrência mais recente do array), e (2) o percentual assume 20 aulas por semestre como padrão (não existe essa coluna no banco) — uma correção completa exigiria um pequeno ajuste no backend, deixado de fora de propósito nesta rodada porque a api2.js foi explicitamente excluída do escopo.

### 18.5 Testado

Testado ao vivo nas 4 páginas (`index`, `areaaluno`, `areaprofessor`, `talentos`) depois da limpeza de CSS e da unificação de tokens: cores, gradientes e layout idênticos a antes (nenhuma mudança visual), sem novos erros de console. "Frequência por Disciplina" do aluno 21 confirmada mostrando disciplinas e percentuais reais e distintos (antes era sempre `Algoritmos/BD/Cálculo/POO/Redes/Eng. Software` com `96/92/88/98/94/96`).

---

## 19. Backlog de Melhorias Funcionais — Status Real (21/08/2026)

Lista de sugestões de melhoria dada ao Enzio para as 4 páginas principais. Status real (não tudo foi implementado — registrado aqui pra não haver dúvida do que existe de verdade):

### 19.1 index.html
- [x] Trocar imagem de fundo do hero — feito, ver 19.7a (e corrigiu um bug real de tamanho zero na div)
- [ ] **Seção de depoimentos/prova social — decisão do Enzio: não implementar agora.** Movida pra sugestão futura, a ser discutida com o grupo (ver 19.6).
- [x] Busca/filtro por curso na lista pública de ranking — feito, ver 19.7a
- [x] Meta tags de compartilhamento (`og:image`, `og:title`) — feito, ver 19.7a (limitação: `og:image` só funciona com URL pública, projeto ainda não hospedado)

### 19.2 areaaluno.html
- [x] Sistema de notificações — infraestrutura completa (tabela, endpoints, sino, marcar como lida) + gatilho de "empresa visualizou seu perfil"
- [x] Notificação de mudança de posição no ranking — **implementada nesta rodada**, ver 19.7
- [ ] Notificação de resposta de chamado de suporte (chamados hoje não têm mecanismo de resposta — fora de escopo até essa função existir)
- [ ] Notificação de evento novo no calendário acadêmico (eventos do professor hoje são estáticos, sem tabela própria — mesma limitação)
- [x] Card de "próximos passos"/insight acionável — feito, ver 19.7b
- [x] Meta pessoal (CRA/posição-alvo) — feito como meta de CRA (posição-alvo ficaria redundante com a notificação de ranking), ver 19.7b
- [x] Avatar de upload — feito, ver 19.7b

### 19.3 areaprofessor.html — concluído (3 de 3)
- [x] Aviso/comunicado para turma inteira — feito, ver 19.7c
- [x] Exportar CSV das próprias turmas (PDF não — CSV já resolve o caso de uso e evita adicionar mais peso de lib) — feito, ver 19.7c
- [x] Gráfico de evolução da turma ao longo do semestre — feito, ver 19.7c

### 19.4 talentos.html — concluído (3 de 3)
- [x] Status de acompanhamento por candidato (Contatado/Entrevista) — feito, ver 19.7d
- [x] Exportar comparativo de 3 candidatos em PDF — feito, ver 19.7e
- [x] Alerta de candidato novo que bate com Interesses de Perfil — feito e testado (seção 17.2)

### 19.5 Transversal
- [x] Notificação/sino in-app — parcial: 3 gatilhos reais (visualização de perfil, candidato novo, mudança de ranking), arquitetura pronta pra novos gatilhos
- [x] Estados de erro reais em toda a aplicação — feito, ver 19.7f (auditoria completa das telas principais)
- [x] Busca global — feito como ferramenta de admin (era o caso de uso identificado), ver seção 20

### 19.6 Sugestões para conversar com o grupo (não implementar sem alinhar)
- Seção de depoimentos/prova social no index — vale a pena pra um TCC, ou é enfeite? Se decidirem que sim, são 2-3 citações reais de alunos/empresas parceiras, sem inventar nome/depoimento.

### 19.7a `index.html` — concluído

- **Fundo do hero**: trocado o stock photo do Pixabay por um padrão geométrico autoral (grade de pontos + linhas diagonais em CSS puro, tons da marca). Ao fazer isso, descobri e corrigi um **bug real pré-existente**: a `div.hero-bg` não tinha `position`/`inset` definidos, então colapsava pra 0×0 e nunca era exibida — nem a foto antiga aparecia de verdade. Corrigido com `position:absolute; inset:0;`.
- **Filtro de curso no ranking público**: novo `<select>` acima da lista, populado com os cursos reais presentes no ranking; filtra client-side (`_rankingFiltrado()`), reseta pra página 1 ao trocar, mostra "Nenhum aluno encontrado" quando o curso filtrado não tem resultados.
- **Meta tags de compartilhamento**: `og:title`, `og:description`, `og:image`, `twitter:card` etc. adicionadas. Limitação honesta: `og:image` aponta pro caminho local da logo — funciona bem quando o projeto for hospedado com URL pública; localmente (`file://`/`localhost`), crawlers de redes sociais não conseguem buscar a imagem.
- Testado ao vivo: padrão do hero visível e sutil, filtro trocando o curso e re-numerando posições corretamente, sem erros de console.

### 19.7b `areaaluno.html` — concluído (3 dos 4 itens; upload de avatar também)

Descoberta: o card "Insights de Estudo" **já existia**, mas era 100% estático (dica sempre sobre "Algoritmos", provas fixas, meta sempre em "87% pra CRA 9.0") — igual pra todo aluno. Reaproveitado e corrigido em vez de criar um card novo:

- **Card de insight acionável**: `setupInsightPerformance()` calcula a partir de `boletim-detalhado` (já buscado no dashboard) — se alguma disciplina está com frequência real abaixo de 75%, avisa qual; senão, destaca a disciplina de melhor nota real. Removido o bloco fixo de "Próximas Avaliações" (não existe fonte de dado real pra isso no banco — não fabriquei datas falsas).
- **Meta pessoal de CRA**: vira editável de verdade — botão de lápis abre um campo, salva em `localStorage` (`meta_cra_<id>`, por aluno), barra de progresso e texto calculados contra o CRA real atual. Sem prêmio inventado, só progresso real.
- **Avatar de upload**: novo — migration `banco_sql/migration_avatar_aluno.sql` (`alunos.avatar_base64 MEDIUMTEXT`), rotas `PUT`/`DELETE /alunos/:id/avatar`. Frontend redimensiona a imagem no cliente via canvas (200×200, cover-crop, JPEG 85%) antes de enviar — payload pequeno, sem precisar gerenciar pasta de uploads no servidor. O botão "Alterar Foto"/"Remover Foto" da tela de Editar Perfil **já existia visualmente mas não fazia nada** — agora funciona de verdade nos dois lugares (visualização em Meu Perfil e edição).
- Aumentado o limite do `express.json()` de 100kb (padrão) pra 2mb, necessário pro payload de avatar em base64.
- Testado ao vivo: insight real e distinto por aluno confirmado (aluno 6 → "Seu melhor desempenho é em Compiladores, com nota 8.8"); meta salva, calcula progresso corretamente (89% pra CRA 8.5 com atual 7.6) e persiste; avatar testado via canvas sintético — upload confirmado no banco (`GET /alunos/6` retornou o base64 salvo), renderizado como `<img>` redondo, remoção confirmada revertendo ao ícone padrão. Sem erros novos de console.

### 19.7c `areaprofessor.html` — concluído (3 dos 3 itens)

- **Aviso pra turma inteira**: nova rota `POST /disciplinas/:discId/aviso` — cria uma notificação (`notificacoes`, tipo `aviso_turma`) pra cada aluno com boletim no semestre mais recente cursado naquela disciplina. Botão "Aviso" novo em cada card da aba Turmas, abre modal com textarea, reaproveita o sistema de notificação do aluno já existente (sino já renderiza qualquer tipo genericamente, zero mudança extra no lado do aluno).
- **Gráfico de evolução da turma**: nova rota `GET /disciplinas/:discId/evolucao` — média real por `semestre_cursado` de todos os alunos que já passaram pela disciplina (mesma lógica de `/alunos/:id/desempenho-semestral`, mas agregando a turma inteira em vez de um aluno). Botão "Evolução" novo em cada card, abre modal com o gráfico (Frappe Charts, já usado no resto do arquivo).
- **Exportar CSV dos alunos**: botão "Exportar CSV" na aba Alunos — gera CSV real (`Blob` + link de download) com os dados já carregados na tabela (nome, matrícula, curso, desempenho, frequência, atividades, disciplinas), respeitando o filtro de turma selecionado no momento. Delimitador `;` e BOM UTF-8 no início do arquivo — necessário pro Excel em português abrir com acentuação correta e sem misturar decimal com separador de coluna.
- Testado ao vivo: aviso enviado de verdade pra "Algoritmos e Estruturas de Dados" — confirmado 8 notificações reais criadas no banco pra cada aluno matriculado na turma naquele período (depois removidas, era teste); gráfico de evolução renderizado com os mesmos valores confirmados via `curl`; CSV gerado com conteúdo real, escapado corretamente, sem erro no console.

### 19.7 Notificação de mudança de posição no ranking — implementação

- **Migration** `banco_sql/migration_notif_ranking.sql`: nova coluna `alunos.ultima_posicao_ranking`.
- **`GET /alunos/:id/notificacoes`** (`Backend/api2.js`) ganhou uma sincronização antes de listar (mesmo padrão já usado pra notificação de empresa): calcula a posição atual do aluno no ranking geral, compara com `ultima_posicao_ranking` salva, e se mudou (e não é a primeira vez — `NULL` não gera notificação, só estabelece a base) cria uma notificação "Você subiu no ranking!" ou "Sua posição no ranking mudou", com a posição antiga e nova. Sempre atualiza `ultima_posicao_ranking` com o valor atual ao final.
- Nenhuma mudança de frontend necessária — o sino e o dropdown de notificações do aluno já renderizam qualquer tipo de notificação genericamente (mesmo componente usado pra "visualização de perfil").
- **Testado:** via `curl`, simulando uma posição anterior diferente da atual (`UPDATE alunos SET ultima_posicao_ranking=18` num aluno que hoje está em #15) — notificação gerada corretamente ("Você subiu de #18 para #15"), chamada repetida não duplica, dado de teste removido depois.

### 19.7d Status de acompanhamento por candidato favoritado (talentos.html) — 21/08/2026

- **Migration** `banco_sql/migration_status_favorito.sql`: nova coluna `empresa_favoritos.status VARCHAR(20) NOT NULL DEFAULT 'novo'`.
- **Backend**: `GET /empresas/:id/favoritos` passou a retornar `status` no SELECT; nova rota `PUT /empresas/:id/favoritos/:alunoId/status`, valida contra whitelist (`novo`, `contatado`, `entrevista_marcada`, `em_processo`, `descartado`), 400 se inválido, 404 se o favorito não existir.
- **Frontend** (`javascript/talentos.js`): novo `_favoritosStatusMap` (aluno_id → status), populado junto com `_favoritosIds` em `_carregarFavoritos()`. Decisão de UX: não existe uma página "Meus Favoritos" dedicada (favoritos hoje são só um filtro na grade principal) — o seletor de status vive no **drawer de perfil do candidato**, condicionalmente renderizado só quando o aluno já está favoritado (`_statusFavoritoWrapHtml()`, extraído como função à parte pra ser reusada tanto na renderização inicial do drawer quanto ao favoritar/desfavoritar sem fechar o drawer). `window.atualizarStatusFavorito(alunoId, status)` faz o `PUT` e atualiza o map local.
- Testado ao vivo via automação de navegador: favoritado aluno de teste, select apareceu com "Novo" pré-selecionado; troca de status via evento `change` real persistiu no banco (`SELECT` confirmou `entrevista_marcada`); reload completo da página (sessão nova) reabrindo o drawer manteve o status carregado do backend; desfavoritar removeu o select e limpou o map corretamente. Sem erros de console. Dado de teste removido do banco ao final.

### 19.7e Exportar comparativo de candidatos em PDF (talentos.html) — 21/08/2026

- Reaproveita o modal de comparação já existente (`#modalComparacao`, gerado por `abrirComparacao()`) — adicionado `modal-footer` com botão "Exportar Comparativo (PDF)".
- `window.exportarComparacaoPDF(btn)`: busca os mesmos dados já usados na comparação em tela (`/talentos/aluno/:id/perfil` + `/alunos/:id/desempenho-semestral?filtro=completo`) para os `_compararIds` selecionados (2 ou 3), gera um PDF paisagem (A4) com **jsPDF** (mesma lib já usada em `exportarPerfilCompletoPDF`), uma coluna de texto por candidato lado a lado (nome, curso/semestre, CRA, frequência, ranking, disciplinas/atividades/faltas, evolução do CRA no curso todo, disciplinas de destaque, contato) com linha divisória vertical entre colunas.
- Decisão de escopo: sem captura de imagem/gráfico (canvas) — texto puro, igual ao padrão já estabelecido no relatório individual; mantém o PDF leve e evita dependência de renderização de canvas fora da tela.
- **Testado ao vivo**: função chamada de verdade com 2 candidatos reais selecionados via `toggleComparar()`; confirmado por instrumentação do construtor `jsPDF` (a técnica ingênua de sobrescrever `jsPDF.prototype.save` não funciona — a lib atribui `save` como propriedade própria da instância, não no prototype) que `pdf.save('comparacao_candidatos_ranking_plus.pdf')` é chamado corretamente ao final; botão volta ao estado normal (não trava em "Gerando…"); sem erros de aplicação no console (só ruído padrão de mensageria de extensão do Chrome, não relacionado ao código).

Com isso, os 2 últimos itens do backlog original do Portal de Talentos (`talentos.html`) estão concluídos — fecha a seção 19.4.

### 19.7f Auditoria de estados de erro reais em toda a aplicação — 21/08/2026

Levantamento de todos os `catch` de chamadas à API nos 4 arquivos principais (`index.js`, `areaaluno.js`, `areaprofessor.js`, `talentos.js` — 63 blocos `catch` no total) pra achar onde uma falha de rede/API deixava o usuário sem feedback nenhum (tela em branco, ou só `console.error`/`console.warn`). A maioria já tinha loading/erro/vazio corretos (herdados do trabalho das seções 16-19.7c); os problemas reais encontrados e corrigidos:

- **`areaaluno.js` — `loadAlunoData()` (o carregador principal do Dashboard inteiro)**: se o `fetch` do aluno falhasse (`!resAluno.ok`) ou lançasse exceção, a função só dava `return` silencioso ou um `console.warn` — o dashboard inteiro ficava parado sem nenhum aviso visível. Era o gap de maior impacto de todos: a tela mais usada do sistema, quebrando sem avisar. Corrigido com um banner de erro real (`#alunoDataErrorBanner`, novo em `areaaluno.html`, logo no topo do `#pageContent`) com botão "Tentar de novo" que rechama `loadAlunoData(id)`; some automaticamente assim que os dados carregam com sucesso.
- **`areaprofessor.js` — `loadScheduleTab()` (aba Horários)**: não tinha `try/catch` nenhum — uma falha no fetch de disciplinas propagava uma exceção não tratada, quebrando a troca de aba sem mensagem nenhuma. Corrigido com `try/catch` real e mensagem de erro com "Tentar de novo" na grade de horários.
- **`talentos.js`**: função `mostrarErro()` (usada por `buscarTalentos()`, o carregador principal da grade de candidatos) mostrava a mensagem mas sem botão de retry — adicionado. As mensagens de erro do drawer de perfil (`abrirPerfilAluno()`, tanto "perfil não disponível" quanto erro de rede) também ganharam botão "Tentar de novo".
- **`index.js`**: `loadRanking()` já tinha o padrão completo (feito numa sessão anterior) — nada a mudar.

**Não mexido de propósito** (silêncio é aceitável nesses casos, avaliado item a item): contadores estatísticos decorativos (`loadStats()` no index — degradam pros placeholders "—" já visíveis no HTML), widget secundário "empresas que viram meu perfil" (`_renderVisualizacoesEmpresas()` — card opcional, falha não afeta o resto da página), formulário de Perfil Profissional (`loadPerfilProfissional()` — cai pra formulário vazio editável em vez de bloquear, o que é aceitável pra um form).

**Testado ao vivo**: simulei a falha de `loadAlunoData()` chamando com um ID inexistente — banner apareceu, dados já carregados na tela não foram apagados (só o aviso aparece por cima), clique real no botão "Tentar de novo" confirmado, reload completo com ID válido confirma que o banner some e os dados carregam normalmente. Para `loadScheduleTab()`, simulei `window.fetch` rejeitando (rede fora do ar) — antes disso a função lançava exceção não tratada; agora captura, mostra erro com retry, e o caminho normal (sem simulação) continua funcionando perfeitamente depois. Sem erros de console além do ruído padrão de extensão do Chrome.

### 19.8 Pendências registradas para depois (nesta ordem)

1. Motion Camada 3 (física de mola via lib externa tipo anime.js + animação de SVG no logo) — ver seção 17.1.
2. Segurança (Frente A do plano em `ranking-plus-plano-correcoes-gcp.md` no vault).

## 20. Painel Admin — Redesign, Chamados de Suporte e Busca Global (21/08/2026)

Depois de decidir que a busca global fazia mais sentido como ferramenta de admin, o Enzio pediu pra ir além: implementar a busca de verdade, adicionar um registro real de chamados de suporte no painel, e **refazer `admin.html`** — segundo ele, "está bem engessada" (era só troca de aba com `d-none`, uma seção visível por vez). Autorização explícita pra mudar o padrão visual, inclusive diferente do resto da plataforma, já que é uma ferramenta interna.

### 20.1 Backend — `Backend/api2.js`

- **`GET /admin/chamados`** (protegida por `adminAuth`): lista todos os chamados de `chamados_suporte` (tabela já existia desde a seção 14, usada pelo formulário de Suporte — só faltava uma rota de leitura pro admin).
- **`PUT /admin/chamados/:id/status`**: move um chamado entre os 3 estados (`aberto`/`em_andamento`/`concluido`), validado contra whitelist, 400 se inválido, 404 se o chamado não existir.
- Nenhuma migration nova — a coluna `status` (`VARCHAR(20) DEFAULT 'aberto'`) já existia na tabela desde a criação do sistema de Suporte (seção 14), só não era exposta em nenhuma tela.

### 20.2 Redesign de `admin.html` — de abas para página única

- **Sidebar**: os itens deixaram de alternar `d-none` entre `<div>`s e passaram a ser links de rolagem (`data-secao` + `scrollIntoView({behavior:'smooth'})`) — a página inteira agora é uma rolagem única, com todas as seções sempre no DOM. Um `IntersectionObserver` (`_initScrollSpy()`) marca automaticamente o item ativo da sidebar conforme a seção visível na tela, sem precisar de lógica de clique manual pra isso.
- Seções viraram `<section class="admin-section">` com `scroll-margin-top` (compensa a topbar `sticky` ao rolar até uma âncora).
- Item "Chamados" na sidebar ganhou um badge numérico (`#navChamadosBadge`) com a contagem de chamados abertos + em andamento — visível de qualquer ponto da página, não só quando a seção está em foco.

### 20.3 Busca global (`_buscaGlobal()`)

- Campo de busca prominente na topbar, sempre visível (menos em telas < 992px, onde esconde por espaço).
- **Decisão de arquitetura**: não criei uma rota de backend nova pra isso — os dados de alunos/professores/empresas já são carregados inteiros no painel para os filtros locais existentes (`_alunos`, `_professores`, `_empresas`), então a busca global roda 100% client-side sobre esse cache já em memória. Zero requisição extra, resposta instantânea.
- Resultado agrupado por tipo (Alunos/Professores/Empresas, até 5 de cada), dropdown com ícone + nome + e-mail. Clicar num resultado (`_irParaResultado()`) rola até a seção certa **e** aplica o mesmo termo no campo de busca local daquela tabela — reaproveita os filtros que já existiam (`filtrarAlunos()` etc.) em vez de duplicar lógica de renderização.

### 20.4 Chamados de Suporte — quadro Kanban

- Três colunas fixas: **Abertos** / **Em Andamento** / **Concluídos**, cada uma com contador no cabeçalho.
- Card por chamado: assunto, nome + e-mail de quem abriu, badge de categoria (Problema Técnico/Dúvida sobre Ranking/Benefícios/Conta/Outros), badge de prioridade colorido (Baixa/Média/Alta/Urgente), descrição truncada em 2 linhas, data relativa e `#id`.
- Movimentação **sem drag-and-drop** — dois botões por card (seta esquerda/direita) que avançam ou voltam um estágio (`moverChamado()`), com **atualização otimista** (move na tela imediatamente, reverte sozinho se o `PUT` falhar) — decisão consciente de não implementar drag-and-drop: mais simples de implementar corretamente, mais acessível (funciona por teclado/clique), e suficiente pro volume de chamados esperado num projeto acadêmico.

### 20.5 Testado ao vivo

Criei uma conta de admin temporária (`qa.teste@rankingplus.local`) e um chamado de teste real via `POST /suporte/chamados` — nunca usei nem expus a senha real do admin do Enzio. Testado via automação de navegador:
- Login real pelo formulário (não via localStorage direto) → painel carrega, layout novo renderiza corretamente.
- Busca global: digitei "bruno", resultado apareceu agrupado corretamente; clique no resultado rolou até Alunos e filtrou a tabela pra "Bruno Costa" — confirmado por screenshot.
- Kanban: card do chamado de teste apareceu em "Em Andamento" com todos os dados corretos; clique real no botão de avançar moveu pra "Concluídos"; confirmado no MySQL (`status = 'concluido'`) e reconfirmado após reload completo da página (sessão nova, restaura token do `localStorage`) — dado sobrevive.
- Impersonation (função não tocada, só queria confirmar que a reestruturação da página não quebrou nada): modal de confirmação ainda abre normalmente.
- Sem erros de console.
- Conta de admin de teste e chamado de teste **removidos do banco** ao final — painel voltou ao estado real (1 admin, 0 chamados).

### 20.6 Correção pós-entrega — dois bugs reais encontrados pelo Enzio (21/08/2026, mesmo dia)

Ao testar de verdade (sem chamado nenhum no banco), o Enzio bateu em `"Erro ao carregar chamados."`. Investigado e eram **dois bugs reais**, não "comportamento esperado sem dados":

1. **Sessão admin ficando presa num token inválido sem avisar** — as sessões de admin vivem só em memória no servidor (`Map`, documentado como "simples e suficiente pra projeto acadêmico sem JWT"); toda vez que reinicio o backend pra aplicar mudança de rota (o que fiz duas vezes nesta sessão), todos os tokens já emitidos morrem, mas o `localStorage` do navegador continua com o token antigo — e o painel achava que ainda estava logado. Resultado: cada seção (`alunos`, `professores`, `empresas`, `chamados`, `estatísticas`) tentava chamar a API, recebia `401` e mostrava `"Erro ao carregar X"` isoladamente, sem indicar a causa real. Corrigido: `_apiGet`/`_apiPost`/novo `_apiPut` agora detectam `401` centralizadamente e chamam `_tratarSessaoExpirada()` — limpa o token, esconde o painel, mostra a tela de login com o aviso "Sua sessão expirou. Faça login novamente." em vez de erros soltos.
2. **Bug real e mais sério: uma falha em `carregarChamados()` quebrava o quadro permanentemente.** O `catch` fazia `board.innerHTML = <mensagem de erro>` sobrescrevendo `#kanbanBoard` inteiro — o que **apagava as 3 divs das colunas** (`colAberto`/`colEmAndamento`/`colConcluido`). Qualquer tentativa seguinte (mesmo clicando "Tentar de novo") quebrava de novo, agora com um erro diferente e não tratado (`Cannot set properties of null`), porque o código tentava re-popular colunas que não existiam mais no DOM — ficava travado pra sempre no estado de erro, mesmo que a API voltasse a funcionar. Corrigido: o esqueleto do quadro (as 3 colunas com seus ids) nunca é mais destruído; erro agora aparece num banner separado (`#kanbanError`, acima do quadro) que soma/some sem tocar na estrutura das colunas. Testado forçando uma falha real (`window.fetch` rejeitando) e confirmando que uma tentativa seguinte recupera normalmente.

A causa exata da falha original do Enzio provavelmente foi o cenário 1 (token invalidado pelos meus restarts de backend durante o desenvolvimento) — mas o cenário 2 é o bug estrutural que faria **qualquer** falha futura (rede instável, backend reiniciando em produção, etc.) travar o quadro permanentemente, então valia corrigir os dois.

Também deixado, a pedido do Enzio, um **chamado de demonstração real no banco** (não removido): "Marina Torres" — Gráfico de frequência não atualiza, categoria Problema Técnico, prioridade Média, status Aberto — pra o painel não ficar vazio/pouco apresentável nas próximas vezes que for aberto.

### 20.7 Tema escuro + compacto no `admin.css` (21/08/2026, mesmo dia)

Depois de ver o resultado, o Enzio comentou que a reestruturação melhorou mas visualmente "tá igual o antigo". Perguntei se valia a pena investir mais em diferenciação visual — como é ferramenta interna (só ele usa), sugeri que o ganho real estava na parte funcional, não no reskin; ele topou fazer só ajustes pontuais **sem impacto no resto do projeto** (arquivo isolado): tema escuro completo + números em fonte monoespaçada + layout mais compacto.

- **Paleta escura nova** (`--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-muted`), aplicada em: login, sidebar, topbar, cards de estatística, tabelas, quadro Kanban, modal de confirmação e toast de impersonation.
- **Números em `var(--mono)`** (`ui-monospace`/Cascadia Code/Consolas) com `font-variant-numeric: tabular-nums`: valores dos stat-cards do dashboard, contadores do Kanban, e as colunas de id/matrícula/e-mail das tabelas — efeito "painel técnico", números alinham visualmente entre si.
- **Densidade maior**: paddings reduzidos em quase todos os componentes (cards, linhas de tabela, colunas do Kanban), fontes ligeiramente menores — cabe mais informação na tela sem rolar tanto.
- **Dois bugs de contraste reais encontrados e corrigidos durante o teste visual** (não eram óbvios só lendo o CSS, só apareceram ao renderizar de verdade):
  1. Bootstrap pinta fundo de célula de tabela via variável própria (`--bs-table-bg`, que eu não tinha sobrescrito) — resultado: células com fundo branco sólido por trás de texto claro, quase ilegível. Corrigido definindo `--bs-table-bg`/`--bs-table-color`/`--bs-table-border-color`/`--bs-table-hover-bg` diretamente no seletor `.table-card .table` (forma suportada pelo Bootstrap 5.3 pra reskin de tabela).
  2. A classe `.text-muted` do Bootstrap usa `!important` (cor escura pensada pra fundo claro) — nas colunas de id/e-mail/matrícula ficava cinza-escuro sobre fundo escuro, quase invisível. Corrigido com `.table-card .table .text-muted { color: var(--text-muted) !important; }` (precisa do `!important` pra vencer o do Bootstrap).
  3. Botões que usavam `var(--primary)` (navy quase preto) diretamente como cor de fundo — botão "Entrar no Painel" do login e o botão "Confirmar" do modal de impersonation (caso "Aluno") ficavam quase invisíveis contra o novo fundo escuro. Trocados pra `var(--accent)` (laranja da marca), consistente com os botões "Acessar como Aluno" que já eram laranja.
- **Testado ao vivo** com conta de admin temporária: login, dashboard, Kanban, as 3 tabelas (Alunos/Professores/Empresas) e o modal de impersonation — todos com contraste correto após as correções, confirmado via zoom em screenshot e inspeção de `getComputedStyle()` real (não só leitura do CSS). Conta de teste removida ao final; painel real (1 admin) e o chamado de demonstração preservados.

## 21. Correção — "Evolução das Notas" (Dashboard do aluno), modo Anual (21/08/2026)

O Enzio reportou que o filtro "Ano" do gráfico "Evolução das Notas" (Dashboard, primeira tela do aluno) "não ficou bom" e pediu mais opções de quantidade de anos.

### 21.1 Causa raiz

Investigando `initializePerformanceChart()` (`javascript/areaaluno.js`) e a rota `GET /alunos/:id/desempenho-semestral` (`Backend/api2.js`): o filtro "Ano" **nunca agregava por ano civil de verdade** — só pedia uma janela maior de semestres (4 em vez de 2) e mostrava com o mesmo rótulo de semestre (`"25.2"`, `"26.1"`, `"25.1"`, `"24.2"`...). Ou seja, o botão dizia "Ano" mas o gráfico continuava semestre a semestre, só que com mais pontos — daí a sensação de "não ficou bom": não parecia visão anual nenhuma, e não dava pra escolher quantos anos ver.

### 21.2 Correção

- **Backend**: novo parâmetro opt-in `agrupar=ano` na rota `/alunos/:id/desempenho-semestral`. Quando presente, agrupa as médias por semestre (já calculadas) pelo ano civil (primeiros 4 dígitos de `semestre_cursado`, ex: `"2025.1"` → `"2025"`) e tira a média das médias de cada ano — agregação real, não só filtro de janela. Sem esse parâmetro, o comportamento é **exatamente o de antes** (zero risco pro "Histórico de CRA" em Meu Perfil, que usa o mesmo endpoint sem esse parâmetro).
- **Frontend**: o botão "Ano" agora chama `agrupar=ano` de verdade; ao ativá-lo, aparece um `<select>` novo ("Últimos 2 anos" / "Últimos 3 anos" / "Últimos 5 anos" / "Todos os anos") ao lado do botão — resolve o pedido de "mais opções de anos" sem lotar o cabeçalho do card com mais botões.
- **Bug pego durante o próprio teste**: `parseInt(valor, 10) || 3` — clássica pegadinha de "zero é falsy" em JS. Quando o select estava em "Todos os anos" (`value="0"`), `0 || 3` sempre caía no `3` (2025 pra frente), ignorando a opção "Todos". Corrigido trocando por checagem explícita com `Number.isFinite()`.

### 21.3 Testado ao vivo

Aluno de teste com histórico real de 4 anos civis (2023–2026, 7 semestres). Verificação cruzada independente: rodei a mesma query de médias por semestre direto no MySQL e conferi manualmente a média de cada ano contra o que a API retornou — bateu exato (2023: 9.3 = média de 10.0 e 8.5; 2024: 8.5; 2025: 6.5; 2026: 7.5, só um semestre lançado até agora). No navegador: modo "Semestre" inalterado (`"25.2"`, `"26.1"`); modo "Ano" com 3 anos mostrou `2024/2025/2026` corretos; troquei pra "Todos os anos" — só depois de corrigir o bug do `|| 3` — e confirmou os 4 anos (`2023/2024/2025/2026`); "Últimos 2 anos" confirmado via API (`["2025","2026"]`); volta pro modo "Semestre" esconde o `<select>` corretamente. Sem erros de console.

## 22. Correções pontuais no Painel Admin — botão de acessibilidade e coluna de ação (21/08/2026, mesmo dia)

Dois problemas reportados pelo Enzio no painel admin.

### 22.1 Botão de acessibilidade sobrepondo conteúdo

O FAB de acessibilidade (`javascript/acessibilidade.js`, script compartilhado por **todas** as páginas) fica fixo em `bottom:24px; left:16px`. Nas páginas com sidebar fixa à esquerda (`admin.html`, `areaaluno.html`, `areaprofessor.html`), esse canto cai literalmente dentro da coluna da sidebar — no admin especificamente, bem em cima do nome do admin logado e do botão "Sair", que ficam fixados no rodapé da sidebar via flexbox.

**Correção** (no arquivo compartilhado, corrige as 3 páginas de uma vez): antes de posicionar o FAB, o script agora **mede a sidebar de verdade** (`getBoundingClientRect()`, procurando `.admin-sidebar` ou `.sidebar`) e desloca o `left` pra logo depois da borda direita dela (`+16px`); recalcula no `resize` da janela (útil pro breakpoint mobile onde a sidebar some). Sem sidebar visível na página (index, talentos, suporte, termo de uso, recuperar senha), mantém o padrão de sempre. Optei por medir o elemento real em vez de cravar um valor fixo — as duas sidebars têm larguras diferentes (`areaaluno`/`areaprofessor`: 250px, `areaprofessor` na prática mediu 280px, admin: 250px), um número chutado erraria em pelo menos uma delas.

Testado ao vivo nas 4 páginas: admin (266px, fora da sidebar), areaaluno (266px), areaprofessor (296px — confirmando que a medição dinâmica pegou a largura real e diferente dessa sidebar), talentos (16px, inalterado — sem sidebar). Sem erros de console.

### 22.2 Botão "Acessar como Empresa/Professor/Aluno" ficando fora da área clicável

Enzio não conseguia clicar no botão de impersonation da tabela de Empresas. Investigando: as tabelas (Alunos/Professores/Empresas) usam `.table-responsive` com rolagem horizontal, e a coluna "Ação" (com o botão) é a última coluna — em janelas mais estreitas ou com a tabela naturalmente larga (nomes/e-mails/CNPJ compridos), o botão fica além da borda visível, exigindo rolar a tabela pra ver e clicar nele. Confirmado via `getBoundingClientRect()` que o botão pode ficar fora da área visível dependendo da largura disponível.

**Correção**: coluna "Ação" (`th:last-child`/`td:last-child` dentro de `.table-card .table`) agora usa `position: sticky; right: 0` — fica sempre visível e clicável na borda direita da tabela, independente de quanto ela role horizontalmente por baixo. Adicionado um fundo opaco e uma sombra sutil separando a coluna fixa do conteúdo que rola por trás dela, pra não ficar com aparência quebrada.

Testado ao vivo forçando overflow real (não simulado): reduzi a largura do card de Empresas pra 450px via JS (bem menor que a largura natural da tabela, ~900px+) — a coluna "Ação" continuou visível e o clique real no botão abriu o modal de confirmação normalmente. Revertido depois; comportamento na largura normal continua idêntico (confirmado via `getBoundingClientRect()`, o botão já estava dentro da área visível mesmo antes — a correção é uma proteção estrutural pra qualquer largura de tela, não uma mudança visual na largura padrão).

Conta de admin de teste removida ao final de ambas as verificações.

## 23. Correção — Toggles de Privacidade em Editar Perfil (aluno) (21/08/2026)

Dos 3 toggles em "Editar Perfil" → "Configurações de Privacidade", só "Aparecer no ranking público" era real — "Permitir contato de colegas" e "Compartilhar progresso acadêmico" eram checkboxes puramente decorativos, sem nenhuma coluna no banco nem JS ligado a eles (nenhuma leitura, nenhum salvamento).

- **Migration** `banco_sql/migration_preferencias_contato.sql`: novas colunas `alunos.permitir_contato` (`TINYINT(1) DEFAULT 1`) e `alunos.compartilhar_progresso` (`TINYINT(1) DEFAULT 0`).
- **Backend**: `PUT /alunos/:id` já usava uma whitelist de campos aceitos — só adicionei os dois novos campos nela. `GET /alunos/:id` já faz `SELECT *`, então passou a retornar os campos novos automaticamente, sem precisar mexer.
- **Frontend**: extraída uma função `_wireToggleAluno(elId, campo, aluno, alunoId, defaultQuandoNulo)` reaproveitável (o toggle de ranking já usava esse padrão inline, duplicado três vezes seria feio) — carrega o estado real do banco ao abrir a aba e salva via `PUT` a cada mudança, mesmo padrão pros 3 toggles agora.
- **Testado ao vivo**: cliques reais nos dois toggles antes inertes, confirmados no banco via `curl` a cada mudança; reload completo (sessão nova) confirmou que o estado persiste; valores de teste revertidos ao padrão ao final.

`permitir_contato` é a base pro próximo item (chat, seção 24) — o escopo final ficou diferente do que o nome sugeria: controla o contato **entre alunos** (colegas); professor↔aluno é sempre livre nos dois sentidos, sem toggle.

## 24. Chat — aluno↔aluno e aluno↔professor, criptografado (22/08/2026)

Feature nova, grande: um chat de verdade dentro do Ranking+, com histórico persistente, anexo de PDF temporário e link autolinking, no estilo WhatsApp Web/Instagram DM (mas propositalmente simples). Antes de implementar, alinhei o desenho com o Enzio (decisões abaixo já refletem essa conversa, não achismo):

- **Escopo de quem fala com quem**: qualquer aluno ↔ qualquer professor, sem restrição (confirmado explicitamente). Aluno ↔ aluno respeita `alunos.permitir_contato` — só o **destinatário** precisa ter o contato ligado; quem inicia sempre pode tentar iniciar quantas conversas quiser, a restrição é sobre quem pode ser contatado, não quem contata.
- **Atualização**: polling a cada 4s (não WebSocket) — decisão explícita do Enzio, pra não adicionar Socket.io como dependência nova só pra esse recurso.
- **Anexos**: PDF até 5MB, expira em 7 dias (parâmetros escolhidos pelo Enzio). Link solto no texto não precisa de nada especial — é só detectado e vira clicável.
- **Criptografia em repouso** (pedido explícito, "desde já no projeto"): texto de mensagem e bytes do PDF anexado, os dois com AES-256-GCM via `crypto` nativo do Node — **zero dependência nova**. Chave de 32 bytes gerada uma única vez no primeiro boot do servidor, salva em `Backend/.chat-key` (fora do git — o repo não tinha `.gitignore` nenhum até agora, criado nesta sessão).

### 24.1 Banco de dados — `banco_sql/migration_chat.sql`

Três tabelas novas:
- **`conversas`**: par de participantes genérico (`participanteN_tipo` ENUM 'aluno'/'professor' + `participanteN_id`) — suporta aluno-aluno e aluno-professor na mesma estrutura, sem precisar de tabelas separadas por tipo de par. Par sempre normalizado numa ordem consistente (`_ordenarPar()` no backend) antes de gravar, senão a mesma dupla de pessoas criaria conversas duplicadas dependendo de quem inicia.
- **`mensagens`**: `texto_cifrado`/`iv`/`auth_tag` (nunca o texto puro), `anexo_id` opcional, `lida`.
- **`mensagem_anexos`**: metadado do PDF (nome original, caminho do arquivo cifrado em disco, `iv`/`auth_tag` próprios, `expira_em`, `removido_em`).

### 24.2 Backend — `Backend/crypto-chat.js` (novo) + rotas em `api2.js`

- `crypto-chat.js`: `encryptTexto`/`decryptTexto` (strings) e `encryptBuffer`/`decryptBuffer` (arquivos) — tudo AES-256-GCM, chave carregada uma vez e reaproveitada.
- `multer` **já estava instalado** no projeto (usado pro upload do PDF do LinkedIn) — reaproveitei a mesma lib com uma instância nova limitada a 5MB (`_chatPdfUpload`), em vez de reinventar upload via base64.
- Rotas: `GET /chat/contatos/:tipo/:id` (quem dá pra chamar — separado em professores/colegas pro aluno), `GET /chat/conversas/participante/:tipo/:id` (lista de conversas), `POST /chat/conversas` (cria/obtém, valida permissão), `GET`/`POST /chat/conversas/:conversaId/mensagens`, `PUT .../marcar-lida`, `POST /chat/anexos` + `GET /chat/anexos/:id/download`.
- Permissão validada em **dois pontos**: ao criar a conversa E a cada envio de mensagem — cobre o caso de o aluno desligar `permitir_contato` depois que a conversa já existia (o remetente não consegue mais mandar mensagem nova, mas o histórico continua visível pros dois).
- Limpeza automática de anexo expirado: `setInterval` de 1h, apaga o arquivo físico e marca `removido_em` (mantém metadado — a mensagem mostra "arquivo expirado" em vez de sumir sem explicação).
- **Notificação real** (sino) só do lado do aluno por enquanto — professor ainda não tem essa infraestrutura no projeto (não existe rota `GET /professores/:id/notificacoes` nem UI de sino em `areaprofessor.html`); construir isso do zero seria escopo bem maior que o pedido, então o professor por ora só vê mensagem nova pelo badge de não lidas dentro da própria aba Mensagens.

### 24.3 Frontend — `javascript/chat.js` (novo, compartilhado) + `css/chat.css` (novo, compartilhado)

Um único arquivo de JS/CSS usado nas duas páginas (`areaaluno.html` e `areaprofessor.html`) — detecta sozinho quem está logado (`alunoId`/`professorId` do `localStorage`, mesmo padrão já usado no resto do projeto). Nova aba "Mensagens" na sidebar dos dois, com badge de não lidas.

- Layout dois painéis (lista de conversas + conversa aberta), bolhas de mensagem, seletor de ~30 emojis básicos num popover, campo de anexo (só PDF, valida tamanho no cliente antes de subir), Enter para enviar.
- Links dentro do texto viram clicáveis automaticamente (`_linkify()`, aplicado **depois** de escapar o HTML — nunca antes, senão vira brecha de XSS).
- Modal "Nova conversa" separa Professores de Colegas; colegas com `permitir_contato` desligado aparecem acinzentados com "Contato desativado" e não são clicáveis — dá pra ver que a pessoa existe, só não dá pra iniciar conversa com ela.

### 24.4 Bugs reais encontrados e corrigidos durante o desenvolvimento

1. **Colisão de rota no Express**: `GET /chat/conversas/:tipo/:id` e `GET /chat/conversas/:conversaId/mensagens` têm a mesma quantidade de segmentos de URL (`/chat/conversas/1/mensagens` bate nas duas), e a primeira rota registrada vence — a lista de conversas por participante estava "roubando" as chamadas de listagem de mensagens, retornando `[]` sempre. Corrigido renomeando pra `/chat/conversas/participante/:tipo/:id`, sem ambiguidade nenhuma com a outra rota.
2. **Bug de "zero é falsy" já visto antes nesta sessão** — não se repetiu aqui, mas o padrão de checagem (`Number.isFinite` em vez de `||`) foi aplicado com cuidado nos pontos onde `id`s podiam ser `0`.

### 24.5 Testado ao vivo (aluno real ↔ professor real, duas abas)

- **Criptografia**: confirmado por inspeção direta do banco que `texto_cifrado` é ilegível (bytes aleatórios em hex), e do arquivo `.enc` em disco que o conteúdo do PDF também é ilegível — só decifra corretamente na hora de servir pra quem tem permissão.
- **Fluxo completo**: aluno inicia conversa com professor pelo modal → envia mensagem com emoji real (clicado no picker) → professor recebe (confirmado a lista e o conteúdo via inspeção do DOM) → professor responde → **aluno recebe a resposta sozinho, via polling, sem recarregar a página** (esperei o ciclo de 4s rodar de verdade).
- **Anexo**: upload de PDF real via input de arquivo (não simulado), aparece como bloco clicável na bolha, download decifra e bate 100% (`diff` bytea-a-byte) com o arquivo original.
- **Link**: mensagem com URL solta no texto virou `<a>` clicável automaticamente.
- **Bloqueio aluno↔aluno**: desliguei `permitir_contato` de um aluno de teste — ele aparece acinzentado e não-clicável no modal "Nova conversa" de outro aluno; tentativa direta via API retorna 403 com mensagem clara.
- **Falso alarme investigado a fundo**: um teste inicial mostrou o nome errado na lista de conversas do professor ("Roberto Campos" em vez de "Felipe Rocha") — parecia bug real, mas era o `localStorage` compartilhado entre as duas abas de teste (mesma origem `localhost:4000`) com um `alunoId` residual de um teste anterior fazendo o `chat.js` da aba do professor se identificar como aluno. Confirmado via `curl` direto na API (que sempre respondeu certo) que o backend nunca teve esse bug — só o setup do teste.
- Emoji sobrevive ao ciclo completo de criptografia (confirmado com 😊🎉👍 iguais na saída) — outro "bug" que na real era só o `curl`/bash do Windows corrompendo emoji como argumento de linha de comando, não um problema no código.
- Sem erros de console em nenhuma das duas sessões. Todo dado de teste (mensagens, conversas, anexo em disco, toggles dos alunos de teste) removido/revertido ao final.

## 25. Portal de Talentos — Notas privadas por favorito (22/08/2026)

Primeira de 8 melhorias novas propostas pro Portal de Talentos (levantamento feito sob pedido do Enzio, ver nota do vault) — implementadas uma por vez, cada uma testada e validada antes da próxima. Esta é a #1: **notas privadas por candidato favoritado**.

### 25.1 Problema

`empresa_favoritos` já tinha `status` (seção 19.7d), mas nenhum campo de texto livre. O recrutador não tinha onde anotar algo tipo "entrevistei, bom em Python mas fraco em SQL" sobre um candidato específico.

### 25.2 Implementação

- **Migration** `banco_sql/migration_notas_favorito.sql`: `ALTER TABLE empresa_favoritos ADD COLUMN notas TEXT NULL AFTER status;`.
- **Backend**: `GET /empresas/:id/favoritos` passou a incluir `f.notas` no SELECT; nova rota `PUT /empresas/:id/favoritos/:alunoId/notas`, valida que `notas` é string e não passa de 2000 caracteres (400 se inválido, 404 se o favorito não existir).
- **Frontend** (`javascript/talentos.js`): novo `_favoritosNotasMap` (aluno_id → notas), populado junto com `_favoritosStatusMap` em `_carregarFavoritos()`. No drawer, logo abaixo do `<select>` de status já existente, um `<textarea rows="3">` com as anotações — salva no `onblur` (perder o foco), não a cada tecla, evitando um PUT por caractere digitado. Pequeno indicador "Salvo ✓" aparece por 1.5s após confirmar o salvamento. Campo escapado manualmente (`_escTextarea`, função nova — o arquivo não tinha nenhuma função de escape genérica antes) antes de interpolar no HTML, evitando XSS via anotação.
- Mesmo padrão do status: só aparece quando o candidato já é favorito, some/reaparece junto ao favoritar/desfavoritar (reaproveita o mesmo `toggleFavorito()` que já reconstruía esse bloco).

### 25.3 Testado ao vivo

Via `curl`: favoritei um aluno de teste, salvei uma nota via `PUT`, confirmei com `SELECT` direto no banco; testei a validação de 2000 caracteres (rejeitada com 400, como esperado).

Via navegador (automação, empresa "Tech Solutions" logada por `sessionStorage`): abri o drawer de um candidato real, favoritei, digitei uma nota real no textarea, tirei o foco (evento `blur` real) e confirmei — via `SELECT` direto no banco, não só visual — que salvou; indicador "Salvo ✓" apareceu e sumiu sozinho depois de ~1.5s; **reload completo da página (sessão nova)** confirmou que a nota persiste e vem pré-preenchida no textarea; desfavoritar o candidato fez o bloco de notas (e o de status) sumirem juntos, e o `_favoritosNotasMap` foi limpo corretamente. Sem erros de console. Dado de teste removido do banco ao final (`empresa_favoritos` de volta a 0 linhas).

## 26. Portal de Talentos — Painel de Favoritos em Kanban (22/08/2026)

Segunda sugestão da lista de melhorias do Portal de Talentos. Implementado em paralelo à seção 25 (fork separado, mesma sessão) — **sem tocar em `Backend/api2.js`**, só frontend, reaproveitando as rotas de status/favoritos que já existiam (incluindo `notas`, que a seção 25 acabou de adicionar).

### 26.1 Motivação

O status de acompanhamento (Novo/Contatado/Entrevista marcada/Em processo/Descartado) só existia dentro do drawer individual de cada candidato — a empresa não tinha uma visão de conjunto do funil inteiro dos favoritos.

### 26.2 Implementação

- **Sem migration nova** — reaproveita `empresa_favoritos.status` (seção 19.7d) e o `GET /empresas/:id/favoritos` já existente (que já retorna `nome`, `curso`, `semestre`, `status`, `notas`).
- **`html/talentos.html`**: novo modal `#modalKanbanFavoritos` (`modal-xl`, mesmo padrão do `#modalComparacao`), botão de gatilho "Meus Favoritos" na navbar (visível só com `#navLogado`, empresa logada). CSS do quadro (`.kanban-board`/`.kanban-col`/`.kanban-card`/`.kanban-count`) reaproveita **exatamente a mesma estrutura** do quadro de chamados do Painel Admin (`css/admin.css`, construído numa sessão anterior), adaptada pro tema claro de talentos.html em vez do tema escuro do admin — 5 colunas (uma por status) em vez de 3, cor de destaque por coluna diferente pra cada status.
- **`javascript/talentos.js`**: `abrirKanbanFavoritos()` (busca a lista atual de favoritos e abre o modal), `_renderKanbanFavoritos()` (agrupa por status, monta as 5 colunas), `_kanbanCardHtml()` (card com nome/curso/semestre + botões de avançar/voltar), `moverFavoritoKanban(alunoId, novoStatus)` (atualização otimista — move na tela na hora, reverte sozinho se o `PUT` falhar; mantém `_favoritosStatusMap` em sincronia, então o drawer reflete o status certo se aberto a partir de um card do quadro). Clicar num card fecha o modal e abre o drawer completo do candidato via `abrirPerfilAluno()` (função já existente, reaproveitada sem mudança).
- Movimentação por setas (sem drag-and-drop), mesma decisão de UX já tomada pro Kanban do admin — mais simples e acessível.

### 26.3 Testado ao vivo

Criados 3 favoritos de teste via `curl` com status diferentes (Novo/Contatado/Entrevista marcada). No navegador: quadro abriu com os 3 candidatos nas colunas certas, contadores corretos; cliquei de verdade na seta de avançar de um card — confirmado por `curl`+`SELECT` direto no banco que o status mudou (`novo` → `contatado`); tela atualizou mostrando o card na coluna nova e o contador ajustado; cliquei no card pra abrir o drawer — abriu o candidato certo, com o `<select>` de status do drawer já mostrando "Contatado" (confirma a sincronização entre o Kanban e o resto da página). Sem erros de console. Os 3 favoritos de teste removidos do banco ao final.

## 27. Portal de Talentos — Exportar Favoritos com Status e Notas (CSV) (22/08/2026)

Sugestão #3 do pacote de melhorias do Portal de Talentos: exportar o shortlist de favoritos (não a busca geral) incluindo status de acompanhamento e notas privadas — hoje o botão "Exportar CSV" já existente só exporta os candidatos da busca/filtro atual (Nome/Curso/Semestre/CRA/GitHub/LinkedIn), sem essas duas colunas, que só fazem sentido no contexto de favoritos.

- **Sem migration nova** — reaproveita `GET /empresas/:id/favoritos` (já retorna `status` e `notas`, essa última column adicionada na seção 25 por outro fork em paralelo).
- **`html/talentos.html`**: novo botão "Exportar Favoritos (CSV)" dentro do mesmo wrapper `#filtSoFavoritosWrap` que já contém o checkbox "Somente favoritos" na sidebar — herda a mesma visibilidade condicional (só aparece com empresa logada) sem precisar de JS novo pra isso. O `<div>` do wrapper foi levemente reestruturado (checkbox agora dentro de um `form-check` aninhado) só pra caber o botão embaixo, sem alterar o comportamento do checkbox.
- **`javascript/talentos.js`**: `exportarFavoritosCSV()` busca os favoritos frescos via `GET`, monta as colunas Nome/Curso/Semestre/Status (label em português via `STATUS_FAVORITO_LABELS` já existente)/Notas/Favoritado em, gera o CSV **reaproveitando exatamente o padrão já usado** por `_exportarTalentosCsv()` (aspas duplas escapadas, separador `,`, BOM UTF-8, `Blob` + link de download) — não inventou um formato novo. Avisa com `alert()` se a empresa não tiver nenhum favorito, sem gerar CSV vazio.
- **Testado ao vivo**: 2 favoritos de teste com status e notas diferentes (uma delas com aspas duplas e acentuação, de propósito, pra testar o escape). Inspecionei a string do CSV gerado diretamente (não só cliquei sem olhar) — aspas internas escapadas corretamente (`""Muito proativo""`), acentuação correta, status traduzido pro rótulo em português. Clique real no botão confirmado sem erro. Aviso de "sem favoritos" testado chamando a função com uma empresa sem nenhum favorito. Sem erros de console.
- **Nota**: um teste inicial mostrou acentuação corrompida nas notas — não era bug do código, era o `curl` do bash do Windows corrompendo caracteres acentuados passados como argumento de linha de comando (mesmo problema já visto nesta sessão com emoji no chat). Confirmado reinserindo a nota via um cliente HTTP Node puro (bypassando o bash) — o CSV gerado a partir desse dado limpo veio perfeito.
- Todos os favoritos de teste removidos do banco ao final.

## 28. Portal de Talentos — Múltiplas Vagas Reais (22/08/2026)

Sugestão #4 do pacote de melhorias do Portal de Talentos: hoje `empresa_interesses` é uma única linha por empresa (um "perfil do que eu busco" — área de foco, tipo de vaga, curso preferido, semestre mínimo), usada na UI "Interesses de Perfil" e como fonte do badge "Novo pra você". Uma empresa recrutando pra 2 áreas ao mesmo tempo (ex: "Estágio em Dados" e "Trainee em Backend") não conseguia representar isso — só tinha 1 perfil de busca.

**Decisão de escopo, seguida à risca**: aditivo, não substitui nada. `empresa_interesses` e o badge "Novo pra você" continuam exatamente como estavam antes, intocados — confirmado por teste de regressão explícito (ver abaixo). "Vagas" é um conceito novo e separado — uma lista real de itens que a empresa cadastra, edita e fecha. Não houve tentativa de unificar os dois conceitos (isso exigiria alinhar com o Enzio antes, é decisão de produto, não técnica).

- **Migration** `banco_sql/migration_empresa_vagas.sql`: tabela `empresa_vagas` — `titulo` (obrigatório), `descricao`, `area_foco_id`/`tipo_vaga_id` (FK pras mesmas tabelas de domínio já usadas em `empresa_interesses` — `dom_areas_foco`/`dom_tipos_vaga`, sem taxonomia nova), `curso_preferido`, `semestre_minimo`, `status` (`aberta`/`fechada`, default `aberta`), `criado_em`/`atualizado_em`.
- **Backend** (`Backend/api2.js`, inserido logo após as rotas de `/empresas/:id/interesses` já existentes, mesmo estilo): `GET/POST/PUT /empresas/:id/vagas[/:vagaId]`. Sem rota `DELETE` de verdade — fechar a vaga é um `PUT` com `status: 'fechada'`, decisão consciente pra preservar o histórico de vagas já publicadas em vez de apagar.
- **Frontend**: botão "Minhas Vagas" na navbar (ao lado de "Meus Favoritos", mesma condição de visibilidade só-empresa-logada), modal listando as vagas (badge verde/cinza por status, editar/fechar) com formulário de criar/editar reaproveitando os mesmos `<select>` de Área de Foco/Tipo de Vaga já populados pelo formulário de Interesses (clona as `<option>` já carregadas em vez de buscar de novo).
- **Bug pego antes de testar**: usei `_esc()` pra escapar HTML no template do card de vaga, mas essa função não existe em `talentos.js` — só `_escTextarea()` (adicionada pelo fork da seção 25). Corrigido antes de qualquer teste ao vivo, sem chegar a rodar com o bug.
- **Testado ao vivo, incluindo teste de regressão explícito**: criei uma vaga real pelo formulário (clique real no "Salvar"), confirmei no banco via `curl`/API (não só visual, acentuação incluída); editei o título via clique real, confirmei que foi `PUT` no mesmo `id` (não criou linha nova); fechei a vaga via clique real no botão, confirmei `status='fechada'` no banco. **Regressão**: abri "Interesses de Perfil" (formulário antigo, intocado) e salvei normalmente — confirmado no banco que continua funcionando exatamente como antes, nenhuma mudança de comportamento. Sem erros de console.
- Vagas e interesses de teste removidos do banco ao final.

## 29. Portal de Talentos — Filtro por Menção Específica (22/08/2026)

Sugestão #5 do pacote de melhorias do Portal de Talentos: a busca por habilidade (`/talentos/buscar?habilidade=`) já casava nome de disciplina cursada e exigia média > 8.5 nela, mas não deixava o recrutador exigir uma menção específica (SS, por exemplo) — só sabia que o aluno "cursou bem" a disciplina, não com qual menção exata.

**Backend** (`Backend/api2.js`, rota `GET /talentos/buscar`): novo parâmetro opcional `mencao` (valor único ou lista separada por vírgula, mesmo padrão de `habilidade`). Só é aplicado quando `habilidade` também está presente — filtra as **linhas de `boletim`** (não a média agregada) pra exigir que a menção pedida bata numa das disciplinas que casaram a busca, antes do agrupamento. Isso é diferente (e mais correto) do que filtrar pela média geral do aluno na disciplina: um aluno que tirou SS num semestre e MI em outro na mesma disciplina (retomada) passa a aparecer com `mencao=SS` mesmo que sua média combinada não bata o limiar de 8.5 do filtro de habilidade original — o filtro de menção reavalia com base só nas linhas que batem a menção pedida, não dilui com as outras.

**Frontend** (`html/talentos.html` + `javascript/talentos.js`): novo `<select>` "Menção na disciplina buscada" (Qualquer/SS/SS ou MS) na sidebar, ao lado de "CRA mínimo". Fica desabilitado (com texto de ajuda explicando por quê) enquanto não houver nenhuma habilidade buscada — habilita/desabilita automaticamente em `renderSearchChips()`, then re-testado toda vez que um chip é adicionado ou removido. Persistido em `localStorage` junto com o resto do filtro (`talentos_ultimo_filtro`), mesmo padrão já existente.

**Testado ao vivo com caso real do banco** (não dado fabricado): "Felipe Rocha" tem 3 lançamentos de "Algoritmos e Estruturas de Dados" em semestres diferentes (MI, MS, SS — provavelmente disciplina cursada mais de uma vez) — sem filtro de menção ele nem aparecia na busca (média combinada não batia 8.5); com `mencao=SS`, passou a aparecer corretamente. "Daniel Santos" tem MI/MM/MS na mesma disciplina, nunca SS — confirmado que **nunca** aparece com `mencao=SS`, em nenhum teste. Testado via `curl` isolado (resultado exato conferido linha a linha) e depois via clique real no navegador ("Aplicar Filtros" de verdade, não só chamada de função) — mesma lista de nomes nos dois casos. Reload completo (sessão nova) confirmou que o filtro salvo restaura certo, incluindo o select ficando habilitado de novo. "Limpar Filtros" testado, reseta e desabilita o select corretamente. Sem erros de console.

## 30. Portal de Talentos — Match Score (%) por Aderência aos Interesses (22/08/2026)

Sugestão #6 do pacote de melhorias: o badge "Novo pra você" é binário — aparece ou não — e só sinaliza candidatos ainda não vistos. Faltava algo que ordenasse/sinalizasse **todo mundo** por aderência real ao que a empresa busca, não só os "novos".

**Decisão de escopo, seguida à risca**: 100% aditivo. O badge "Novo pra você" e sua lógica (`bateInteresse`, `_visualizadosIds`) continuam exatamente como estavam, intocados — confirmado por teste ao vivo (contagem de badges antes/depois idêntica). Match score é um elemento novo e separado.

- **Sem mudança nenhuma no backend** — decisão consciente. Os únicos dois campos necessários pro cálculo (`curso`, `semestre` do candidato) já vêm em `GET /talentos/buscar`; os critérios da empresa (`curso_preferido`, `semestre_minimo`) já vêm em `_empresaLogada.interesses[0]`, carregado no login. Cálculo 100% client-side. Isso também eliminou qualquer risco de colisão com o fork irmão da sugestão #5 (seção anterior), que estava mexendo na mesma rota `/talentos/buscar` ao mesmo tempo.
- **Fórmula** (`_calcularMatchScore()`, `javascript/talentos.js`): heurística simples e transparente, pesos iguais (50% curso preferido bate + 50% semestre do aluno ≥ semestre mínimo pedido) — documentada em comentário no código. Não é nenhum algoritmo de ranqueamento sofisticado, é uma régua declarada e auditável, com a mesma regra de "critério não preenchido pela empresa conta como batendo" que o badge "Novo pra você" já usa (`bateInteresse`) — consistência proposital entre os dois.
- **UI**: chip "NN% match" nos cards (grid e lista), cor por faixa (`bg-success-subtle` ≥70%, `bg-warning-subtle` 40-69%, `bg-secondary-subtle` <40% — utilitários "subtle" do Bootstrap 5.3, sem CSS novo), só visível com empresa logada **e** interesse cadastrado. Nova opção "Melhor match" no `<select>` de ordenação, escondida via atributo `hidden` no `<option>` quando não há interesse — reavaliada em `_atualizarNavEmpresa()` (mesmo hook que já atualiza outros elementos condicionais à sessão da empresa), inclusive resetando a ordenação pra CRA se o usuário estava ordenando por match e o interesse for removido.

**Testado ao vivo com dados reais**: cadastrei um interesse de teste (Ciência da Computação, 5º semestre+) pra empresa "Tech Solutions". Confirmado visualmente: aluno de CC no 3º semestre → 50% match (amarelo, só o curso bate); aluno de CC no 7º semestre → 100% match (verde, os dois critérios batem). Ordenação "Melhor match" testada via evento `change` real no `<select>` — os 100% vieram todos antes dos 50%, confirmado inspecionando a ordem real do DOM. Logout testado: opção "Melhor match" volta a ficar escondida e nenhum badge de match aparece — zero vazamento de UI de empresa pra visitante anônimo. Badge "Novo pra você" contado antes/depois, inalterado (3 badges nos dois momentos). Sem erros de console. Interesse de teste removido do banco ao final (empresa 1 voltou a 0 interesses, estado original).

Feature é só de leitura — não criou nem alterou nenhum dado, não houve nada pra limpar no banco ao final.

## 31. Portal de Talentos — Registro de Entrevista de Verdade (22/08/2026)

Sugestão #7 do pacote de melhorias: `empresa_favoritos.status` já suportava `'entrevista_marcada'`, mas era só um rótulo — sem data/hora nem observação estruturada por trás.

- **Migration** `banco_sql/migration_entrevista_favorito.sql`: `entrevista_data_hora` (`DATETIME NULL`) e `entrevista_observacao` (`TEXT NULL`) em `empresa_favoritos`, mesmo padrão da coluna `notas` (feita numa etapa anterior deste mesmo pacote).
- **Backend**: `GET /empresas/:id/favoritos` passou a incluir os dois campos no SELECT; nova rota `PUT /empresas/:id/favoritos/:alunoId/entrevista` (body `{ data_hora, observacao }`, aceita `null` pra desmarcar sem precisar trocar o status).
- **Frontend** — dois lugares:
  - **Drawer**: `_statusFavoritoWrapHtml()` ganhou um bloco condicional (`entrevistaFieldsWrap`) — só visível quando o status selecionado é "Entrevista marcada" — com `<input type="datetime-local">` e um `<textarea>` de observação, salvando ao `change`/`onblur` (mesmo padrão de "Anotações privadas" já existente). Trocar de volta pro status para outro **esconde** os campos mas **não apaga** o dado salvo — confirmado via teste que o valor sobrevive no banco mesmo com o campo fora da tela.
  - **Kanban de favoritos** (feito numa etapa anterior deste pacote): card da coluna "Entrevista marcada" mostra "📅 dd/mm às hh:mm" quando há data marcada, ou "sem data marcada" em itálico quando não há.
  - **Cuidado de fuso horário**: a API devolve a data em ISO com `Z` (UTC); o `<input type="datetime-local">` não trabalha com timezone. Escrito um helper `_isoParaDatetimeLocal()` que usa os getters **locais** do `Date` (não os UTC) pra reconstruir exatamente o horário que a empresa digitou — testado explicitamente: digitei 15:30, o banco guardou `15:30:00` (sem deslocamento), reload completo trouxe `15:30` de volta no campo, e o Kanban mostrou `15:30` também. Sem esse cuidado, o exemplo teria mostrado 18:30 (UTC-3 de diferença) depois de qualquer reload.
- **Testado ao vivo**: favoritei 2 alunos de teste reais, marquei "Entrevista marcada" nos dois, preenchi data/hora e observação por interação real (`change`/`blur` de verdade, não só chamada de API), confirmei tudo no banco via `SELECT`. Reload completo (sessão nova) confirmou os campos vindo pré-preenchidos com a hora certa. Troquei o status de um deles pra "Contatado" e confirmei que os campos escondem na tela mas o dado permanece no banco. Abri o Kanban e confirmei as duas datas aparecendo certas na coluna "Entrevista marcada". Sem erros de console. `empresa_favoritos` de teste removidos ao final (voltou a 0 linhas).

Com isso, as 7 primeiras sugestões do pacote de melhorias do Portal de Talentos estão implementadas e testadas — falta só a #8 (mini-dashboard do funil).

## 32. Portal de Talentos — Mini-Dashboard do Funil de Recrutamento (22/08/2026)

Sugestão #8, a última do pacote: a empresa favorita candidatos e vai mudando o status deles, mas não tinha nenhuma visão agregada de quantos estão em cada estágio.

- **Sem migration, sem rota nova** — 100% client-side, reaproveitando `GET /empresas/:id/favoritos` (já retorna `status` de cada favorito). Feito assim de propósito: outro fork estava editando `Backend/api2.js` em paralelo na hora (sugestão #7), então evitar o backend eliminou o risco de colisão.
- **UI**: botão "Análise de Recrutamento" na navbar da empresa, ao lado de "Meus Favoritos"/"Minhas Vagas". Modal separado (`#modalFunilFavoritos`) — não reaproveita o Kanban existente, também por causa da concorrência com o fork da #7 que estava mexendo nos cards do Kanban.
- **Conteúdo**: total de favoritos; barra de progresso (CSS puro, sem lib de gráfico nova — Frappe Charts não está carregado em `talentos.html`) por status, proporcional ao total, cores reaproveitando o mesmo mapa de cores do Bootstrap (`secondary`/`info`/`warning`/`primary`/`danger`); taxas de conversão sequenciais (Novo → Contatado → Entrevista marcada → Em processo — "Descartado" fica de fora do funil sequencial, é tratado como saída, não como avanço).
- **Estado vazio**: se a empresa não tiver nenhum favorito, mostra uma mensagem clara em vez de gráfico zerado.

**Testado ao vivo**: distribuí 6 favoritos de teste reais com status diferentes via `curl` (2 novo, 2 contatado, 1 entrevista marcada, 1 descartado) e conferi a matemática esperada antes de abrir a tela — a UI bateu **exatamente**: 33%/33%/17%/0%/17% nas barras, e nas taxas de conversão "50% dos contatados chegaram a entrevista" (1 de 2, contas batendo). Testado o estado vazio removendo todos os favoritos de teste. Sem erros de console. `empresa_favoritos` de teste removidos ao final (0 linhas).

## 33. Resumo Consolidado — Pacote de 8 Melhorias do Portal de Talentos (22/08/2026)

As seções 25-32 documentam cada melhoria individualmente, com todo o detalhamento técnico. Esta seção existe só pra dar uma visão de conjunto num único lugar — o levantamento de sugestões foi feito a pedido do Enzio ("o que mais dá pra integrar no portal de talentos"), ele gostou das 8 e pediu implementação de todas, uma por vez, cada uma testada antes da próxima. Todas as 8 foram implementadas via forks paralelos/sequenciais na mesma sessão, cada uma isolada em escopo pra evitar quebrar as outras, com o cuidado extra de religar arquivos antes de editar quando havia edição concorrente (aconteceu algumas vezes, sempre resolvido sem perda de trabalho).

| # | Melhoria | Banco | Backend | Onde fica na tela | Seção |
|---|---|---|---|---|---|
| 1 | Notas privadas por favorito | +coluna `notas` | `PUT .../notas` | Textarea no drawer do candidato | [25](#25-portal-de-talentos--notas-privadas-por-favorito-22082026) |
| 2 | Painel de favoritos em Kanban | — (reaproveita) | — (reaproveita) | Modal "Meus Favoritos" (navbar) | [26](#26-portal-de-talentos--painel-de-favoritos-em-kanban-22082026) |
| 3 | Exportar shortlist com status/notas | — (reaproveita) | — (reaproveita) | Botão junto do filtro "Somente favoritos" | [27](#27-portal-de-talentos--exportar-favoritos-com-status-e-notas-csv-22082026) |
| 4 | Múltiplas vagas reais | +tabela `empresa_vagas` | `GET/POST/PUT .../vagas` | Modal "Minhas Vagas" (navbar) | [28](#28-portal-de-talentos--múltiplas-vagas-reais-22082026) |
| 5 | Filtro por menção específica | — (leitura) | +parâmetro `mencao` em `/talentos/buscar` | Select na sidebar de filtros | [29](#29-portal-de-talentos--filtro-por-menção-específica-22082026) |
| 6 | Match score (%) por aderência | — (leitura) | — (100% client-side) | Chip nos cards + opção de ordenação | [30](#30-portal-de-talentos--match-score--por-aderência-aos-interesses-22082026) |
| 7 | Registro de entrevista de verdade | +colunas `entrevista_data_hora`/`entrevista_observacao` | `PUT .../entrevista` | Campos no drawer (só quando "Entrevista marcada") + card do Kanban | [31](#31-portal-de-talentos--registro-de-entrevista-de-verdade-22082026) |
| 8 | Mini-dashboard do funil | — (leitura) | — (100% client-side) | Modal "Análise de Recrutamento" (navbar) | [32](#32-portal-de-talentos--mini-dashboard-do-funil-de-recrutamento-22082026) |

**Migrations novas aplicadas nesta leva** (todas em `banco_sql/`, todas idempotentes/aditivas, nenhuma quebra dado existente):
`migration_notas_favorito.sql` · `migration_empresa_vagas.sql` · `migration_entrevista_favorito.sql`

**Decisões de escopo que se repetiram em várias delas** (não foi coincidência, foi instrução explícita em cada fork):
- **Aditivo, nunca substitutivo** — `empresa_interesses` e o badge "Novo pra você" (itens #4 e #6 encostavam conceitualmente neles) continuam funcionando exatamente como antes; testado com regressão explícita nos dois casos.
- **Preferência por client-side quando os dados já estavam disponíveis** (#3, #6, #8) — reduz tanto risco de colisão entre forks concorrentes editando `Backend/api2.js` quanto superfície de rota nova pra manter.
- **Reaproveitamento visual** — nenhuma das 8 introduziu um padrão de UI novo do zero; todas reaproveitaram algo já existente na página ou (no caso do Kanban) uma tela já validada em outra sessão (Painel Admin).

**Bugs reais pegos e corrigidos durante a implementação** (vale registrar porque não eram do escopo pedido, foram achados no processo):
- Fuso horário no campo de entrevista (`datetime-local` é naive, API devolve UTC) — corrigido com getters locais do `Date`, testado explicitamente pra não deslocar 3h a cada reload (seção 31).
- Referência a uma função de escape (`_esc()`) que não existia no arquivo — pega antes de qualquer teste ao vivo rodar (seção 28).
- Falsos alarmes descartados depois de investigação (não eram bugs de código, eram artefatos do ambiente de teste): acentuação corrompida via `curl` no bash do Windows (seção 27, mesmo padrão já visto antes nesta sessão com emoji no chat).

**Estado final**: as 8 sugestões estão implementadas, testadas ao vivo (nunca só "parece que funciona" — sempre com `SELECT` no banco, inspeção de DOM, ou conteúdo real de arquivo gerado como evidência) e documentadas. Nenhum dado de teste ficou para trás em nenhuma delas.

## 34. Ajustes pós-entrega no Portal de Talentos (22/08/2026)

Três pedidos pontuais depois do pacote de 8 melhorias.

### 34.1 Currículo ATS no PDF de comparação

O comparativo de candidatos (`exportarComparacaoPDF()`) já exportava um relatório acadêmico por candidato — faltava o currículo ATS, que já existia na exportação individual do drawer. Extraída a lógica de renderização do currículo (antes inline em `exportarPerfilCompletoPDF`) pra uma função reaproveitável `_renderCurriculoAtsNaPagina()` + um `_temCurriculoAts()` que checa se há algo preenchido — evita gerar página em branco pra quem não tem Perfil Profissional preenchido. Cada candidato com currículo ganha uma página extra em retrato (o comparativo em si é paisagem), logo após as colunas de comparação.

Testado ao vivo: comparei 2 candidatos, um com Perfil Profissional bem preenchido (8 experiências, 3 formações, 1 certificação, 1 idioma) e outro sem nenhum registro — o PDF gerado teve 4 páginas (1 de comparação + 3 do currículo extenso, que estourou uma página só) e nenhuma página extra pro candidato sem perfil, confirmado por instrumentação do construtor `jsPDF` (mesma técnica já usada nesta sessão pra verificar `pdf.save()` sem baixar o arquivo de fato).

### 34.2 Botão "Sair" pro aluno/professor no Portal de Talentos

`talentos.html` é aberto a partir da área do aluno/professor (`target="_blank"`), mas quando logado nesse contexto não tinha nenhum jeito de encerrar a sessão ali — só "Início", que não limpa o `localStorage`. Adicionado botão "Sair" ao lado do nome/badge de tipo, reaproveitando exatamente o padrão já usado pelo botão "Sair" da empresa (`logoutEmpresa()`), mas limpando `localStorage` inteiro e redirecionando pra `index.html` (mesmo comportamento do `confirmLogout()` já usado em `areaaluno.html`/`areaprofessor.html`).

Testado ao vivo: sessão de aluno simulada, botão visível, clique real confirmado limpando `alunoId`/`unirank_user` do `localStorage` e redirecionando pra `index.html`.

### 34.3 Reorganização da navbar da empresa

Depois do pacote de 8 melhorias, a navbar da empresa logada acumulou 9 elementos soltos numa única barra (nome, sino, Já Visualizados, Meus Favoritos, Minhas Vagas, Análise de Recrutamento, Interesses de Perfil, Sair, Início) — quebrava linha e ficou visualmente poluída, mesmo com todas as funções individualmente corretas.

Agrupados os 4 itens de gestão/analytics (Meus Favoritos, Minhas Vagas, Análise de Recrutamento, Já Visualizados) num dropdown único "Ferramentas" (mesmo padrão Bootstrap já usado pro dropdown de notificações). Mantidos visíveis, sem agrupar: nome da empresa, sino, "Interesses de Perfil" (ação mais central/frequente, mantida em destaque com a cor de aviso que já tinha) e "Sair". Navbar caiu de 9 pra 5 elementos, cabendo numa linha só em qualquer resolução testada.

Testado ao vivo: dropdown abre corretamente, os 4 itens dentro dele abrem seus modais/telas de verdade (confirmado individualmente, não só visual — cada modal checado via `classList.contains('show')` depois de clique real disparado no elemento). Sem erros de console.

**Com isso, as 8 sugestões do pacote de melhorias do Portal de Talentos estão implementadas e testadas.**

## 35. Perfil do Professor — Dados Reais, Funções Quebradas e Hover Desnecessário (22/08/2026)

Reclamação do usuário sobre a aba Perfil (`#settings-tab`) em `areaprofessor.html`: "está desigual, feio, travado e a animação de movimento está desnecessária pois não tem função ao clicar, talvez só uma cor melhor", além de pedir validação geral de quais funções ali estavam quebradas.

### 35.1 Causa real do "desigual"

Não é bug de CSS — é desbalanceamento de conteúdo. A coluna esquerda tem um único card "Dados Pessoais" alto (6 campos); a coluna direita empilha dois cards menores ("Segurança", com só 2 campos de senha, e "Preferências" logo abaixo), criando um degrau visível entre as colunas. Decisão: não redistribuir os cards agora — o pedido explícito era a animação de hover e as funções quebradas, e o desnível não chega a ficar grosseiro (diferença de ~40px nos botões finais, medida ao vivo). Fica registrado como causa raiz confirmada, não corrigida nesta sessão.

### 35.2 Hover sem função nos cards de configuração

`.custom-card:hover` e `.stats-card:hover` (definidos globalmente em `styleareaprofessor.css`, usados também no Dashboard e outras abas onde os cards *são* clicáveis) aplicavam `translateY()` também nos cards do Perfil, que não têm nenhuma ação ao clicar — sinal falso de interatividade. Corrigido com override **escopado** a `#settings-tab` (especificidade por ID, sem precisar de `!important`), logo após as regras originais, que ficaram intocadas:

```css
#settings-tab .custom-card:hover { transform: none; border-color: var(--primary-orange); box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
#settings-tab .stats-card:hover { transform: none; background-color: var(--light-orange, #fff3e0); }
```

Verificado via inspeção direta do CSSOM (`document.styleSheets`), não só visual: a regra escopada existe com o texto esperado e a regra original `.custom-card:hover { transform: translateY(-5px); ... }` permanece exatamente igual — zero risco de regressão nas outras abas.

### 35.3 Funções que só fingiam funcionar

Telefone, Titulação e Área de Atuação não existiam no banco; "Salvar Dados", "Alterar Senha" e "Salvar Preferências" eram só `alert()` decorativos que não persistiam nada (o caso de Preferências era o mais grave: dizia "Preferências salvas!" sem salvar de fato).

- **Migração** `banco_sql/migration_perfil_professor.sql`: 8 colunas novas em `professores` (`telefone`, `titulacao`, `area_atuacao`, `idioma_preferido` default `'pt-BR'`, `notif_notas`/`notif_faltas`/`notif_eventos` default `1`, `notif_ranking` default `0`) — defaults escolhidos pra bater exatamente com o estado que os checkboxes já tinham hardcoded no HTML, então nenhum professor existente muda de comportamento sem tocar na tela.
- **Backend** (`Backend/api2.js`), 3 rotas novas seguindo o mesmo padrão dinâmico `allowed`/`sets`/`vals` já usado no resto do arquivo: `PUT /professores/:id` (dados pessoais, campus propositalmente fora), `PUT /professores/:id/senha` (valida mínimo de 6 caracteres no servidor, senha em texto puro — mesma convenção já usada em todo o projeto pra admin/empresa/aluno), `PUT /professores/:id/preferencias` (idioma + 4 notificações).
- **Frontend** (`javascript/areaprofessor.js`): carregamento dos novos campos reaproveitando o `GET /professores/:id` que já existia (sem fetch extra); `_feedbackInline()` — mesmo padrão do "Salvo ✓" já usado no Portal de Talentos, sem `alert()`; três funções reais (`salvarDadosProfessor`, `alterarSenhaProfessor`, `salvarPreferenciasProfessor`) com botão desabilitado durante o salvamento e feedback não-bloqueante com auto-esconder em 2s.

**Testado ao vivo (professor de teste id=6, criado e depois removido do banco):**
- Dados Pessoais: campo Área de Atuação alterado de "Ciencia da Computacao" pra "Engenharia de Software" via clique real no botão → feedback "Salvo ✓" exibido e escondido sozinho após 2s → confirmado no banco (`SELECT`, não só visual) com o valor novo persistido.
- Alterar Senha: senhas diferentes primeiro → erro "As senhas não coincidem." exibido sem chamar o servidor; depois senhas iguais e válidas → "Senha alterada ✓", campos limpos, e valor novo confirmado direto na coluna `senha` do banco.
- Preferências: idioma trocado pra `en-US` e os 4 switches de notificação invertidos, clique real em "Salvar Preferências" → "Salvo ✓" → confirmado no banco que os 5 valores bateram exatamente com o que foi marcado na tela.
- Reload completo da página (sessão nova) com os mesmos dados no banco → todos os campos (telefone, titulação, área de atuação, idioma, 4 checkboxes) vieram pré-preenchidos corretamente a partir do banco, provando o ciclo completo salvar→persistir→recarregar.
- Console do navegador sem erros da aplicação (únicas mensagens encontradas são ruído genérico de extensão de navegador, não relacionado ao código do projeto).

**Arquivos alterados:** `banco_sql/migration_perfil_professor.sql` (novo), `Backend/api2.js`, `javascript/areaprofessor.js`, `html/areaprofessor.html`, `css/styleareaprofessor.css`.

## 36. Perfil do Professor — Reequilíbrio de Layout e Hover Generalizado (22/08/2026)

Continuação da seção 35, mesmo dia: o Enzio pediu pra reequilibrar o layout desigual do Perfil (não mexido na seção anterior, ficou fora do escopo dela de propósito) e corrigir o hover saltitante em **toda** a área do professor, não só no Perfil — sugeriu uma animação mais simples, "talvez só uma cor melhor".

### 36.1 Causa real do "desigual"

Medi ao vivo antes de decidir qualquer abordagem (`offsetHeight` real via JS, não suposição): as duas colunas (`.col-lg-6`) já tinham a mesma altura — 798px cada — porque o `.row` do Bootstrap 5 é `display:flex` por padrão e estica as colunas pra bater. O problema não era mismatch entre colunas, era **espaço morto dentro da coluna direita**: "Segurança" (337px) + "Preferências" (382px) = 719px de conteúdo visível numa coluna de 798px, sobrando ~55px de vazio abaixo do último card, sem nenhum indicação visual do porquê.

### 36.2 Correção

`html/areaprofessor.html`, bloco "Segurança + Preferências" (~linha 696-751): coluna direita virou `d-flex flex-column`; o card "Preferências" (o de baixo, com mais conteúdo) ganhou `flex-grow-1 d-flex flex-column`, e seu `.card-body` também `flex-grow-1` — o espaço sobrando é absorvido pelo card de baixo em vez de ficar como vazio no fim da coluna. Escolhido deixar "Segurança" com altura fixa (natural do conteúdo) e "Preferências" esticar, em vez de mover campos entre os cards (ex: mover Titulação/Área de Atuação pra dentro de Segurança não fazia sentido semântico — são dados acadêmicos, não de segurança).

Confirmado por medição depois da mudança: Segurança 337px + margem 24px + Preferências 436px (antes 382px) = 797px ≈ 798px da coluna — sem sobra. Screenshot confirma os botões "Salvar Dados" e "Salvar Preferências" terminando praticamente na mesma altura horizontal.

### 36.3 Hover generalizado (não só Perfil)

A seção 35 tinha corrigido o hover-com-`transform` só dentro de `#settings-tab` (override escopado). Investigação confirmou (grep no projeto inteiro): **nenhum elemento com `.custom-card`, `.stats-card`, `.student-card` ou `.class-card` tem `onclick` no elemento em si, em lugar nenhum da aplicação** — só têm botões clicáveis por dentro (ex: "Ver Alunos" dentro do card de turma). O "levantar" no hover (`transform: translateY(...)`) era uma affordance falsa em toda a área do professor (Dashboard, Turmas, Alunos, Horários, Relatórios), não só no Perfil.

`css/styleareaprofessor.css`: generalizada a correção — `.custom-card:hover` e `.stats-card:hover` (regras base, sem escopo de aba) trocaram `transform` por realce de cor (borda `var(--primary-orange)` pro custom-card, fundo `var(--light-orange)` pro stats-card), mantendo a transição de `box-shadow` já existente. O override específico de `#settings-tab` da seção anterior foi removido — virou código morto já que a base cobre tudo agora.

**Testado ao vivo**: confirmado via CSSOM (iterando `document.styleSheets`) que só existem essas 2 regras de hover em toda a folha de estilo carregada, nenhuma com `transform` diferente de vazio — cobre todas as abas de uma vez, não precisa testar aba por aba manualmente. Clique real no botão "Ver Alunos" dentro do card de turma confirmado navegando pra aba Alunos e populando a tabela (26 linhas) — a mudança de CSS no card pai não afetou os botões filhos. Sem erros de console. Nenhum dado de teste criado (só leitura/navegação nesta rodada).

**Arquivos alterados:** `html/areaprofessor.html`, `css/styleareaprofessor.css`.

## 37. Auditoria de Segurança Completa — Fechamento dos Achados Críticos (22-23/08/2026)

Um colega de equipe fez uma primeira rodada de correções de segurança no projeto (S2, S3, S7 e parte do S8 do relatório técnico `codereview.md`). O usuário pediu pra auditar essa rodada ao vivo (rodando contra o servidor real, não só lendo código) e fechar o resto dos achados críticos. Sessão longa, tudo testado com evidência real (curl, banco de dados via `mysql.exe`, e várias vezes via navegador real com automação).

### 37.1 Confirmado ao vivo — já resolvido pelo colega
- **S3** — `express.static` restrito a `html/css/javascript/images`; antes, `/Backend/api2.js` (com a senha SMTP) e `/banco_sql/*.sql` eram baixáveis via HTTP. Confirmado 404 em ambos.
- **S7** — OTP e tokens migrados de `Math.random()` pra `crypto`; rate limiter em memória no login/OTP.
- **S8 (parcial)** — erro genérico ao cliente, sem vazar SQL/stack.

### 37.2 S1 — IDOR generalizado (achado mais grave, fechado nesta sessão)

O fluxo de OTP autenticava mas nunca emitia um token de sessão real — o front só guardava o `id` no `localStorage` e o backend confiava cegamente nele em toda rota `/alunos/:id`, `/professores/:id`, `/empresas/:id`. Confirmado ao vivo antes da correção:
```bash
curl http://localhost:4000/alunos/1
→ {"senha":"senha123","cpf":"111.222.333-01","endereco_rua":"SQN 202...", ...}
```
Sem nenhum header de autenticação.

**Correção:** `POST /verificar-otp` e `POST /empresas/login` passaram a emitir um token opaco (`crypto.randomBytes(32)`, 8h de validade, guardado num `Map` em memória). Dois middlewares novos, `exigirAutenticacao(tipos)` e `exigirDono(tipo, campo)`, aplicados em **40 rotas** de dados de aluno/professor/empresa. `javascript/auth-token.js` (novo) injeta o token automaticamente em todo `fetch()` da página via monkey-patch de `window.fetch`, sem precisar editar cada chamada dentro dos arquivos gigantes (`areaaluno.js`, `talentos.js`).

**Bugs descobertos e corrigidos durante o processo:**
- A impersonation do admin (`/admin/impersonate/aluno|professor|empresa/:id`) não emitia token — usuário impersonado ficava "logado" na aparência mas toda rota protegida dava 401. Corrigido emitindo token também nessas 3 rotas.
- Sessão salva no navegador de antes do S1 existir (sem token) ficava presa num estado "logado" quebrado, sem nunca revalidar. Corrigido: `_restaurarSessaoEmpresa()` e a inicialização de `areaaluno.js`/`areaprofessor.js` agora detectam sessão sem token e voltam pro login sozinhas; `auth-token.js` também limpa a sessão e recarrega a página se um 401 chegar com token presente (token expirado/inválido).

**Testado ao vivo:** sem token → 401 em todas as rotas; token válido do dono → 200; token de outro usuário/empresa → 403; impersonation completa (admin → aluno/professor/empresa) testada via automação de navegador real, incluindo o fluxo de favoritar no Portal de Talentos.

### 37.3 S4 / D1 — Senhas em texto puro

Confirmado direto no banco: `administradores`, `alunos` e `empresas` tinham senha em texto puro (`senha123`, `rankingplus001` etc.), e `GET /alunos/:id`/`GET /professores/:id` devolviam o campo `senha` inteiro na resposta.

**Decisão de arquitetura:** usado `bcryptjs` (pacote 100% JavaScript) em vez do `bcrypt` nativo — o nativo exige compilação C++ (node-gyp/Python) que pode quebrar ao instalar numa VM Linux limpa do GCP; `bcryptjs` roda idêntico em qualquer SO, sem esse risco na hora da migração.

**Migração preguiçosa** (sem UPDATE em massa nem downtime): login com senha ainda em texto puro é validado normalmente e, no mesmo request, a coluna já é regravada com `bcrypt.hashSync(senha, 10)`. Cadastro novo (aluno/empresa) já nasce com hash. `GET /alunos/:id`/`GET /professores/:id` passaram a nunca devolver o campo `senha`.

**Testado ao vivo, os 3 tipos de conta:** senha real no banco antes (`senha123`) → login funciona → senha no banco depois (`$2b$10$...`, hash real) → login de novo (agora contra hash) → funciona igual. Cadastro de conta nova confirmado nascendo já com hash.

### 37.4 S6 — Chat sem checar participante (+ gap extra achado no processo)

`GET /chat/anexos/:anexoId/download` não verificava se quem baixava fazia parte da conversa — IDs sequenciais permitiam enumerar e baixar PDFs de conversas alheias. Corrigido: busca a `conversa_id` via `mensagens.anexo_id`, confere se o token bate com `participante1` ou `participante2` da conversa.

**Gap extra achado durante o teste** (fora do escopo original do S6, mas mesma classe de problema): `POST /chat/conversas`, `GET /chat/conversas/:id/mensagens`, `POST /chat/conversas/:id/mensagens`, `PUT .../marcar-lida`, `GET /chat/contatos/:tipo/:id`, `GET /chat/conversas/participante/:tipo/:id` e `POST /chat/anexos` confiavam em `meu_tipo`/`meu_id`/`remetente_tipo`/`remetente_id` vindos do **body ou query**, sem nenhuma autenticação — qualquer um podia mandar mensagem se passando por outra pessoa. Fechadas as 7 rotas, identidade agora vem só do token.

**Testado ao vivo:** conversa criada e mensagem enviada usando só o token (sem nenhum campo de identidade no body); um segundo usuário sem ser participante tentando mandar mensagem ou ler a conversa → 403 nos dois casos; download de anexo sem token → 401, com token de não-participante → 403, com token do participante real → 200 com o PDF.

**Arquivos alterados:** `Backend/api2.js`, `javascript/auth-token.js` (novo), `javascript/admin.js`, `javascript/talentos.js`, `javascript/areaaluno.js`, `javascript/areaprofessor.js`, `html/index.html`, `html/areaaluno.html`, `html/areaprofessor.html`, `html/talentos.html`, `html/suporte.html`.

## 38. Achados Moderados — CORS, Anonimização e Validação de Entrada (23/08/2026)

### 38.1 S8 (parte do CORS) — allowlist em vez de `*`

`Access-Control-Allow-Origin: *` liberava qualquer site da internet a ler resposta de rotas públicas. Trocado por uma allowlist configurável via `.env` (`ALLOW_ORIGIN=http://localhost:4000,null` — o `null` cobre o acesso via `file://` que a impersonation do admin usa), refletindo o header só quando a origem da requisição bate com a lista.

**Testado ao vivo, 4 cenários de `Origin`:** origem permitida → header reflete certo; `null` (file://) → reflete certo; origem estranha tipo `http://evil.com` → header **ausente** (navegador bloquearia a leitura); sem header `Origin` (chamada servidor-a-servidor) → segue funcionando normal. Confirmado também pelo navegador real (login de empresa, favoritos) sem nenhum erro de CORS.

### 38.2 D5 — Nome real vazando no ranking mesmo com opt-out

`GET /ranking` mandava o nome real do aluno no JSON mesmo quando `permitir_exibicao_ranking=0` — só o frontend trocava visualmente por "Aluno Anônimo", o dado real aparecia em qualquer inspeção de rede. Corrigido movendo a anonimização pro SQL (`CASE WHEN ... ELSE 'Aluno Anônimo' END AS nome`). Testado ao vivo: os 4 alunos com opt-out apareceram como "Aluno Anônimo" direto na resposta do servidor.

### 38.3 Validação de entrada real — email, CPF, CNPJ

Não existia validação nenhuma de formato antes desta correção. Implementado com os algoritmos reais de dígito verificador (não só regex de tamanho) em `_validarEmail`, `_validarCPF`, `_validarCNPJ`, aplicados no cadastro de aluno/empresa e na edição de perfil (aluno e professor).

**Testado ao vivo, 8 cenários:** email inválido, CPF inválido (`111.111.111-11`), CPF matematicamente válido (gerado programaticamente só pra confirmar que o algoritmo aceita entrada correta, não só rejeita a errada), CNPJ inválido, CNPJ válido, e edição de perfil com email inválido/válido nos dois papéis (aluno e professor) — todos batendo com o esperado.

**Arquivos alterados:** `Backend/api2.js`, `Backend/.env`, `Backend/.env.example`.

## 39. Qualidade de Código — Escala de Nota Unificada e Utilitários Duplicados (23/08/2026)

### 39.1 C1 — Duas escalas de nota divergentes (bug de lógica, não só duplicação)

A expressão `CASE mencao ...` estava copiada **15 vezes** no `api2.js` (o relatório original estimava ~10), com dois pesos diferentes coexistindo: uma escala no ranking/stats do professor (`SS=10,MS=9,MM=7,MI=5`) e outra no dashboard do aluno/desempenho/talentos (`SS=10,MS=8.5,MM=6.5,MI=4,II=2`) — o mesmo aluno via uma "média" diferente dependendo da tela.

**Escala oficial definida pelo usuário:** `SS=10, MS=8, MM=6, MI=4, II=2, demais=0`. Unificada numa função só, `mencaoParaNotaSQL(coluna)`, que devolve a expressão SQL via template literal — as 15 ocorrências passaram a chamar essa única fonte da verdade.

**Testado ao vivo:** `/ranking` e o perfil do Portal de Talentos do mesmo aluno passaram a bater (9.43 vs 9.4 — só diferença de arredondamento, 2 casas vs 1, não mais pesos diferentes).

### 39.2 C2 — Utilitários duplicados

- `const n = v => (v===undefined||v==='') ? null : v` (normalizador de campo vazio) estava redefinido **4 vezes** no backend — virou uma função só no escopo do módulo.
- `_esc()` (escape anti-XSS) tinha **4 cópias** espalhadas em `admin.js`, `areaaluno.js`, `chat.js` e `talentos.js` — **e a cópia de `areaaluno.js` estava incompleta, sem escapar aspas simples**, um gap real de XSS em contexto de atributo que a duplicação escondia. Unificado num arquivo novo, `javascript/esc.js`, carregado antes de cada página que precisa (inclusive dentro da IIFE do `chat.js`, que resolve `_esc` pela cadeia normal de escopo do JavaScript).

**Testado ao vivo:** as 4 rotas do backend que usam `n()` (cadastro de aluno/empresa, interesses e vagas da empresa); `_esc` confirmado funcionando em `admin.html` e `talentos.html` via console real, e em `areaaluno.html` confirmado globalmente acessível sem erro de `ReferenceError`.

### 39.3 Correção de rumo sobre idioma do código

Na primeira passada do C1/C2 apliquei "inglês por padrão, português só pro termo de domínio" nos nomes novos (`requireAuth`, `requireOwner`, `mencaoScoreSQL`) e nos comentários. O usuário corrigiu explicitamente: quer **português como padrão** no código de projetos pessoais, inglês só onde for tecnicamente imprescindível — ele não fala inglês fluente. Revertido tudo: `requireAuth`→`exigirAutenticacao`, `requireOwner`→`exigirDono`, `mencaoScoreSQL`→`mencaoParaNotaSQL`, comentários traduzidos. Virou regra permanente pra sessões futuras.

**Arquivos alterados:** `Backend/api2.js`, `javascript/esc.js` (novo), `javascript/admin.js`, `javascript/areaaluno.js`, `javascript/chat.js`, `javascript/talentos.js`, `html/admin.html`, `html/areaaluno.html`, `html/areaprofessor.html`, `html/talentos.html`.

## 40. Banco de Dados e Performance — D4, D6, D7, P1, P3 (23/08/2026)

### 40.1 D4 — Falta de chave única em `boletim`

Nada impedia duas linhas do mesmo aluno/disciplina/semestre — como quase toda métrica é `AVG()` sobre `boletim`, uma duplicata silenciosa distorceria CRA, ranking e gráficos. Aplicado `UNIQUE(aluno_id, disciplina_id, semestre_cursado)` (confirmado antes que não existia nenhuma duplicata real no banco). `POST /boletim` ganhou tratamento específico do erro de duplicata (`ER_DUP_ENTRY` → 409 com mensagem clara, em vez de erro genérico).

**Testado ao vivo:** matrícula nova → sucesso; matrícula duplicada → `{"error":"Este aluno já está matriculado nesta disciplina neste semestre."}`.

### 40.2 D6 — `avatar_base64` (MEDIUMTEXT) arrastado à toa em `SELECT *`

Login (aluno/professor) e o perfil público do Portal de Talentos faziam `SELECT *` em `alunos`, arrastando a imagem em base64 inteira mesmo nunca usando ela nessas respostas. Trocado por colunas explícitas nessas duas rotas. `GET /alunos/:id` (usado pelo dashboard, que **precisa** mostrar o avatar) foi mantido como estava de propósito.

### 40.3 D7 — Coluna `idade` redundante

Confirmado antes de remover: **zero referência** a essa coluna em todo o código (backend e frontend, busca por palavra exata, não substring). Coluna removida do banco (`ALTER TABLE alunos DROP COLUMN idade`).

### 40.4 P1 — Efeito colateral de escrita dentro de um GET

`GET /alunos/:id/notificacoes` recalculava o ranking inteiro (`AVG`+`GROUP BY` sobre todos os alunos) e gravava no banco a cada chamada — e o frontend faz *polling* nessa rota. Extraída a lógica pra uma função própria, `_atualizarPosicaoRanking(alunoId)`, que só roda agora quando o professor lança/muda uma menção (`PUT .../boletim`), não mais a cada consulta de notificações.

**Testado ao vivo (prova rigorosa, não só leitura de código):** marquei a posição do aluno como `999` direto no banco; chamei o GET de notificações várias vezes → continuou `999` (antes, qualquer polling reescrevia); só voltou ao valor real depois de lançar uma nota pela rota certa.

### 40.5 P3 — `/ranking` sem cache

Adicionado cache de 30s em memória, invalidado imediatamente quando uma menção muda pela rota do professor (mesmo gancho do P1). Confirmado que o índice `notificacoes(destinatario_tipo, destinatario_id)` sugerido pelo relatório **já existia** no banco (`idx_destinatario`) — nada a fazer ali.

**Testado ao vivo:** mudei uma menção **direto no banco** (contornando a aplicação) e o `/ranking` continuou mostrando o valor antigo dentro da janela de 30s (cache funcionando); mudei pela rota do professor e o `/ranking` refletiu na hora (invalidação funcionando).

### 40.6 Achado extra — `POST /boletim` sem autenticação nenhuma

Descoberto durante o teste do D4: matricular um aluno numa disciplina não exigia login nenhum, de nenhum tipo. Sem uso no frontend atual (ação puramente administrativa) — protegida com o mesmo token de admin usado em `/admin/alunos` e afins.

**Arquivos alterados:** `Backend/api2.js`, schema do banco (`boletim`, `alunos`).

## 41. Regressão Real — Gráfico de CRA Sumindo do Drawer do Portal de Talentos (23/08/2026)

O usuário percebeu, numa sessão posterior, que o gráfico de desempenho tinha sumido do drawer de candidato no Portal de Talentos. Causa raiz: ao proteger as 40 rotas do S1 (seção 37.2), três rotas de aluno (`GET /alunos/:id/desempenho-semestral`, `GET /alunos/:id/perfil-profissional`, `GET /alunos/:id/boletim-detalhado`) foram tratadas como "só o dono acessa" — mas essas rotas **sempre foram multi-perfil por design**: empresa vê candidato que optou por exibição pública, professor vê qualquer aluno seu.

**Correção:** novo helper `_identidadeOpcional(req)` (lê o token se houver, nunca bloqueia sozinho) + lógica condicional nas 3 rotas — dono, ou professor, ou (nas duas primeiras, que aparecem no Portal de Talentos) qualquer um se `permitir_exibicao_ranking=1`.

**Testado ao vivo, 7 cenários:** empresa vendo aluno público → 200; empresa vendo aluno que optou por **não** aparecer → 403 (privacidade preservada); professor vendo qualquer aluno → 200 nas 3 rotas; aluno vendo o próprio → 200; um aluno tentando ver o boletim de outro → 403. Confirmado via navegador real que o SVG do gráfico volta a renderizar de verdade no drawer (não só a chamada retornando 200).

**Lição registrada pra sessões futuras:** antes de aplicar um middleware de "só dono" numa rota `/alunos/:id/...`, checar se ela é chamada a partir de outros arquivos de frontend além do próprio `areaaluno.js` — se sim, é multi-perfil e precisa de lógica condicional, não um bloqueio fixo.

**Arquivos alterados:** `Backend/api2.js`.

## 42. Ferramentas — GitHub CLI e Planejamento de Migração para GCP (23/08/2026)

Instalado `gh` CLI (via `winget`) pra dar acesso direto ao GitHub via linha de comando (issues, Projects) — falta só o usuário terminar o `gh auth login` (ficou pendente por o terminal aberto não ter o PATH atualizado logo após a instalação).

Criado documento completo de migração do projeto pra GCP em `docs/migracao-gcp.md` — arquitetura definida: VM `e2-micro` (Always Free Tier, custo zero de computação) + Cloud SQL `db-f1-micro` gerenciado (~US$12-15/mês) + Nginx como reverse proxy/TLS (**sem** o Load Balancer gerenciado da GCP, que custa uma taxa fixa por hora rodando e só faz sentido com múltiplas VMs). Estimativa: ~US$60-75 de gasto no semestre inteiro (ago-dez), dos 300 créditos disponíveis. Documento cobre passo a passo completo (orçamento/alertas, IAM, Cloud SQL Auth Proxy, systemd, Nginx, HTTPS via certbot) com todos os comandos `gcloud`. Nada foi provisionado ainda — o usuário ainda não ativou o billing/créditos na conta GCP, é planejamento puro por enquanto.
