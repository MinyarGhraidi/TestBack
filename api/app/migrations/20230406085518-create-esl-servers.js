'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('esl_servers', {

      esl_server_id :{
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      ip: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING
      },
      port: {
        type: Sequelize.STRING
      },
      password: {
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
    return queryInterface.dropTable('esl_servers');
  }
};
