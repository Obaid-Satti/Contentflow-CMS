import knex, { type Knex } from 'knex';

const isProduction = process.env.NODE_ENV === 'production';

export const dbConfig: Knex.Config = {
  client: 'pg',

  connection: isProduction
    ? process.env.DATABASE_URL!
    : {
      host: process.env.DB_HOST!,
      port: Number(process.env.DB_PORT!),
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
    },

  migrations: {
    directory: './src/database/migrations',
  },
};

export const db = knex(dbConfig);