'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('has_permissions', {
            id: {
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            roles_crm_id: {
                type: Sequelize.INTEGER
            },
            permission_crm_id: {
                type: Sequelize.INTEGER
            },
            active: {
                allowNull: true,
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
        }).then(() => {
            queryInterface.bulkInsert("has_permissions",
                [
                    {
                        "id": 1,
                        "roles_crm_id": 2,
                        "permission_crm_id": 1,
                        "active": "Y"
                    },
                    {
                        "id": 2,
                        "roles_crm_id": 2,
                        "permission_crm_id": 2,
                        "active": "Y"
                    },
                    {
                        "id": 3,
                        "roles_crm_id": 2,
                        "permission_crm_id": 3,
                        "active": "Y"
                    },
                    {
                        "id": 4,
                        "roles_crm_id": 2,
                        "permission_crm_id": 4,
                        "active": "Y"
                    },
                    {
                        "id": 5,
                        "roles_crm_id": 2,
                        "permission_crm_id": 5,
                        "active": "Y"
                    },
                    {
                        "id": 6,
                        "roles_crm_id": 2,
                        "permission_crm_id": 6,
                        "active": "Y"
                    },
                    {
                        "id": 7,
                        "roles_crm_id": 2,
                        "permission_crm_id": 7,
                        "active": "Y"
                    },
                    {
                        "id": 8,
                        "roles_crm_id": 2,
                        "permission_crm_id": 8,
                        "active": "Y"
                    },
                    {
                        "id": 9,
                        "roles_crm_id": 1,
                        "permission_crm_id": 9,
                        "active": "Y"
                    },
                    {
                        "id": 10,
                        "roles_crm_id": 1,
                        "permission_crm_id": 10,
                        "active": "Y"
                    },
                    {
                        "id": 11,
                        "roles_crm_id": 3,
                        "permission_crm_id": 11,
                        "active": "Y"
                    },
                    {
                        "id": 12,
                        "roles_crm_id": 3,
                        "permission_crm_id": 12,
                        "active": "Y"
                    },
                    {
                        "id": 13,
                        "roles_crm_id": 3,
                        "permission_crm_id": 13,
                        "active": "Y"
                    },
                    {
                        "id": 14,
                        "roles_crm_id": 1,
                        "permission_crm_id": 14,
                        "active": "Y"
                    },
                    {
                        "id": 15,
                        "roles_crm_id": 2,
                        "permission_crm_id": 14,
                        "active": "Y"
                    },
                    {
                        "id": 16,
                        "roles_crm_id": 3,
                        "permission_crm_id": 14,
                        "active": "Y"
                    }
                ]);
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('has_permissions');
    }
};
