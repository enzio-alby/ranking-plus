# 🎓 Ranking+ — Plataforma de Ranking Acadêmico

Ranking+ é uma aplicação web interativa desenvolvida como parte do Projeto Integrador I do curso de Ciência da Computação. Seu objetivo é promover o engajamento estudantil por meio de rankings acadêmicos, gráficos de desempenho, avaliações de professores e gamificação(não finalizado por completo).

## 🚀 Funcionalidades Principais

- 🔐 **Login de Aluno**
- 📊 **Ranking em Tempo Real por Matéria e Turma**
- 🧠 **Avaliação de Professores com Estrelas**
- 🥇 **Sistema de Medalhas por Desempenho**
- 📈 **Gráficos de Menções e Frequência**
- 🏫 **Painel do Professor para Premiação**
- ☁️ **Hospedagem Cloud com Banco SQL**

## 💡 Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript, Bootstrap, Chart.js, Font Awesome
- **Backend:** Node.js com Express
- **Banco de Dados:** MySQL
- **Hospedagem em nuvem:** Google Cloud Platform (VM Ubuntu, SQL, Storage)
- **Dominio Godaddy:** http://rankingplus.online/
- **Ferramentas:** (protótipos), VSCode, Trello

## 📁 Estrutura do Projeto

```
📦 RANKING/
├── .vscode/
├── Backend/
│   └── api.js
├── css/
│   ├── stylecadastro.css
│   ├── styleconfigprof.css
│   ├── styleconfiguser.css
│   ├── stylehomeprof.css
│   ├── styleindex.css
│   ├── stylelogin.css
│   ├── styleprof.css
│   └── stylerrecuperar.css
├── html/
│   ├── areadoprofessor.html
│   ├── cadastro.html
│   ├── configprof.html
│   ├── configuser.html
│   ├── homeprof.html
│   ├── index.html
│   ├── login.html
│   └── recuperarsenha.html
├── images/
├── javascript/
│   ├── acessibilidade.js
│   ├── avaliacao.js
│   ├── cadastro.js
│   ├── chamada.js
│   ├── comunicacao.js
│   ├── configprof.js
│   ├── configuser.js
│   ├── homeprof.js
│   ├── index.js
│   ├── login.js
│   ├── professor.js
│   ├── ranking.js
│   ├── recuperar.js
│   └── sobreNos.js
```

## 🧪 Como Executar Localmente

### Pré-requisitos:

- Node.js instalado
- MySQL rodando localmente ou em nuvem

### Instalação:

```bash
git clone https://github.com/enzio-alby/ranking-plus.git
cd ranking-plus/backend
npm install
node api.js
```

Depois, abra o `login.html` no navegador.

## 👤 Acesso de Usuário para Testes

Segue abaixo alguns usuários disponíveis para validação dos gráficos com dados reais(enquanto houver créditos na google):

| ID  | Nome              | Curso                      | Turma   | Email                            |Matricula                        |Senha                            |
|-----|-------------------|----------------------------|---------|----------------------------------|---------------------------------|---------------------------------|
| 51  | Daniela Oliveira  | Engenharia da Computação   | Turma A | daniela.oliveira@exemplo.com     |T1A001                           |193472                           |
| 52  | Bruno Santos      | Engenharia da Computação   | Turma B | bruno.santos@exemplo.com         |T1A002                           |595082                           |

## 🧑‍💻 Equipe de Desenvolvimento

- Enzio Albéfaro (Gerente de Projeto)
- Kaio Victor
- Sergio Gabriel Linard
- João Victor Monteiro
- Instituição: CEUB

## 📄 Licença

Este projeto é acadêmico e desenvolvido exclusivamente para fins educacionais.
