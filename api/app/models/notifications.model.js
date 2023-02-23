
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
            list_callfile_id: {
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
            reminder_id: {
                type: Sequelize.INTEGER,
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
        "list_callfile_id",
        "reminder_id"
    ]),
        (notifications.prototype.fieldsSearchMetas = [
            "notification_id",
            "account_id",
            "campaign_id",
            "data",
            "list_callfile_id",
            "reminder_id"
        ]);
    notifications.associate = function (models) {
        notifications.belongsTo(models.campaigns, {
            foreignKey: 'campaign_id'
        });
        notifications.belongsTo(models.accounts, {
            foreignKey: 'account_id'
        })
        notifications.belongsTo(models.listcallfiles, {
            foreignKey: 'list_callfile_id'
        })
        notifications.belongsTo(models.reminders, {
            foreignKey: 'reminder_id'
        })
    };

    return notifications;
};
