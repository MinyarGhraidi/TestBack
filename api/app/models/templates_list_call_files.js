module.exports = (sequelize, Sequelize) => {
    const template_list_call_file = sequelize.define("templates_list_call_files", {
            templates_list_call_files_id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            account_id: {
                type: Sequelize.INTEGER
            },
            template: {
                type: Sequelize.JSONB,
            },
            template_name: {
                type: Sequelize.STRING,
            },
            active: {
                allowNull: true,
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
            type:{
                type: Sequelize.STRING,
            },
            custom_field:{
                type: Sequelize.JSONB,
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
        },
        {timestamps: false})

    template_list_call_file.prototype.fields = [
        'templates_list_call_files_id',
        'account_id',
        'template',
        'created_at',
        'updated_at',
        'template_name',
        'active',
        'type',
        'custom_field',
        'status'
    ]
    template_list_call_file.prototype.fieldsSearchMetas = [
        'template_name',
        'type',
    ]
    template_list_call_file.associate = function (models) {
        template_list_call_file.belongsTo(models.accounts, {
            foreignKey: 'account_id'
        })

    }
    return template_list_call_file
}
