'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

const timezone = 'Africa/Tunis';
process.env.TZ = timezone;

let sequelize;
let sequalize_extra_config = config;
sequalize_extra_config.pool = {
  max: 30,
  min: 0,
  idle: 10000,
  acquire: 10000,
  handleDisconnects: true,
  evict: 60000,
  connectRetries: 30,
  operatorsAliases: false,
};

sequalize_extra_config.timezone = timezone;
sequalize_extra_config.dialectOptions = {
  useUTC: false,
  timezone: timezone
}

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], sequalize_extra_config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, sequalize_extra_config);
}

fs.readdirSync(__dirname)
    .filter(file => {
      return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
      const model = sequelize['import'](path.join(__dirname, file));
      db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
