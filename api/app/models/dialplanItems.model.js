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
            cps: {
                type: Sequelize.INTEGER
            }, pai: {
                type: Sequelize.INTEGER
            },
            trunck_id: {
                type: Sequelize.INTEGER
            },
            dialplan_id: {
                type: Sequelize.INTEGER
            },

            active: {
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
            status: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
        },
        {timestamps: false,}
    );

    dialplan_item.prototype.fields = [
        'dialplan_item_id',
        'dialplan_id',
        'channels',
        'name',
        'active',
        'prefix',
        'priority',
        'cps',
        'trunck_id',
        'pai',
        "status"

    ];

    dialplan_item.prototype.fieldsSearchMetas = [
        'dialplan_id',
        'name',
        'active',
        'channels',
        'prefix',
        'priority',
        'cps',
        'trunck_id',
        'pai',
        "status"
    ];
    dialplan_item.associate = function (models) {
        dialplan_item.belongsTo(models.truncks, {
            foreignKey: 'trunck_id'
        });
        dialplan_item.belongsTo(models.dialplans, {
            foreignKey: 'dialplan_id'
        })
    };
    return dialplan_item;
};
