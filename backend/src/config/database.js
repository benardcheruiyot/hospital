const { Sequelize } = require('sequelize');
const config = require('./config')[process.env.NODE_ENV || 'development'];

let sequelize;

// Development convenience: allow using a local SQLite DB when
// `DB_USE_SQLITE=true` is set in the environment. This avoids requiring
// a full Postgres install for simple local development and tests.
if (process.env.DB_USE_SQLITE === 'true') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.SQLITE_STORAGE || './database.sqlite',
    logging: false,
  });
} else if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

module.exports = sequelize;
