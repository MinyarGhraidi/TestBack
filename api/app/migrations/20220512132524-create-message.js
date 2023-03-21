'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('messages', {
      message_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      created_by_id: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      message_channel_id: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      content: {
        allowNull: true,
        type: Sequelize.STRING
      },
      attachment_post_id: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      created_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
      active: {
        allowNull: true,
        type: Sequelize.STRING(1),
        defaultValue: 'Y'
      },
    })
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
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
