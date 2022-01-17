'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('emails', {
      email_id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      account_id: {
        type: Sequelize.INTEGER,
      },
      is_sended: {
        type: Sequelize.STRING,
      },
      active: {
        type: Sequelize.STRING,
      },
      category: {
        type: Sequelize.STRING,
      },
      template: {
        type: Sequelize.JSONB,
      },
    }, {})
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('emails');
  }
};