const {TooManyRequests} = require("http-errors");

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
            isDefault: {
                type: Sequelize.STRING,
                defaultValue: "N",
            },
            isSystem: {
                type: Sequelize.STRING,
                defaultValue: "N",
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: "Y",
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
        },
        {timestamps: false}
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
        "campaign_id"
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
