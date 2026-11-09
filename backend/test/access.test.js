import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import initSqlJs from 'sql.js';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

const state = vi.hoisted(() => {
  process.env.OS_UPLOAD_DIR = `${process.env.TMPDIR || '/tmp'}/eletrotech-tests-${process.pid}`;
  return { db: null };
});
// Executa as consultas de isolamento em um banco em memória, sem tocar no MySQL do usuário.
vi.mock('../src/config/database.js', () => {
  async function query(sql, params = []) {
    const compatible = sql.replace(/JSON_ARRAYAGG/gi, 'json_group_array').replace(/JSON_ARRAY\(\)/gi, "'[]'").replace(/ FOR UPDATE/gi, '');
    const stmt = state.db.prepare(compatible);
    try {
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      if (/^\s*SELECT/i.test(sql)) return rows;
      return { insertId: state.db.exec('SELECT last_insert_rowid()')[0].values[0][0], affectedRows: state.db.getRowsModified() };
    } finally { stmt.free(); }
  }
  return { query, transaction: async (work) => {
    state.db.run('BEGIN');
    try { const value = await work({ execute: async (sql, params) => [await query(sql, params)] }); state.db.run('COMMIT'); return value; }
    catch (error) { state.db.run('ROLLBACK'); throw error; }
  } };
});
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { query } from '../src/config/database.js';
let SQL, password;
const month = new Date().toISOString().slice(0, 7);
const token = (id, extra = {}) => jwt.sign({ id, versao: Number(state.db.exec('SELECT sessao_versao FROM tabela_usuarios WHERE id=' + Number(id))[0]?.values[0][0] || 0), ...extra }, env.jwtSecret, { expiresIn: '1h' });
const asUser = (method, path, user = 2) => request(app)[method](`/api/v1${path}`).set('Authorization', `Bearer ${token(user)}`);

beforeAll(async () => { SQL = await initSqlJs(); password = await bcrypt.hash('senha123', 4); });
beforeEach(async () => {
  state.db = new SQL.Database();
  state.db.create_function('NOW', () => new Date().toISOString().slice(0,19).replace('T',' '));
  state.db.create_function('DATE_FORMAT', (value, _format) => String(value).slice(0, 7));
  state.db.run(`
    CREATE TABLE tabela_eletricistas(id INTEGER PRIMARY KEY AUTOINCREMENT,nome TEXT,cpf TEXT,data_contratacao TEXT,data_demissao TEXT);
    CREATE TABLE tabela_usuarios(id INTEGER PRIMARY KEY AUTOINCREMENT,usuario TEXT UNIQUE,senha TEXT,is_admin INTEGER,eletricista_id INTEGER,sessao_versao INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE tabela_usuario_permissao(usuario_id INTEGER,permissao TEXT,PRIMARY KEY(usuario_id,permissao));
    CREATE TABLE tabela_metas(id INTEGER PRIMARY KEY AUTOINCREMENT,eletricista_meta INTEGER,mes_meta TEXT,vlr_meta REAL,tipo_periodo TEXT DEFAULT 'mensal',qtd_os_meta INTEGER,criado_por INTEGER);
    CREATE TABLE tabela_ordens_servico(id INTEGER PRIMARY KEY AUTOINCREMENT,eletricista_os INTEGER,data_os TEXT,status TEXT,data_fechamento TEXT,valor_servico REAL DEFAULT 0,descricao TEXT,local_servico TEXT);
    CREATE TABLE tabela_produtos(id INTEGER PRIMARY KEY,nome_produto TEXT,qtd_estoque INTEGER,vlr_unitario REAL);
    CREATE TABLE tabela_os_materiais(id INTEGER PRIMARY KEY,id_os INTEGER,id_produto INTEGER,qtd_utilizada INTEGER);
    CREATE TABLE tabela_movimentacoes(id INTEGER PRIMARY KEY,id_os INTEGER,id_produto INTEGER,tipo TEXT,quantidade INTEGER,valor_unitario REAL,data_mov TEXT,origem TEXT,id_usuario INTEGER,id_baixa INTEGER);
    CREATE TABLE tabela_checklist(id INTEGER PRIMARY KEY,titulo TEXT,tipo TEXT,selecionado INTEGER);
    CREATE TABLE tabela_checklist_perguntas(id INTEGER PRIMARY KEY,id_checklist INTEGER,texto_pergunta TEXT,tipo_resposta TEXT,bloqueia_abertura TEXT,ordem INTEGER);
    CREATE TABLE tabela_os_checklist_respostas(id INTEGER PRIMARY KEY,id_os INTEGER,id_pergunta INTEGER,resposta TEXT,motivo_nao TEXT);
    CREATE TABLE tabela_os_comentarios(id INTEGER PRIMARY KEY,id_os INTEGER,comentario TEXT,data_comentario TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE tabela_supervisor_eletricista(eletricista_id INTEGER PRIMARY KEY,supervisor_id INTEGER);
    CREATE TABLE tabela_os_checklist_status(id INTEGER PRIMARY KEY,id_os INTEGER,tipo TEXT,bloqueado INTEGER,observacao TEXT,data_bloqueio TEXT,data_finalizacao TEXT,decisao TEXT,id_usuario INTEGER,origem TEXT DEFAULT 'checklist',status_anterior TEXT);
    CREATE TABLE tabela_os_eventos(id INTEGER PRIMARY KEY,id_os INTEGER,id_usuario INTEGER,acao TEXT,observacao TEXT,data_evento TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE tabela_sessoes(token_hash TEXT PRIMARY KEY,usuario_id INTEGER,expira_em TEXT);
    CREATE TABLE tabela_os_fotos(id INTEGER PRIMARY KEY,id_os INTEGER,id_usuario INTEGER,etapa TEXT,arquivo TEXT,content_type TEXT,criado_em TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE tabela_baixas(id INTEGER PRIMARY KEY,tipo TEXT,data_baixa TEXT,id_eletricista INTEGER,observacao TEXT,status TEXT,id_usuario INTEGER,data_abertura TEXT,data_finalizacao TEXT);
    CREATE TABLE tabela_baixa_itens(id INTEGER PRIMARY KEY,id_baixa INTEGER,id_produto INTEGER,quantidade INTEGER,valor_unitario REAL);
    INSERT INTO tabela_supervisor_eletricista VALUES (1,5),(2,5);
    INSERT INTO tabela_eletricistas VALUES (1,'Ana','11111111111','2026-01-01',NULL),(2,'Bruno','22222222222','2026-01-01',NULL);
    INSERT INTO tabela_metas (id,eletricista_meta,mes_meta,vlr_meta) VALUES (1,1,'${month}',100),(2,2,'${month}',900);
    INSERT INTO tabela_ordens_servico (id,eletricista_os,data_os,status,data_fechamento) VALUES (1,1,'${month}-01','solicitada',NULL),(2,2,'${month}-01','solicitada',NULL),(3,1,'${month}-02','fechada','${month}-02');
    INSERT INTO tabela_produtos VALUES (1,'Cabo',20,10);
    INSERT INTO tabela_os_materiais VALUES (1,3,1,2),(2,2,1,9);
    INSERT INTO tabela_movimentacoes (id,id_os,id_produto,tipo,quantidade,valor_unitario,data_mov,origem) VALUES (1,3,1,'saida',2,10,'${month}-02','OS 3'),(2,2,1,'saida',9,10,'${month}-01','OS 2');
    INSERT INTO tabela_checklist VALUES (1,'Início','inicio',1),(2,'Fim','fim',1);
    INSERT INTO tabela_checklist_perguntas VALUES (11,1,'Seguro?','radio',NULL,1),(12,2,'Concluído?','radio',NULL,1);
    INSERT INTO tabela_usuario_permissao VALUES (2,'produtos'),(2,'eletricistas'),(2,'checklist'),(4,'metas'),(5,'perfil_supervisor'),(5,'eletricistas'),(5,'produtos');
  `);
  for (const row of [[1,'admin',1,null],[2,'11111111111',0,1],[3,'22222222222',0,2],[4,'gestor',0,null],[5,'supervisor',0,null]]) {
    await query('INSERT INTO tabela_usuarios (id,usuario,senha,is_admin,eletricista_id) VALUES (?,?,?,?,?)', [row[0],row[1],password,row[2],row[3]]);
  }
});
afterEach(async () => {
  const photos=await query('SELECT arquivo FROM tabela_os_fotos');
  for (const photo of photos) await unlink(join(process.env.OS_UPLOAD_DIR,photo.arquivo)).catch(() => {});
  state.db.close();
});

describe('Login e perfil de eletricista', () => {
  it('usa o mesmo login e limita permissões antigas aos três módulos', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ nome: '111.111.111-11', senha: 'senha123' });
    expect(res.status).toBe(200);
    expect(res.body.data.usuario).toMatchObject({ perfil: 'eletricista', isAdmin: false, eletricistaId: 1, destino: '/menu', permissoes: ['menu','ordemServico','metas'] });
    expect(res.body.data.accessToken).toBeTruthy();
  });
  it('cria o login e as permissões junto com o cadastro do eletricista', async () => {
    const res = await asUser('post','/eletricistas',1).send({ nome:'Carla',cpf:'33333333333',data_contratacao:'2026-01-01',senha:'senha123' });
    expect(res.status).toBe(201);
    const user = (await query('SELECT * FROM tabela_usuarios WHERE eletricista_id=?',[res.body.data.id]))[0];
    expect(user.is_admin).toBe(0);
    expect((await query('SELECT permissao FROM tabela_usuario_permissao WHERE usuario_id=? ORDER BY permissao',[user.id])).map(r=>r.permissao)).toEqual(['menu','metas','ordemServico']);
    const login = await request(app).post('/api/v1/auth/login').send({ nome:'33333333333',senha:'senha123' });
    expect(login.status).toBe(200);
  });
  it('libera acesso para eletricista antigo ao definir a senha na edição', async () => {
    await query("INSERT INTO tabela_eletricistas VALUES (3,'Carla','33333333333','2026-01-01',NULL)");
    expect((await asUser('put','/eletricistas/3',1).send({nome:'Carla',senha:'senha123'})).status).toBe(200);
    const res=await request(app).post('/api/v1/auth/login').send({nome:'33333333333',senha:'senha123'});
    expect(res.status).toBe(200);
    expect(res.body.data.usuario.permissoes).toEqual(['menu','ordemServico','metas']);
    // Uma nova edição deve atualizar a mesma conta, preservando o vínculo único.
    expect((await asUser('put','/eletricistas/3',1).send({senha:'novaSenha123'})).status).toBe(200);
    expect((await query('SELECT id FROM tabela_usuarios WHERE eletricista_id=3')).length).toBe(1);
    expect((await request(app).post('/api/v1/auth/login').send({nome:'33333333333',senha:'senha123'})).status).toBe(401);
  });
  it('rejeita senha incorreta e acesso anônimo', async () => {
    expect((await request(app).post('/api/v1/auth/login').send({nome:'11111111111',senha:'errada'})).status).toBe(401);
    expect((await request(app).get('/api/v1/metas')).status).toBe(401);
  });
  it('revalida o perfil mesmo com token antigo de administrador', async () => {
    const res = await request(app).get('/api/v1/produtos').set('Authorization',`Bearer ${token(2,{isAdmin:true,permissoes:['produtos']})}`);
    expect(res.status).toBe(403);
  });
  it('bloqueia o usuário demitido inclusive com token emitido anteriormente', async () => {
    await query("UPDATE tabela_eletricistas SET data_demissao='2026-01-02' WHERE id=1");
    expect((await asUser('get','/dashboard')).status).toBe(403);
    expect((await request(app).post('/api/v1/auth/login').send({nome:'11111111111',senha:'senha123'})).status).toBe(403);
  });
  it('impede promover uma conta de eletricista a administrador', async () => {
    expect((await asUser('put','/usuarios/2',1).send({is_admin:1})).status).toBe(422);
  });
  it.each(['/usuarios','/eletricistas','/produtos','/checklists','/movimentacoes','/movimentacoes/totais','/lancamentos','/eletricistas/2/ordens-servico'])('nega acesso direto a %s', async path => {
    expect((await asUser('get',path)).status).toBe(403);
  });
  it('nega acesso ao assistente fora dos módulos do perfil', async () => {
    expect((await asUser('post','/chat').send({mensagem:'teste'})).status).toBe(403);
  });
});

describe('Isolamento dos dados', () => {
  it('retorna somente as metas próprias mesmo com filtros de outro eletricista', async () => {
    for (const filter of ['', '?eletricistaId=2', '?filtro_eletricista=2']) {
      const res=await asUser('get',`/metas${filter}`);
      expect(res.status).toBe(200);
      expect(res.body.data.map(r=>r.id)).toEqual([1]);
    }
    expect((await asUser('get','/metas?mes=2000-01')).body.data).toEqual([]);
    expect((await asUser('get','/metas',3)).body.data.map(r=>r.id)).toEqual([2]);
  });
  it.each([['post','/metas'],['put','/metas/1'],['put','/metas/2'],['delete','/metas/1'],['delete','/metas/2']])('impede alterar metas: %s %s', async (method,path) => {
    expect((await asUser(method,path).send({eletricista_meta:1,mes_meta:month,vlr_meta:1})).status).toBe(403);
    expect((await query('SELECT SUM(vlr_meta) total FROM tabela_metas'))[0].total).toBe(1000);
  });
  it('lista e pagina somente OS próprias e limita as opções da equipe', async () => {
    const res=await asUser('get','/ordens-servico?eletricistaId=2&pageSize=1');
    expect(res.status).toBe(200);
    expect(res.body.data.paginacao.total).toBe(2);
    expect(res.body.data.ordensServico.map(r=>r.id)).toEqual([3]);
    expect(res.body.data.eletricistasAtivos.map(r=>r.id)).toEqual([1]);
    expect(res.body.data.checklistInicio.perguntas[0]).toMatchObject({id:11,pergunta:'Seguro?',tipo_resposta:'sim_nao'});
    expect((await asUser('get','/ordens-servico?status=solicitada')).body.data.ordensServico.map(r=>r.id)).toEqual([1]);
    expect((await asUser('get','/ordens-servico/opcoes')).body.data.eletricistas.map(r=>r.id)).toEqual([1]);
  });
  it.each([['get','/ordens-servico/2'],['post','/ordens-servico/2/abertura'],['post','/ordens-servico/2/fechamento'],['post','/ordens-servico/2/comentarios']])('bloqueia ID de outra pessoa: %s %s',async(method,path)=>{
    expect((await asUser(method,path).send({comentario:'indevido'})).status).toBe(403);
    expect((await query('SELECT * FROM tabela_os_comentarios')).length).toBe(0);
  });
  it('permite detalhes, abertura, fechamento e comentário na própria OS', async () => {
    expect((await asUser('get','/ordens-servico/1')).status).toBe(200);
    const opened=await asUser('post','/ordens-servico/1/abertura').send({id_produto:[1],qtd_utilizada:[2],checklistRespostas:{11:'sim'}});
    expect(opened.status).toBe(200);
    expect((await query('SELECT qtd_estoque FROM tabela_produtos WHERE id=1'))[0].qtd_estoque).toBe(18);
    expect((await asUser('post','/ordens-servico/1/fechamento').send({checklistRespostas:{12:'sim'}})).status).toBe(200);
    expect((await asUser('post','/ordens-servico/1/comentarios').send({comentario:'Concluído'})).status).toBe(201);
    expect((await query('SELECT status FROM tabela_ordens_servico WHERE id=1'))[0].status).toBe('fechada');
    expect((await asUser('post','/ordens-servico').send({eletricista_os:1})).status).toBe(403);
  });
  it('filtra todos os indicadores e gráficos do dashboard', async () => {
    const res=await asUser('get',`/dashboard?eletricistaId=2&mes=${month}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({perfil:'eletricista',totais:{os:2,metas:100,eletricistas:1,produtos:1},eletricistaDashboard:{totalOs:1,produtosUtilizados:2,metaAtual:100}});
    expect(res.body.data.graficoEletricista).toEqual([{eletricista:'Ana',total:2}]);
    expect(res.body.data.graficoMes).toEqual([{mes:month,total:2}]);
    expect(res.body.data.graficoMovimentacao).toEqual([{mes:month,entrada:0,saida:20}]);
  });
  it('mantém acesso geral do administrador e gestão por usuário padrão autorizado', async () => {
    expect((await asUser('get','/metas',1)).body.data).toHaveLength(2);
    expect((await asUser('get','/ordens-servico',1)).body.data.paginacao.total).toBe(3);
    expect((await asUser('get','/dashboard',1)).body.data.totais).toMatchObject({os:3,metas:1000,eletricistas:2});
    expect((await asUser('put','/metas/1',4).send({vlr_meta:120})).status).toBe(403);
    expect((await asUser('get','/dashboard',4)).status).toBe(403);
  });
});

// A mesma base valida o perfil e a migração aditiva de equipes e metas.
describe('Acesso do supervisor', () => {
  it('permite ao administrador criar, editar e remover o perfil de supervisor', async () => {
    const created = await asUser('post','/usuarios',1).send({usuario:'novo_supervisor',senha:'senha123',perfil:'supervisor',permissoes:['eletricistas']});
    expect(created.status).toBe(201);
    const userId = created.body.data.id;
    const login = await request(app).post('/api/v1/auth/login').send({nome:'novo_supervisor',senha:'senha123'});
    expect(login.status).toBe(200);
    expect(login.body.data.usuario).toMatchObject({perfil:'supervisor',isAdmin:false,isSupervisor:true,permissoes:['menu','ordemServico','metas','checklist']});
    expect((await asUser('get','/usuarios',1)).body.data.find(user=>user.id===userId).perfil).toBe('supervisor');
    // A edição parcial preserva o perfil quando só a senha muda.
    expect((await asUser('put',`/usuarios/${userId}`,1).send({senha:'novaSenha123'})).status).toBe(200);
    expect((await asUser('get','/auth/me',userId)).body.data.perfil).toBe('supervisor');
    // A revogação vale imediatamente, mesmo para o token recebido antes dela.
    const oldToken = token(userId);
    expect((await asUser('put',`/usuarios/${userId}`,1).send({perfil:'padrao',permissoes:[]})).status).toBe(200);
    expect((await request(app).post('/api/v1/ordens-servico').set('Authorization',`Bearer ${oldToken}`).send({eletricista_os:1})).status).toBe(403);
    expect((await asUser('put',`/usuarios/${userId}`,1).send({perfil:'supervisor'})).status).toBe(200);
    expect((await asUser('get','/auth/me',userId)).body.data.perfil).toBe('supervisor');
  });

  it('cria e acompanha OS da equipe, metas e checklists', async () => {
    const os = await asUser('post','/ordens-servico',5).send({eletricista_os:2,data_os:`${month}-01`});
    expect(os.status).toBe(201);
    expect((await asUser('get',`/ordens-servico/${os.body.data.id}`,5)).status).toBe(200);
    expect((await asUser('post',`/ordens-servico/${os.body.data.id}/comentarios`,5).send({comentario:'Atribuída pela supervisão'})).status).toBe(201);
    expect((await asUser('post',`/ordens-servico/${os.body.data.id}/abertura`,5).send({id_produto:[1],qtd_utilizada:[1],checklistRespostas:{11:'sim'}})).status).toBe(200);
    expect((await asUser('post',`/ordens-servico/${os.body.data.id}/fechamento`,5).send({checklistRespostas:{12:'sim'}})).status).toBe(200);
    const meta = await asUser('post','/metas',5).send({eletricista_meta:1,mes_meta:'2027-01',vlr_meta:1500});
    expect(meta.status).toBe(201);
    expect((await asUser('put',`/metas/${meta.body.data.id}`,5).send({vlr_meta:1600})).status).toBe(200);
    const checklist = await asUser('post','/checklists',5).send({titulo:'Segurança',tipo:'inicio',pergunta:['Usando EPI?'],tipo_resposta:['radio']});
    expect(checklist.status).toBe(201);
    expect((await asUser('get',`/checklists/${checklist.body.data.id}/perguntas`,5)).body.data[0].texto_pergunta).toBe('Usando EPI?');
  });

  it('nega consultas e alterações nos cadastros de usuários e eletricistas', async () => {
    const routes = [
      ['get','/usuarios'],['post','/usuarios'],['put','/usuarios/1'],['delete','/usuarios/1'],
      ['get','/eletricistas'],['post','/eletricistas'],['put','/eletricistas/1'],
      ['patch','/eletricistas/1/demissao'],['patch','/eletricistas/1/reativacao'],
      ['get','/produtos'],['get','/movimentacoes'],['get','/lancamentos'],
    ];
    for (const [method,path] of routes) expect((await asUser(method,path,5).send({usuario:'indevido',senha:'senha123',perfil:'admin'})).status).toBe(403);
    expect((await query('SELECT COUNT(*) total FROM tabela_usuarios'))[0].total).toBe(5);
    expect((await query('SELECT COUNT(*) total FROM tabela_eletricistas'))[0].total).toBe(2);
    expect((await asUser('put','/usuarios/2',1).send({perfil:'supervisor'})).status).toBe(422);
    expect((await asUser('put','/usuarios/1',1).send({perfil:'supervisor'})).status).toBe(409);
  });

  it('fornece opções de atribuição e dados da equipe sem expor os cadastros pessoais', async () => {
    const options = await asUser('get','/metas/opcoes',5);
    expect(options.status).toBe(200);
    expect(options.body.data).toEqual([{id:1,nome:'Ana'},{id:2,nome:'Bruno'}]);
    const orders = await asUser('get','/ordens-servico',5);
    expect(orders.body.data).toMatchObject({podeSolicitar:true,paginacao:{total:3}});
    expect((await asUser('get','/metas',5)).body.data).toHaveLength(2);
    expect((await asUser('get','/dashboard',5)).body.data).toMatchObject({perfil:'supervisor',totais:{os:3,metas:1000}});
    // O novo endpoint auxiliar continua indisponível ao eletricista.
    expect((await asUser('get','/metas/opcoes',2)).status).toBe(403);
  });
});

// Os cenários abaixo exercitam as regras confirmadas para cada instalação.
describe('Equipes de supervisão e isolamento por vínculo', () => {
  beforeEach(async () => {
    await query('INSERT INTO tabela_usuarios (id,usuario,senha,is_admin,eletricista_id) VALUES (6,?,?,0,NULL)', ['outro_supervisor',password]);
    await query("INSERT INTO tabela_usuario_permissao VALUES (6,'perfil_supervisor')");
    await query('UPDATE tabela_supervisor_eletricista SET supervisor_id=6 WHERE eletricista_id=2');
  });
  it.each([2,5,6])('reserva a seção de supervisores ao admin (usuário %s)', async user => {
    for (const [method,path] of [['get','/supervisores'],['post','/supervisores'],['put','/supervisores/5'],['put','/supervisores/5/equipe']]) {
      expect((await asUser(method,path,user).send({usuario:'indevido',senha:'senha123',eletricistaIds:[2]})).status).toBe(403);
    }
  });
  it('cria login de supervisor e associa apenas eletricistas ativos', async () => {
    const created=await asUser('post','/supervisores',1).send({usuario:'supervisor_novo',senha:'senha123'});
    expect(created.status).toBe(201);
    const sid=created.body.data.id;
    const login=await request(app).post('/api/v1/auth/login').send({nome:'supervisor_novo',senha:'senha123'});
    expect(login.body.data.usuario.perfil).toBe('supervisor');
    expect((await asUser('put',`/supervisores/${sid}/equipe`,1).send({eletricistaIds:[1]})).status).toBe(409);
    expect((await asUser('put',`/supervisores/${sid}/equipe`,1).send({eletricistaIds:[1],transferir:true})).status).toBe(200);
    expect((await asUser('get','/metas/opcoes',sid)).body.data).toEqual([{id:1,nome:'Ana'}]);
    await query("UPDATE tabela_eletricistas SET data_demissao='2026-01-02' WHERE id=2");
    expect((await asUser('put',`/supervisores/${sid}/equipe`,1).send({eletricistaIds:[1,2],transferir:true})).status).toBe(422);
    expect((await query('SELECT * FROM tabela_supervisor_eletricista WHERE supervisor_id=?',[sid])).map(r=>r.eletricista_id)).toEqual([1]);
  });
  it('filtra OS, opções, metas, dashboard e gráficos pela equipe', async () => {
    expect((await asUser('get','/ordens-servico',5)).body.data.ordensServico.map(r=>r.id)).toEqual([3,1]);
    expect((await asUser('get','/ordens-servico?eletricistaId=2',5)).body.data.ordensServico).toEqual([]);
    expect((await asUser('get','/ordens-servico/opcoes',5)).body.data.eletricistas).toEqual([{id:1,nome:'Ana'}]);
    expect((await asUser('get','/metas',5)).body.data.map(r=>r.id)).toEqual([1]);
    expect((await asUser('get','/equipe',5)).body.data.map(r=>r.nome)).toEqual(['Ana']);
    expect((await asUser('get','/metas?eletricistaId=2',5)).body.data).toEqual([]);
    const dashboard=(await asUser('get','/dashboard',5)).body.data;
    expect(dashboard.totais).toMatchObject({os:2,eletricistas:1,metas:100});
    expect(dashboard.graficoEletricista).toEqual([{eletricista:'Ana',total:2}]);
    expect(dashboard.graficoMovimentacao).toEqual([{mes:month,entrada:0,saida:20}]);
  });
  it.each([['get','/ordens-servico/2'],['post','/ordens-servico/2/abertura'],['post','/ordens-servico/2/fechamento'],['post','/ordens-servico/2/bloqueio'],['post','/ordens-servico/2/comentarios'],['put','/ordens-servico/2'],['get','/ordens-servico/2/fotos/1'],['get','/checklists/pendencias/2/inicio/relatorio'],['post','/checklists/pendencias/2/inicio/resolucao']])('nega acesso por ID fora da equipe: %s %s', async (method,path) => {
    const response=await asUser(method,path,5).send({motivo:'Teste',observacao:'Teste',acao:'autorizar',comentario:'Teste'});
    expect(response.status).toBe(403);
  });
  it('nega atribuir OS e alterar metas de outro supervisor', async () => {
    expect((await asUser('post','/ordens-servico',5).send({eletricista_os:2,data_os:`${month}-01`})).status).toBe(403);
    expect((await asUser('post','/metas',5).send({eletricista_meta:2,tipo_periodo:'anual',mes_meta:month.slice(0,4),qtd_os_meta:10})).status).toBe(403);
    expect((await asUser('put','/metas/2',5).send({vlr_meta:100})).status).toBe(403);
    expect((await asUser('delete','/metas/2',5)).status).toBe(403);
  });
  it('revoga o acesso com token antigo quando o admin transfere a equipe', async () => {
    const oldToken=token(5);
    expect((await asUser('put','/supervisores/6/equipe',1).send({eletricistaIds:[1,2],transferir:true})).status).toBe(200);
    expect((await request(app).get('/api/v1/ordens-servico/1').set('Authorization',`Bearer ${oldToken}`)).status).toBe(403);
    expect((await asUser('get','/dashboard',5)).body.data.totais.os).toBe(0);
    expect((await asUser('get','/metas/opcoes',5)).body.data).toEqual([]);
  });
  it('remove o vínculo ao desligar um eletricista ou remover o perfil do supervisor', async () => {
    expect((await asUser('patch','/eletricistas/1/demissao',1)).status).toBe(200);
    expect((await query('SELECT * FROM tabela_supervisor_eletricista WHERE eletricista_id=1'))).toEqual([]);
    expect((await asUser('patch','/eletricistas/1/reativacao',1)).status).toBe(200);
    expect((await asUser('get','/metas/opcoes',5)).body.data).toEqual([]);
    expect((await asUser('put','/usuarios/6',1).send({perfil:'padrao',permissoes:[]})).status).toBe(200);
    expect((await query('SELECT * FROM tabela_supervisor_eletricista WHERE supervisor_id=6'))).toEqual([]);
  });
});

describe('Ciclo de OS e revisão de bloqueios', () => {
  it('bloqueia manualmente e restaura o estado anterior sem repetir estoque', async () => {
    expect((await asUser('post','/ordens-servico/1/bloqueio',5).send({motivo:'Aguardando material'})).status).toBe(200);
    expect((await asUser('post','/ordens-servico/1/fechamento').send({checklistRespostas:{12:'sim'}})).status).toBe(409);
    expect((await asUser('post','/checklists/pendencias/1/inicio/resolucao').send({acao:'autorizar',observacao:'Tentativa indevida'})).status).toBe(403);
    expect((await asUser('post','/checklists/pendencias/1/inicio/resolucao',5).send({acao:'autorizar',observacao:'Material entregue'})).status).toBe(200);
    expect((await query('SELECT status FROM tabela_ordens_servico WHERE id=1'))[0].status).toBe('solicitada');
    expect((await asUser('post','/ordens-servico/1/abertura').send({itens:[],checklistRespostas:{11:'sim'}})).status).toBe(200);
    expect((await asUser('post','/ordens-servico/1/bloqueio',5).send({motivo:'Pausa operacional'})).status).toBe(200);
    expect((await asUser('post','/checklists/pendencias/1/inicio/resolucao',5).send({acao:'autorizar',observacao:'Condições restabelecidas'})).status).toBe(200);
    expect((await query('SELECT status FROM tabela_ordens_servico WHERE id=1'))[0].status).toBe('aberta');
    expect((await query('SELECT qtd_estoque FROM tabela_produtos WHERE id=1'))[0].qtd_estoque).toBe(20);
  });
  it('persiste pendência de início e impede contornar o bloqueio pelo fechamento', async () => {
    await query("UPDATE tabela_checklist_perguntas SET bloqueia_abertura='nao' WHERE id=11");
    const opened=await asUser('post','/ordens-servico/1/abertura').send({id_produto:[1],qtd_utilizada:[2],checklistRespostas:{11:'nao'}});
    expect(opened.body.data.bloqueada).toBe(true);
    expect((await asUser('get','/checklists/pendencias',5)).body.data[0]).toMatchObject({id_os:1,tipo:'inicio',origem:'checklist'});
    expect((await asUser('post','/ordens-servico/1/fechamento').send({checklistRespostas:{12:'sim'}})).status).toBe(409);
    expect((await asUser('post','/ordens-servico/1/abertura').send({id_produto:[1],qtd_utilizada:[2],checklistRespostas:{11:'sim'}})).status).toBe(409);
    expect((await query('SELECT qtd_estoque FROM tabela_produtos WHERE id=1'))[0].qtd_estoque).toBe(18);
    expect((await asUser('post','/checklists/pendencias/1/inicio/resolucao',5).send({acao:'negar',observacao:'Ainda há pendência'})).status).toBe(200);
    expect((await query('SELECT status FROM tabela_ordens_servico WHERE id=1'))[0].status).toBe('bloqueada');
    expect((await asUser('post','/checklists/pendencias/1/inicio/resolucao',5).send({acao:'autorizar',observacao:'Pendência corrigida'})).status).toBe(200);
    expect((await query('SELECT status FROM tabela_ordens_servico WHERE id=1'))[0].status).toBe('aberta');
  });
  it('exige justificativa no fim e só registra conclusão após a autorização', async () => {
    await query("UPDATE tabela_checklist_perguntas SET bloqueia_abertura='nao' WHERE id=12");
    await asUser('post','/ordens-servico/1/abertura').send({itens:[],checklistRespostas:{11:'sim'}});
    expect((await asUser('post','/ordens-servico/1/fechamento').send({checklistRespostas:{12:'nao'}})).status).toBe(422);
    const closed=await asUser('post','/ordens-servico/1/fechamento').send({checklistRespostas:{12:'nao'},motivos:{12:'Necessária revisão'}});
    expect(closed.body.data.bloqueada).toBe(true);
    expect((await query('SELECT data_fechamento FROM tabela_ordens_servico WHERE id=1'))[0].data_fechamento).toBeNull();
    expect((await asUser('post','/checklists/pendencias/1/fim/resolucao',5).send({acao:'autorizar',observacao:'Revisão concluída'})).status).toBe(200);
    const os=(await query('SELECT * FROM tabela_ordens_servico WHERE id=1'))[0];
    expect(os.status).toBe('fechada'); expect(os.data_fechamento).toBeTruthy();
    expect((await asUser('post','/checklists/pendencias/1/fim/resolucao',5).send({acao:'autorizar',observacao:'Repetida'})).status).toBe(409);
    expect((await asUser('put','/ordens-servico/1',5).send({valor_servico:900})).status).toBe(409);
    expect((await asUser('post','/ordens-servico/1/bloqueio',5).send({motivo:'Alteração indevida'})).status).toBe(409);
    const history=(await asUser('get','/ordens-servico/1')).body.data.historico;
    expect(history.some(h=>h.acao==='autorizar_fim' && h.id_usuario===5)).toBe(true);
  });
  it.each([
    {itens:[{produtoId:1,quantidade:1},{produtoId:1,quantidade:1}],checklistRespostas:{11:'sim'}},
    {itens:[{produtoId:1,quantidade:-1}],checklistRespostas:{11:'sim'}},
    {itens:[],checklistRespostas:{11:'talvez'}},
    {itens:'{invalido',checklistRespostas:{11:'sim'}},
  ])('rejeita abertura inválida sem alterar estoque ou respostas', async body => {
    expect((await asUser('post','/ordens-servico/1/abertura').send(body)).status).toBe(422);
    expect((await query('SELECT qtd_estoque FROM tabela_produtos WHERE id=1'))[0].qtd_estoque).toBe(20);
    expect((await query('SELECT * FROM tabela_os_checklist_respostas WHERE id_os=1'))).toEqual([]);
  });
  it('desfaz respostas e materiais quando não há saldo e preserva modelos já usados', async () => {
    expect((await asUser('post','/ordens-servico/1/abertura').send({itens:[{produtoId:1,quantidade:99}],checklistRespostas:{11:'sim'}})).status).toBe(409);
    expect((await query('SELECT * FROM tabela_os_checklist_respostas WHERE id_os=1'))).toEqual([]);
    await asUser('post','/ordens-servico/1/abertura').send({itens:[],checklistRespostas:{11:'sim'}});
    await query('UPDATE tabela_checklist SET selecionado=0 WHERE id=1');
    expect((await asUser('delete','/checklists/1',5)).status).toBe(409);
    expect((await query('SELECT * FROM tabela_os_checklist_respostas WHERE id_os=1'))).toHaveLength(1);
  });
  it('entrega contagem e texto de perguntas no contrato consumido pela tela', async () => {
    expect((await asUser('get','/checklists',5)).body.data.find(c=>c.id===1).qtd_perguntas).toBe(1);
    expect((await asUser('get','/checklists/1/perguntas',5)).body.data[0].pergunta).toBe('Seguro?');
  });
  it('permite foto autenticada e impede acesso de outro eletricista', async () => {
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS1kAAAAASUVORK5CYII=','base64');
    const response=await asUser('post','/ordens-servico/1/comentarios').field('comentario','Foto de campo').attach('foto',png,{filename:'foto.png',contentType:'image/png'});
    expect(response.status).toBe(201);
    const photo=(await query('SELECT * FROM tabela_os_fotos WHERE id_os=1'))[0];
    expect((await asUser('get',`/ordens-servico/1/fotos/${photo.id}`)).headers['content-type']).toMatch(/image\/png/);
    expect((await asUser('get',`/ordens-servico/1/fotos/${photo.id}`,3)).status).toBe(403);
  });
});

describe('Metas mensais e anuais de OS e faturamento', () => {
  it('acompanha quantidade e faturamento pela conclusão, sem incluir OS abertas nem outra pessoa', async () => {
    await query("UPDATE tabela_ordens_servico SET valor_servico=25 WHERE id=3");
    await query("UPDATE tabela_ordens_servico SET valor_servico=9000 WHERE id=2");
    expect((await asUser('put','/metas/1',5).send({qtd_os_meta:2,vlr_meta:100})).status).toBe(200);
    const annual=await asUser('post','/metas',5).send({eletricista_meta:1,tipo_periodo:'anual',mes_meta:month.slice(0,4),qtd_os_meta:20,vlr_meta:1000});
    expect(annual.status).toBe(201);
    expect((await asUser('put','/ordens-servico/1',5).send({valor_servico:75,descricao:'Serviço de campo'})).status).toBe(200);
    await asUser('post','/ordens-servico/1/abertura').send({itens:[],checklistRespostas:{11:'sim'}});
    await asUser('post','/ordens-servico/1/fechamento').send({checklistRespostas:{12:'sim'}});
    const goals=(await asUser('get','/metas')).body.data;
    expect(goals.find(g=>g.id===1)).toMatchObject({os_realizadas:2,faturamento_realizado:100,progresso_os:100,progresso_faturamento:100});
    expect(goals.find(g=>g.id===annual.body.data.id)).toMatchObject({os_realizadas:2,faturamento_realizado:100,progresso_os:10,progresso_faturamento:10});
  });
  it('aceita somente OS, somente faturamento ou ambas e evita duplicação do período', async () => {
    const base={eletricista_meta:1,tipo_periodo:'anual',mes_meta:'2028'};
    expect((await asUser('post','/metas',5).send({...base,qtd_os_meta:10})).status).toBe(201);
    expect((await asUser('post','/metas',5).send({...base,vlr_meta:100})).status).toBe(409);
    expect((await asUser('post','/metas',5).send({...base,mes_meta:'2029',vlr_meta:500})).status).toBe(201);
    expect((await asUser('post','/metas',5).send({...base,mes_meta:'2030',qtd_os_meta:5,vlr_meta:500})).status).toBe(201);
  });
  it.each([{qtd_os_meta:0},{qtd_os_meta:1.5},{vlr_meta:-1},{vlr_meta:0},{qtd_os_meta:1,tipo_periodo:'anual',mes_meta:'2026-01'},{vlr_meta:1.001}])('rejeita meta inválida %j', async fields => {
    expect((await asUser('post','/metas',5).send({eletricista_meta:1,tipo_periodo:'anual',mes_meta:'2031',...fields})).status).toBe(422);
  });
});

describe('Sessões e rascunhos de estoque', () => {
  it('rotaciona refresh, revoga tokens no logout e nega reutilizar o cookie antigo', async () => {
    const agent=request.agent(app);
    const login=await agent.post('/api/v1/auth/login').send({nome:'admin',senha:'senha123'});
    const firstCookie=login.headers['set-cookie'][0].split(';')[0];
    const refreshed=await agent.post('/api/v1/auth/refresh').send({});
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.accessToken).toBeTruthy();
    expect((await request(app).post('/api/v1/auth/refresh').set('Cookie',firstCookie)).status).toBe(401);
    expect((await agent.post('/api/v1/auth/logout').set('Authorization',`Bearer ${refreshed.body.data.accessToken}`)).status).toBe(204);
    expect((await request(app).get('/api/v1/auth/me').set('Authorization',`Bearer ${refreshed.body.data.accessToken}`)).status).toBe(401);
    expect((await agent.post('/api/v1/auth/refresh')).status).toBe(401);
  });
  it('troca de senha invalida o token anterior', async () => {
    const previous=token(2);
    expect((await asUser('put','/eletricistas/1',1).send({senha:'novaSenha123'})).status).toBe(200);
    expect((await request(app).get('/api/v1/auth/me').set('Authorization',`Bearer ${previous}`)).status).toBe(401);
    expect((await request(app).post('/api/v1/auth/login').send({nome:'11111111111',senha:'novaSenha123'})).status).toBe(200);
  });
  it('limita tentativas inválidas de login', async () => {
    for (let i=0;i<5;i++) expect((await request(app).post('/api/v1/auth/login').send({nome:'limite_teste',senha:'errada'})).status).toBe(401);
    expect((await request(app).post('/api/v1/auth/login').send({nome:'limite_teste',senha:'errada'})).status).toBe(429);
  });
  it('reserva o rascunho ao criador e impede editar depois da finalização', async () => {
    await query('INSERT INTO tabela_usuarios (id,usuario,senha,is_admin) VALUES (7,?,?,1)', ['admin2',password]);
    const opened=await asUser('post','/lancamentos',1).send({tipo:'saida',data_baixa:`${month}-01`,id_eletricista:1});
    expect(opened.status).toBe(201); const bid=opened.body.data.id;
    expect((await asUser('post','/lancamentos',1).send({tipo:'saida',data_baixa:`${month}-01`,id_eletricista:1})).status).toBe(409);
    expect((await asUser('post',`/lancamentos/${bid}/itens`,7).send({id_produto:1,quantidade:1,valor_unitario:10})).status).toBe(404);
    const added=await asUser('post',`/lancamentos/${bid}/itens`,1).send({id_produto:1,quantidade:2,valor_unitario:10});
    expect(added.status).toBe(201);
    expect((await asUser('post',`/lancamentos/${bid}/finalizacao`,7)).status).toBe(404);
    expect((await asUser('post',`/lancamentos/${bid}/finalizacao`,1)).status).toBe(200);
    expect((await query('SELECT qtd_estoque FROM tabela_produtos WHERE id=1'))[0].qtd_estoque).toBe(18);
    expect((await asUser('delete',`/lancamentos/${bid}/itens/${added.body.data.id}`,1)).status).toBe(409);
    expect((await asUser('post',`/lancamentos/${bid}/itens`,1).send({id_produto:1,quantidade:1,valor_unitario:10})).status).toBe(409);
    expect((await asUser('post',`/lancamentos/${bid}/finalizacao`,1)).status).toBe(409);
    const report=await asUser('get',`/lancamentos/${bid}/relatorio`,1);
    expect(report.body.data.itens[0].valor_total).toBe(20);
    expect((await asUser('get',`/baixas/${bid}`,1)).body.data.itens[0].valor_total).toBe(20);
  });
  it('aplica filtros aos totais e calcula valores das movimentações', async () => {
    const response=await asUser('get','/movimentacoes?tipo=saida',1);
    expect(response.body.data.map(r=>r.valor_total)).toEqual(expect.arrayContaining([20,90]));
    expect((await asUser('get','/movimentacoes/totais?tipo=entrada',1)).body.data).toEqual({totalEntrada:0,totalSaida:0});
    expect((await asUser('post','/movimentacoes/relatorio',1).send({ids:[1]})).body.data[0].valor_total).toBe(20);
  });
});
