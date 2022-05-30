module.exports = (sequelize, DataTypes) => {
    const messages = sequelize.define('messages', {
        message_id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        created_by_id: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        message_channel_id: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        content: {
            allowNull: true,
            type: DataTypes.STRING
        },
        attachment_post_id: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        created_at: {
            allowNull: true,
            type: DataTypes.DATE,
        },
        updated_at: {
            allowNull: true,
            type: DataTypes.DATE
        },
        active: {
            allowNull: true,
            type: DataTypes.STRING,
            defaultValue: 'Y'
        },
    }, {
        tableName: 'messages'
    });

    messages.prototype.fields = [
        'message_id',
        'created_by_id',
        'message_channel_id',
        'content',
        'createdAt',
        'updatedAt',
        'attachment_post_id',
        'active'
    ];

    messages.prototype.fieldsSearchMetas = [
        'message_id',
        'created_by_id',
        'message_channel_id',
        'content',
        'createdAt',
        'updatedAt',
        'attachment_post_id',
        'active'
    ];

    const users = require('./users.model');
    const message_channels = require('./message_channels')

    messages.prototype.modelIncludes = {
        'users': {
            model: users

        },
        'message_channels': {
            model: message_channels
        }
    }

    messages.associate = function (models) {
        messages.belongsTo(models.users, {
            foreignKey: 'created_by_id'
        });
        messages.belongsTo(models.message_channels, {
            foreignKey: 'message_channel_id'
        })
    }

    return messages;
}
