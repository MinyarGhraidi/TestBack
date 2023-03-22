'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('callstatuses', {
      callstatus_id: {
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
      is_default: {
        type: Sequelize.STRING,
        defaultValue: "N",
      },
      is_system: {
        type: Sequelize.STRING,
        defaultValue: "N",
      },
      call_type: {
        type: Sequelize.STRING
      },
      campaign_id: {
        type: Sequelize.INTEGER
      },
      active: {
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
      status: {
        allowNull: true,
        type: Sequelize.STRING,
        defaultValue: "Y",
      }
    }).then(() => {
      queryInterface.bulkInsert("callstatuses",
          [
            {
              "code": "reminder",
              "label": "reminder",
              "is_default": "N",
              "is_system": "Y",
              "call_type": null,
              "campaign_id": null,
              "active": "Y",
              "status": "Y"
            },
            {
              "code": "AD",
              "label": "dropped",
              "is_default": "N",
              "is_system": "Y",
              "call_type": null,
              "campaign_id": null,
              "active": "Y",
              "status": "Y"
            },
          ]);
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('callstatuses');
  }
};
