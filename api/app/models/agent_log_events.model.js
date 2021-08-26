const {} = require("http-errors")
let bcrypt = require('bcryptjs');

module.exports = (sequelize, Sequelize) => {
    const agent_log_event = sequelize.define("agent_log_events", {
            agent_log_event_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            action_name: {
                type: Sequelize.STRING
            },
            active: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: 'Y'
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

            }
        },
        {timestamps: false})

        agent_log_event.prototype.fields = [
        'agent_log_event_id',
        'action_name',
        'active',
        'created_at',
        'updated_at'
    ],
    agent_log_event.prototype.fieldsSearchMetas = [
        'agent_log_event_id',
        'action_name',
        'active'
        ]

    return agent_log_event
}
