'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('reminders', {

      reminder_id:{
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      note:{
        type: Sequelize.STRING
      },
      call_file_id:{
        type: Sequelize.INTEGER
      },
      agent_id:{
        type: Sequelize.INTEGER
      },
      date:{
        type: Sequelize.STRING
      },
      time:{
        type: Sequelize.STRING
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
      active: {
        allowNull: true,
        type: Sequelize.STRING(1),
        defaultValue: 'Y'
      }
    })

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('reminders');
  }
};
