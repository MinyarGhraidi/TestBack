'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('servers', {

      server_id :{
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      ip: {
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING
      },
      active: {
        type: Sequelize.STRING(1),
        defaultValue: 'Y'
      },
      status: {
        type: Sequelize.STRING(1),
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
      sip_device: {
        type: Sequelize.JSONB
      },
    })

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('servers');
  }
};
