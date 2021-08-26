const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
 
class agent_log_events extends baseModelbo {
    constructor() {
        super('agent_log_events', 'agent_log_event_id');
        this.baseModal = "agent_log_events";
        this.primaryKey = 'agent_log_event_id';
    }
}

module.exports = agent_log_events;