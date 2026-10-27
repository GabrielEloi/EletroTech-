import { describe, expect, it, vi } from 'vitest';
import { normalizedUser } from '../../src/shared/access.js';
import { requirePermission } from '../../src/middlewares/auth.js';

// Testa a definição do perfil diretamente, sem fazer login ou consultar o banco.
describe('normalizedUser', () => {
  it('libera todos os módulos para um administrador', () => {
    const usuario = normalizedUser({
      id: 1, usuario: 'admin', is_admin: 1, eletricista_id: null, permissoes: [],
    });

    expect(usuario.perfil).toBe('admin');
    expect(usuario.isAdmin).toBe(true);
    expect(usuario.permissoes).toEqual([
      'menu', 'ordemServico', 'checklist', 'produtos', 'baixas', 'metas', 'eletricistas',
    ]);
  });

  it('limita o eletricista aos três módulos mesmo com permissões antigas', () => {
    const usuario = normalizedUser({
      id: 2, usuario: '11111111111', is_admin: 0, eletricista_id: 10,
      permissoes: ['produtos', 'eletricistas'],
    });

    expect(usuario.perfil).toBe('eletricista');
    expect(usuario.isAdmin).toBe(false);
    expect(usuario.permissoes).toEqual(['menu', 'ordemServico', 'metas']);
  });

  it('define o supervisor com os módulos operacionais, sem privilégios de administrador', () => {
    const usuario = normalizedUser({
      id: 5, usuario: 'supervisor', is_admin: 0, eletricista_id: null,
      permissoesJson: JSON.stringify(['perfil_supervisor', 'eletricistas', 'produtos']),
    });

    expect(usuario.perfil).toBe('supervisor');
    expect(usuario.isAdmin).toBe(false);
    expect(usuario.permissoes).toEqual(['menu', 'ordemServico', 'metas', 'checklist']);
  });
});

// O next simulado registra se a função autorizou a ação ou devolveu um erro.
describe('requirePermission', () => {
  it('permite continuar quando o usuário tem a permissão do módulo', () => {
    const req = { user: { isAdmin: false, permissoes: ['metas'] } };
    const next = vi.fn();

    requirePermission('metas')(req, {}, next);

    expect(next).toHaveBeenCalledExactlyOnceWith();
  });

  it('bloqueia o módulo quando o usuário não tem a permissão', () => {
    const req = { user: { isAdmin: false, permissoes: ['metas'] } };
    const next = vi.fn();

    requirePermission('produtos')(req, {}, next);

    expect(next).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      status: 403, code: 'FORBIDDEN',
    }));
  });
});
