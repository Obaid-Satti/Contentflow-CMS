import knex, { type Knex } from 'knex';

export const dbConfig: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'contentflow',
    password: process.env.DB_PASSWORD || 'contentflow_password',
    database: process.env.DB_NAME || 'contentflow',
  },
  migrations: {
    directory: './src/database/migrations',
  },
};

export const db = knex(dbConfig);
