const {TooManyRequests} = require("http-errors")

module.exports = (sequelize, Sequelize) => {
    const listcallfile = sequelize.define("listcallfiles", {
            listcallfile_id: {
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
            file_id: {
                type: Sequelize.INTEGER,
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
            mapping: {
                type: Sequelize.JSONB,
            },
            processing: {
                type: Sequelize.INTEGER,
                defaultValue: 1
            },
            processing_status: {
                type: Sequelize.JSONB,
            },
            check_duplication: {
                type: Sequelize.INTEGER,
            },
            prefix: {
                type: Sequelize.STRING,
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
            templates_id: {
                type: Sequelize.INTEGER,
            },
            custom_fields: {
                type: Sequelize.JSONB,
            },
            sql_list_id: {
                type: Sequelize.INTEGER
            },
            stats: {
                type: Sequelize.JSONB,
            },
        },
        {timestamps: false,}
    )

    listcallfile.prototype.fields = [
        'listcallfile_id',
        'name',
        'description',
        'campaign_id',
        "active",
        'file_id',
        'status',
        "mapping",
        'processing',
        'processing_status',
        'check_duplication',
        'created_at',
        'updated_at',
        'prefix',
        'templates_id',
        "custom_fields",
        "sql_list_id"
    ]
    listcallfile.prototype.fieldsSearchMetas = [
        'listcallfile_id',
        'name',
        'description',
        'campaign_id',
        "active",
        'file_id',
        'status',
        "mapping",
        'processing',
        'check_duplication',
        'processing_status',
        'created_at',
        'updated_at',
        'prefix'
    ]
    listcallfile.associate = function (models) {
        listcallfile.belongsTo(models.efiles, {
            foreignKey: 'file_id'
        });
        listcallfile.belongsTo(models.campaigns, {
            foreignKey: 'campaign_id'
        });
        listcallfile.belongsTo(models.templates_list_call_files,{
            foreignKey: 'templates_id'
        });
    };
    return listcallfile
}
