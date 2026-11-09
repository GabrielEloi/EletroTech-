import * as repo from '../repository/dashboard.repository.js';
import { AppError } from '../shared/http.js';

/**
 * user: { id, usuario, nome_exibicao, is_admin, eletricista_id, permissoes }
 * Admin vê tudo; usuário vinculado a eletricista vê só os próprios dados.
 */
async function obterDashboard(user, { mes } = {}) {
  if (mes && !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new AppError(422, 'Mês inválido, use YYYY-MM.', 'VALIDATION_ERROR');
  const ehAdmin = user.isAdmin === true || Number(user.is_admin ?? user.isAdmin) === 1;
  const eletricistaId = user.eletricista_id ? Number(user.eletricista_id) : null;
  if (!ehAdmin && !eletricistaId) {
    throw new AppError(403, 'O dashboard está disponível apenas para administradores e eletricistas.', 'FORBIDDEN');
  }
  const filtro = ehAdmin ? null : eletricistaId;

  const [totais, graficoEletricista, graficoMes, graficoStatus, graficoMovimentacao] =
    await Promise.all([
      repo.contarTotais(filtro),
      repo.getOsPorEletricista(filtro, mes),
      repo.getOsPorMes(mes, filtro),
      repo.getOsPorStatus(filtro, mes),
      repo.getMovimentacaoPorMes(filtro, mes),
    ]);

  const data = {
    perfil: user.perfil,
    usuario: user.nome || user.usuario,
    mesFiltro: mes || '',
    totais,
    graficoEletricista,
    graficoMes,
    graficoStatus,
    graficoMovimentacao,
  };

  if (filtro) {
    const [produtosUtilizados, metaAtual] = await Promise.all([
      repo.contarProdutosUtilizados(filtro),
      repo.getMetaAtual(filtro),
    ]);
    data.eletricistaDashboard = {
      totalOs: totais.os,
      produtosUtilizados,
      metaAtual,
    };
  }

  return data;
}

export { obterDashboard };
