'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('users', {
      user_id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING
      },
      password_hash: {
        type: Sequelize.STRING
      },
      first_name: {
        type: Sequelize.STRING
      },
      last_name: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      user_type: {
        type: Sequelize.STRING,
      },
      account_id: {
        type: Sequelize.INTEGER
      },
      role_id: {
        type: Sequelize.INTEGER
      },
      sip_device: {
        type: Sequelize.JSONB
      },
      params: {
        type: Sequelize.JSONB
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'Y'
      },
      active: {
        allowNull: true,
        type: Sequelize.STRING,
        defaultValue: 'Y'
      },
      current_session_token: {
        allowNull: true,
        type: Sequelize.STRING
      },
      isAssigned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      campaign_id: {
        type: Sequelize.INTEGER,
        defaultValue: null
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
      role_crm_id :{
        type: Sequelize.INTEGER
      },
      profile_image_id :{
        type: Sequelize.INTEGER
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('users');
  }
};