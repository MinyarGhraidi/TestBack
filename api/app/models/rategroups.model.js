module.exports = (sequelize, Sequelize) => {
    const rategroup = sequelize.define("rategroups", {
      rategroup_id: {
            primaryKey: true,
            autoIncrement: true,
            type: Sequelize.INTEGER
          },
          name: {
            type: Sequelize.STRING
          },
        },
        {timestamps: false,}
    );

    rategroup.prototype.fields = [
        'rategroup_id',
        'name'
       
    ];

    rategroup.prototype.fieldsSearchMetas = [
      'rategroup_id',
        'name'
    ];

    return rategroup;
};
