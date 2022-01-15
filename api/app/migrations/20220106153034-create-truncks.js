'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('truncks', {
      trunck_id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      account_id: {
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      proxy: {
        type: Sequelize.STRING
      },
      register: {
        type: Sequelize.STRING,
        defaultValue: 'Y'
      },
      codec_prefs: {
        type: Sequelize.STRING
      },
      channels: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'Y'
      },
      gateways: {
        type: Sequelize.JSONB
      },
      active: {
        allowNull: true,
        type: Sequelize.STRING,
        defaultValue: 'Y'
      },
      created_at: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: new Date()
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: new Date()
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('truncks');
  }
};