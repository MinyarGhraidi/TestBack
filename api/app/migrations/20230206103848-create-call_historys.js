'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('calls_historys', {

      id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      agent_id: {
        type: Sequelize.INTEGER
      },
      call_file_id: {
        type: Sequelize.INTEGER
      },
      started_at: {
        type: Sequelize.DATE
      },
      finished_at: {
        type: Sequelize.DATE
      },
      active: {
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
      uuid: {
        type: Sequelize.STRING
      },
      dmc: {
        type: Sequelize.INTEGER
      },
      dmt: {
        type: Sequelize.INTEGER
      },
      list_call_file_id: {
        type: Sequelize.INTEGER
      },
      note: {
        type: Sequelize.STRING
      },
      record_url: {
        type: Sequelize.STRING
      },
      revision_id: {
        type: Sequelize.INTEGER
      },
    })

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('calls_historys');
  }
};
