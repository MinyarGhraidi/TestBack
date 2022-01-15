module.exports =(sequelize, Sequelize) =>{
    const roles_crms = sequelize.define('roles_crms', {
        id :{
            primaryKey: true,
            autoIncrement: true,
            type: Sequelize.INTEGER
        },
        value: {
            type: Sequelize.STRING
        },
        description: {
            type: Sequelize.STRING
        },
        active: {
            type: Sequelize.STRING,
            defaultValue: 'Y'
        },
    },
        {timestamps: false}
    );

    roles_crms.prototype.fields = [
        'id',
        'value',
        'description',
        'active'

    ];

    roles_crms.prototype.fieldsSearchMetas = [
        'id',
        'value',
        'description',
        'active'
    ];

    return roles_crms;

}