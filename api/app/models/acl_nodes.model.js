module.exports = (sequelize, Sequelize) => {
    const acl_nodes = sequelize.define(
        "acl_nodes",
        {
            acl_node_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER,
            },
            type: {
                type: Sequelize.STRING,
            },
            cidr: {
                type: Sequelize.STRING,
            },
            domain: {
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
            acl_id : {
                type: Sequelize.INTEGER
            },
            params: {
                type: Sequelize.JSONB
            },
        },
        {timestamps: false}
    );

    acl_nodes.prototype.fields = [
        "acl_node_id",
        "type",
        "cidr",
        "domain",
        "description",
        "created_at",
        "updated_at",
        "active",
        "acl_id"
    ];

    acl_nodes.prototype.fieldsSearchMetas = [
        "type",
        "cidr",
        "domain",
        "description"
    ];

    acl_nodes.associate = function (models) {
        acl_nodes.belongsTo(models.acls, {
            foreignKey: 'acl_id'
        });
    };
    return acl_nodes;
};
