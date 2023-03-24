'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('notifications', {

      notification_id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER,
      },
      account_id: {
        type: Sequelize.INTEGER,
      },
      campaign_id: {
        type: Sequelize.INTEGER,
      },
      list_callfile_id: {
        type: Sequelize.INTEGER,
      },
      data: {
        type: Sequelize.JSONB,
      },
      active: {
        allowNull: true,
        type: Sequelize.STRING(1),
        defaultValue: "Y",
      },
      status: {
        allowNull: true,
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
      reminder_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    })

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('notifications');
  }
};
