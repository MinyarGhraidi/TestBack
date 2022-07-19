'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('message_attachments', {
      message_id: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      attachment_efile_id: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      attachment_post_id: {
        allowNull: true,
        type: Sequelize.INTEGER
      }
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
