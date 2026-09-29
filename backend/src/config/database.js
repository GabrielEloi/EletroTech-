import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '../..');
const wasmPath = path.join(backendRoot, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');

const SQL = await initSqlJs({
  locateFile: () => wasmPath
});

const db = new SQL.Database();

function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      cpf TEXT UNIQUE,
      senha_hash TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      permissoes TEXT NOT NULL DEFAULT '[]',
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const adminExists = db.prepare('SELECT id FROM usuarios WHERE nome = ?').getAsObject(['admin']);

  if (!adminExists || !adminExists.id) {
    const senhaHash = bcrypt.hashSync('admin123', 10);
    const permissoes = JSON.stringify([
      'menu',
      'ordemServico',
      'checklist',
      'produtos',
      'baixas',
      'metas',
      'eletricistas'
    ]);

    db.prepare(
      'INSERT INTO usuarios (nome, cpf, senha_hash, is_admin, permissoes, ativo) VALUES (?, ?, ?, ?, ?, 1)'
    ).run(['admin', '00000000000', senhaHash, 1, permissoes]);
  }
}

function getUserByLogin(login) {
  const normalized = String(login || '').trim();
  if (!normalized) return null;

  const row = db.prepare(
    'SELECT * FROM usuarios WHERE nome = ? OR cpf = ? LIMIT 1'
  ).getAsObject([normalized, normalized]);

  return Object.keys(row || {}).length ? row : null;
}

function getUserById(id) {
  const row = db.prepare('SELECT * FROM usuarios WHERE id = ?').getAsObject([id]);
  return Object.keys(row || {}).length ? row : null;
}

initializeDatabase();

export { db, initializeDatabase, getUserByLogin, getUserById };
