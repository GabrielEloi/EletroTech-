-- ============================================================
-- SCRIPT DE INSERÇÃO DE DADOS FICTÍCIOS PARA TESTES (SQL)
-- ============================================================

-- ------------------------------------------------------------
-- 1. ELETRICISTAS
-- ------------------------------------------------------------
INSERT INTO TABELA_ELETRICISTAS (id, cpf, nome, data_contratacao, data_demissao) VALUES
(1, '111.222.333-01', 'Carlos Eduardo Silva', '2022-01-15', NULL),
(2, '222.333.444-02', 'Roberto Ramos (Beto)', '2021-05-10', NULL),
(3, '333.444.555-03', 'Marcos Vinicius Santos', '2023-03-01', NULL),
(4, '444.555.666-04', 'João Pedro Ferreira', '2020-08-20', '2024-01-10');

-- ------------------------------------------------------------
-- 2. USUÁRIOS
-- ------------------------------------------------------------
INSERT INTO TABELA_USUARIOS (id, usuario, senha, is_admin, eletricista_id) VALUES
(1, 'admin.sistema', '$2a$12$eImiTXuWVfxh...hash', TRUE, NULL),
(2, 'carlos.eletricista', '$2a$12$eImiTXuWVfxh...hash', FALSE, 1),
(3, 'roberto.eletricista', '$2a$12$eImiTXuWVfxh...hash', FALSE, 2),
(4, 'marcos.eletricista', '$2a$12$eImiTXuWVfxh...hash', FALSE, 3);

-- ------------------------------------------------------------
-- 3. PERMISSÕES DE USUÁRIO
-- ------------------------------------------------------------
INSERT INTO TABELA_USUARIO_PERMISSAO (usuario_id, permissao) VALUES
(1, 'ADMIN_TOTAL'),
(1, 'GESTAO_ESTOQUE'),
(2, 'ABRIR_OS'),
(2, 'EXECUTAR_OS'),
(3, 'ABRIR_OS'),
(3, 'EXECUTAR_OS'),
(4, 'ABRIR_OS');

-- ------------------------------------------------------------
-- 4. PRODUTOS (MATERIAIS DE ESTOQUE)
-- ------------------------------------------------------------
INSERT INTO TABELA_PRODUTOS (id, nome_produto, vlr_unitario, qtd_estoque) VALUES
(1, 'Cabo Flexível 2,5mm² 750V Vermelho (Rolo 100m)', 145.90, 25),
(2, 'Cabo Flexível 2,5mm² 750V Azul (Rolo 100m)', 145.90, 18),
(3, 'Disjuntor Monopolar 20A DIN', 18.50, 120),
(4, 'Disjuntor Bipolar 32A DIN', 42.00, 45),
(5, 'Fita Isolante 19mm x 20m Premium', 9.80, 200),
(6, 'Tomada Dupla 10A 4x2 Completa', 22.90, 80),
(7, 'Lâmpada LED Bulbo 9W Bivolt 6500K', 8.50, 150),
(8, 'Quadro de Distribuição 12/16 Módulos Sobrepor', 89.90, 12);

-- ------------------------------------------------------------
-- 5. METAS DOS ELETRICISTAS
-- ------------------------------------------------------------
INSERT INTO TABELA_METAS (id, eletricista_meta, mes_meta, vlr_meta) VALUES
(1, 1, '2026-08', 15000.00),
(2, 2, '2026-08', 12000.00),
(3, 3, '2026-08', 10000.00),
(4, 1, '2026-09', 16000.00),
(5, 2, '2026-09', 12000.00);

-- ------------------------------------------------------------
-- 6. ORDENS DE SERVIÇO (OS)
-- ------------------------------------------------------------
INSERT INTO TABELA_ORDENS_SERVICO (id, eletricista_os, data_os, status, data_fechamento) VALUES
(101, 1, '2026-09-01', 'CONCLUIDA', '2026-09-01'),
(102, 2, '2026-09-02', 'EM_ANDAMENTO', NULL),
(103, 1, '2026-09-03', 'CONCLUIDA', '2026-09-04'),
(104, 3, '2026-09-05', 'CANCELADA', NULL);

-- ------------------------------------------------------------
-- 7. MATERIAIS UTILIZADOS NAS OS
-- ------------------------------------------------------------
INSERT INTO TABELA_OS_MATERIAIS (id, id_os, id_produto, qtd_utilizada) VALUES
(1, 101, 1, 1),
(2, 101, 3, 2),
(3, 101, 5, 1),
(4, 103, 6, 4),
(5, 103, 7, 6);

-- ------------------------------------------------------------
-- 8. COMENTÁRIOS DA OS
-- ------------------------------------------------------------
INSERT INTO TABELA_OS_COMENTARIOS (id, id_os, comentario, foto, data_comentario) VALUES
(1, 101, 'Troca do disjuntor geral concluída com sucesso.', 'http://midia.local/os/101_antes.jpg', '2026-09-01 10:30:00'),
(2, 101, 'Teste de carga realizado sem aquecimento.', 'http://midia.local/os/101_depois.jpg', '2026-09-01 11:15:00'),
(3, 102, 'Aguardando cliente autorizar a troca da fiação interna.', NULL, '2026-09-02 14:00:00');

-- ------------------------------------------------------------
-- 9. CHECKLISTS E PERGUNTAS DE SEGURANÇA/PROCESSO
-- ------------------------------------------------------------
INSERT INTO TABELA_CHECKLIST (id, titulo, tipo, selecionado) VALUES
(1, 'Checklist de Segurança EPI/EPC', 'SEGURANCA', TRUE),
(2, 'Checklist de Qualidade Pós-Serviço', 'QUALIDADE', FALSE);

INSERT INTO TABELA_CHECKLIST_PERGUNTAS (id, id_checklist, texto_pergunta, ordem, tipo_resposta, bloqueia_abertura) VALUES
(1, 1, 'O circuito foi desenergizado e testado antes do início?', 1, 'SIM_NAO', 'SIM'),
(2, 1, 'O eletricista está utilizando luvas de proteção e capacete?', 2, 'SIM_NAO', 'SIM'),
(3, 2, 'A área de trabalho foi limpa e organizada?', 1, 'SIM_NAO', 'NAO');

-- ------------------------------------------------------------
-- 10. RESPOSTAS E STATUS DO CHECKLIST DA OS
-- ------------------------------------------------------------
INSERT INTO TABELA_OS_CHECKLIST_RESPOSTAS (id, id_os, id_pergunta, resposta, motivo_nao) VALUES
(1, 101, 1, 'SIM', NULL),
(2, 101, 2, 'SIM', NULL),
(3, 102, 1, 'NAO', 'Disjuntor preso por trava de terceiros');

INSERT INTO TABELA_OS_CHECKLIST_STATUS (id, id_os, tipo, bloqueado, observacao, data_bloqueio, data_finalizacao) VALUES
(1, 101, 'SEGURANCA', FALSE, 'Tudo liberado conforme normas.', NULL, '2026-09-01 08:30:00'),
(2, 102, 'SEGURANCA', TRUE, 'Serviço bloqueado por risco elétrico.', '2026-09-02 09:10:00', NULL);

-- ------------------------------------------------------------
-- 11. BAIXAS DE MATERIAIS
-- ------------------------------------------------------------
INSERT INTO TABELA_BAIXAS (id, tipo, data_baixa, id_eletricista, observacao, status, id_usuario, data_abertura, data_finalizacao) VALUES
(1, 'SAIDA_SERVICO', '2026-09-01', 1, 'Retirada de insumos para atendimento da OS 101', 'APROVADA', 2, '2026-09-01 07:45:00', '2026-09-01 08:00:00'),
(2, 'PERDA_DANIFICADO', '2026-09-03', 2, 'Cabo avariado na embalagem durante transporte', 'FINALIZADA', 1, '2026-09-03 16:20:00', '2026-09-03 16:30:00');

INSERT INTO TABELA_BAIXA_ITENS (id, id_baixa, id_produto, quantidade, valor_unitario) VALUES
(1, 1, 1, 1, 145.90),
(2, 1, 3, 2, 18.50),
(3, 1, 5, 1, 9.80),
(4, 2, 2, 1, 145.90);

-- ------------------------------------------------------------
-- 12. MOVIMENTAÇÕES DE ESTOQUE
-- ------------------------------------------------------------
INSERT INTO TABELA_MOVIMENTACOES (id, id_produto, tipo, quantidade, valor_unitario, data_mov, origem, id_os, id_baixa, id_usuario) VALUES
-- Movimentação originada pela Baixa 1
(1, 1, 'SAIDA', 1, 145.90, '2026-09-01', 'BAIXA_ESTOQUE', 101, 1, 2),
(2, 3, 'SAIDA', 2, 18.50, '2026-09-01', 'BAIXA_ESTOQUE', 101, 1, 2),
-- Movimentação originada por Ajuste/Perda na Baixa 2
(3, 2, 'SAIDA', 1, 145.90, '2026-09-03', 'PERDA', NULL, 2, 1),
-- Entrada de estoque realizada pelo Administrador
(4, 4, 'ENTRADA', 20, 42.00, '2026-09-04', 'COMPRA_FORNECEDOR', NULL, NULL, 1);