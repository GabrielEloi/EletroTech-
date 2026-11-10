-- Schema legado sem dados pessoais, DROP ou INSERT. Completar com npm run db:migrate.

CREATE TABLE IF NOT EXISTS `tabela_baixa_itens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_baixa` int NOT NULL,
  `id_produto` int NOT NULL,
  `quantidade` int NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `fk_item_baixa` (`id_baixa`),
  KEY `fk_item_produto` (`id_produto`),
  CONSTRAINT `fk_item_baixa` FOREIGN KEY (`id_baixa`) REFERENCES `tabela_baixas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_item_produto` FOREIGN KEY (`id_produto`) REFERENCES `tabela_produtos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tabela_baixas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo` enum('entrada','saida') COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_baixa` date NOT NULL,
  `id_eletricista` int NOT NULL,
  `observacao` text COLLATE utf8mb4_unicode_ci,
  `status` enum('rascunho','finalizada','cancelada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'rascunho',
  `id_usuario` int DEFAULT NULL,
  `data_abertura` datetime NOT NULL,
  `data_finalizacao` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_baixa_eletricista` (`id_eletricista`),
  KEY `fk_baixa_usuario` (`id_usuario`),
  KEY `idx_baixa_rascunho` (`id_usuario`,`tipo`,`status`),
  CONSTRAINT `fk_baixa_eletricista` FOREIGN KEY (`id_eletricista`) REFERENCES `tabela_eletricistas` (`id`),
  CONSTRAINT `fk_baixa_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `tabela_usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tabela_checklist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('inicio','fim') COLLATE utf8mb4_unicode_ci NOT NULL,
  `selecionado` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tabela_checklist_perguntas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_checklist` int NOT NULL,
  `texto_pergunta` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ordem` int NOT NULL DEFAULT '0',
  `tipo_resposta` enum('radio','text') NOT NULL DEFAULT 'text',
  `bloqueia_abertura` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_checklist` (`id_checklist`),
  CONSTRAINT `tabela_checklist_perguntas_ibfk_1` FOREIGN KEY (`id_checklist`) REFERENCES `tabela_checklist` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tabela_eletricistas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cpf` varchar(14) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_contratacao` date NOT NULL,
  `data_demissao` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cpf` (`cpf`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tabela_metas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eletricista_meta` int NOT NULL,
  `mes_meta` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vlr_meta` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `eletricista_meta` (`eletricista_meta`),
  CONSTRAINT `tabela_metas_ibfk_1` FOREIGN KEY (`eletricista_meta`) REFERENCES `tabela_eletricistas` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tabela_movimentacoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_produto` int NOT NULL,
  `tipo` enum('entrada','saida') NOT NULL,
  `quantidade` int NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL DEFAULT '0.00',
  `data_mov` date NOT NULL,
  `origem` varchar(100) NOT NULL DEFAULT '',
  `id_os` int DEFAULT NULL,
  `id_baixa` int DEFAULT NULL,
  `id_usuario` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_mov_produto` (`id_produto`),
  KEY `fk_mov_os` (`id_os`),
  KEY `fk_mov_baixa` (`id_baixa`),
  KEY `fk_mov_usuario` (`id_usuario`),
  CONSTRAINT `fk_mov_os` FOREIGN KEY (`id_os`) REFERENCES `tabela_ordens_servico` (`id`),
  CONSTRAINT `fk_mov_produto` FOREIGN KEY (`id_produto`) REFERENCES `tabela_produtos` (`id`),
  CONSTRAINT `fk_mov_baixa` FOREIGN KEY (`id_baixa`) REFERENCES `tabela_baixas` (`id`),
  CONSTRAINT `fk_mov_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `tabela_usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `tabela_ordens_servico` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eletricista_os` int NOT NULL,
  `data_os` date DEFAULT NULL,
  `status` enum('solicitada','aberta','bloqueada','fechada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'solicitada',
  `data_fechamento` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `eletricista_os` (`eletricista_os`),
  CONSTRAINT `tabela_ordens_servico_ibfk_1` FOREIGN KEY (`eletricista_os`) REFERENCES `tabela_eletricistas` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tabela_os_checklist_respostas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_os` int NOT NULL,
  `id_pergunta` int NOT NULL,
  `resposta` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `motivo_nao` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `id_os` (`id_os`),
  KEY `id_pergunta` (`id_pergunta`),
  CONSTRAINT `tabela_os_checklist_respostas_ibfk_1` FOREIGN KEY (`id_os`) REFERENCES `tabela_ordens_servico` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tabela_os_checklist_respostas_ibfk_2` FOREIGN KEY (`id_pergunta`) REFERENCES `tabela_checklist_perguntas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tabela_os_materiais` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_os` int NOT NULL,
  `id_produto` int NOT NULL,
  `qtd_utilizada` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_os` (`id_os`),
  KEY `id_produto` (`id_produto`),
  CONSTRAINT `tabela_os_materiais_ibfk_1` FOREIGN KEY (`id_os`) REFERENCES `tabela_ordens_servico` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tabela_os_materiais_ibfk_2` FOREIGN KEY (`id_produto`) REFERENCES `tabela_produtos` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tabela_os_comentarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_os` int NOT NULL,
  `comentario` text COLLATE utf8mb4_unicode_ci,
  `foto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_comentario` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_os` (`id_os`),
  CONSTRAINT `fk_coment_os` FOREIGN KEY (`id_os`) REFERENCES `tabela_ordens_servico` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tabela_produtos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome_produto` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vlr_unitario` decimal(10,2) NOT NULL,
  `qtd_estoque` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tabela_usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT '0',
  `eletricista_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario` (`usuario`),
  KEY `fk_usuario_eletricista` (`eletricista_id`),
  CONSTRAINT `fk_usuario_eletricista` FOREIGN KEY (`eletricista_id`) REFERENCES `tabela_eletricistas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tabela_usuario_permissao` (
  `usuario_id` int NOT NULL,
  `permissao` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`usuario_id`,`permissao`),
  CONSTRAINT `fk_permissao_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `tabela_usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tabela_os_checklist_status (
  id INT NOT NULL AUTO_INCREMENT,
  id_os INT NOT NULL,
  tipo ENUM('inicio','fim') NOT NULL,
  bloqueado TINYINT(1) NOT NULL DEFAULT 1,
  observacao TEXT NULL,
  data_bloqueio DATETIME NULL,
  data_finalizacao DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_os_tipo (id_os, tipo),
  CONSTRAINT fk_os_checklist_status_os
    FOREIGN KEY (id_os) REFERENCES tabela_ordens_servico(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
