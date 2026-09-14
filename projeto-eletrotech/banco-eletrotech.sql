-- MySQL dump 10.13  Distrib 8.0.44, for macos12.7 (arm64)
--
-- Host: 127.0.0.1    Database: eletrotech
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `tabela_baixa_itens`
--

DROP TABLE IF EXISTS `tabela_baixa_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tabela_baixa_itens` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tabela_baixa_itens`
--

LOCK TABLES `tabela_baixa_itens` WRITE;
/*!40000 ALTER TABLE `tabela_baixa_itens` DISABLE KEYS */;
/*!40000 ALTER TABLE `tabela_baixa_itens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tabela_baixas`
--

DROP TABLE IF EXISTS `tabela_baixas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tabela_baixas` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tabela_baixas`
--

LOCK TABLES `tabela_baixas` WRITE;
/*!40000 ALTER TABLE `tabela_baixas` DISABLE KEYS */;
/*!40000 ALTER TABLE `tabela_baixas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tabela_checklist`
--

DROP TABLE IF EXISTS `tabela_checklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tabela_checklist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('inicio','fim') COLLATE utf8mb4_unicode_ci NOT NULL,
  `selecionado` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tabela_checklist`
--

LOCK TABLES `tabela_checklist` WRITE;
/*!40000 ALTER TABLE `tabela_checklist` DISABLE KEYS */;
/*!40000 ALTER TABLE `tabela_checklist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tabela_checklist_perguntas`
--

DROP TABLE IF EXISTS `tabela_checklist_perguntas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tabela_checklist_perguntas` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tabela_checklist_perguntas`
--

LOCK TABLES `tabela_checklist_perguntas` WRITE;
/*!40000 ALTER TABLE `tabela_checklist_perguntas` DISABLE KEYS */;
/*!40000 ALTER TABLE `tabela_checklist_perguntas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tabela_eletricistas`
--

DROP TABLE IF EXISTS `tabela_eletricistas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tabela_eletricistas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cpf` varchar(14) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_contratacao` date NOT NULL,
  `data_demissao` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cpf` (`cpf`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tabela_eletricistas`
--

LOCK TABLES `tabela_eletricistas` WRITE;
/*!40000 ALTER TABLE `tabela_eletricistas` DISABLE KEYS */;
INSERT INTO `tabela_eletricistas` VALUES (1,'67125897037','Carlos Alberto','2026-05-28',NULL),(2,'07574900345','Lucas','2025-03-15',NULL);
/*!40000 ALTER TABLE `tabela_eletricistas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tabela_metas`
--

DROP TABLE IF EXISTS `tabela_metas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tabela_metas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eletricista_meta` int NOT NULL,
  `mes_meta` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vlr_meta` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `eletricista_meta` (`eletricista_meta`),
  CONSTRAINT `tabela_metas_ibfk_1` FOREIGN KEY (`eletricista_meta`) REFERENCES `tabela_eletricistas` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tabela_metas`
--

LOCK TABLES `tabela_metas` WRITE;
/*!40000 ALTER TABLE `tabela_metas` DISABLE KEYS */;
INSERT INTO `tabela_metas` VALUES (1,1,'2026-06',2000.00),(2,2,'2026-04',5000.00),(3,2,'2026-08',3000.00);
/*!40000 ALTER TABLE `tabela_metas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tabela_movimentacoes`
--

DROP TABLE IF EXISTS `tabela_movimentacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tabela_movimentacoes` (
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
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tabela_movimentacoes`
--

LOCK TABLES `tabela_movimentacoes` WRITE;
/*!40000 ALTER TABLE `tabela_movimentacoes` DISABLE KEYS */;
INSERT INTO `tabela_movimentacoes` VALUES (1,3,'saida',30,6.50,'2026-05-25','OS #00001',1,NULL,NULL),(2,1,'saida',50,120.50,'0026-05-10','OS #00002',2,NULL,NULL),(3,1,'saida',1,120.50,'0026-05-10','OS #00002',2,NULL,NULL),(4,5,'saida',1,10.00,'2026-07-06','OS #00003',3,NULL,NULL),(5,5,'saida',1,10.00,'2026-07-06','OS #00003',3,NULL,NULL),(6,2,'saida',20,18.90,'2026-03-20','OS #00006',6,NULL,NULL),(8,1,'entrada',51,120.50,'0026-05-10','Estoque inicial',NULL,NULL,NULL),(9,2,'entrada',20,18.90,'0026-05-10','Estoque inicial',NULL,NULL,NULL),(10,3,'entrada',100,6.50,'0026-05-10','Estoque inicial',NULL,NULL,NULL),(11,4,'entrada',50,10.90,'0026-05-10','Estoque inicial',NULL,NULL,NULL),(12,5,'entrada',2,10.00,'0026-05-10','Estoque inicial',NULL,NULL,NULL),(13,6,'entrada',3,9.90,'0026-05-10','Estoque inicial',NULL,NULL,NULL),(18,6,'entrada',5,9.90,'2026-07-20','Reposição de estoque',NULL,NULL,NULL),(19,7,'entrada',10000,100.00,'2026-07-20','Reposição de estoque',NULL,NULL,NULL),(20,7,'saida',20,100.00,'2026-07-20','OS #00008',8,NULL,NULL),(22,7,'entrada',20,100.00,'2026-07-21','Reposição de estoque',NULL,NULL,NULL),(24,6,'saida',1,9.90,'0025-03-15','OS #00010',10,NULL,NULL),(25,4,'entrada',40,10.90,'2026-07-21','Reposição de estoque',NULL,NULL,NULL),(26,4,'saida',40,10.90,'2026-07-21','Baixa manual de estoque',NULL,NULL,NULL),(27,4,'entrada',50,10.90,'2026-07-21','Reposição de estoque',NULL,NULL,NULL),(28,4,'saida',50,10.90,'2026-07-21','Baixa manual de estoque',NULL,NULL,NULL);
/*!40000 ALTER TABLE `tabela_movimentacoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tabela_ordens_servico`
--

DROP TABLE IF EXISTS `tabela_ordens_servico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tabela_ordens_servico` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eletricista_os` int NOT NULL,
  `data_os` date DEFAULT NULL,
  `status` enum('solicitada','aberta','bloqueada','fechada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'solicitada',
  `data_fechamento` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `eletricista_os` (`eletricista_os`),
  CONSTRAINT `tabela_ordens_servico_ibfk_1` FOREIGN KEY (`eletricista_os`) REFERENCES `tabela_eletricistas` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tabela_ordens_servico`
--

LOCK TABLES `tabela_ordens_servico` WRITE;
/*!40000 ALTER TABLE `tabela_ordens_servico` DISABLE KEYS */;
INSERT INTO `tabela_ordens_servico` VALUES (1,1,'2026-05-25','aberta',NULL),(2,1,'0026-05-10','aberta',NULL),(3,1,'2026-07-06','aberta',NULL),(4,2,'2026-03-13','aberta',NULL),(5,2,'2006-03-15','aberta',NULL),(6,2,'2026-03-20','aberta',NULL),(8,2,'2026-07-20','aberta',NULL),(10,2,'0025-03-15','aberta',NULL);
/*!40000 ALTER TABLE `tabela_ordens_servico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tabela_os_checklist_respostas`
--

DROP TABLE IF EXISTS `tabela_os_checklist_respostas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tabela_os_checklist_respostas` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tabela_os_checklist_respostas`
--

LOCK TABLES `tabela_os_checklist_respostas` WRITE;
/*!40000 ALTER TABLE `tabela_os_checklist_respostas` DISABLE KEYS */;
/*!40000 ALTER TABLE `tabela_os_checklist_respostas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tabela_os_materiais`
--

DROP TABLE IF EXISTS `tabela_os_materiais`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tabela_os_materiais` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_os` int NOT NULL,
  `id_produto` int NOT NULL,
  `qtd_utilizada` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_os` (`id_os`),
  KEY `id_produto` (`id_produto`),
  CONSTRAINT `tabela_os_materiais_ibfk_1` FOREIGN KEY (`id_os`) REFERENCES `tabela_ordens_servico` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tabela_os_materiais_ibfk_2` FOREIGN KEY (`id_produto`) REFERENCES `tabela_produtos` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tabela_os_materiais`
--

LOCK TABLES `tabela_os_materiais` WRITE;
/*!40000 ALTER TABLE `tabela_os_materiais` DISABLE KEYS */;
INSERT INTO `tabela_os_materiais` VALUES (1,1,3,30),(2,2,1,50),(3,2,1,1),(4,3,5,1),(5,3,5,1),(6,6,2,20),(8,8,7,20),(10,10,6,1);
/*!40000 ALTER TABLE `tabela_os_materiais` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tabela_os_comentarios`
--

DROP TABLE IF EXISTS `tabela_os_comentarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tabela_os_comentarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_os` int NOT NULL,
  `comentario` text COLLATE utf8mb4_unicode_ci,
  `foto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_comentario` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_os` (`id_os`),
  CONSTRAINT `fk_coment_os` FOREIGN KEY (`id_os`) REFERENCES `tabela_ordens_servico` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tabela_produtos`
--

DROP TABLE IF EXISTS `tabela_produtos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tabela_produtos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome_produto` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vlr_unitario` decimal(10,2) NOT NULL,
  `qtd_estoque` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tabela_produtos`
--

LOCK TABLES `tabela_produtos` WRITE;
/*!40000 ALTER TABLE `tabela_produtos` DISABLE KEYS */;
INSERT INTO `tabela_produtos` VALUES (1,'Cabo Flexível 2.5mm Preto',120.50,0),(2,'Disjuntor DIN 16A',18.90,0),(3,'Fita Isolante 3M',6.50,70),(4,'Fita',10.90,0),(5,'cabo',10.00,0),(6,'Cabo',9.90,7),(7,'Cabo de energia',100.00,10000);
/*!40000 ALTER TABLE `tabela_produtos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tabela_usuarios`
--

DROP TABLE IF EXISTS `tabela_usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tabela_usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT '0',
  `eletricista_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario` (`usuario`),
  KEY `fk_usuario_eletricista` (`eletricista_id`),
  CONSTRAINT `fk_usuario_eletricista` FOREIGN KEY (`eletricista_id`) REFERENCES `tabela_eletricistas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tabela_usuarios`
--

LOCK TABLES `tabela_usuarios` WRITE;
/*!40000 ALTER TABLE `tabela_usuarios` DISABLE KEYS */;
INSERT INTO `tabela_usuarios` VALUES (26,'Lucas','$2y$10$1DnK3WE2RZ9gLKOP6HGF1uHR.A8jSc2FYFZ9ysUL95W/f5WlxfMvq',1,NULL),(49,'Eloi','$2y$10$C4cTLI3DOG.Gt43cKJZkr.n.HSra9UF0joaRt7mUuBaVXl4y0z8ly',1,NULL);
/*!40000 ALTER TABLE `tabela_usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tabela_usuario_permissao`
--

DROP TABLE IF EXISTS `tabela_usuario_permissao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tabela_usuario_permissao` (
  `usuario_id` int NOT NULL,
  `permissao` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`usuario_id`,`permissao`),
  CONSTRAINT `fk_permissao_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `tabela_usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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

--
-- Dumping data for table `tabela_usuario_permissao`
--

LOCK TABLES `tabela_usuario_permissao` WRITE;
/*!40000 ALTER TABLE `tabela_usuario_permissao` DISABLE KEYS */;
/*!40000 ALTER TABLE `tabela_usuario_permissao` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed
