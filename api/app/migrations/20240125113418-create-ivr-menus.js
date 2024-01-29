'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('ivr_menus', {
      ivr_menu_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      extension: {
        type: Sequelize.STRING
      },
      active: {
        allowNull: true,
        type: Sequelize.STRING,
        defaultValue: "Y",
    },
      flow: {
        type: Sequelize.JSONB
      },
      campaign_id: {
        type: Sequelize.INTEGER
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('ivr_menus');
  }
};