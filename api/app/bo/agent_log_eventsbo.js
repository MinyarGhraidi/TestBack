const {baseModelbo} = require('./basebo');
const appSocket = new (require("../providers/AppSocket"))();

class agent_log_events extends baseModelbo {
    constructor() {
        super('agent_log_events', 'agent_log_event_id');
        this.baseModal = "agent_log_events";
        this.primaryKey = 'agent_log_event_id';
    }

    _getLastEvent(user_id){
        return new Promise((resolve,reject) => {
            this.db['agent_log_events'].findAll({where : {active: 'Y', user_id : user_id}, order: [['agent_log_event_id', 'DESC']]})
                .then(events => {
                    return resolve({
                        status : 200,
                        message : 'success',
                        data : events[0]
                    });
                })
                .catch(err => {
                    return reject(err)
                })
        })
    }
    getLastEvent(req, res, next) {
        let _this = this;
        let {user_id} = req.body;
        this._getLastEvent(user_id).then(result => {
            res.send(result)
        })
            .catch(err => {
                return _this.sendResponseError(res, ['Error.cannot Fetch data from DB', err], 1, 403);
            })
    }
    getLastEventParam(user,campaign_id){
        return new Promise((resolve,reject)=>{
            this.db['agent_log_events'].findAll({where : {active: 'Y', user_id : user.user_id}, order: [['agent_log_event_id', 'DESC']]})
                .then(events => {
                    let data_agent = {
                        user_id: user.user_id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        uuid: user.sip_device.uuid,
                        crmStatus: user.params.status,
                        telcoStatus: user.sip_device.status,
                        timerStart: events[0].start_at,
                        campaign_id: campaign_id,
                        account_id : user.account_id
                    };
                    appSocket.emit('agent_connection', data_agent);
                    appSocket.emit('campaign_updated', {user_id : user.user_id, campaign_id : campaign_id});
                    resolve(true)
                })
                .catch(err => reject(err))
        })
    }
}

module.exports = agent_log_events;