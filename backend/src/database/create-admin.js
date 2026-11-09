import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import bcrypt from 'bcryptjs';
import { pool, transaction } from '../config/database.js';
import { text, invalid } from '../shared/validation.js';

let muted = false;
const output = new Writable({ write(chunk, _encoding, next) { if (!muted) process.stdout.write(chunk); next(); } });
const terminal = createInterface({ input: process.stdin, output, terminal: Boolean(process.stdin.isTTY) });
try {
  const usuario = text(await terminal.question('Nome do novo administrador: '), 'Usuário', 50);
  process.stdout.write('Senha (8 a 72 caracteres, entrada oculta): ');
  muted = true;
  const senha = await terminal.question('');
  muted = false;
  process.stdout.write('\n');
  if (senha.length < 8 || Buffer.byteLength(senha, 'utf8') > 72) throw invalid('Senha inválida.');
  await transaction(async c => {
    const [existing] = await c.execute('SELECT id FROM tabela_usuarios WHERE usuario=?', [usuario]);
    if (existing.length) throw new Error('O usuário já existe; nenhum acesso foi modificado.');
    await c.execute('INSERT INTO tabela_usuarios (usuario,senha,is_admin) VALUES (?,?,1)', [usuario, await bcrypt.hash(senha, 10)]);
  });
  console.log('Administrador criado.');
} finally {
  muted = false;
  terminal.close();
  await pool.end();
}
