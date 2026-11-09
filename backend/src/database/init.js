import { readFile } from 'node:fs/promises';
import { pool } from '../config/database.js';

const connection = await pool.getConnection();
try {
  const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await connection.query('SET FOREIGN_KEY_CHECKS=0');
  for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await connection.query(statement);
  console.log('Tabelas criadas sem substituir registros existentes. Execute npm run db:migrate.');
} finally {
  await connection.query('SET FOREIGN_KEY_CHECKS=1');
  connection.release();
  await pool.end();
}
