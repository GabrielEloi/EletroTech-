import { dashboardData } from '../repository/dashboard.repository.js';
import { listGoals } from '../modules/metas/metas.service.js';
import { month, today } from '../shared/validation.js';

export async function obterDashboard(user, { mes } = {}) {
  if (mes) month(mes);
  const current = mes || today().slice(0, 7);
  const [data, monthly, annual] = await Promise.all([
    dashboardData(user, mes),
    listGoals(user, { tipo_periodo: 'mensal', periodo: current }),
    listGoals(user, { tipo_periodo: 'anual', periodo: current.slice(0, 4) }),
  ]);
  data.totais.metas = monthly.reduce((sum, m) => sum + Number(m.vlr_meta), 0);
  data.totais.metaOs = monthly.reduce((sum, m) => sum + Number(m.qtd_os_meta || 0), 0);
  if (user.eletricistaId) data.eletricistaDashboard = {
    totalOs: data.totais.osFechadas, produtosUtilizados: data.produtosUtilizados,
    metaAtual: data.totais.metas, metaOs: data.totais.metaOs, faturamentoRealizado: data.totais.faturamentoRealizado,
  };
  return { ...data, metas: [...monthly, ...annual], perfil: user.perfil, usuario: user.nome || user.usuario, mesFiltro: mes || '' };
}
