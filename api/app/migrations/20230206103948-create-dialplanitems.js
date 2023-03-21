'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('dialplan_items', {

      dialplan_item_id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      prefix: {
        type: Sequelize.STRING
      },
      priority: {
        type: Sequelize.STRING
      },
      channels: {
        type: Sequelize.INTEGER
      },
      pai: {
        type: Sequelize.INTEGER
      },
      trunck_id: {
        type: Sequelize.INTEGER
      },
      account_id: {
        type: Sequelize.INTEGER
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
    })

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('dialplan_items');
  }
};
