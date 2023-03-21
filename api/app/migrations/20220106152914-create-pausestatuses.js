'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('pausestatuses', {
      pausestatus_id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER,
      },
      code: {
        type: Sequelize.STRING,
      },
      label: {
        type: Sequelize.STRING,
      },
      isSystem: {
        type: Sequelize.STRING,
        defaultValue: "N",
      },
      pause_type: {
        type: Sequelize.STRING
      },
      campaign_id: {
        type: Sequelize.INTEGER
      },
      duration: {
        type: Sequelize.INTEGER
      },
      active: {
        allowNull: true,
        type: Sequelize.STRING(1),
        defaultValue: "Y",
      },
      status: {
        allowNull: true,
        type: Sequelize.STRING(1),
        defaultValue: "Y",
      },
      created_at: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: new Date(),
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: new Date(),
      },
    }).then(() => {
      queryInterface.bulkInsert("pausestatuses",
          [
            {
              "code": "PD",
              "label": "pause dej",
              "isSystem": "Y",
              "pause_type": null,
              "campaign_id": null,
              "duration": null,
              "active": "Y",
              "status": "Y"
            },
            {
              "code": "PC",
              "label": "pause café",
              "isSystem": "Y",
              "pause_type": null,
              "campaign_id": null,
              "duration": null,
              "active": "Y",
              "status": "Y"
            }
          ]);
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('pausestatuses');
  }
};
