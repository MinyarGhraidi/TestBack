module.exports = (sequelize, DataTypes) => {
    const message_channel_subscribers = sequelize.define('message_channel_subscribers', {
        message_channel_subscriber_id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        message_channel_id: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        user_id: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        created_at: {
            allowNull: true,
            type: DataTypes.DATE,
            field: 'created_at'
        },
        updated_at: {
            allowNull: true,
            type: DataTypes.DATE,
            field: 'created_at'
        },
        active: {
            allowNull: true,
            type: DataTypes.STRING,
            defaultValue: 'Y'
        },
        status_read: {
            allowNull: true,
            type: DataTypes.STRING,
        },
    });
    message_channel_subscribers.prototype.fields = [
        'message_channel_subscriber_id',
        'message_channel_id',
        'user_id',
        'created_at',
        'updated_at',
        'active',
        'status_read'
    ];

    message_channel_subscribers.prototype.fieldsSearchMetas = [
        'message_channel_subscriber_id',
        'message_channel_id',
        'user_id',
        'created_at',
        'updated_at',
        'active',
        'status_read'
    ];
    const message_channels = require('./message_channels')
    message_channel_subscribers.prototype.modelIncludes = {
        'message_channels': {
            model: message_channels
        }
    }

    message_channel_subscribers.associate = function (models) {
        message_channel_subscribers.belongsTo(models.message_channels, {
            foreignKey: 'message_channel_id'
        })
    }
    return message_channel_subscribers;

}
