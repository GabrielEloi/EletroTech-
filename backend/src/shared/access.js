// O vínculo com um eletricista define um perfil fixo, inclusive para contas antigas.
export const permissions = ['menu', 'ordemServico', 'checklist', 'produtos', 'baixas', 'metas', 'eletricistas'];
export const electricianPermissions = ['menu', 'ordemServico', 'metas'];

export function normalizedUser(row) {
  const eletricistaId = row.eletricista_id == null ? null : Number(row.eletricista_id);
  const isAdmin = !eletricistaId && Number(row.is_admin) === 1;
  const stored = row.permissoes ?? row.permissoesJson ?? [];
  const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
  const permissoes = eletricistaId ? [...electricianPermissions] : isAdmin ? [...permissions] : parsed.filter(p => permissions.includes(p));
  return {
    id: row.id, nome: row.eletricista_nome || row.usuario, usuario: row.usuario,
    isAdmin, is_admin: isAdmin, eletricistaId, eletricista_id: eletricistaId,
    perfil: eletricistaId ? 'eletricista' : isAdmin ? 'admin' : 'padrao', permissoes,
    destino: permissoes.includes('menu') ? '/menu' : permissoes.includes('ordemServico') ? '/ordem-servico' : '/home',
    rotuloDestino: permissoes.includes('menu') ? 'Dashboard' : 'Ordens de serviço',
  };
}
