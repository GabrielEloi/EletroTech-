import { query } from '../config/database.js';
import { AppError } from './http.js';
import { id } from './validation.js';

// O vínculo é consultado no banco em cada operação. Trocar a equipe revoga o
// acesso imediatamente, inclusive em detalhes, relatórios e tokens antigos.
export function electricianScope(user, column, { allowStandard = false } = {}) {
  if (user.isAdmin) return { sql: '1=1', params: [] };
  if (user.eletricistaId) return { sql: `${column}=?`, params: [user.eletricistaId] };
  if (user.isSupervisor) return {
    sql: `${column} IN (SELECT se.eletricista_id FROM tabela_supervisor_eletricista se WHERE se.supervisor_id=?)`,
    params: [user.id],
  };
  return { sql: allowStandard ? '1=1' : '1=0', params: [] };
}

export async function assertElectrician(user, electricianId, { active = false, connection } = {}) {
  const electricId = id(electricianId);
  const scope = electricianScope(user, 'e.id');
  const sql = `SELECT e.* FROM tabela_eletricistas e WHERE e.id=? AND ${scope.sql}${active ? ' AND e.data_demissao IS NULL' : ''}${connection ? ' FOR UPDATE' : ''}`;
  const params = [electricId, ...scope.params];
  const rows = connection ? (await connection.execute(sql, params))[0] : await query(sql, params);
  if (!rows[0]) throw new AppError(403, 'Eletricista fora da sua equipe ou indisponível para esta operação.', 'FORBIDDEN');
  return rows[0];
}

export async function teamOptions(user) {
  const scope = electricianScope(user, 'e.id');
  return query(`SELECT e.id,e.nome FROM tabela_eletricistas e WHERE e.data_demissao IS NULL AND ${scope.sql} ORDER BY e.nome`, scope.params);
}
