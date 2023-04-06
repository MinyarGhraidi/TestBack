module.exports = (sequelize, Sequelize) => {
    const domain = sequelize.define(
        "domains",
        {
            domain_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER,
            },
            domain_name: {
                type: Sequelize.STRING,
            },
            description: {
                type: Sequelize.STRING,
            },
            active: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: "Y",
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: "Y",
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
            esl_server_id:{
                type: Sequelize.INTEGER
            }
        },
        {timestamps: false}
    );

    domain.prototype.fields = [
        "domain_id",
        "domain_name",
        "description",
        "active",
        "status",
        "created_at",
        "updated_at",
        "esl_server_id"
    ];

    domain.prototype.fieldsSearchMetas = [
        "domain_name",
        "description",
        "esl_server_id"
    ];

    domain.associate = function (models) {
        domain.belongsTo(models.esl_servers, {
            foreignKey: 'esl_server_id'
        });

    };


    return domain;
};
