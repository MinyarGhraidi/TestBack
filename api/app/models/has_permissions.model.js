module.exports = (sequelize, Sequelize) => {
    const has_permissions = sequelize.define("has_permissions", {
            id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            roles_crm_id: {
                type: Sequelize.INTEGER
            },
            permission_crm_id: {
                type: Sequelize.INTEGER
            },
            active: {
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
        },
        {timestamps: false,}
    );

    has_permissions.prototype.fields = [
        'id',
        'roles_crm_id',
        'permission_crm_id',
        'active'

    ];

    has_permissions.prototype.fieldsSearchMetas = [
        'id',
        'roles_crm_id',
        'permission_crm_id',
        'active'
    ];
    has_permissions.associate = function (models) {
        has_permissions.belongsTo(models.roles_crms, {
            foreignKey: 'roles_crm_id'
        });
        has_permissions.belongsTo(models.permissions_crms, {
            foreignKey: 'permission_crm_id'
        });
    };

    return has_permissions;
};
