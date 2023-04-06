'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('domains', {

      domain_id: {
        primaryKey: true,
            autoIncrement: true,
            type: Sequelize.INTEGER,
      },
      domain_name: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.STRING,
      },
      active: {
        allowNull: true,
            type: Sequelize.STRING(1),
            defaultValue: "Y",
      },
      status: {
        type: Sequelize.STRING(1),
            defaultValue: "Y",
      },
      created_at: {
        allowNull: true,
            type: Sequelize.DATE,
            defaultValue: new Date(),
      },
      updated_at: {
        allowNull: true,
            type: Sequelize.DATE,
            defaultValue: new Date(),
      },
      params: {
        type: Sequelize.JSONB
      },
        esl_server_id:{
            type: Sequelize.INTEGER
        }
    })

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('domains');
  }
};
