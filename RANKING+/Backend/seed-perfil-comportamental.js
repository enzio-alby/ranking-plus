// seed-perfil-comportamental.js — cria as tabelas do módulo de Perfil Comportamental
// e semeia o questionário oficial do sistema (50 perguntas: 30 Likert + 10 forçada +
// 8 situacional + 2 pretensão). Idempotente: se o questionário 'sistema' ativo já
// existe, não duplica. Rodar uma vez: `node seed-perfil-comportamental.js`.
const mysql = require('mysql2/promise');

const EIXOS = ['execucao', 'comunicacao', 'colaboracao', 'resiliencia', 'aprendizado'];

async function criarTabelas(db) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS questionarios_comportamentais (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      origem ENUM('sistema','empresa') NOT NULL DEFAULT 'sistema',
      empresa_id INT NULL,
      ativo TINYINT(1) NOT NULL DEFAULT 1,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
    )`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS perguntas_comportamentais (
      id INT AUTO_INCREMENT PRIMARY KEY,
      questionario_id INT NOT NULL,
      ordem INT NOT NULL,
      bloco ENUM('likert','forcada','situacional','pretensao') NOT NULL,
      enunciado VARCHAR(300) NOT NULL,
      FOREIGN KEY (questionario_id) REFERENCES questionarios_comportamentais(id) ON DELETE CASCADE,
      INDEX idx_questionario_ordem (questionario_id, ordem)
    )`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS opcoes_resposta (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pergunta_id INT NOT NULL,
      ordem INT NOT NULL,
      texto VARCHAR(200) NOT NULL,
      peso_execucao INT NOT NULL DEFAULT 0,
      peso_comunicacao INT NOT NULL DEFAULT 0,
      peso_colaboracao INT NOT NULL DEFAULT 0,
      peso_resiliencia INT NOT NULL DEFAULT 0,
      peso_aprendizado INT NOT NULL DEFAULT 0,
      FOREIGN KEY (pergunta_id) REFERENCES perguntas_comportamentais(id) ON DELETE CASCADE,
      INDEX idx_pergunta (pergunta_id)
    )`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS avaliacoes_comportamentais (
      id INT AUTO_INCREMENT PRIMARY KEY,
      aluno_id INT NOT NULL,
      questionario_id INT NOT NULL,
      score_execucao INT NOT NULL,
      score_comunicacao INT NOT NULL,
      score_colaboracao INT NOT NULL,
      score_resiliencia INT NOT NULL,
      score_aprendizado INT NOT NULL,
      perfil_executor_pct INT NOT NULL,
      perfil_comunicador_pct INT NOT NULL,
      perfil_planejador_pct INT NOT NULL,
      perfil_analista_pct INT NOT NULL,
      perfil_dominante VARCHAR(20) NOT NULL,
      respondido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      valido_ate DATE NOT NULL,
      FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
      FOREIGN KEY (questionario_id) REFERENCES questionarios_comportamentais(id),
      INDEX idx_aluno_data (aluno_id, respondido_em DESC)
    )`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS respostas_comportamentais (
      id INT AUTO_INCREMENT PRIMARY KEY,
      avaliacao_id INT NOT NULL,
      pergunta_id INT NOT NULL,
      opcao_id INT NOT NULL,
      FOREIGN KEY (avaliacao_id) REFERENCES avaliacoes_comportamentais(id) ON DELETE CASCADE,
      FOREIGN KEY (pergunta_id) REFERENCES perguntas_comportamentais(id),
      FOREIGN KEY (opcao_id) REFERENCES opcoes_resposta(id),
      INDEX idx_avaliacao (avaliacao_id)
    )`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS empresa_perfis_procurados (
      empresa_id INT NOT NULL,
      perfil VARCHAR(20) NOT NULL,
      ordem TINYINT NOT NULL,
      PRIMARY KEY (empresa_id, ordem),
      FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
    )`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS contratacoes_checkins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      favorito_id INT NOT NULL,
      empresa_id INT NOT NULL,
      aluno_id INT NOT NULL,
      marcado_contratado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      continua_na_empresa TINYINT(1) NULL,
      respondido_em TIMESTAMP NULL,
      proximo_checkin_em DATE NOT NULL,
      FOREIGN KEY (favorito_id) REFERENCES empresa_favoritos(id) ON DELETE CASCADE,
      FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
      FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
      INDEX idx_empresa (empresa_id),
      INDEX idx_proximo (proximo_checkin_em)
    )`);

  // Coluna nova em alunos pro versionamento do termo de uso (default 1 = versão
  // anterior à cláusula de Perfil Comportamental — força reaceite no próximo login).
  const [cols] = await db.execute("SHOW COLUMNS FROM alunos LIKE 'termos_versao_aceita'");
  if (!cols.length) {
    await db.execute('ALTER TABLE alunos ADD COLUMN termos_versao_aceita INT NOT NULL DEFAULT 1');
  }

  console.log('[OK] Tabelas do módulo Perfil Comportamental prontas.');
}

// ─── Bloco A — Likert (30: 6 por eixo, 3 diretos + 3 reversos) ──────────────
// Cada item usa a MESMA escala de 5 pontos (Discordo totalmente..Concordo
// totalmente). O peso de cada ponto já embute a reversão no dado semeado —
// assim o cálculo de score fica igual pra TODO bloco: soma dos pesos das
// opções marcadas. Sem lógica especial de "isso é reverso" em tempo de execução.
const ESCALA_LIKERT = ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'];

function opcoesLikert(eixo, reverso) {
  return ESCALA_LIKERT.map((texto, i) => {
    const nivel = reverso ? (5 - i) : (i + 1); // 1..5
    return { texto, pesos: { [eixo]: nivel } };
  });
}

const BLOCO_A = [
  // Execução & Disciplina
  { eixo: 'execucao', reverso: false, enunciado: 'Eu costumo terminar minhas tarefas antes do prazo, mesmo sob pressão.' },
  { eixo: 'execucao', reverso: false, enunciado: 'Eu organizo meu trabalho em etapas claras antes de começar.' },
  { eixo: 'execucao', reverso: false, enunciado: 'Eu reviso meu trabalho com cuidado antes de entregar.' },
  { eixo: 'execucao', reverso: true,  enunciado: 'Eu costumo deixar tarefas importantes para a última hora.' },
  { eixo: 'execucao', reverso: true,  enunciado: 'Eu me distraio facilmente quando preciso concluir algo chato.' },
  { eixo: 'execucao', reverso: true,  enunciado: 'Eu prefiro improvisar a seguir um planejamento definido.' },
  // Comunicação & Influência
  { eixo: 'comunicacao', reverso: false, enunciado: 'Eu me sinto confortável apresentando minhas ideias para um grupo.' },
  { eixo: 'comunicacao', reverso: false, enunciado: 'Eu tomo a iniciativa de puxar conversa em ambientes novos.' },
  { eixo: 'comunicacao', reverso: false, enunciado: 'Eu gosto de estar no centro das discussões em reuniões de equipe.' },
  { eixo: 'comunicacao', reverso: true,  enunciado: 'Eu prefiro me comunicar por escrito a falar em público.' },
  { eixo: 'comunicacao', reverso: true,  enunciado: 'Eu evito chamar atenção em reuniões, mesmo tendo algo a dizer.' },
  { eixo: 'comunicacao', reverso: true,  enunciado: 'Eu me sinto desconfortável em ambientes muito sociais ou barulhentos.' },
  // Colaboração
  { eixo: 'colaboracao', reverso: false, enunciado: 'Eu costumo ajudar colegas mesmo quando isso não é minha responsabilidade direta.' },
  { eixo: 'colaboracao', reverso: false, enunciado: 'Eu levo em conta a opinião dos outros antes de decidir algo em grupo.' },
  { eixo: 'colaboracao', reverso: false, enunciado: 'Eu dou feedback de forma construtiva, mesmo quando é uma crítica.' },
  { eixo: 'colaboracao', reverso: true,  enunciado: 'Eu prefiro trabalhar sozinho a depender de outras pessoas.' },
  { eixo: 'colaboracao', reverso: true,  enunciado: 'Eu tenho dificuldade em aceitar que outros façam diferente do que eu faria.' },
  { eixo: 'colaboracao', reverso: true,  enunciado: 'Eu priorizo meus próprios resultados acima dos do grupo quando há conflito de interesse.' },
  // Resiliência sob Pressão
  { eixo: 'resiliencia', reverso: false, enunciado: 'Eu mantenho a calma quando algo dá errado no último minuto.' },
  { eixo: 'resiliencia', reverso: false, enunciado: 'Eu consigo separar frustração pessoal de decisões profissionais.' },
  { eixo: 'resiliencia', reverso: false, enunciado: 'Eu me recupero rápido depois de um erro ou uma crítica.' },
  { eixo: 'resiliencia', reverso: true,  enunciado: 'Eu fico muito ansioso(a) quando um prazo está próximo e algo não saiu como esperado.' },
  { eixo: 'resiliencia', reverso: true,  enunciado: 'Eu levo críticas ao meu trabalho de forma pessoal.' },
  { eixo: 'resiliencia', reverso: true,  enunciado: 'Eu tenho dificuldade de manter o foco quando estou sob pressão.' },
  // Aprendizado & Inovação
  { eixo: 'aprendizado', reverso: false, enunciado: 'Eu gosto de aprender uma tecnologia ou ferramenta nova, mesmo sem necessidade imediata.' },
  { eixo: 'aprendizado', reverso: false, enunciado: 'Eu costumo propor soluções diferentes das que já são usadas no time.' },
  { eixo: 'aprendizado', reverso: false, enunciado: 'Eu me interesso por assuntos fora da minha área principal de estudo ou trabalho.' },
  { eixo: 'aprendizado', reverso: true,  enunciado: 'Eu prefiro usar o que já sei a testar uma abordagem diferente.' },
  { eixo: 'aprendizado', reverso: true,  enunciado: 'Eu me sinto desconfortável quando preciso mudar de ferramenta ou processo no meio de um projeto.' },
  { eixo: 'aprendizado', reverso: true,  enunciado: 'Eu evito tarefas que exigem aprender algo totalmente novo.' },
];

// ─── Bloco B — Forçada ternária (10 blocos, "o que MAIS parece com você") ──
const BLOCO_B = [
  { enunciado: 'Num projeto em grupo, qual frase mais parece com você?', opcoes: [
      { texto: 'Garanto que prazo e qualidade técnica sejam cumpridos', eixo: 'execucao' },
      { texto: 'Assumo a comunicação com o cliente ou a apresentação do resultado', eixo: 'comunicacao' },
      { texto: 'Cuido para que todo mundo do time seja ouvido', eixo: 'colaboracao' } ] },
  { enunciado: 'Quando um projeto muda de escopo de repente, o que mais parece com você?', opcoes: [
      { texto: 'Mantenho a calma e me adapto ao novo cenário sem estresse', eixo: 'resiliencia' },
      { texto: 'Vejo isso como oportunidade de testar uma abordagem nova', eixo: 'aprendizado' },
      { texto: 'Reorganizo o planejamento pra garantir que o prazo não seja afetado', eixo: 'execucao' } ] },
  { enunciado: 'Num brainstorm de equipe, o que você mais faz?', opcoes: [
      { texto: 'Puxo a discussão e proponho ideias com confiança', eixo: 'comunicacao' },
      { texto: 'Ajudo a conectar as ideias dos outros e busco consenso', eixo: 'colaboracao' },
      { texto: 'Trago referências e abordagens que ninguém tinha pensado ainda', eixo: 'aprendizado' } ] },
  { enunciado: 'Você recebe uma crítica dura sobre uma entrega. O que mais parece com você?', opcoes: [
      { texto: 'Ajusto o que for preciso e sigo em frente sem me abalar', eixo: 'resiliencia' },
      { texto: 'Reviso ponto a ponto pra garantir que não se repita', eixo: 'execucao' },
      { texto: 'Pergunto a opinião de outros colegas antes de mudar algo', eixo: 'colaboracao' } ] },
  { enunciado: 'Numa entrevista técnica difícil, o que mais parece com você?', opcoes: [
      { texto: 'Fico tranquilo(a) mesmo não sabendo todas as respostas', eixo: 'resiliencia' },
      { texto: 'Aproveito pra mostrar como aprendo rápido coisas novas', eixo: 'aprendizado' },
      { texto: 'Foco em me expressar bem e criar boa conexão com quem entrevista', eixo: 'comunicacao' } ] },
  { enunciado: 'No seu dia de trabalho ideal, você passaria mais tempo...', opcoes: [
      { texto: 'Executando e entregando tarefas técnicas com qualidade', eixo: 'execucao' },
      { texto: 'Se comunicando com pessoas, apresentando ou negociando', eixo: 'comunicacao' },
      { texto: 'Estudando, testando algo novo ou resolvendo um problema difícil', eixo: 'aprendizado' } ] },
  { enunciado: 'Um colega comete um erro que pode atrasar a entrega do time. O que mais parece com você?', opcoes: [
      { texto: 'Ajudo a resolver junto, sem julgar', eixo: 'colaboracao' },
      { texto: 'Fico focado(a) em corrigir e cumprir o prazo, sem me desviar', eixo: 'execucao' },
      { texto: 'Mantenho a calma e trato isso como parte normal do processo', eixo: 'resiliencia' } ] },
  { enunciado: 'Ao liderar uma pequena tarefa em grupo, o que mais parece com você?', opcoes: [
      { texto: 'Distribuo claramente quem faz o quê e cobro prazo', eixo: 'execucao' },
      { texto: 'Motivo o grupo e mantenho todo mundo alinhado', eixo: 'comunicacao' },
      { texto: 'Garanto que as decisões sejam tomadas em conjunto', eixo: 'colaboracao' } ] },
  { enunciado: 'Você é colocado(a) num projeto totalmente novo pra você. O que mais parece com você?', opcoes: [
      { texto: 'Encaro como um desafio interessante de aprender algo novo', eixo: 'aprendizado' },
      { texto: 'Não me abalo com a insegurança inicial, vou no ritmo', eixo: 'resiliencia' },
      { texto: 'Busco ajuda de quem já tem experiência no time', eixo: 'colaboracao' } ] },
  { enunciado: 'No fim de um projeto, o que mais te dá satisfação?', opcoes: [
      { texto: 'Ver que tudo foi entregue certinho, no prazo', eixo: 'execucao' },
      { texto: 'Ter aprendido algo que não sabia antes', eixo: 'aprendizado' },
      { texto: 'Apresentar o resultado pro cliente/stakeholder e ver a reação boa', eixo: 'comunicacao' } ] },
];

function opcoesForcada(opcoes) {
  return opcoes.map(o => ({ texto: o.texto, pesos: { [o.eixo]: 3 } }));
}

// ─── Bloco C — Situacional/SJT (8 cenários, 4 alternativas cada, peso 0-3) ──
const BLOCO_C = [
  { enunciado: 'Você percebeu que um colega de equipe cometeu um erro que pode atrasar a entrega do projeto. O que você faz?', opcoes: [
      { texto: 'Aviso o colega em particular e ajudo a corrigir antes do prazo', pesos: { colaboracao: 3, execucao: 1 } },
      { texto: 'Reporto direto pro professor/líder do projeto', pesos: { execucao: 1 } },
      { texto: 'Espero pra ver se ele mesmo percebe e corrige', pesos: {} },
      { texto: 'Assumo a correção sozinho(a) sem avisar ninguém', pesos: { execucao: 2 } } ] },
  { enunciado: 'Faltam 2 dias pra entrega e você percebe que não vai dar tempo de fazer tudo com a qualidade que queria. O que você faz?', opcoes: [
      { texto: 'Priorizo o que é essencial e comunico o time sobre o que ficará de fora', pesos: { execucao: 3, comunicacao: 2 } },
      { texto: 'Peço ajuda a outras pessoas do time pra dar conta de tudo', pesos: { colaboracao: 3 } },
      { texto: 'Tento fazer tudo de qualquer jeito, mesmo sob estresse', pesos: { execucao: 1 } },
      { texto: 'Entrego só o que consegui, sem avisar antecipadamente', pesos: {} } ] },
  { enunciado: 'Você discorda publicamente da forma como um colega está conduzindo uma tarefa do grupo. Qual sua reação mais provável?', opcoes: [
      { texto: 'Chamo ele(a) em particular pra entender o motivo e sugerir outra forma', pesos: { colaboracao: 3, comunicacao: 1 } },
      { texto: 'Exponho minha discordância na hora, na frente do grupo', pesos: { comunicacao: 2 } },
      { texto: 'Fico quieto(a) pra não gerar atrito, mesmo achando errado', pesos: { resiliencia: 1 } },
      { texto: 'Assumo a tarefa sozinho(a), do jeito que acho certo', pesos: { execucao: 1 } } ] },
  { enunciado: 'Numa apresentação importante, o projetor falha e você precisa continuar sem os slides. O que você faz?', opcoes: [
      { texto: 'Continuo a apresentação de improviso, com calma', pesos: { resiliencia: 3, comunicacao: 2 } },
      { texto: 'Peço um tempo pra resolver o problema técnico antes de continuar', pesos: { execucao: 1 } },
      { texto: 'Fico visivelmente nervoso(a) e a apresentação piora', pesos: {} },
      { texto: 'Peço pra alguém do time assumir enquanto tento resolver', pesos: { colaboracao: 1 } } ] },
  { enunciado: 'Você recebe uma tarefa nova, numa tecnologia que nunca usou antes. Qual sua primeira atitude?', opcoes: [
      { texto: 'Já começo a pesquisar e testar por conta própria', pesos: { aprendizado: 3 } },
      { texto: 'Pergunto pra alguém com mais experiência antes de começar', pesos: { colaboracao: 2, aprendizado: 1 } },
      { texto: 'Tento adiar a tarefa ou pedir pra outra pessoa fazer', pesos: {} },
      { texto: 'Sigo um tutorial passo a passo sem me aprofundar no porquê', pesos: { execucao: 1 } } ] },
  { enunciado: 'O escopo de um projeto muda no meio do caminho, exigindo refazer parte do que já estava pronto. Como você reage?', opcoes: [
      { texto: 'Vejo como parte natural do processo e me reorganizo rápido', pesos: { resiliencia: 3, execucao: 1 } },
      { texto: 'Fico frustrado(a), mas sigo em frente mesmo assim', pesos: { resiliencia: 1 } },
      { texto: 'Questiono o motivo da mudança antes de continuar', pesos: { comunicacao: 1 } },
      { texto: 'Aproveito pra melhorar partes que já não estavam boas', pesos: { aprendizado: 2 } } ] },
  { enunciado: 'Dois colegas do seu time entram em conflito durante uma tarefa. Qual sua atitude mais provável?', opcoes: [
      { texto: 'Tento mediar e ajudar os dois a chegarem num meio-termo', pesos: { colaboracao: 3, comunicacao: 1 } },
      { texto: 'Fico de fora, não é problema meu', pesos: {} },
      { texto: 'Tomo um lado, o que eu acho que está certo', pesos: { comunicacao: 1 } },
      { texto: 'Sugiro uma pausa e retomo o assunto depois, com mais calma', pesos: { resiliencia: 2 } } ] },
  { enunciado: 'Você entrega um trabalho e recebe uma nota ou feedback bem abaixo do esperado. O que você faz?', opcoes: [
      { texto: 'Peço detalhes do que faltou e ajusto pra próxima entrega', pesos: { aprendizado: 3, resiliencia: 1 } },
      { texto: 'Fico chateado(a) por alguns dias antes de conseguir seguir em frente', pesos: { resiliencia: 1 } },
      { texto: 'Discordo do feedback e não mudo nada', pesos: {} },
      { texto: 'Assumo o erro rapidamente e já busco corrigir no mesmo dia', pesos: { execucao: 2, resiliencia: 2 } } ] },
];

function opcoesSituacional(opcoes) {
  return opcoes.map(o => ({ texto: o.texto, pesos: o.pesos }));
}

// ─── Pretensão (2, sem peso comportamental — só metadado de match) ─────────
const BLOCO_PRETENSAO = [
  { enunciado: 'Que tipo de vaga te interessa agora?', opcoes: ['Estágio', 'Trainee', 'Júnior', 'Freelance/PJ'] },
  { enunciado: 'Qual formato de trabalho você prefere?', opcoes: ['Presencial', 'Híbrido', 'Remoto'] },
];

function opcoesPretensao(lista) {
  return lista.map(texto => ({ texto, pesos: {} }));
}

async function inserirPergunta(db, questionarioId, ordem, bloco, enunciado, opcoes) {
  const [r] = await db.execute(
    'INSERT INTO perguntas_comportamentais (questionario_id, ordem, bloco, enunciado) VALUES (?, ?, ?, ?)',
    [questionarioId, ordem, bloco, enunciado]
  );
  const perguntaId = r.insertId;
  let ordemOpcao = 1;
  for (const op of opcoes) {
    const pesos = EIXOS.map(e => op.pesos?.[e] || 0);
    await db.execute(
      `INSERT INTO opcoes_resposta
         (pergunta_id, ordem, texto, peso_execucao, peso_comunicacao, peso_colaboracao, peso_resiliencia, peso_aprendizado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [perguntaId, ordemOpcao++, op.texto, ...pesos]
    );
  }
}

async function semear(db) {
  const [existente] = await db.execute(
    "SELECT id FROM questionarios_comportamentais WHERE origem='sistema' AND ativo=1 LIMIT 1"
  );
  if (existente.length) {
    console.log('[SKIP] Já existe questionário sistema ativo (id=' + existente[0].id + '). Nada a semear.');
    return;
  }

  const [qr] = await db.execute(
    "INSERT INTO questionarios_comportamentais (nome, origem, ativo) VALUES (?, 'sistema', 1)",
    ['Mapeamento de Perfil Comportamental — v1']
  );
  const questionarioId = qr.insertId;

  let ordem = 1;
  for (const item of BLOCO_A) {
    await inserirPergunta(db, questionarioId, ordem++, 'likert', item.enunciado, opcoesLikert(item.eixo, item.reverso));
  }
  for (const item of BLOCO_B) {
    await inserirPergunta(db, questionarioId, ordem++, 'forcada', item.enunciado, opcoesForcada(item.opcoes));
  }
  for (const item of BLOCO_C) {
    await inserirPergunta(db, questionarioId, ordem++, 'situacional', item.enunciado, opcoesSituacional(item.opcoes));
  }
  for (const item of BLOCO_PRETENSAO) {
    await inserirPergunta(db, questionarioId, ordem++, 'pretensao', item.enunciado, opcoesPretensao(item.opcoes));
  }

  console.log(`[OK] Questionário semeado (id=${questionarioId}), ${ordem - 1} perguntas.`);
}

(async () => {
  const db = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'universidade_ranking', multipleStatements: false });
  try {
    await criarTabelas(db);
    await semear(db);
  } finally {
    await db.end();
  }
})().catch(e => { console.error('[ERRO]', e); process.exit(1); });
