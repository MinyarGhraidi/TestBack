'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('acls', {
      acl_id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
      },
      default: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.STRING,
      },
      active: {
        allowNull: true,
        type: Sequelize.STRING(1),
        defaultValue : 'Y'
      },
      created_at: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: new Date(),
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: new Date(),
      },
      params: {
        type: Sequelize.JSONB
      },
      server_id: {
        type: Sequelize.INTEGER
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('acls');

  }
};
