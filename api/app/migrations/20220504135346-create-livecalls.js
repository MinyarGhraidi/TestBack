'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('live_calls', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      events: {
        type: Sequelize.JSONB
      },
      callid: {
        type: Sequelize.STRING
      },
      active: {
        type: Sequelize.STRING,
        defaultValue: 'Y'
      },
      agent_id: {
        type: Sequelize.INTEGER
      },
      created_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE,
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('live_calls');

  }
};