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
        type: Sequelize.STRING(1),
        defaultValue: 'Y',
        allowNull: true,
      },
      active: {
        allowNull: true,
        type: Sequelize.STRING(1),
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
      },
      channel_uuid : {
        type: Sequelize.STRING
      },
      config: {
        type: Sequelize.JSONB
      },
    }).then(() => {
      queryInterface.bulkInsert("users",
          [
            {
              "username": "admin",
              "password_hash": "$2b$10$TOzGnzuUQjfTzmecOw7NKe0ub6zPrRREXPRgLNkRWeUJtMZ1KUoeq",
              "active": "Y",
              "first_name" : "admin",
              "last_name" : "1",
              "account_id" : 1,
              "params" : JSON.stringify({
                "pass": "Oxilog2022."
              }),
              "status" : "Y",
              "isAssigned" : false,
              "role_crm_id" : 1
            }
          ]);
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('users');
  }
};
