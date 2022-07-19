module.exports = (sequelize, DataTypes) => {
    const message_channel = sequelize.define('message_channels', {
        message_channel_id:{
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        last_excerpt:{
            allowNull: true,
            type: DataTypes.STRING,
        },
        created_by_id: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        channel_name:{
            allowNull: true,
            type: DataTypes.STRING,
        },
        channel_picture_efile_id:{
            allowNull: true,
            type: DataTypes.INTEGER
        },
        channel_type:{
            allowNull: true,
            type: DataTypes.STRING,
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

    });

    message_channel.prototype.fields = [
        'message_channel_id',
        'last_excerpt',
        'created_by_id',
        'channel_name',
        'channel_picture_efile_id',
        'channel_type',
        'created_at',
        'updated_at',
        'active'
    ];
    message_channel.prototype.fieldsSearchMetas = [
        'message_channel_id',
        'last_excerpt',
        'created_by_id',
        'channel_name',
        'channel_picture_efile_id',
        'channel_type',
        'created_at',
        'updated_at',
        'active'
    ];
    const users = require('./users.model');

    message_channel.prototype.modelIncludes ={
        'users':{
            model: users
        }
    }

    message_channel.associate = function (models){
       message_channel.belongsTo(models.users,{
           foreignKey: 'created_by_id'
       })
    }

    return message_channel;
}
