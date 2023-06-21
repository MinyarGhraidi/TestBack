module.exports = (sequelize, Sequelize) => {
    const didsgroup = sequelize.define("call_blundings", {
            id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            did_id: {
                type: Sequelize.INTEGER
            },
            phone_number: {
                type: Sequelize.STRING
            },
            campaign_id: {
                type: Sequelize.INTEGER
            },account_id: {
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

    didsgroup.prototype.fields = [
        'did_id',
        'campaign_id',
        "active",
        'status',
        'created_at',
        'updated_at',
        'account_id'
    ]
        didsgroup.prototype.fieldsSearchMetas = [
            'did_id',
            'campaign_id',
            "active",
            'status',
            'created_at',
            'updated_at',
            'account_id'
        ]
    didsgroup.associate = function (models) {
        didsgroup.belongsTo(models.campaigns, {
            foreignKey: 'campaign_id'
        });
        didsgroup.belongsTo(models.dids, {
            foreignKey: 'did_id'
        });
        didsgroup.belongsTo(models.accounts, {
            foreignKey: 'account_id'
        });
    };
    return didsgroup
}