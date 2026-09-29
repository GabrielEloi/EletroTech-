import dotenv from 'dotenv';
import app from './app.js';
import { initializeDatabase } from './config/database.js';

dotenv.config();

const PORT = Number(process.env.PORT || 3001);

initializeDatabase();

app.listen(PORT, () => {
  console.log(`Backend EletroTech rodando na porta ${PORT}`);
});
