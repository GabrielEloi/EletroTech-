import 'dotenv/config';

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32 || !process.env.CORS_ORIGIN)) {
  throw new Error('Configure JWT_SECRET com pelo menos 32 bytes e CORS_ORIGIN antes de iniciar em produção.');
}

export const env = {
  port: Number(process.env.PORT || 3001),
  databaseUrl: process.env.DATABASE_URL || '',
  dbHost: process.env.DB_HOST || '127.0.0.1',
  dbPort: Number(process.env.DB_PORT || 3306),
  dbName: process.env.DB_NAME || 'eletrotech',
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || '',
  dbSocketPath: process.env.DB_SOCKET_PATH || undefined,
  jwtSecret: process.env.JWT_SECRET || 'troque-esta-chave-em-producao',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  flowiseApiUrl: process.env.FLOWISE_API_URL || '',
};
