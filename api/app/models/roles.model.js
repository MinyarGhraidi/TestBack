const {TooManyRequests} = require("http-errors")

module.exports = (sequelize, Sequelize) => {
    const role = sequelize.define("roles", {
            role_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            role_name: {
                type: Sequelize.STRING
            },
            account_id: {
                type: Sequelize.INTEGER
            },
            permission: {
                type: Sequelize.JSONB
            },
            active: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
            created_at: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: new Date()
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: new Date()
            },
        },
        {timestamps: false,}
    )

    role.prototype.fields = [
        'role_id',
        'role_name',
        'account_id',
        'permission',
        "active",
        'created_at',
        'updated_at'
    ],
        role.prototype.fieldsSearchMetas = [
            'role_id',
            'role_name',
           'account_id',
        ],
        role.associate = function (models) {
            role.belongsTo(models.accounts, {
                foreignKey: 'account_id'
            });
            role.belongsToMany(models.permission_acls, {foreignKey : 'role_id', through: models.acls });
        };
    return role
}
