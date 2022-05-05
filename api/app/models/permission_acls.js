module.exports = (sequelize, Sequelize) => {
    const permission_acls = sequelize.define('permission_acls', {
            id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            label: {
                type: Sequelize.STRING
            },
            code: {
                type: Sequelize.STRING
            },
            active: {
                type: Sequelize.STRING,
                defaultValue: 'Y'
            }
        },
        {timestamps: false}
    );

    permission_acls.prototype.fields = [
        'id',
        'label',
        'code',
        'active'

    ];

    permission_acls.prototype.fieldsSearchMetas = [
        'id',
        'label',
        'code',
        'active'
    ];

    permission_acls.associate = function (models) {
        permission_acls.belongsToMany(models.roles, {through: models.acls , foreignKey : 'permission_acl_id',})
    }


    return permission_acls;

}