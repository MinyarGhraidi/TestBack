'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('permission_acls', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      label: {
        type: Sequelize.STRING
      },
      code: {
        type: Sequelize.STRING
      },
      active: {
        type: Sequelize.STRING,
        defaultValue: 'Y'
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('permission_acls');

  }
};
