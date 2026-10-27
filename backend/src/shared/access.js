// O vínculo com um eletricista define um perfil fixo, inclusive para contas antigas.
export const permissions = ['menu', 'ordemServico', 'checklist', 'produtos', 'baixas', 'metas', 'eletricistas'];
export const electricianPermissions = ['menu', 'ordemServico', 'metas'];
export const supervisorPermissions = ['menu', 'ordemServico', 'metas', 'checklist'];
// Identifica o perfil na tabela de permissões existente, sem alterar o schema.
export const supervisorMarker = 'perfil_supervisor';

export function normalizedUser(row) {
  const eletricistaId = row.eletricista_id == null ? null : Number(row.eletricista_id);
  const isAdmin = !eletricistaId && Number(row.is_admin) === 1;
  const stored = row.permissoes ?? row.permissoesJson ?? [];
  const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
  const isSupervisor = !eletricistaId && !isAdmin && parsed.includes(supervisorMarker);
  const permissoes = eletricistaId ? [...electricianPermissions] : isAdmin ? [...permissions] : isSupervisor ? [...supervisorPermissions] : parsed.filter(p => permissions.includes(p));
  return {
    id: row.id, nome: row.eletricista_nome || row.usuario, usuario: row.usuario,
    isAdmin, is_admin: isAdmin, isSupervisor, eletricistaId, eletricista_id: eletricistaId,
    perfil: eletricistaId ? 'eletricista' : isAdmin ? 'admin' : isSupervisor ? 'supervisor' : 'padrao', permissoes,
    destino: permissoes.includes('menu') ? '/menu' : permissoes.includes('ordemServico') ? '/ordem-servico' : '/home',
    rotuloDestino: permissoes.includes('menu') ? 'Dashboard' : 'Ordens de serviço',
  };
}

// A gestão pode solicitar e acompanhar OS da equipe; o eletricista mantém seu escopo pessoal.
export const canManageOrders = (user) => Boolean(user?.isAdmin || user?.isSupervisor);
