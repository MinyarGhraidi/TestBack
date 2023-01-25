module.exports = (sequelize, Sequelize) => {
    const dids = sequelize.define("dids", {
            id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            number: {
                type: Sequelize.STRING
            },
            did_group_id: {
                type: Sequelize.INTEGER
            },
            active: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
            status: {
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

    dids.prototype.fields = [
        'id',
        'did_group_id',
        'number',
        "active",
        'status',
        'created_at',
        'updated_at'
    ]
    dids.prototype.fieldsSearchMetas = [
        'id',
        'number',
        'did_group_id',
        'status',
        'created_at',
        'updated_at'
    ]
    dids.associate = function (models) {
        dids.belongsTo(models.didsgroups, {
            foreignKey: 'did_group_id'
        });
    };
    return dids
}
