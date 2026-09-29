import express from 'express';
import { loginUsuario } from '../services/auth.service.js';

const router = express.Router();

router.post('/entrar', async (req, res) => {
  try {
    const body = req.body || {};
    const nome = body.nome ?? body.usuario ?? body.login ?? '';
    const senha = body.senha ?? body.password ?? '';

    const dados = await loginUsuario({ nome, senha });

    globalThis.__ELETROTECH_USER__ = dados;

    return res.status(200).json(dados);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      mensagem: error.message || 'Erro ao autenticar.'
    });
  }
});

router.get('/sair', (req, res) => {
  globalThis.__ELETROTECH_USER__ = null;
  return res.status(200).json({ mensagem: 'Logout realizado com sucesso.' });
});

router.get('/home', (req, res) => {
  if (!globalThis.__ELETROTECH_USER__) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  return res.status(200).json(globalThis.__ELETROTECH_USER__);
});

export default router;
