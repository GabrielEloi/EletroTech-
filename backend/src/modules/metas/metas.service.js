import { query, transaction } from '../../config/database.js';
import { electricianScope, assertElectrician } from '../../shared/scope.js';
import { id, amount, period, periodBounds, invalid } from '../../shared/validation.js';
import { AppError } from '../../shared/http.js';

function targets(body) {
  const rawCount = body.qtdOsMeta ?? body.qtd_os_meta;
  const rawValue = body.vlrMeta ?? body.vlr_meta;
  const count = rawCount == null || rawCount === '' ? null : amount(rawCount, 'Meta de OS', { integer: true, positive: true });
  const value = rawValue == null || rawValue === '' ? 0 : amount(rawValue, 'Meta de faturamento');
  if (count == null && value <= 0) throw invalid('Informe uma meta de quantidade de OS e/ou faturamento maior que zero.');
  return { count, value };
}

export async function listGoals(user, filters = {}) {
  const scope = electricianScope(user, 'm.eletricista_meta', { allowStandard: true });
  const clauses = [scope.sql], params = [...scope.params];
  const electrician = filters.eletricistaId ?? filters.filtro_eletricista;
  if (electrician && !user.eletricistaId) { clauses.push('m.eletricista_meta=?'); params.push(id(electrician)); }
  const type = filters.tipo_periodo;
  if (type) {
    if (!['mensal', 'anual'].includes(type)) throw invalid('Periodicidade inválida.');
    clauses.push('m.tipo_periodo=?'); params.push(type);
  }
  const reference = filters.periodo ?? filters.mes ?? filters.filtro_mes;
  if (reference) { clauses.push('m.mes_meta=?'); params.push(period(reference, type || 'mensal')); }
  const rows = await query(`SELECT m.*,e.nome nome_eletricista FROM tabela_metas m
    JOIN tabela_eletricistas e ON e.id=m.eletricista_meta WHERE ${clauses.join(' AND ')} ORDER BY m.mes_meta DESC,m.id DESC`, params);
  return Promise.all(rows.map(async row => {
    const [start, end] = periodBounds(row.mes_meta, row.tipo_periodo);
    const [realized] = await query(`SELECT COUNT(*) os_realizadas,COALESCE(SUM(valor_servico),0) faturamento_realizado
      FROM tabela_ordens_servico WHERE eletricista_os=? AND status='fechada' AND data_fechamento>=? AND data_fechamento<?`, [row.eletricista_meta, start, end]);
    return { ...row, ...realized,
      progresso_os: row.qtd_os_meta ? Number(realized.os_realizadas) / Number(row.qtd_os_meta) * 100 : null,
      progresso_faturamento: Number(row.vlr_meta) > 0 ? Number(realized.faturamento_realizado) / Number(row.vlr_meta) * 100 : null,
    };
  }));
}

export async function createGoal(user, body) {
  const electricId = id(body.eletricistaId ?? body.eletricista_meta);
  const type = body.tipo_periodo ?? 'mensal';
  const reference = period(body.periodo ?? body.mes ?? body.mes_meta, type);
  const { count, value } = targets(body);
  return transaction(async c => {
    // Bloqueia o eletricista para serializar metas repetidas e transferências.
    await assertElectrician(user, electricId, { active: true, connection: c });
    const [existing] = await c.execute('SELECT id FROM tabela_metas WHERE eletricista_meta=? AND tipo_periodo=? AND mes_meta=?', [electricId, type, reference]);
    if (existing.length) throw new AppError(409, 'Já existe meta para este eletricista e período. Edite a meta existente.', 'CONFLICT');
    const [result] = await c.execute('INSERT INTO tabela_metas (eletricista_meta,mes_meta,vlr_meta,tipo_periodo,qtd_os_meta,criado_por) VALUES (?,?,?,?,?,?)', [electricId, reference, value, type, count, user.id]);
    return result.insertId;
  });
}

export async function updateGoal(user, goalId, body) {
  return transaction(async c => {
    const [rows] = await c.execute('SELECT * FROM tabela_metas WHERE id=? FOR UPDATE', [id(goalId)]);
    if (!rows[0]) throw new AppError(404, 'Meta não encontrada.', 'NOT_FOUND');
    await assertElectrician(user, rows[0].eletricista_meta, { connection: c });
    const { count, value } = targets({ ...rows[0], ...body });
    await c.execute('UPDATE tabela_metas SET vlr_meta=?,qtd_os_meta=? WHERE id=?', [value, count, rows[0].id]);
  });
}

export async function deleteGoal(user, goalId) {
  return transaction(async c => {
    const [rows] = await c.execute('SELECT * FROM tabela_metas WHERE id=? FOR UPDATE', [id(goalId)]);
    if (!rows[0]) throw new AppError(404, 'Meta não encontrada.', 'NOT_FOUND');
    await assertElectrician(user, rows[0].eletricista_meta, { connection: c });
    await c.execute('DELETE FROM tabela_metas WHERE id=?', [rows[0].id]);
  });
}
