import { query } from '../config/database.js';
import { electricianScope } from '../shared/scope.js';
import { periodBounds } from '../shared/validation.js';

export async function dashboardData(user, month) {
  const scope = electricianScope(user, 'os.eletricista_os', { allowStandard: true });
  const dates = month ? periodBounds(month) : [];
  const where = `${scope.sql}${month ? ' AND os.data_os>=? AND os.data_os<?' : ''}`;
  const params = [...scope.params, ...dates];
  const closedWhere = `${scope.sql} AND os.status='fechada'${month ? ' AND os.data_fechamento>=? AND os.data_fechamento<?' : ''}`;
  const electricScope = electricianScope(user, 'e.id', { allowStandard: true });
  const [counts, closed, electricians, products, byElectrician, byMonth, byStatus, movements, materials] = await Promise.all([
    query(`SELECT COUNT(*) total FROM tabela_ordens_servico os WHERE ${where}`, params),
    query(`SELECT COUNT(*) total,COALESCE(SUM(os.valor_servico),0) faturamento FROM tabela_ordens_servico os WHERE ${closedWhere}`, params),
    query(`SELECT COUNT(*) total FROM tabela_eletricistas e WHERE e.data_demissao IS NULL AND ${electricScope.sql}`, electricScope.params),
    user.isAdmin ? query('SELECT COUNT(*) total FROM tabela_produtos') : query(`SELECT COUNT(DISTINCT om.id_produto) total FROM tabela_os_materiais om JOIN tabela_ordens_servico os ON os.id=om.id_os WHERE ${where}`, params),
    query(`SELECT e.nome eletricista,COUNT(os.id) total FROM tabela_ordens_servico os JOIN tabela_eletricistas e ON e.id=os.eletricista_os WHERE ${where} GROUP BY e.id,e.nome ORDER BY total DESC`, params),
    query(`SELECT DATE_FORMAT(os.data_os,'%Y-%m') mes,COUNT(*) total FROM tabela_ordens_servico os WHERE ${where} GROUP BY DATE_FORMAT(os.data_os,'%Y-%m') ORDER BY mes`, params),
    query(`SELECT os.status,COUNT(*) total FROM tabela_ordens_servico os WHERE ${where} GROUP BY os.status`, params),
    query(`SELECT DATE_FORMAT(m.data_mov,'%Y-%m') mes,
      SUM(CASE WHEN m.tipo='entrada' THEN m.quantidade*m.valor_unitario ELSE 0 END) entrada,
      SUM(CASE WHEN m.tipo='saida' THEN m.quantidade*m.valor_unitario ELSE 0 END) saida
      FROM tabela_movimentacoes m LEFT JOIN tabela_ordens_servico os ON os.id=m.id_os
      WHERE ${user.isAdmin ? '1=1' : scope.sql}${month ? ' AND m.data_mov>=? AND m.data_mov<?' : ''}
      GROUP BY DATE_FORMAT(m.data_mov,'%Y-%m') ORDER BY mes`, [...(user.isAdmin ? [] : scope.params), ...dates]),
    query(`SELECT COALESCE(SUM(om.qtd_utilizada),0) total FROM tabela_os_materiais om JOIN tabela_ordens_servico os ON os.id=om.id_os WHERE ${where}`, params),
  ]);
  return {
    totais: { eletricistas: Number(electricians[0].total), produtos: Number(products[0].total), os: Number(counts[0].total), osFechadas: Number(closed[0].total), faturamentoRealizado: Number(closed[0].faturamento) },
    graficoEletricista: byElectrician, graficoMes: byMonth,
    graficoStatus: { solicitada: 0, aberta: 0, bloqueada: 0, fechada: 0, ...Object.fromEntries(byStatus.map(r => [r.status, Number(r.total)])) },
    graficoMovimentacao: movements, produtosUtilizados: Number(materials[0].total),
  };
}
