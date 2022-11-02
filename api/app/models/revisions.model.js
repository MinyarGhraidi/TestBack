module.exports = (sequelize, Sequelize) => {
    const revision = sequelize.define("revisions", {
            revision_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            model_id: {
                type: Sequelize.INTEGER
            },
            model_name: {
                type: Sequelize.STRING
          },
          before: {
            type: Sequelize.JSONB
          },
          after: {
            type: Sequelize.JSONB
          },
            changes: {
                type: Sequelize.JSONB
            },
            date: {
                type: Sequelize.DATE
            },
            user_id: {
                type: Sequelize.INTEGER
            },
            active: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },

        },
        {timestamps: false,}
    );

    revision.prototype.fields = [
        "revision_id",
        "model_id",
        "model_name",
        "before",
        "after",
        "date",
        "user_id",
        "active"

    ];

    revision.prototype.fieldsSearchMetas = [
        "revision_id",
        "model_id",
        "model_name",
        "before",
        "after",
        "date",
        "user_id",
        "active"
    ];
    revision.associate = function (models) {
        revision.belongsTo(models.users, {
            foreignKey: 'user_id'
        });
    };


    return revision;
};
