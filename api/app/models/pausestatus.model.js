const { TooManyRequests } = require("http-errors");

module.exports = (sequelize, Sequelize) => {
  const pausestatus = sequelize.define(
    "pausestatuses",
    {
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
        type: Sequelize.STRING,
        defaultValue: "Y",
      },
        status: {
            allowNull: true,
            type: Sequelize.STRING,
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
    },
    { timestamps: false }
  );

  (pausestatus.prototype.fields = [
    "pausestatus_id",
    "code",
    "label",
    "isSystem",
    "duration",
    "campaign_id",
    "active",
    "created_at",
    "updated_at",
  ]),
    (pausestatus.prototype.fieldsSearchMetas = [
      "pausestatus_id",
      "code",
      "label",
      "isDefault",
      "duration",
      "campaign_id",
    ]);

  return pausestatus;
};
