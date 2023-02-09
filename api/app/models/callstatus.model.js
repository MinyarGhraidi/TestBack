const { TooManyRequests } = require("http-errors");

module.exports = (sequelize, Sequelize) => {
  const callstatus = sequelize.define(
    "callstatuses",
    {
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
        status: {
            allowNull: true,
            type: Sequelize.STRING,
            defaultValue: "Y",
        }
    },
    { timestamps: false }
  );

  (callstatus.prototype.fields = [
    "callstatus_id",
    "code",
    "label",
    "isDefault",
    "active",
    "created_at",
    "updated_at",
    "isSystem",
    "campaign_id",
      "status"
  ]),
    (callstatus.prototype.fieldsSearchMetas = [
      "callstatus_id",
      "code",
      "label",
      "isDefault",
      "campaign_id"
    ]);

  return callstatus;
};
