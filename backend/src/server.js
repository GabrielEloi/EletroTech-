import app from './app.js';
import { env } from './config/env.js';
import { pool } from './config/database.js';

const PORT = env.port;

const server = app.listen(PORT, () => {
  console.log(`Backend EletroTech rodando na porta ${PORT}`);
});

async function shutdown() { await pool.end(); server.close(() => process.exit(0)); }
process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
