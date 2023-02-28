module.exports = (sequelize, Sequelize) => {
    const dialplan_item = sequelize.define("dialplan_items", {
            dialplan_item_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            prefix: {
                type: Sequelize.STRING
            },
            priority: {
                type: Sequelize.STRING
            },
            channels: {
                type: Sequelize.INTEGER
            },
            pai: {
                type: Sequelize.INTEGER
            },
            trunck_id: {
                type: Sequelize.INTEGER
            },
            account_id: {
                type: Sequelize.INTEGER
            },

            active: {
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
    );

    dialplan_item.prototype.fields = [
        'dialplan_item_id',
        'account_id',
        'channels',
        'active',
        'prefix',
        'priority',
        'trunck_id',
        'pai',
        "status",
        'created_at',
        'updated_at',

    ];

    dialplan_item.prototype.fieldsSearchMetas = [
        'account_id',
        'active',
        'channels',
        'prefix',
        'priority',
        'trunck_id',
        'pai',
        "status"
    ];
    dialplan_item.associate = function (models) {
        dialplan_item.belongsTo(models.truncks, {
            foreignKey: 'trunck_id'
        });
        dialplan_item.belongsTo(models.accounts, {
            foreignKey: 'account_id'
        })
    };
    return dialplan_item;
};
