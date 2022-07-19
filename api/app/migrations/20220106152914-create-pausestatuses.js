'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('pausestatuses', {
      pausestatus_id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER,
      },
      code: {
        type: Sequelize.STRING,
      },
      label: {
        type: Sequelize.STRING,
      },
      isDefault: {
        type: Sequelize.STRING,
        defaultValue: "N",
      },
      pause_type: {
        type: Sequelize.STRING
      },
      campaign_id: {
        type: Sequelize.INTEGER
      },
      duration: {
        type: Sequelize.INTEGER
      },
      active: {
        allowNull: true,
        type: Sequelize.STRING,
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
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('pausestatuses');
  }
};