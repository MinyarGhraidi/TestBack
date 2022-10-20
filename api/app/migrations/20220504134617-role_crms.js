'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('roles_crms', {
      id :{
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      value: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING
      },
      active: {
        type: Sequelize.STRING,
        defaultValue: 'Y'
      },
    }).then(() => {
      queryInterface.bulkInsert("roles_crms",
          [
            {
              "id": 1,
              "value": "superadmin",
              "description": "super admin",
              "active": "Y"
            },
            {
              "id": 2,
              "value": "admin",
              "description": "admin",
              "active": "Y"
            },
            {
              "id": 3,
              "value": "agent",
              "description": "agent",
              "active": "Y"
            },
            {
              "id": 4,
              "value": "sales",
              "description": "sales",
              "active": "Y"
            }
          ]);
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