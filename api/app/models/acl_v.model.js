module.exports = (sequelize, Sequelize) => {
    const acls_v = sequelize.define('acls_v', {
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

    acls_v.prototype.fields = [
        'id',
        'role_id',
        'permission_acl_id',
        'active'

    ];

    acls_v.prototype.fieldsSearchMetas = [
        'id',
        'role_id',
        'permission_acl_id',
        'active'
    ];

    acls_v.associate = function (models) {
        acls_v.belongsTo(models.roles, {
            foreignKey: 'role_id'
        });
        acls_v.belongsTo(models.permission_acls ,{
            foreignKey : 'permission_acl_id'
        })
    }

    return acls_v;

}