'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('permissions_crms', {
      id: {
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
      queryInterface.bulkInsert("permissions_crms", [{
        name: "admin",
        description: "Admins",
      },
        {
          name: "company",
          description: "Companies",
        },
        {
          name: "user",
          description: "Users",
        },
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
