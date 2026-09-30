const repo = require('./dashboard.repository');

/**
 * user: { id, usuario, nome_exibicao, is_admin, eletricista_id, permissoes }
 * Admin vê tudo; usuário vinculado a eletricista vê só os próprios dados.
 */
async function obterDashboard(user, { mes } = {}) {
  const ehAdmin = !!user.is_admin;
  const eletricistaId = user.eletricista_id ? Number(user.eletricista_id) : null;
  const filtro = !ehAdmin && eletricistaId ? eletricistaId : null;

  const [totais, graficoEletricista, graficoMes, graficoStatus, graficoMovimentacao] =
    await Promise.all([
      repo.contarTotais(filtro),
      repo.getOsPorEletricista(filtro),
      repo.getOsPorMes(mes, filtro),
      repo.getOsPorStatus(filtro),
      repo.getMovimentacaoPorMes(filtro),
    ]);

  const data = {
    perfil: filtro ? 'eletricista' : 'admin',
    usuario: user.nome_exibicao || user.usuario || user.nome,
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

module.exports = { obterDashboard };
