module.exports = (sequelize, Sequelize) => {
    const didsgroup = sequelize.define("didsgroups", {
            did_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING
            },
            description: {
                type: Sequelize.STRING
            },
            type: {
                type: Sequelize.STRING
            },
            campaign_id: {
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
            account_id: {
                type: Sequelize.INTEGER
            },
        },
        {timestamps: false,}
    )

    didsgroup.prototype.fields = [
        'did_id',
        'name',
        'description',
        'campaign_id',
        "active",
        'status',
        'created_at',
        'updated_at',
        'type',
        'account_id'
    ]
        didsgroup.prototype.fieldsSearchMetas = [
            'did_id',
            'name',
            'description',
            'campaign_id',
            'status',
            'created_at',
            'updated_at',
            'type',
            'account_id'
        ]
    didsgroup.associate = function (models) {
        didsgroup.belongsTo(models.campaigns, {
            foreignKey: 'campaign_id'
        });
    };
    return didsgroup
}
