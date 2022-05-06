'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('permissions_crms', {
            id: {
                primaryKey: true,
                autoIncrement: true,
                type: Sequelize.INTEGER
            },
            value: {
                type: Sequelize.STRING
            },
            description: {
                type: Sequelize.STRING
            },
            active: {
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
                        "active": "Y"
                    },
                    {
                        "id": 2,
                        "value": "livecalls",
                        "description": "livecalls",
                        "active": "Y"
                    },
                    {
                        "id": 3,
                        "value": "dashboard",
                        "description": "dashboard",
                        "active": "Y"
                    },
                    {
                        "id": 4,
                        "value": "user-manager",
                        "description": "User Manager",
                        "active": "Y"
                    },
                    {
                        "id": 5,
                        "value": "campaigns",
                        "description": "campaigns",
                        "active": "Y"
                    },
                    {
                        "id": 6,
                        "value": "meetings",
                        "description": "meetings",
                        "active": "Y"
                    },
                    {
                        "id": 7,
                        "value": "truncks",
                        "description": "truncks",
                        "active": "Y"
                    },
                    {
                        "id": 8,
                        "value": "roles",
                        "description": "roles",
                        "active": "Y"
                    },
                    {
                        "id": 9,
                        "value": "accounts",
                        "description": "accounts",
                        "active": "Y"
                    },
                    {
                        "id": 10,
                        "value": "servers",
                        "description": "servers",
                        "active": "Y"
                    },
                    {
                        "id": 11,
                        "value": "acl_groups",
                        "description": "acl groups",
                        "active": "Y"
                    },
                    {
                        "id": 12,
                        "value": "dispatcher",
                        "description": "dispatcher",
                        "active": "Y"
                    },
                    {
                        "id": 13,
                        "value": "domains",
                        "description": "domains",
                        "active": "Y"
                    },
                    {
                        "id": 14,
                        "value": "rtp_engine",
                        "description": "rtp_engine",
                        "active": "Y"
                    },
                    {
                        "id": 18,
                        "value": "agent_dashboard",
                        "description": "agent_dashboard",
                        "active": "Y"
                    },
                    {
                        "id": 19,
                        "value": "sales_dashboard",
                        "description": "sales_dashboard",
                        "active": "Y"
                    },
                    {
                        "id": 20,
                        "value": "calendar",
                        "description": "calendar",
                        "active": "Y"
                    },
                    {
                        "id": 21,
                        "value": "user-settings",
                        "description": "user settings",
                        "active": "Y"
                    }
                ]);
        });
    },

    down: (queryInterface, Sequelize) => {
        /*
          Add reverting commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.dropTable('users');
        */
    }
};
