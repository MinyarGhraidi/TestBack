const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');

class livecalls extends baseModelbo {
    constructor() {
        super('live_calls', 'id');
        this.baseModal = "live_calls";
        this.primaryKey = 'id';
    }

    getLiveCallsByCallId(req, res, next) {
        let _this = this;
        let {call_id} = req.body;
        this.db['live_calls'].findAll({where : {callid : call_id}})
            .then(livecalls => {
                res.send({
                    status : 200,
                    message : "success",
                    data : livecalls
                });
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Cannot fetch data from DB', err], 1, 403);
            })
    }
}

module.exports = livecalls;