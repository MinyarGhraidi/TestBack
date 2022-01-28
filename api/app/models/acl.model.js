module.exports = (sequelize, Sequelize) => {
    const acls = sequelize.define('acls', {
            id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            label: {
                type: Sequelize.STRING
            },
            description: {
                type: Sequelize.STRING
            },
            users: {
                type: Sequelize.ARRAY

            },
            active: {
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
        },
        {timestamps: false}
    );

    acls.prototype.fields = [
        'id',
        'label',
        'description',
        'users',
        'active'

    ];

    acls.prototype.fieldsSearchMetas = [
        'id',
        'label',
        'description',
        'users',
        'active'
    ];

    return acls;

}