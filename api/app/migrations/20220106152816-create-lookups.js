'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('lookups', {
      lookup_id : {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      key : {
        type : Sequelize.STRING
      },
      value : {
        type : Sequelize.JSONB
      },
      created_at : {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: new Date()
      },
      updated_at : {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: new Date()
      },
      type : {
        type: Sequelize.STRING
      },
    }).then(() => {
      queryInterface.bulkInsert("lookups",
          [
            {
              "lookup_id": 1,
              "key": "add",
              "value": JSON.stringify({"name":"add"}),
              "type" : "PERMISSION"
            },
            {
              "lookup_id": 2,
              "key": "edit",
              "value": JSON.stringify({"name":"edit"}),
              "type" : "PERMISSION"
            },
            {
              "lookup_id": 3,
              "key": "delete",
              "value": JSON.stringify({"name":"delete"}),
              "type" : "PERMISSION"
            },
            {
              "lookup_id": 4,
              "key": "list",
              "value": JSON.stringify({"name":"list"}),
              "type" : "PERMISSION"
            },
            {
              "lookup_id": 5,
              "key": "B2B",
              "value": JSON.stringify([
                "phone_number","title","category", "first_name", "last_name", "address1", "city", "country_code", "email", "siret", "siren"]),
              "type" : null
            },
            {
              "lookup_id": 6,
              "key": "B2C",
              "value": JSON.stringify([
                "phone_number",
                "gender",
                "first_name",
                "last_name",
                "address1",
                "city",
                "country_code",
                "age",
                "email"
              ]),
              "type" : null
            },
            {
              "lookup_id": 7,
              "key": "camp_queue_key_inbound",
              "value": JSON.stringify({
                "record": "true",
                "options": {
                  "max_wait_time": 50,
                  "time_base_score": "queue",
                  "tier_rules_apply": "false",
                  "tier_rule_wait_second": 300,
                  "agent_no_answer_status": "available",
                  "discard_abandoned_after": 900,
                  "abandoned_resume_allowed": "true",
                  "ring_progressively_delay": 10,
                  "tier_rule_no_agent_no_wait": "true",
                  "max_wait_time_with_no_agent": 120,
                  "tier_rule_wait_multiply_level": "false",
                  "skip_agents_with_external_calls": "true",
                  "max_wait_time_with_no_agent_time_reached": 5
                },
                "strategy": "longest-idle-agent"
              }),
              "type" : null
            },
            {
              "lookup_id": 8,
              "key": "default_config_campaigns_dialer",
              "value": JSON.stringify({
                "hooper": 30,
                "list_mix": true,
                "dial_level": 1,
                "list_order": "up",
                "dialtimeout": 60
              }),
              "type" : null
            }
          ]);
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('lookups');
  }
};
