module.exports =(sequelize, Sequelize) =>{
    const servers = sequelize.define('servers', {
            server_id :{
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            ip: {
                type: Sequelize.STRING
            },
            name: {
                type: Sequelize.STRING
            },
            description: {
                type: Sequelize.STRING
            },
            active: {
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
            status: {
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
            sip_device: {
                type: Sequelize.JSONB
            },
        },
        {timestamps: false}
    );

    servers.prototype.fields = [
        'server_id',
        'ip',
        'name',
        'description',
        'active',
        'status',
        'created_at',
        'updated_at',
        'sip_device'
    ];

    servers.prototype.fieldsSearchMetas = [
        'ip',
        'name',
        'description'
    ];

    return servers;

}