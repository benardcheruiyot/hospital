require('dotenv').config();

const useSqlite = process.env.DB_USE_SQLITE === 'true';

module.exports = {
  development: useSqlite
    ? {
        dialect: 'sqlite',
        storage: process.env.SQLITE_STORAGE || './database.sqlite',
        logging: false,
      }
    : {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
      },
  test: useSqlite
    ? {
        dialect: 'sqlite',
        storage: process.env.SQLITE_STORAGE || './database.test.sqlite',
        logging: false,
      }
    : {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: `${process.env.DB_NAME}_test`,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
      },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  },
};
