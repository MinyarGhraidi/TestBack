module.exports = (sequelize, Sequelize) => {
    const acls = sequelize.define(
        "acls",
        {
            acl_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER,
            },
            name: {
                type: Sequelize.STRING,
            },
            default: {
                type: Sequelize.STRING,
            },
            description: {
                type: Sequelize.STRING,
            },
            active: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue : 'Y'
            },
            created_at: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: new Date(),
            },
            updated_at: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: new Date(),
            },
            params: {
                type: Sequelize.JSONB
            },
            server_id: {
                type: Sequelize.INTEGER
            },
        },
        {timestamps: false}
    );

    acls.prototype.fields = [
        "acl_id",
        "name",
        "default",
        "description",
        "created_at",
        "updated_at",
        "active",
        "server_id"
    ];

    acls.prototype.fieldsSearchMetas = [
        "name",
        "description",
        "default"
    ];
    acls.prototype.getModelIncludes = function () {
        return ['esl_servers'];
    };

    acls.associate = function (models) {
        acls.belongsTo(models.esl_servers, {
            foreignKey: 'server_id'
        });
    }
    return acls;
};
