'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('accounts', {
                account_id: {
                    primaryKey: true,
                    autoIncrement: true,
                    type: Sequelize.INTEGER,
                },
                account_code: {
                    type: Sequelize.STRING,
                },
                first_name: {
                    type: Sequelize.STRING,
                },
                last_name: {
                    type: Sequelize.STRING,
                },
                company: {
                    type: Sequelize.STRING,
                },
                adresse: {
                    type: Sequelize.STRING,
                },
                country: {
                    type: Sequelize.STRING,
                },
                city: {
                    type: Sequelize.STRING,
                },
                zip_code: {
                    type: Sequelize.STRING,
                },
                tel: {
                    type: Sequelize.STRING,
                },
                mobile: {
                    type: Sequelize.STRING,
                },
                email: {
                    type: Sequelize.STRING,
                },
                nbr_account: {
                    type: Sequelize.INTEGER,
                },
                white_label: {
                    type: Sequelize.BOOLEAN,
                },
                log: {
                    type: Sequelize.STRING,
                },
                white_label_app_name: {
                    type: Sequelize.STRING,
                },
                domain_sip: {
                    type: Sequelize.STRING,
                },
                active: {
                    allowNull: true,
                    type: Sequelize.STRING,
                    defaultValue: "Y",
                },
                status: {
                    type: Sequelize.STRING,
                    defaultValue: "Y",
                },
                created_at: {
                    allowNull: true,
                    type: Sequelize.DATE,
                    defaultValue: new Date(),
                },
                updated_at: {
                    allowNull: true,
                    type: Sequelize.DATE,
                    defaultValue: new Date(),
                },
                role_crm_id: {
                    type: Sequelize.INTEGER
                },
                user_id: {
                    type: Sequelize.INTEGER
                },
                lang: {
                    type: Sequelize.STRING,
                },
                domain_id: {
                    type: Sequelize.INTEGER,
                },
                web_domain: {
                    type: Sequelize.STRING,
                },
                nb_agents: {
                    type: Sequelize.INTEGER,
                },
            },
        );
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('accounts');
    }
};
