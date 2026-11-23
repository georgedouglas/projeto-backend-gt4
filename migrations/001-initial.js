import { readFile } from 'node:fs/promises';
import { DataTypes } from 'sequelize';
import { sequelize } from '../connection.js';

const query = sequelize.getQueryInterface();
try {
  await query.createTable('schema_migrations', {
    version: { type: DataTypes.STRING(32), primaryKey: true, allowNull: false }
  });
  const [applied] = await sequelize.query("SELECT version FROM schema_migrations WHERE version = '001'");
  if (!applied.length) {
    // MySQL commits DDL implicitly. Each create is repeatable if setup is interrupted.
    const sql = await readFile(new URL('./001-initial.sql', import.meta.url), 'utf8');
    for (const statement of sql.split(';').map(value => value.trim()).filter(Boolean)) {
      await sequelize.query(statement);
    }
    await sequelize.query("INSERT IGNORE INTO schema_migrations (version) VALUES ('001')");
  }
  console.log('Migration 001 aplicada.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
