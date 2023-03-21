'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('agent_log_events', {
      agent_log_event_id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      action_name: {
        type: Sequelize.STRING,
        defaultValue: 'logged-out'
      },
      user_id: {
        type: Sequelize.INTEGER
      },
      active: {
        allowNull: true,
        type: Sequelize.STRING(1),
        defaultValue: 'Y'
      },
      created_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      start_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      finish_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      pause_status_id: {
        type: Sequelize.INTEGER
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('agent_log_events');
  }
};
