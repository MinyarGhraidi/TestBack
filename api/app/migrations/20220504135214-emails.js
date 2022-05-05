'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('emails', {
      email_id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
      },
      is_sended: {
        type: Sequelize.STRING,
        defaultValue: 'N'
      },
      active: {
        type: Sequelize.STRING,
        defaultValue: 'Y'
      },
      category: {
        type: Sequelize.STRING,
      },
      last_password: {
        type: Sequelize.STRING,
      },
      template: {
        type: Sequelize.JSONB,
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
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
