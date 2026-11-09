// Validação opt-in em MySQL real. Cria sua própria base aleatória e a remove ao
// encerrar. Não importa dados legados nem altera um database já existente.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const socket = process.env.MYSQL_TEST_SOCKET;
if (!socket?.startsWith('/')) throw new Error('Informe MYSQL_TEST_SOCKET apontando a um servidor local de testes.');
const schema = `eletrotech_qa_${randomBytes(8).toString('hex')}`;
const connection = await mysql.createConnection({ socketPath: socket, user: process.env.MYSQL_TEST_USER || 'root', password: process.env.MYSQL_TEST_PASSWORD || '', decimalNumbers: true, dateStrings: true });
let server, pool, createdDatabase = false;
const serve = process.argv.includes('--serve');
let checks = 0;
try {
  await connection.query(`CREATE DATABASE \`${schema}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  createdDatabase = true;
  await connection.query(`USE \`${schema}\``);
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = '';
  process.env.DB_SOCKET_PATH = socket;
  process.env.DB_NAME = schema;
  process.env.DB_USER = process.env.MYSQL_TEST_USER || 'root';
  process.env.DB_PASSWORD = process.env.MYSQL_TEST_PASSWORD || '';
  process.env.JWT_SECRET = randomBytes(32).toString('hex');
  // Executa os comandos documentados contra a base vazia, incluindo uma segunda
  // migração para verificar a versão já aplicada, sem tocar em outra base.
  for (const script of ['init.js', 'migrate.js', 'migrate.js']) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL(`../src/database/${script}`, import.meta.url))], { env: process.env, encoding: 'utf8' });
    assert.equal(result.status, 0, `${script}: ${result.stderr}`); checks++;
  }
  const [[migrationCount]] = await connection.query('SELECT COUNT(*) total FROM tabela_migracoes');
  assert.equal(Number(migrationCount.total),1); checks++;
  const { today } = await import('../src/shared/validation.js');
  const current = today(), month = current.slice(0, 7);
  const password = await bcrypt.hash('teste12345', 4);
  await connection.execute("INSERT INTO tabela_eletricistas (id,nome,cpf,data_contratacao) VALUES (1,'Ana (teste)','11111111111',?),(2,'Bruno (teste)','22222222222',?)", [current, current]);
  for (const row of [[1,'admin',1,null],[2,'11111111111',0,1],[3,'22222222222',0,2],[5,'supervisor',0,null],[6,'supervisor_b',0,null]]) await connection.execute('INSERT INTO tabela_usuarios (id,usuario,senha,is_admin,eletricista_id) VALUES (?,?,?,?,?)', [row[0],row[1],password,row[2],row[3]]);
  await connection.query("INSERT INTO tabela_usuario_permissao VALUES (5,'perfil_supervisor'),(6,'perfil_supervisor')");
  await connection.query('INSERT INTO tabela_supervisor_eletricista (eletricista_id,supervisor_id) VALUES (1,5),(2,6)');
  await connection.query("INSERT INTO tabela_produtos (id,nome_produto,vlr_unitario,qtd_estoque) VALUES (1,'Cabo (teste)',10,20)");
  await connection.query("INSERT INTO tabela_checklist (id,titulo,tipo,selecionado) VALUES (1,'Início (teste)','inicio',1),(2,'Fim (teste)','fim',1)");
  await connection.query("INSERT INTO tabela_checklist_perguntas (id,id_checklist,texto_pergunta,ordem,tipo_resposta,bloqueia_abertura) VALUES (11,1,'Condições de início verificadas?',1,'radio','nao'),(12,2,'Serviço concluído?',1,'radio','nao')");
  await connection.execute("INSERT INTO tabela_ordens_servico (id,eletricista_os,data_os,status,valor_servico) VALUES (1,1,?,'solicitada',150),(2,2,?,'solicitada',900)", [current,current]);
  const { default: app } = await import('../src/app.js');
  ({ pool } = await import('../src/config/database.js'));
  server = app.listen(serve ? 3417 : 0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  async function call(method, path, token, body, expected = 200, extra = {}) {
    const response = await fetch(`${base}${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}), ...extra }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = response.status === 204 ? null : await response.json();
    assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`); checks++;
    return { data: data?.data, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  const login = async name => call('POST','/auth/login',null,{nome:name,senha:'teste12345'});
  const admin = (await login('admin')).data.accessToken;
  const supervisor = (await login('supervisor')).data.accessToken;
  const electrician = (await login('11111111111')).data.accessToken;
  await call('GET','/usuarios?pageSize=1',admin);
  await call('GET','/supervisores',admin);
  await call('GET','/supervisores',supervisor,null,403);
  const team = (await call('GET','/equipe',supervisor)).data;
  assert.deepEqual(team.map(e=>e.id),[1]); checks++;
  assert.equal((await call('GET','/ordens-servico',supervisor)).data.paginacao.total,1); checks++;
  await call('GET','/ordens-servico/2',supervisor,null,403);
  await call('POST','/ordens-servico',supervisor,{eletricista_os:2,data_os:current},403);
  const monthly = (await call('POST','/metas',supervisor,{eletricista_meta:1,mes_meta:month,qtd_os_meta:2,vlr_meta:300},201)).data.id;
  await call('POST','/metas',supervisor,{eletricista_meta:1,tipo_periodo:'anual',mes_meta:current.slice(0,4),qtd_os_meta:20,vlr_meta:3000},201);
  await call('POST','/metas',supervisor,{eletricista_meta:1,mes_meta:month,qtd_os_meta:2},409);
  await call('POST','/ordens-servico/1/abertura',electrician,{itens:[{produtoId:1,quantidade:2}],checklistRespostas:{11:'sim'}});
  await call('POST','/ordens-servico/1/abertura',electrician,{itens:[{produtoId:1,quantidade:2}],checklistRespostas:{11:'sim'}},409);
  await call('POST','/ordens-servico/1/fechamento',electrician,{checklistRespostas:{12:'nao'},motivos:{12:'Conferência da supervisão'}});
  await call('POST','/ordens-servico/1/fechamento',electrician,{checklistRespostas:{12:'sim'}},409);
  await call('GET','/checklists/pendencias',supervisor);
  await call('GET','/checklists/pendencias/1/fim/relatorio',supervisor);
  await call('POST','/checklists/pendencias/1/fim/resolucao',supervisor,{acao:'autorizar',observacao:'Conferência concluída'});
  await call('PUT','/ordens-servico/1',supervisor,{valor_servico:1000},409);
  const goals = (await call('GET','/metas',electrician)).data;
  assert.equal(Number(goals.find(g=>g.id===monthly).faturamento_realizado),150); checks++;
  const dashboard = (await call('GET',`/dashboard?mes=${month}`,supervisor)).data;
  assert.equal(dashboard.totais.osFechadas,1); assert.equal(dashboard.totais.faturamentoRealizado,150); checks+=2;
  const nextId=(await call('POST','/ordens-servico',supervisor,{eletricista_os:1,data_os:current,valor_servico:50},201)).data.id;
  const simultaneous=await Promise.all([0,1].map(async () => {
    const response=await fetch(`${base}/ordens-servico/${nextId}/abertura`,{method:'POST',headers:{Authorization:`Bearer ${electrician}`,'Content-Type':'application/json'},body:JSON.stringify({itens:[{produtoId:1,quantidade:1}],checklistRespostas:{11:'sim'}})});
    return response.status;
  }));
  assert.deepEqual(simultaneous.sort(),[200,409]); checks++;
  const [[product]]=await connection.query('SELECT qtd_estoque FROM tabela_produtos WHERE id=1');
  assert.equal(product.qtd_estoque,17); checks++;
  await call('POST',`/ordens-servico/${nextId}/bloqueio`,supervisor,{motivo:'Bloqueio manual de teste'});
  const launch=(await call('POST','/lancamentos',admin,{tipo:'saida',data_baixa:current,id_eletricista:1},201)).data.id;
  await call('POST',`/lancamentos/${launch}/itens`,admin,{id_produto:1,quantidade:1,valor_unitario:10},201);
  await call('POST',`/lancamentos/${launch}/finalizacao`,admin);
  await call('POST',`/lancamentos/${launch}/finalizacao`,admin,null,409);
  await call('GET',`/lancamentos/${launch}/relatorio`,admin);
  await call('GET',`/baixas/${launch}`,admin);
  await call('GET','/movimentacoes',admin);
  await call('GET','/movimentacoes/totais?tipo=entrada',admin);
  await call('PUT','/supervisores/6/equipe',admin,{eletricistaIds:[1,2],transferir:true});
  await call('GET','/ordens-servico/1',supervisor,null,403);
  await call('PUT','/supervisores/5/equipe',admin,{eletricistaIds:[1],transferir:true});
  const session=await login('admin');
  const refreshed=await call('POST','/auth/refresh',null,{},200,{Cookie:session.cookie});
  await call('POST','/auth/refresh',null,{},401,{Cookie:session.cookie});
  await call('POST','/auth/logout',refreshed.data.accessToken,null,204,{Cookie:refreshed.cookie});
  await call('GET','/auth/me',refreshed.data.accessToken,null,401);
  console.log(`MySQL 8: ${checks} verificações aprovadas; schema, migração idempotente e abertura concorrente validados.`);
  if (serve) {
    console.log('Ambiente sintético para revisão visual: API 127.0.0.1:3417. Logins admin, supervisor e 11111111111; senha teste12345.');
    console.log('Pressione Enter para encerrar e remover a base de teste.');
    await new Promise(resolve => {
      process.once('SIGINT',resolve); process.once('SIGTERM',resolve);
      process.stdin.once('data', () => { process.stdin.pause(); resolve(); });
    });
  }
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  if (pool) await pool.end();
  if (createdDatabase) await connection.query(`DROP DATABASE \`${schema}\``);
  await connection.end();
}
