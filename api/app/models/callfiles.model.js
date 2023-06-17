
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
            note: {
                type: Sequelize.STRING
            },
            call_status: {
                type: Sequelize.STRING
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: 'Y',
                allowNull: true
            },
            to_treat: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: 'N'
            },
            save_in_hooper: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: 'N'
            },
            gender: {
                type: Sequelize.STRING
            },
            age: {
                type: Sequelize.STRING
            },
            company_name: {
                type: Sequelize.STRING
            },
            category: {
                type: Sequelize.STRING
            },
            siret: {
                type: Sequelize.STRING
            },
            siren: {
                type: Sequelize.STRING
            },
            date_of_birth: {
                type: Sequelize.STRING
            },
            comments: {
                type: Sequelize.STRING
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
        'to_treat',
        'save_in_hooper',
        'date_of_birth',
        'comments'

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
        'to_treat',
        'save_in_hooper'
    ]

    callfile.associate = function (models) {
        callfile.belongsTo(models.listcallfiles, {
            foreignKey: 'listcallfile_id'
        });
    };

    return callfile
}
