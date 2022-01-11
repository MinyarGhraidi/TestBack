'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('campaigns', {
      campaign_id : {
        primaryKey : true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      campaign_name : {
        type : Sequelize.STRING
      },
      campaign_description : {
        type : Sequelize.STRING
      },
      campaign_type : {
        type : Sequelize.STRING
      },
      list_order : {
        type : Sequelize.STRING
      },
      list_mix : {
        type : Sequelize.BOOLEAN
      },
      hopper : {
        type : Sequelize.INTEGER
      },
      dial_level : {
        type : Sequelize.INTEGER
      },
      dialtimeout : {
        type: Sequelize.INTEGER,
      },
      active: {
        allowNull: true,
        type: Sequelize.STRING,
        defaultValue: 'Y'
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'Y'
      },
      account_id: {
        type: Sequelize.INTEGER,
      },
      agents: {
        type: Sequelize.JSONB,
      },
      params: {
        type: Sequelize.JSONB,
      },
      created_at : {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: new Date()
      },
      updated_at : {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: new Date()
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('campaigns');
  }
};