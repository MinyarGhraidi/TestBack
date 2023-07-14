module.exports =(sequelize, Sequelize) =>{
    const servers = sequelize.define('esl_servers', {
            esl_server_id :{
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            ip: {
                type: Sequelize.STRING
            },
            description: {
                type: Sequelize.STRING
            },
            port: {
                type: Sequelize.STRING
            },
            password: {
                type: Sequelize.STRING
            },
            active: {
                type: Sequelize.STRING(1),
                defaultValue: 'Y'
            },
            status: {
                type: Sequelize.STRING(1),
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
            sip_device: {
                type: Sequelize.JSONB
            },
            crdt: {
                type: Sequelize.JSONB
            },
        },
        {timestamps: false}
    );

    servers.prototype.fields = [
        'esl_server_id',
        'ip',
        'port',
        'description',
        'active',
        'password',
        'status',
        'created_at',
        'updated_at',
        'sip_device',
        'crdt'
    ];

    servers.prototype.fieldsSearchMetas = [
        'ip',
        'port',
        'description'
    ];
    servers.associate = function (models) {
        servers.hasMany(models.domains, {
            foreignKey: 'esl_server_id'
        })
    }

    return servers;

}
