import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Usa a mesma transformação JSX do frontend nos testes das permissões visíveis.
export default defineConfig({ plugins: [react()], test: { environment: 'node' } });
