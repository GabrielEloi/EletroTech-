// Migração aditiva: os registros legados e suas metas monetárias são preservados.
export async function up(connection) {
  async function column(table, name, definition) {
    const [rows] = await connection.execute('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?', [table, name]);
    if (!rows.length) await connection.query(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
  }
  await connection.query(`CREATE TABLE IF NOT EXISTS tabela_supervisor_eletricista (
    eletricista_id INT NOT NULL PRIMARY KEY,
    supervisor_id INT NOT NULL,
    associado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_supervisor_equipe (supervisor_id),
    CONSTRAINT fk_equipe_eletricista FOREIGN KEY (eletricista_id) REFERENCES tabela_eletricistas(id),
    CONSTRAINT fk_equipe_supervisor FOREIGN KEY (supervisor_id) REFERENCES tabela_usuarios(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  await column('tabela_usuarios', 'sessao_versao', 'INT NOT NULL DEFAULT 0');
  await column('tabela_metas', 'tipo_periodo', "VARCHAR(7) NOT NULL DEFAULT 'mensal'");
  await column('tabela_metas', 'qtd_os_meta', 'INT NULL');
  await column('tabela_metas', 'criado_por', 'INT NULL');
  await column('tabela_ordens_servico', 'valor_servico', 'DECIMAL(12,2) NOT NULL DEFAULT 0');
  await column('tabela_ordens_servico', 'descricao', 'TEXT NULL');
  await column('tabela_ordens_servico', 'local_servico', 'VARCHAR(255) NULL');
  await connection.query(`CREATE TABLE IF NOT EXISTS tabela_os_checklist_status (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, id_os INT NOT NULL,
    tipo ENUM('inicio','fim') NOT NULL, bloqueado TINYINT(1) NOT NULL DEFAULT 1,
    observacao TEXT NULL, data_bloqueio DATETIME NULL, data_finalizacao DATETIME NULL,
    UNIQUE KEY uk_os_tipo (id_os,tipo),
    CONSTRAINT fk_os_checklist_status_os FOREIGN KEY (id_os) REFERENCES tabela_ordens_servico(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  await column('tabela_os_checklist_status', 'decisao', 'VARCHAR(20) NULL');
  await column('tabela_os_checklist_status', 'id_usuario', 'INT NULL');
  await column('tabela_os_checklist_status', 'origem', "VARCHAR(12) NOT NULL DEFAULT 'checklist'");
  await column('tabela_os_checklist_status', 'status_anterior', 'VARCHAR(12) NULL');
  await connection.query(`CREATE TABLE IF NOT EXISTS tabela_os_eventos (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, id_os INT NOT NULL,
    id_usuario INT NOT NULL, acao VARCHAR(40) NOT NULL, observacao TEXT NULL,
    data_evento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_evento_os (id_os),
    CONSTRAINT fk_evento_os FOREIGN KEY (id_os) REFERENCES tabela_ordens_servico(id),
    CONSTRAINT fk_evento_usuario FOREIGN KEY (id_usuario) REFERENCES tabela_usuarios(id)
  ) ENGINE=InnoDB`);
  await connection.query(`CREATE TABLE IF NOT EXISTS tabela_sessoes (
    token_hash CHAR(64) NOT NULL PRIMARY KEY, usuario_id INT NOT NULL,
    expira_em DATETIME NOT NULL,
    CONSTRAINT fk_sessao_usuario FOREIGN KEY (usuario_id) REFERENCES tabela_usuarios(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  await connection.query(`CREATE TABLE IF NOT EXISTS tabela_os_fotos (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, id_os INT NOT NULL, id_usuario INT NOT NULL,
    etapa VARCHAR(20) NOT NULL, arquivo VARCHAR(80) NOT NULL, content_type VARCHAR(30) NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_foto_os FOREIGN KEY (id_os) REFERENCES tabela_ordens_servico(id),
    CONSTRAINT fk_foto_usuario FOREIGN KEY (id_usuario) REFERENCES tabela_usuarios(id)
  ) ENGINE=InnoDB`);
  // Antes desta versão havia OS bloqueadas sem pendência correspondente.
  // Mantém o bloqueio e oferece a revisão na nova consulta, sem liberar OS.
  await connection.query(`INSERT INTO tabela_os_checklist_status (id_os,tipo,bloqueado,data_bloqueio,observacao)
    SELECT os.id,'inicio',1,NOW(),'Bloqueio legado: revisar antes de liberar.' FROM tabela_ordens_servico os
    WHERE os.status='bloqueada' AND NOT EXISTS (SELECT 1 FROM tabela_os_checklist_status s WHERE s.id_os=os.id AND s.bloqueado=1)`);
}
