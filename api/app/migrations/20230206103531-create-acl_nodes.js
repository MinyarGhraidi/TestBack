'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('acl_nodes', {

      acl_node_id: {
        primaryKey: true,
            autoIncrement: true,
            type: Sequelize.INTEGER,
      },
      type: {
        type: Sequelize.STRING,
      },
      cidr: {
        type: Sequelize.STRING,
      },
      domain: {
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
      acl_id : {
        type: Sequelize.INTEGER
      },
      params: {
        type: Sequelize.JSONB
      },
    })

        },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('acl_nodes');
  }
};
