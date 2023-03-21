'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('roles_crms', {
      id :{
        primaryKey: true,
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
        defaultValue: 'Y',
          allowNull: true
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
            },
            {
              "id": 5,
              "value": "user",
              "description": "user",
              "active": "Y"
            }
          ]);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('roles_crms');

  }
};
