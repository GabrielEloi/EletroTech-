const db = require('../../config/db'); // pool do mysql2/promise

const temFiltro = (id) => id !== null && id !== undefined && id !== '';

async function contarTotais(idEletricista = null) {
  const totais = { eletricistas: 0, produtos: 0, os: 0, metas: 0 };

  if (temFiltro(idEletricista)) {
    const [[row]] = await db.query(
      'SELECT COUNT(*) AS total FROM tabela_ordens_servico WHERE eletricista_os = ?',
      [Number(idEletricista)]
    );
    totais.os = Number(row.total);
    return totais;
  }

  const [[el]] = await db.query(
    'SELECT COUNT(*) AS total FROM tabela_eletricistas WHERE data_demissao IS NULL'
  );
  const [[pr]] = await db.query('SELECT COUNT(*) AS total FROM tabela_produtos');
  const [[os]] = await db.query('SELECT COUNT(*) AS total FROM tabela_ordens_servico');
  const [[me]] = await db.query('SELECT COALESCE(SUM(vlr_meta), 0) AS total FROM tabela_metas');

  totais.eletricistas = Number(el.total);
  totais.produtos = Number(pr.total);
  totais.os = Number(os.total);
  totais.metas = Number(me.total);
  return totais;
}

async function contarProdutosUtilizados(idEletricista = null) {
  let sql = `
    SELECT COALESCE(SUM(om.qtd_utilizada), 0) AS total
    FROM tabela_os_materiais om
    LEFT JOIN tabela_ordens_servico os ON os.id = om.id_os`;
  const params = [];

  if (temFiltro(idEletricista)) {
    sql += ' WHERE os.eletricista_os = ?';
    params.push(Number(idEletricista));
  }

  const [[row]] = await db.query(sql, params);
  return Number(row.total);
}

async function getMetaAtual(idEletricista) {
  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [rows] = await db.query(
    'SELECT vlr_meta FROM tabela_metas WHERE eletricista_meta = ? AND mes_meta = ? LIMIT 1',
    [Number(idEletricista), mesAtual]
  );
  return rows.length ? Number(rows[0].vlr_meta) : 0;
}

async function getOsPorEletricista(idEletricista = null) {
  let sql = `
    SELECT e.nome AS eletricista, COUNT(os.id) AS total
    FROM tabela_ordens_servico os
    LEFT JOIN tabela_eletricistas e ON e.id = os.eletricista_os`;
  const params = [];

  if (temFiltro(idEletricista)) {
    sql += ' WHERE os.eletricista_os = ?';
    params.push(Number(idEletricista));
  }
  sql += ' GROUP BY e.id, e.nome ORDER BY total DESC';

  const [rows] = await db.query(sql, params);
  return rows.map((r) => ({ eletricista: r.eletricista, total: Number(r.total) }));
}

async function getMovimentacaoPorMes(idEletricista = null) {
  let sql = `
    SELECT DATE_FORMAT(m.data_mov, '%Y-%m') AS mes,
      SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade * m.valor_unitario ELSE 0 END) AS entrada,
      SUM(CASE WHEN m.tipo = 'saida'   THEN m.quantidade * m.valor_unitario ELSE 0 END) AS saida
    FROM tabela_movimentacoes m`;
  const params = [];

  if (temFiltro(idEletricista)) {
    sql += ' LEFT JOIN tabela_ordens_servico os ON os.id = m.id_os WHERE os.eletricista_os = ?';
    params.push(Number(idEletricista));
  }
  sql += " GROUP BY DATE_FORMAT(m.data_mov, '%Y-%m') ORDER BY mes ASC";

  const [rows] = await db.query(sql, params);
  return rows.map((r) => ({ mes: r.mes, entrada: Number(r.entrada), saida: Number(r.saida) }));
}

async function getOsPorStatus(idEletricista = null) {
  let sql = 'SELECT status, COUNT(id) AS total FROM tabela_ordens_servico';
  const params = [];

  if (temFiltro(idEletricista)) {
    sql += ' WHERE eletricista_os = ?';
    params.push(Number(idEletricista));
  }
  sql += ' GROUP BY status';

  const [rows] = await db.query(sql, params);
  const resultado = { solicitada: 0, aberta: 0, fechada: 0 };
  for (const r of rows) resultado[r.status] = Number(r.total);
  return resultado;
}

async function getOsPorMes(mes = null, idEletricista = null) {
  const where = [];
  const params = [];

  if (temFiltro(idEletricista)) {
    where.push('eletricista_os = ?');
    params.push(Number(idEletricista));
  }
  if (mes) {
    where.push("DATE_FORMAT(data_os, '%Y-%m') = ?");
    params.push(mes);
  }

  const sql = `
    SELECT DATE_FORMAT(data_os, '%Y-%m') AS mes, COUNT(id) AS total
    FROM tabela_ordens_servico
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    GROUP BY DATE_FORMAT(data_os, '%Y-%m')
    ORDER BY mes ASC`;

  const [rows] = await db.query(sql, params);
  return rows.map((r) => ({ mes: r.mes, total: Number(r.total) }));
}

module.exports = {
  contarTotais,
  contarProdutosUtilizados,
  getMetaAtual,
  getOsPorEletricista,
  getMovimentacaoPorMes,
  getOsPorStatus,
  getOsPorMes,
};
