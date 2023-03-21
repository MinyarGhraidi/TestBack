'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('efiles', {
      file_id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      file_name: {
        type: Sequelize.TEXT
      },
      original_name: {
        type: Sequelize.TEXT
      },
      file_title: {
        type: Sequelize.TEXT
      },
      active: {
        allowNull: true,
        type: Sequelize.STRING(1),
        defaultValue: 'Y'
      },
      uri: {
        type: Sequelize.TEXT,
      },
      file_extension: {
        type: Sequelize.TEXT,
      },
      file_type: {
        type: Sequelize.TEXT,
      },
      file_size: {
        type: Sequelize.INTEGER,
      },
      doc_type: {
        type: Sequelize.TEXT,
      },
      picture: {
        type: Sequelize.TEXT,
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
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('efiles');
  }
};
