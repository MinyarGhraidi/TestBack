module.exports = (sequelize, Sequelize) => {
    const live_call = sequelize.define("live_calls", {
            id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            events: {
                type: Sequelize.JSONB
            },
            callid: {
                type: Sequelize.STRING
            },
            active: {
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
            agent_id: {
                type: Sequelize.INTEGER
            },
            created_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE,
            }
        },
        {timestamps: false,}
    )

    live_call.prototype.fields = [
        'id',
        'events',
        'callid',
        'active',
        'agent_id',
        'created_at',
        'updated_at',
    ],

        live_call.prototype.fieldsSearchMetas = [
            'events',
            'callid',
            'active',
            'agent_id'
        ]

    return live_call
}