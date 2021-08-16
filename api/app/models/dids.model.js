const {TooManyRequests} = require("http-errors")

module.exports = (sequelize, Sequelize) => {
    const did = sequelize.define("dids", {
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
        },
        {timestamps: false,}
    )

    did.prototype.fields = [
        'did_id',
        'name',
        'description',
        'campaign_id',
        "active",
        'status',
        'created_at',
        'updated_at'
    ],
    did.prototype.fieldsSearchMetas = [
        'did_id',
        'name',
        'description',
        'campaign_id',
        'status',
        'created_at',
        'updated_at'
        ]
        ,
        did.associate = function (models) {
            did.belongsTo(models.campaigns, {
                foreignKey: 'campaign_id'
            });
        };
    return did
}