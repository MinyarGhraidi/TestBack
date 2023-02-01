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
            'status',
            'created_at',
            'updated_at',
            'type',
            'account_id'
        ]
    return didsgroup
}
