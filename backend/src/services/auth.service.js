import bcrypt from 'bcryptjs';
import { getUserByLogin } from '../config/database.js';

const DEFAULT_PERMISSOES = [
  'menu',
  'ordemServico',
  'checklist',
  'produtos',
  'baixas',
  'metas',
  'eletricistas'
];

function normalizarPermissoes(permissoes) {
  if (!permissoes) return DEFAULT_PERMISSOES;

  if (Array.isArray(permissoes)) return permissoes;

  try {
    return JSON.parse(permissoes);
  } catch {
    return DEFAULT_PERMISSOES;
  }
}

export async function loginUsuario({ nome, senha }) {
  const login = String(nome || '').trim();
  const senhaDigitada = String(senha || '');

  if (!login || !senhaDigitada) {
    const error = new Error('Usuário e senha são obrigatórios.');
    error.statusCode = 400;
    throw error;
  }

  const usuario = getUserByLogin(login);

  if (!usuario) {
    const error = new Error('Credenciais inválidas.');
    error.statusCode = 401;
    throw error;
  }

  if (!usuario.ativo) {
    const error = new Error('Usuário inativo.');
    error.statusCode = 403;
    throw error;
  }

  const senhaValida = await bcrypt.compare(senhaDigitada, usuario.senha_hash);

  if (!senhaValida) {
    const error = new Error('Credenciais inválidas.');
    error.statusCode = 401;
    throw error;
  }

  const permissoes = normalizarPermissoes(usuario.permissoes);

  return {
    id: usuario.id,
    nome: usuario.nome,
    cpf: usuario.cpf,
    is_admin: Boolean(usuario.is_admin),
    permissoes,
    destino: '/home',
    rotuloDestino: 'Dashboard'
  };
}
