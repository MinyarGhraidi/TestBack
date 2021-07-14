module.exports = (sequelize, Sequelize) => {
    const lookup = sequelize.define("lookups", {
        lookup_id : {
            primaryKey: true,
            autoIncrement: true,
            type: Sequelize.INTEGER
        },
        key : {
            type : Sequelize.STRING
        },
        value : {
            type : Sequelize.JSONB
        },
        created_at : {
            allowNull: true,
            type: Sequelize.DATE,
            defaultValue: new Date()
        }, 
        updated_at : {
            allowNull: true,
            type: Sequelize.DATE,
            defaultValue: new Date()
        },
        type : {
            type: Sequelize.STRING
        },
    },
    {timestamps: false,}
    );
     
    lookup.prototype.fileds = [
        'lookup_id',
        'key',
        'value',
        'created_at',
        'updated_at'
    ],
    lookup.prototype.filedsSearchMetas = [
        'lookup_id',
        'key',
        'value',
        'created_at',
        'updated_at'
    ]

    return lookup
}