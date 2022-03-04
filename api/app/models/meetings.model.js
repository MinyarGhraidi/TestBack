
module.exports = (sequelize, Sequelize) => {
    const meetings = sequelize.define("meetings", {
            meeting_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING
            },
            description: {
                type: Sequelize.STRING
            },
            agent_id: {
                type: Sequelize.INTEGER
            },
            sales_id: {
                type: Sequelize.INTEGER
            },
            account_id: {
                type: Sequelize.INTEGER
            },
            active: {
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
            address: {
                type: Sequelize.STRING
            },
            started_at: {
                type: Sequelize.DATE
            },
            finished_at: {
                type: Sequelize.DATE
            },
            created_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            day: {
                type: Sequelize.STRING,
            },
            treated: {
                type: Sequelize.STRING,
                defaultValue : 'N'
            },
            status: {
                type: Sequelize.INTEGER,
                defaultValue : 1
            },
            campaign_id: {
                type: Sequelize.INTEGER,
            },
        },
        {timestamps: false,}
    )

    meetings.prototype.fields = [
        'did_id',
        'name',
        'description',
        'agent_id',
        'sales_id',
        'account_id',
        "active",
        "started_at",
        "finished_at",
        'address',
        'created_at',
        'updated_at',
        "day",
        "treated",
        "status",
        "campaign_id"
    ],
    meetings.prototype.fieldsSearchMetas = [
        'did_id',
        'name',
        'description',
        'agent_id',
        'sales_id',
        'account_id',
        "active",
        'address',
        'created_at',
        'updated_at',
        "started_at",
        "finished_at",
        "day",
        "treated"
        ]
        ,
        meetings.associate = function (models) {
            meetings.belongsTo(models.users, {
                foreignKey: 'agent_id'
            });
        };

    return meetings
}