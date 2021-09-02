
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
            started_at: {
                allowNull: true,
                type: Sequelize.DATE
            },
            finished_at: {
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
        "started_at",
        "finished_at",
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
        "started_at",
        "finished_at"
        ]

    return meeting
}