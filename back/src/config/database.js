const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dialectOptions = {};

if (process.env.DB_SSL === 'true') {
  let ca;
  // Priority 1: env var (for cloud deploy like Render)
  if (process.env.DB_SSL_CA) {
    ca = process.env.DB_SSL_CA;
  } else {
    // Priority 2: local file
    const caPath = path.join(__dirname, 'ca.pem');
    if (fs.existsSync(caPath)) {
      ca = fs.readFileSync(caPath);
    }
  }

  dialectOptions.ssl = {
    ...(ca && { ca }),
    rejectUnauthorized: true
  };
}

const isSqlite = !process.env.DB_HOST || process.env.DB_DIALECT === 'sqlite';

console.log(`[PARKO] DB Configuration: Dialect=${isSqlite ? 'sqlite' : 'mysql'}, Host=${process.env.DB_HOST || 'local-sqlite'}, SSL=${process.env.DB_SSL || 'false'}`);

const sequelize = isSqlite
  ? new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', '..', 'database.sqlite'),
    logging: false
  })
  : new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      dialect: 'mysql',
      dialectOptions,
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );

module.exports = sequelize;
