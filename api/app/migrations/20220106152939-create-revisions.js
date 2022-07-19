'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('revisions', {
      revision_id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },

      model_id: {
        type: Sequelize.INTEGER
      },

      model_name: {
        type: Sequelize.STRING
      },

      before: {
        type: Sequelize.JSONB
      },

      after: {
        type: Sequelize.JSONB
      },
      changes: {
        type: Sequelize.JSONB
      },
      date: {
        type: Sequelize.DATE
      },
      user_id: {
        type: Sequelize.INTEGER
      },

    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('revisions');
  }
};