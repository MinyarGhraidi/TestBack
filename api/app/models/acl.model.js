module.exports = (sequelize, Sequelize) => {
    const acls = sequelize.define('acls', {
            id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            role_id: {
                type: Sequelize.INTEGER
            },
            permission_acl_id: {
                type: Sequelize.INTEGER
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
        'role_id',
        'permission_acl_id',
        'active'

    ];

    acls.prototype.fieldsSearchMetas = [
        'id',
        'role_id',
        'permission_acl_id',
        'active'
    ];

    acls.associate = function (models) {
        acls.belongsTo(models.roles, {
            foreignKey: 'role_id'
        });
        acls.belongsTo(models.permission_acls ,{
            foreignKey : 'permission_acl_id'
        })
    }

    return acls;

}