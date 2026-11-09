import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import initSqlJs from 'sql.js';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const state = vi.hoisted(() => ({ db: null }));
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
const token = (id, extra = {}) => jwt.sign({ id, ...extra }, env.jwtSecret, { expiresIn: '1h' });
const asUser = (method, path, user = 2) => request(app)[method](`/api/v1${path}`).set('Authorization', `Bearer ${token(user)}`);

beforeAll(async () => { SQL = await initSqlJs(); password = await bcrypt.hash('senha123', 4); });
beforeEach(async () => {
  state.db = new SQL.Database();
  state.db.create_function('DATE_FORMAT', (value, _format) => String(value).slice(0, 7));
  state.db.run(`
    CREATE TABLE tabela_eletricistas(id INTEGER PRIMARY KEY AUTOINCREMENT,nome TEXT,cpf TEXT,data_contratacao TEXT,data_demissao TEXT);
    CREATE TABLE tabela_usuarios(id INTEGER PRIMARY KEY AUTOINCREMENT,usuario TEXT UNIQUE,senha TEXT,is_admin INTEGER,eletricista_id INTEGER);
    CREATE TABLE tabela_usuario_permissao(usuario_id INTEGER,permissao TEXT,PRIMARY KEY(usuario_id,permissao));
    CREATE TABLE tabela_metas(id INTEGER PRIMARY KEY AUTOINCREMENT,eletricista_meta INTEGER,mes_meta TEXT,vlr_meta REAL);
    CREATE TABLE tabela_ordens_servico(id INTEGER PRIMARY KEY AUTOINCREMENT,eletricista_os INTEGER,data_os TEXT,status TEXT,data_fechamento TEXT);
    CREATE TABLE tabela_produtos(id INTEGER PRIMARY KEY,nome_produto TEXT,qtd_estoque INTEGER,vlr_unitario REAL);
    CREATE TABLE tabela_os_materiais(id INTEGER PRIMARY KEY,id_os INTEGER,id_produto INTEGER,qtd_utilizada INTEGER);
    CREATE TABLE tabela_movimentacoes(id INTEGER PRIMARY KEY,id_os INTEGER,id_produto INTEGER,tipo TEXT,quantidade INTEGER,valor_unitario REAL,data_mov TEXT,origem TEXT);
    CREATE TABLE tabela_checklist(id INTEGER PRIMARY KEY,titulo TEXT,tipo TEXT,selecionado INTEGER);
    CREATE TABLE tabela_checklist_perguntas(id INTEGER PRIMARY KEY,id_checklist INTEGER,texto_pergunta TEXT,tipo_resposta TEXT,bloqueia_abertura TEXT,ordem INTEGER);
    CREATE TABLE tabela_os_checklist_respostas(id INTEGER PRIMARY KEY,id_os INTEGER,id_pergunta INTEGER,resposta TEXT,motivo_nao TEXT);
    CREATE TABLE tabela_os_checklist_status(id INTEGER PRIMARY KEY AUTOINCREMENT,id_os INTEGER,tipo TEXT,bloqueado INTEGER,observacao TEXT,data_bloqueio TEXT,data_finalizacao TEXT,UNIQUE(id_os,tipo));
    CREATE TABLE tabela_os_comentarios(id INTEGER PRIMARY KEY,id_os INTEGER,comentario TEXT,data_comentario TEXT);
    INSERT INTO tabela_eletricistas VALUES (1,'Ana','11111111111','2026-01-01',NULL),(2,'Bruno','22222222222','2026-01-01',NULL);
    INSERT INTO tabela_metas VALUES (1,1,'${month}',100),(2,2,'${month}',900);
    INSERT INTO tabela_ordens_servico VALUES (1,1,'${month}-01','solicitada',NULL),(2,2,'${month}-01','solicitada',NULL),(3,1,'${month}-02','fechada','${month}-02');
    INSERT INTO tabela_produtos VALUES (1,'Cabo',20,10);
    INSERT INTO tabela_os_materiais VALUES (1,3,1,2),(2,2,1,9);
    INSERT INTO tabela_movimentacoes VALUES (1,3,1,'saida',2,10,'${month}-02','OS 3'),(2,2,1,'saida',9,10,'${month}-01','OS 2');
    INSERT INTO tabela_checklist VALUES (1,'Início','inicio',1),(2,'Fim','fim',1);
    INSERT INTO tabela_checklist_perguntas VALUES (11,1,'Seguro?','radio',NULL,1),(12,2,'Concluído?','radio',NULL,1);
    INSERT INTO tabela_usuario_permissao VALUES (2,'produtos'),(2,'eletricistas'),(2,'checklist'),(4,'metas'),(5,'perfil_supervisor'),(5,'eletricistas'),(5,'produtos');
  `);
  for (const row of [[1,'admin',1,null],[2,'11111111111',0,1],[3,'22222222222',0,2],[4,'gestor',0,null],[5,'supervisor',0,null]]) {
    await query('INSERT INTO tabela_usuarios VALUES (?,?,?,?,?)', [row[0],row[1],password,row[2],row[3]]);
  }
});
afterEach(() => state.db.close());

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
  it('preserva o perfil padrão ao editar permissões de usuário', async () => {
    const updated = await asUser('put','/usuarios/4',1).send({
      usuario: 'gestor',
      is_admin: 0,
      permissoes: ['metas'],
    });
    expect(updated.status).toBe(200);
    expect((await query('SELECT is_admin FROM tabela_usuarios WHERE id=4'))[0].is_admin).toBe(0);
  });
  it('retorna OS concluídas e meta do mês na lista de eletricistas', async () => {
    const response = await asUser('get','/eletricistas',1);
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 1, total_os: 1, meta_atual: 100 }),
      expect.objectContaining({ id: 2, total_os: 0, meta_atual: 900 }),
    ]));
  });
  it.each(['/usuarios','/eletricistas','/produtos','/checklists','/movimentacoes','/movimentacoes/totais','/lancamentos','/eletricistas/2/ordens-servico'])('nega acesso direto a %s', async path => {
    expect((await asUser('get',path)).status).toBe(403);
  });
  it('nega acesso ao assistente fora dos módulos do perfil', async () => {
    expect((await asUser('post','/chat').send({mensagem:'teste'})).status).toBe(403);
  });
});

describe('Consulta Checklist', () => {
  async function seedPendencias() {
    await query(
      'INSERT INTO tabela_os_checklist_status (id,id_os,tipo,bloqueado,data_bloqueio) VALUES (1,1,?,1,?),(2,2,?,1,?),(3,3,?,0,?)',
      ['inicio', '2026-03-01 10:00:00', 'fim', '2026-03-02 10:00:00', 'fim', '2026-03-03 10:00:00']
    );
    await query("INSERT INTO tabela_os_checklist_respostas VALUES (1,1,11,'não','')");
  }

  it('lista somente pendências e aplica filtros e ordenação solicitados pela tela', async () => {
    await seedPendencias();
    const all = await asUser('get', '/consultachecklist', 1);
    expect(all.status).toBe(200);
    expect(all.body.data.bloqueados.map(({ id_os }) => id_os)).toEqual([2, 1]);
    expect(all.body.data.eletricistas).toEqual([{ id: 1, nome: 'Ana' }, { id: 2, nome: 'Bruno' }]);

    const byType = await asUser('get', '/checklists/pendencias?tipo=inicio', 1);
    expect(byType.body.data.bloqueados.map(({ id_os }) => id_os)).toEqual([1]);

    const byElectrician = await asUser('get', '/consultachecklist?eletricista=2', 1);
    expect(byElectrician.body.data.bloqueados.map(({ id_os }) => id_os)).toEqual([2]);

    const oldest = await asUser('get', '/consultachecklist?ordenar=data_asc', 1);
    expect(oldest.body.data.bloqueados.map(({ id_os }) => id_os)).toEqual([1, 2]);
    expect(oldest.body.data.bloqueados[0]).toMatchObject({
      tipo: 'inicio',
      nome_eletricista: 'Ana',
      status_os: 'solicitada',
    });
    expect((await asUser('get','/consultachecklist?tipo=desconhecido',1)).status).toBe(422);
    expect((await asUser('get','/consultachecklist?ordenar=aleatorio',1)).status).toBe(422);
  });

  it('registra decisão autorizada e mantém negação pendente conforme regra legada', async () => {
    await seedPendencias();
    const authorized = await asUser('post', '/consultachecklist/finalizar', 1).send({
      id_os: 1, tipo: 'inicio', observacao: 'Revisado', acao: 'autorizar',
    });
    expect(authorized.status).toBe(200);
    expect((await query('SELECT bloqueado,observacao,data_finalizacao FROM tabela_os_checklist_status WHERE id=1'))[0])
      .toMatchObject({ bloqueado: 0, observacao: 'Revisado' });
    expect((await query('SELECT status FROM tabela_ordens_servico WHERE id=1'))[0].status).toBe('aberta');

    const denied = await asUser('post', '/checklists/pendencias/2/fim/resolucao', 1).send({
      observacao: 'Ainda não atende', acao: 'negar',
    });
    expect(denied.status).toBe(200);
    expect((await query('SELECT bloqueado,observacao,data_finalizacao FROM tabela_os_checklist_status WHERE id=2'))[0])
      .toMatchObject({ bloqueado: 1, observacao: 'Ainda não atende', data_finalizacao: null });
    expect((await query('SELECT status FROM tabela_ordens_servico WHERE id=2'))[0].status).toBe('bloqueada');
  });

  it('registra bloqueios criados pela abertura e pelo fechamento da OS', async () => {
    await query("UPDATE tabela_checklist_perguntas SET bloqueia_abertura='sim' WHERE id IN (11,12)");
    const opened = await asUser('post', '/ordens-servico/1/abertura').send({
      id_produto: [1], qtd_utilizada: [1], checklistRespostas: { 11: 'sim' },
    });
    expect(opened.status).toBe(200);
    expect((await query("SELECT bloqueado FROM tabela_os_checklist_status WHERE id_os=1 AND tipo='inicio'"))[0].bloqueado).toBe(1);

    const closed = await asUser('post', '/ordens-servico/1/fechamento').send({
      checklistRespostas: { 12: 'sim' },
    });
    expect(closed.status).toBe(200);
    expect((await query("SELECT bloqueado FROM tabela_os_checklist_status WHERE id_os=1 AND tipo='fim'"))[0].bloqueado).toBe(1);
  });

  it('rejeita decisão inválida, observação ausente e pendência já resolvida', async () => {
    await seedPendencias();
    expect((await asUser('post', '/consultachecklist/finalizar', 1).send({
      id_os: 1, tipo: 'inicio', observacao: '', acao: 'autorizar',
    })).status).toBe(422);
    expect((await asUser('post', '/consultachecklist/finalizar', 1).send({
      id_os: 1, tipo: 'inicio', observacao: 'OK', acao: 'ignorar',
    })).status).toBe(422);
    expect((await asUser('post', '/checklists/pendencias/3/fim/resolucao', 1).send({
      observacao: 'OK', acao: 'autorizar',
    })).status).toBe(409);
  });

  it('retorna relatório com dados da OS, respostas do tipo e status do checklist', async () => {
    await seedPendencias();
    await query("UPDATE tabela_os_checklist_status SET observacao='Aguardando' WHERE id=1");
    const res = await asUser('get', '/consultachecklist/relatorio/1/inicio', 1);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      idOs: 1,
      tipo: 'inicio',
      ordem: { id: 1, nome_eletricista: 'Ana', status: 'solicitada' },
      respostas: [{ id_pergunta: 11, texto_pergunta: 'Seguro?', resposta: 'não' }],
      status: { id_os: 1, tipo: 'inicio', bloqueado: 1, observacao: 'Aguardando' },
    });
    expect((await asUser('get', '/checklists/pendencias/1/inicio/relatorio', 1)).status).toBe(200);
    expect((await asUser('get', '/consultachecklist/relatorio/999/inicio', 1)).status).toBe(404);
  });

  it('protege as rotas com autenticação e permissão checklist', async () => {
    const paths = ['/consultachecklist', '/checklists/pendencias'];
    for (const path of paths) {
      expect((await request(app).get(`/api/v1${path}`)).status).toBe(401);
      expect((await asUser('get', path)).status).toBe(403);
    }
    expect((await request(app).get('/api/v1/consultachecklist/relatorio/1/inicio')).status).toBe(401);
    expect((await asUser('post', '/consultachecklist/finalizar').send({})).status).toBe(403);
  });
});

describe('Listagem de checklists', () => {
  it('retorna a contagem de perguntas para a tabela', async () => {
    const response = await asUser('get','/checklists',1);
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 1, qtd_perguntas: 1 }),
      expect.objectContaining({ id: 2, qtd_perguntas: 1 }),
    ]));
  });
});

describe('Movimentações', () => {
  it('retorna o valor total calculado a partir da quantidade e do valor unitário', async () => {
    const response = await asUser('get','/movimentacoes',1);
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 1, valor_total: 20 }),
      expect.objectContaining({ id: 2, valor_total: 90 }),
    ]));
  });
});

describe('Isolamento dos dados', () => {
  it('retorna somente as metas próprias mesmo com filtros de outro eletricista', async () => {
    for (const filter of ['', '?eletricistaId=2', '?filtro_eletricista=2']) {
      const res=await asUser('get',`/metas${filter}`);
      expect(res.status).toBe(200);
      expect(res.body.data.map(r=>r.id)).toEqual([1]);
    }
    expect((await asUser('get','/metas?mes=1999-01')).body.data).toEqual([]);
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
    expect(res.body.data).toMatchObject({perfil:'eletricista',totais:{os:2,metas:100,eletricistas:0,produtos:0},eletricistaDashboard:{totalOs:2,produtosUtilizados:2,metaAtual:100}});
    expect(res.body.data.graficoEletricista).toEqual([{eletricista:'Ana',total:2}]);
    expect(res.body.data.graficoMes).toEqual([{mes:month,total:2}]);
    expect(res.body.data.graficoMovimentacao).toEqual([{mes:month,entrada:0,saida:20}]);
    await query(`INSERT INTO tabela_ordens_servico VALUES (4,2,'${month}-03','fechada','${month}-03')`);
    const filtered=await asUser('get',`/dashboard?mes=${month}`);
    expect(filtered.body.data.graficoEletricista).toEqual([{eletricista:'Ana',total:2}]);
    expect(filtered.body.data.graficoMes).toEqual([{mes:month,total:2}]);
    expect(filtered.body.data.graficoStatus.fechada).toBe(1);
  });
  it('mantém acesso geral do administrador e gestão por usuário padrão autorizado', async () => {
    expect((await asUser('get','/metas',1)).body.data).toHaveLength(2);
    expect((await asUser('get','/ordens-servico',1)).body.data.paginacao.total).toBe(3);
    expect((await asUser('get','/dashboard',1)).body.data.totais).toMatchObject({os:3,metas:1000,eletricistas:2});
    expect((await asUser('put','/metas/1',4).send({vlr_meta:120})).status).toBe(200);
    await query("INSERT INTO tabela_usuario_permissao VALUES (4,'menu')");
    expect((await asUser('get','/dashboard',4)).status).toBe(403);
  });
});

// Usa a mesma base de testes para validar o perfil sem alterar o schema do banco.
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
    expect((await asUser('put',`/usuarios/${userId}`,1).send({perfil:'padrao',permissoes:[]})).status).toBe(200);
    const oldToken = login.body.data.accessToken;
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
