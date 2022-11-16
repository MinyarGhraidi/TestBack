module.exports = (sequelize, Sequelize) => {
    const dialplans = sequelize.define("dialplans", {
            dialplan_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING
            },
            account_id: {
                type: Sequelize.STRING
            },

            active: {
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
            status: {
                type: Sequelize.STRING,
                defaultValue: 'Y'
            }
        },
        {timestamps: false,}
    );

    dialplans.prototype.fields = [
        'dialplan_id',
        'name',
        'active',
        'created_at',
        'updated_at',
        'account_id'

    ];

    dialplans.prototype.fieldsSearchMetas = [
        'dialplan_id',
        'name',
        'active',
        'account_id'
    ];

    return dialplans;
};
