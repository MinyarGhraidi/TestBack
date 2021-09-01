
module.exports = (sequelize, Sequelize) => {
    const meeting = sequelize.define("meetings", {
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
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
            address: {
                type: Sequelize.STRING
            },
            date: {
                allowNull: true,
                type: Sequelize.DATE
            },
            hour: {
                allowNull: true,
                type: Sequelize.DATE
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
        },
        {timestamps: false,}
    )

    meeting.prototype.fields = [
        'did_id',
        'name',
        'description',
        'agent_id',
        'sales_id',
        'account_id',
        "active",
        "date",
        "hour",
        'address',
        'created_at',
        'updated_at'
    ],
    meeting.prototype.fieldsSearchMetas = [
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
        "date",
        "hour"
        ]
        ,
        meeting.associate = function (models) {
            meeting.belongsTo(models.campaigns, {
                foreignKey: 'campaign_id'
            });
        };
    return meeting
}