'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('user_data_indexs', {
      user_data_index_id:{
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id:{
        allowNull: true,
        type: Sequelize.INTEGER
      },
      total_message_not_readed:{
        allowNull: true,
        type: Sequelize.INTEGER
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
      },
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('dids');

  }
};
