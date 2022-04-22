const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
 
class agent_log_events extends baseModelbo {
    constructor() {
        super('agent_log_events', 'agent_log_event_id');
        this.baseModal = "agent_log_events";
        this.primaryKey = 'agent_log_event_id';
    }

    getLastEvent(req, res, next) {
        let _this = this;
        let {user_id} = req.body;
        this.db['agent_log_events'].findAll({where : {active: 'Y', user_id : user_id}})
            .then(events => {
                res.send({
                    status : 200,
                    message : 'success',
                    data : events[events.length - 1]
                });
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.cannot Fetch data from DB', err], 1, 403);
            })
    }
}

module.exports = agent_log_events;