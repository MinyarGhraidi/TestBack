'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('permissions_crms', {
            id: {
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            value: {
                type: Sequelize.STRING
            },
            description: {
                type: Sequelize.STRING
            },
            active: {
                allowNull: true,
                type: Sequelize.STRING(1),
                defaultValue: 'Y'
            },
            is_updatable: {
                type: Sequelize.STRING,
                defaultValue: 'Y'
            },
        }).then(() => {
            queryInterface.bulkInsert("permissions_crms",
                [
                    {
                        "id": 1,
                        "value": "home",
                        "description": "home",
                        "active": "Y",
                        "is_updatable" : "N"
                    },
                    {
                        "id": 2,
                        "value": "real-time",
                        "description": "real-time",
                        "active": "Y",
                        "is_updatable" : "N"
                    },
                    {
                        "id": 3,
                        "value": "user-manager",
                        "description": "user-manager",
                        "active": "Y",
                        "is_updatable" : "Y"
                    },
                    {
                        "id": 4,
                        "value": "management",
                        "description": "management",
                        "active": "Y",
                        "is_updatable" : "Y"
                    },
                    {
                        "id": 5,
                        "value": "configuration",
                        "description": "configuration",
                        "active": "Y",
                        "is_updatable" : "Y"
                    },
                    {
                        "id": 6,
                        "value": "meetings",
                        "description": "meetings",
                        "active": "Y",
                        "is_updatable" : "N"
                    },
                    {
                        "id": 7,
                        "value": "cdrs",
                        "description": "cdrs",
                        "active": "Y",
                        "is_updatable" : "N"
                    },
                    {
                        "id": 8,
                        "value": "reporting",
                        "description": "reporting",
                        "active": "Y",
                        "is_updatable" : "N"
                    },
                    {
                        "id": 9,
                        "value": "accounts",
                        "description": "accounts",
                        "active": "Y",
                        "is_updatable" : "Y"
                    },
                    {
                        "id": 10,
                        "value": "administration",
                        "description": "administration",
                        "active": "Y",
                        "is_updatable" : "Y"
                    },
                    {
                        "id": 11,
                        "value": "agent_dashboard",
                        "description": "agent_dashboard",
                        "active": "Y",
                        "is_updatable" : "Y"
                    },
                    {
                        "id": 12,
                        "value": "agent_history",
                        "description": "agent_history",
                        "active": "Y",
                        "is_updatable" : "Y"
                    },
                    {
                        "id": 13,
                        "value": "agent_calendar",
                        "description": "agent_calendar",
                        "active": "Y",
                        "is_updatable" : "Y"
                    },
                    {
                        "id": 14,
                        "value": "user-settings",
                        "description": "user-settings",
                        "active": "Y",
                        "is_updatable" : "N"
                    }
                ]);
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('permissions_crms');

    }
};
