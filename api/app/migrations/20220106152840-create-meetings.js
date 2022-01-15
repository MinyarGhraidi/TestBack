'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('meetings', {
      meeting_id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING
      },
      agent_id: {
        type: Sequelize.INTEGER
      },
      sales_id: {
        type: Sequelize.INTEGER
      },
      account_id: {
        type: Sequelize.INTEGER
      },
      active: {
        allowNull: true,
        type: Sequelize.STRING,
        defaultValue: 'Y'
      },
      address: {
        type: Sequelize.STRING
      },
      date: {
        allowNull: true,
        type: Sequelize.DATE
      },
      started_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
      finished_at: {
        allowNull: true,
        type: Sequelize.DATE
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
    return queryInterface.dropTable('meetings');
  }
};