const {baseModelbo} = require('./basebo');

class agent_log_events extends baseModelbo {
    constructor() {
        super('agent_log_events', 'agent_log_event_id');
        this.baseModal = "agent_log_events";
        this.primaryKey = 'agent_log_event_id';
    }

    getLastEvent(req, res, next) {
        let _this = this;
        let {user_id} = req.body;
        this.db['agent_log_events'].findAll({where : {active: 'Y', user_id : user_id}, order: [['agent_log_event_id', 'DESC']]})
            .then(events => {
                res.send({
                    status : 200,
                    message : 'success',
                    data : events[0]
                });
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.cannot Fetch data from DB', err], 1, 403);
            })
    }
    getLastEventParam(user_id){
        return new Promise((resolve,reject)=>{
            this.db['agent_log_events'].findAll({where : {active: 'Y', user_id : user_id}, order: [['agent_log_event_id', 'DESC']]})
                .then(events => resolve(events[0]))
                .catch(err => reject(err))
        })
    }
}

module.exports = agent_log_events;