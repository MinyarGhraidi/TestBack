
module.exports = (sequelize, Sequelize) => {
    const notifications = sequelize.define(
        "notifications",
        {
            notification_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER,
            },
            account_id: {
                type: Sequelize.INTEGER,
            },
            campaign_id: {
                type: Sequelize.INTEGER,
            },
            data: {
                type: Sequelize.JSONB,
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

    (notifications.prototype.fields = [
        "notification_id",
        "account_id",
        "campaign_id",
        "data",
        "active",
        "status",
        "created_at",
        "updated_at",
    ]),
        (notifications.prototype.fieldsSearchMetas = [
            "notification_id",
            "account_id",
            "campaign_id",
            "data"
        ]);
    notifications.associate = function (models) {
        notifications.belongsTo(models.campaigns, {
            foreignKey: 'campaign_id'
        });
        notifications.belongsTo(models.accounts, {
            foreignKey: 'account_id'
        })
    };

    return notifications;
};
