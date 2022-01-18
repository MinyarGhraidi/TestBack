module.exports = (sequelize, Sequelize) => {
    const permissions_crms = sequelize.define("permissions_crms", {
            id: {
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
        {timestamps: false,}
    );

    permissions_crms.prototype.fields = [
        'id',
        'value',
        'description',
        'active'

    ];

    permissions_crms.prototype.fieldsSearchMetas = [
        'id',
        'value',
        'description',
        'active'
    ];

    return permissions_crms;
};
