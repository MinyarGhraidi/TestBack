const {} = require("http-errors")

module.exports = (sequelize, Sequelize) => {
    const agent_log_event = sequelize.define("agent_log_events", {
            agent_log_event_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            action_name: {
                type: Sequelize.STRING,
                defaultValue: 'logged-out'
            },
            user_id: {
                type: Sequelize.INTEGER
            },
            active: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
            created_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            start_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            finish_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            pause_status_id: {
                type: Sequelize.INTEGER
            },

        },
        {timestamps: false})

    agent_log_event.prototype.fields = [
        'agent_log_event_id',
        'action_name',
        'active',
        'created_at',
        'updated_at',
        'user_id',
        'start_at',
        'finish_at',
        "pause_status_id"
    ]
    agent_log_event.prototype.fieldsSearchMetas = [
        'agent_log_event_id',
        'action_name',
        'active',
        'user_id',
        'start_at',
        'finish_at',
        "pause_status_id"
    ]
    agent_log_event.associate = function (models) {
        agent_log_event.belongsTo(models.users, {
            foreignKey: 'user_id'
        });
        agent_log_event.belongsTo(models.pausestatuses, {
            foreignKey: 'pause_status_id'
        })
    };
    return agent_log_event
}
