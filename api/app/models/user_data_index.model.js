module.exports = (sequelize, DataTypes) => {
    const user_data_index = sequelize.define('user_data_indexs',{
        user_data_index_id:{
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        user_id:{
            allowNull: true,
            type: DataTypes.INTEGER
        },
        total_message_not_readed:{
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
    });
    user_data_index.prototype.fields =[
        'user_data_index_id',
        'user_id',
        'total_message_not_readed',
        'created_at',
        'updated_at',
        'active'
    ];

    user_data_index.prototype.fieldsSearchMetas =[
        'user_data_index_id',
        'user_id',
        'total_message_not_readed',
        'created_at',
        'updated_at',
        'active'
    ];

    return user_data_index;

}
