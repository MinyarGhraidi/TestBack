'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('callfiles', {
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
                type: Sequelize.STRING
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
                type: Sequelize.STRING(1),
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
                allowNull: true,
                type: Sequelize.STRING(1),
                defaultValue: 'Y'
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
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('callfiles');
    }
};
