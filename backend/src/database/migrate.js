import { pool } from '../config/database.js';
import { up } from './migrations/001-equipes-metas.js';

const connection = await pool.getConnection();
try {
  const [lock] = await connection.query("SELECT GET_LOCK('eletrotech_migrations',10) adquirido");
  if (Number(lock[0].adquirido) !== 1) throw new Error('Outra migração está em execução.');
  await connection.query('CREATE TABLE IF NOT EXISTS tabela_migracoes (versao VARCHAR(80) PRIMARY KEY, aplicada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB');
  const [applied] = await connection.execute('SELECT versao FROM tabela_migracoes WHERE versao=?', ['001-equipes-metas']);
  if (!applied.length) {
    await up(connection);
    await connection.execute('INSERT INTO tabela_migracoes (versao) VALUES (?)', ['001-equipes-metas']);
    console.log('Migração 001-equipes-metas aplicada.');
  } else console.log('Banco já está atualizado.');
} finally {
  await connection.query("SELECT RELEASE_LOCK('eletrotech_migrations')");
  connection.release();
  await pool.end();
}
