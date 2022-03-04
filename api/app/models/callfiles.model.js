const {TooManyRequests} = require("http-errors")

module.exports = (sequelize, Sequelize) => {
    const callfile = sequelize.define("callfiles", {
        callfile_id: {
                primaryKey: true,
                autoIncrement: true,
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
            status: {
                type: Sequelize.STRING
            },
            to_treat: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: 'N'
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
    )

    callfile.prototype.fields = [
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
        'customfields',
        'to_treat'
       
    ]
    callfile.prototype.fieldsSearchMetas = [
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
            'customfields',
            'to_treat'
        ]
        
    return callfile
}
