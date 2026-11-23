import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize(process.env.DB_NAME || 'digital_store', process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '', {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    dialectOptions: process.env.DB_SOCKET ? { socketPath: process.env.DB_SOCKET } : {},
    logging: false
  });

export async function connect() {
  await sequelize.authenticate();
}
