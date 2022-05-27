module.exports = (sequelize, DataTypes) => {
    const message_readers = sequelize.define('message_readers', {
        message_reader_id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        message_id: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        user_id: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        createdAt: {
            allowNull: true,
            type: DataTypes.DATE,
        },
        updatedAt: {
            allowNull: true,
            type: DataTypes.DATE
        },
        active: {
            allowNull: true,
            type: DataTypes.STRING,
            defaultValue: 'Y'
        },
        status_read: {
            allowNull: true,
            type: DataTypes.STRING,
        }
    });

    message_readers.prototype.fields = [
        'message_reader_id',
        'message_id',
        'user_id',
        'createdAt',
        'updatedAt',
        'active',
        'status_read'
    ];

    message_readers.prototype.fieldsSearchMetas = [
        'message_reader_id',
        'message_id',
        'user_id',
        'createdAt',
        'updatedAt',
        'active',
        'status_read'
    ];

    const users = require('./users.model');
    const messages = require('./messages');
    message_readers.prototype.modelIncludes = {
        'users': {
            model: users

        },
        'messages': {
            model: messages
        }
    }

    message_readers.associate = function (models) {
        message_readers.belongsTo(models.users, {
            foreignKey: 'user_id'
        });
        message_readers.belongsTo(models.messages, {
            foreignKey: 'message_id'
        })
    }

    return message_readers;
}
