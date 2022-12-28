module.exports = (sequelize, Sequelize) => {
    const calls_historys = sequelize.define('calls_historys', {
            id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            agent_id: {
                type: Sequelize.INTEGER
            },
            call_file_id: {
                type: Sequelize.INTEGER
            },
            started_at: {
                type: Sequelize.DATE
            },
            finished_at: {
                type: Sequelize.DATE
            },
            active: {
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

            },
            uuid: {
                type: Sequelize.STRING
            },
            dmc: {
                type: Sequelize.INTEGER
            },
            dmt: {
                type: Sequelize.INTEGER
            },
            list_call_file_id: {
                type: Sequelize.INTEGER
            },
            note: {
                type: Sequelize.STRING
            },
            record_url: {
                type: Sequelize.STRING
            },
            revision_id: {
                type: Sequelize.INTEGER
            },
        },
        {timestamps: false}
    );

    calls_historys.prototype.fields = [
        'id',
        'agent_id',
        'call_file_id',
        'active',
        'started_at',
        'finished_at',
        'created_at',
        'updated_at',
        'uuid',
        'dmc',
        'dmt',
        'list_call_file_id',
        'note',
        'record_url',
        'revision_id'
    ];
    calls_historys.associate = function (models) {
        calls_historys.belongsTo(models.users, {
            foreignKey: 'agent_id'
        })
        calls_historys.belongsTo(models.callfiles, {
            foreignKey: 'call_file_id'
        })
        calls_historys.belongsTo(models.revisions, {
            foreignKey: 'revision_id'
        })
    }

    return calls_historys;

}
