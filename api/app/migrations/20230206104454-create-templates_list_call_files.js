'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('templates_list_call_files', {

      templates_list_call_files_id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      account_id: {
        type: Sequelize.INTEGER
      },
      template: {
        type: Sequelize.JSONB,
      },
      template_name: {
        type: Sequelize.STRING,
      },
      active: {
        allowNull: true,
        type: Sequelize.STRING(1),
        defaultValue: 'Y'
      },
      created_at: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: new Date()
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: new Date()
      },
      type:{
        type: Sequelize.STRING,
      },
      custom_field:{
        type: Sequelize.JSONB,
      },
      status: {
        type: Sequelize.STRING(1),
        defaultValue: 'Y'
      },
    })

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('templates_list_call_files');
  }
};
