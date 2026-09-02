// ============================================================
// RANKING+ — Seed de histórico de notas por semestre (boletim)
// Executar uma vez: node banco_sql/seed_historico_notas.js
// Data: 2026-08-21
// ============================================================
//
// Contexto: a tabela `boletim` já tem a coluna `semestre_cursado` e o aluno
// id=21 (Enzio, conta real) já tinha 7 semestres de histórico real — mas os
// outros 20 alunos (dados de demonstração) só tinham o semestre atual
// (2026.1) cadastrado. Isso fazia o gráfico "Evolução das Notas" usar uma
// curva sintética (interpolação linear até o CRA atual) em vez de dados
// reais, e todo aluno tinha o mesmo formato de curva.
//
// Este script insere, para os alunos 1–20, boletim histórico real cobrindo
// os semestres anteriores ao atual (semestre_atual - 1 períodos, contados
// para trás a partir de 2026.1 — mesma lógica de período usada no endpoint
// /alunos/:id/desempenho-semestral). Cada aluno recebe um "perfil de
// desempenho" (consistente-alto, consistente-médio, crescente, decrescente,
// oscilante) sorteado, para que os gráficos fiquem genuinamente diferentes
// entre alunos — não só terminando em alturas diferentes.
//
// Não mexe nos boletim.id existentes (semestre atual 2026.1) — só adiciona
// linhas novas para os semestres anteriores.

const mysql = require('mysql2/promise');

const MENCAO_POR_FAIXA = (nota) => {
  if (nota >= 9)   return 'SS';
  if (nota >= 7)   return 'MS';
  if (nota >= 5)   return 'MM';
  if (nota >= 3)   return 'MI';
  return 'II';
};

const PERFIS = {
  consistente_alto:  (i, n) => 9.0 + (Math.random() * 0.8 - 0.4),
  consistente_medio: (i, n) => 7.2 + (Math.random() * 1.0 - 0.5),
  crescente:         (i, n) => 5.5 + (i / Math.max(n - 1, 1)) * 3.8 + (Math.random() * 0.6 - 0.3),
  decrescente:       (i, n) => 9.2 - (i / Math.max(n - 1, 1)) * 3.5 + (Math.random() * 0.6 - 0.3),
  oscilante:         (i, n) => 6.5 + Math.sin(i * 1.7) * 1.8 + (Math.random() * 0.5 - 0.25),
};
const NOMES_PERFIS = Object.keys(PERFIS);

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Gera as N períodos anteriores ao período atual (2026.1), mais antigo primeiro
function periodosAnteriores(qtd) {
  let ano = 2026, semestre = 1;
  const periodos = [];
  for (let i = 0; i < qtd; i++) {
    semestre--;
    if (semestre < 1) { semestre = 2; ano--; }
    periodos.unshift(`${ano}.${semestre}`);
  }
  return periodos;
}

async function main() {
  const db = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'universidade_ranking' });

  const [alunos] = await db.execute(
    'SELECT id, nome, semestre_atual FROM alunos WHERE id BETWEEN 1 AND 20 ORDER BY id'
  );
  const [disciplinas] = await db.execute('SELECT id FROM disciplinas');
  const disciplinaIds = disciplinas.map(d => d.id);

  let totalInseridas = 0;
  const resumo = [];

  for (const aluno of alunos) {
    const qtdPeriodosAnteriores = Math.max(0, (aluno.semestre_atual || 1) - 1);
    if (qtdPeriodosAnteriores === 0) {
      resumo.push(`  - ${aluno.nome} (id ${aluno.id}): 1º semestre, sem histórico anterior.`);
      continue;
    }

    const periodos = periodosAnteriores(qtdPeriodosAnteriores);
    const perfilNome = NOMES_PERFIS[Math.floor(Math.random() * NOMES_PERFIS.length)];
    const gerarNota = PERFIS[perfilNome];

    for (let i = 0; i < periodos.length; i++) {
      const periodo = periodos[i];
      // 2 disciplinas por período, sorteadas sem repetir dentro do mesmo período
      const shuffled = [...disciplinaIds].sort(() => Math.random() - 0.5);
      const discsDoSemestre = shuffled.slice(0, 2);

      for (const discId of discsDoSemestre) {
        const nota = clamp(Number(gerarNota(i, periodos.length).toFixed(1)), 3, 10);
        const mencao = MENCAO_POR_FAIXA(nota);
        const faltas = clamp(Math.round(Math.random() * (10 - nota)), 0, 8);
        const atividades = clamp(Math.round(6 + nota / 2 + Math.random() * 2), 4, 10);
        const participacao = clamp(Number((nota + (Math.random() * 1 - 0.5)).toFixed(1)), 3, 10);
        const dataAvaliacao = periodo.endsWith('.1') ? `${periodo.split('.')[0]}-06-15` : `${periodo.split('.')[0]}-11-25`;

        await db.execute(
          `INSERT INTO boletim (aluno_id, disciplina_id, faltas, mencao, nota_avaliacao, data_avaliacao, atividades_entregues, participacao_nota, semestre_cursado)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [aluno.id, discId, faltas, mencao, nota, dataAvaliacao, atividades, participacao, periodo]
        );
        totalInseridas++;
      }
    }
    resumo.push(`  - ${aluno.nome} (id ${aluno.id}): perfil "${perfilNome}", ${periodos.length} período(s) — ${periodos.join(', ')}`);
  }

  console.log(`\nHistórico inserido com sucesso — ${totalInseridas} linhas novas em boletim.\n`);
  console.log(resumo.join('\n'));

  await db.end();
}

main().catch(err => { console.error('Erro ao popular histórico:', err); process.exit(1); });
