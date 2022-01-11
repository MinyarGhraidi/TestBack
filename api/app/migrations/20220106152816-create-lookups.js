'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('lookups', {
      lookup_id : {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      key : {
        type : Sequelize.STRING
      },
      value : {
        type : Sequelize.JSONB
      },
      created_at : {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: new Date()
      },
      updated_at : {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: new Date()
      },
      type : {
        type: Sequelize.STRING
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('lookups');
  }
};