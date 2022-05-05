'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('permission_acls', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      role_id: {
        type: Sequelize.INTEGER
      },
      permission_acl_id: {
        type: Sequelize.INTEGER
      },
      active: {
        type: Sequelize.STRING,
        defaultValue: 'Y'
      },
      label: {
        type: Sequelize.STRING
      },
      code: {
        type: Sequelize.STRING
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
