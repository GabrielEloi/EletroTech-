import { createContext, useContext } from 'react';

// Mantém a identidade do contexto durante atualizações das telas pelo Vite.
export const AuthContext = createContext(null);
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}
