'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('has_permissions', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      roles_crm_id: {
        type: Sequelize.INTEGER
      },
      permission_crm_id: {
        type: Sequelize.INTEGER
      },
      active: {
        type: Sequelize.STRING,
        defaultValue: 'Y'
      }
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
