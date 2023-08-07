module.exports = (sequelize, Sequelize) => {
    const hoopers = sequelize.define("hoopers", {
            id:{
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            callfile_id: {
                type: Sequelize.INTEGER
            },
            listcallfile_id: {
                type: Sequelize.INTEGER
            },
            phone_number: {
                type: Sequelize.STRING
            },
            first_name: {
                type: Sequelize.INTEGER
            },
            last_name: {
                type: Sequelize.STRING
            },
            middle_initial: {
                type: Sequelize.STRING
            },
            title: {
                type: Sequelize.STRING
            },
            address1: {
                type: Sequelize.STRING
            },
            address2: {
                type: Sequelize.STRING
            },
            address3: {
                type: Sequelize.STRING
            },
            state: {
                type: Sequelize.STRING
            },
            city: {
                type: Sequelize.STRING
            },
            province: {
                type: Sequelize.STRING
            },
            postal_code: {
                type: Sequelize.STRING
            },
            email: {
                type: Sequelize.STRING
            },
            country_code: {
                type: Sequelize.STRING
            },
            customfields: {
                type: Sequelize.JSONB
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
            to_treat: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: 'N'
            },
            treated_at:{
                allowNull: true,
                type: Sequelize.DATE
            }
        },
        {timestamps: false,}
    )

    hoopers.prototype.fields = [
        'to_treat',
        'treated_at',
        'id',
        'callfile_id',
        'listcallfile_id',
        'phone_number',
        'first_name',
        "last_name",
        'middle_initial',
        'title',
        'address1',
        'address2',
        'address3',
        'state',
        "city",
        'province',
        'postal_code',
        'email',
        'country_code',
        'customfields'

    ]
    hoopers.prototype.fieldsSearchMetas = [
        'callfile_id',
        'listcallfile_id',
        'phone_number',
        'first_name',
        "last_name",
        'middle_initial',
        'title',
        'address1',
        'address2',
        'address3',
        'state',
        "city",
        'province',
        'postal_code',
        'email',
        'country_code',
        'customfields'
    ]

    return hoopers
}