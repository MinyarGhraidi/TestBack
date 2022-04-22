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
        this.db['live_calls'].findAll({where: {callid: call_id, active: 'Y'}})
            .then(livecalls => {
                res.send({
                    status: 200,
                    message: "success",
                    data: livecalls
                });
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Cannot fetch data from DB', err], 1, 403);
            })
    }

    getLiveCallsByAccount(req, res, next) {
        let _this = this;
        let {account_id} = req.body;
        this.db['live_calls'].findAll({where: {active: 'Y'}})
            .then(liveCalls => {
                this.db['accounts'].findOne({where: {account_id: account_id}})
                    .then(account => {
                        if (Object.keys(account) && Object.keys(account).length !== 0) {
                            let filteredData = liveCalls.filter(call => call.events[0].accountcode === account.account_code);
                            res.send({
                                status: 200,
                                message: "success",
                                data: filteredData,
                            });
                        } else {
                            res.send({
                                status: 200,
                                message: "success",
                                data: []
                            });
                        }
                    })
                    .catch(err => {
                        return _this.sendResponseError(res, ['Cannot fetch accounts from DB', err], 1, 403);
                    })
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Cannot fetch data from DB', err], 1, 403);
            })
    }

}

module.exports = livecalls;