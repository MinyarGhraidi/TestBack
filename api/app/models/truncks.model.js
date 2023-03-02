const {TooManyRequests} = require("http-errors")

module.exports = (sequelize, Sequelize) => {
    const trunck = sequelize.define("truncks", {
            trunck_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            account_id: {
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING
            },
            type: {
                type: Sequelize.INTEGER
            },
            username: {
                type: Sequelize.STRING
            },
            password: {
                type: Sequelize.STRING
            },
            proxy: {
                type: Sequelize.STRING
            },
            register: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            codec_prefs: {
                type: Sequelize.STRING
            },
            channels: {
                type: Sequelize.INTEGER
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
            gateways: {
                type: Sequelize.JSONB
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
        {timestamps: false,}
    )

    trunck.prototype.fields = [
        'trunck_id',
        "active",
        'created_at',
        'updated_at',
        'account_id',
        'name',
        'type',
        'username',
        'password',
        'proxy',
        'register',
        'codec_prefs',
        'channels', 
        'status',
        'gateways'
    ],
    trunck.prototype.fieldsSearchMetas = [
        'trunck_id',
        "active",
        'created_at',
        'updated_at',
        'account_id',
        'name',
        'type',
        'username',
        'password',
        'proxy',
        'register',
        'codec_prefs',
        'channels', 
        'status',
        'gateways'
        ]
        trunck.associate = function (models) {
            trunck.belongsTo(models.accounts, {
                foreignKey: 'account_id'
            })
        };
       
    return trunck
}
