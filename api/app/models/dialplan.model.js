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

            active: {
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
        },
        {timestamps: false,}
    );

    dialplans.prototype.fields = [
        'dialplan_id',
        'name',
        'active'
       
    ];

    dialplans.prototype.fieldsSearchMetas = [
        'dialplan_id',
        'name',
        'active'
    ];

    return dialplans;
};
