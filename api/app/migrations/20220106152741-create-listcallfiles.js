'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('listcallfiles', {
      listcallfile_id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING
      },
      campaign_id: {
        type: Sequelize.INTEGER
      },
      active: {
        allowNull: true,
        type: Sequelize.STRING(1),
        defaultValue: 'Y'
      },
      file_id: {
        type: Sequelize.INTEGER,
      },
      status: {
        allowNull: true,
        type: Sequelize.STRING(1),
        defaultValue: 'Y'
      },
      mapping: {
        type: Sequelize.JSONB,
      },
      processing: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      processing_status: {
        type: Sequelize.JSONB,
      },
      check_duplication: {
        type: Sequelize.INTEGER,
      },
      prefix: {
        type: Sequelize.STRING,
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
      templates_id: {
        type: Sequelize.INTEGER,
      },
      custom_fields: {
        type: Sequelize.JSONB,
      },
      sql_list_id: {
        type: Sequelize.INTEGER
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('listcallfiles');
  }
};
