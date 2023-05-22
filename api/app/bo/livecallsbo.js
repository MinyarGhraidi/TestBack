const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require("../models");

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
        if (!!!account_id) {
            res.send({
                status: 403,
                message: "Account ID Not Found !",
                data: []
            })
        }

        this.db['accounts'].findOne({where: {account_id: account_id}})
            .then(account => {
                if (account) {
                    let sqlQuery = `select *
                            from live_calls
                            WHERE SUBSTRING("callid", 0 , POSITION(':' in "callid") ) = :account_code`

                    db.sequelize['crm-app'].query(sqlQuery, {
                        type: db.sequelize['crm-app'].QueryTypes.SELECT,
                        replacements: {
                            account_code: account.account_code
                        }
                    }).then(livecall => {
                        if (livecall && livecall.length !== 0) {
                            res.send({
                                status: 200,
                                message: "success",
                                data: livecall,
                            });
                        } else {
                            res.send({
                                status: 200,
                                message: "success",
                                data: [],
                            });
                        }
                    }).catch(err => {
                        return _this.sendResponseError(res, ['Cannot fetch data from DB', err], 1, 403);
                    })
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

    }

    getLiveCallsByCampaign(req, res, next) {
        let _this = this;
        let {campaign_id} = req.body;
        if (!!!campaign_id) {
            res.send({
                status: 403,
                message: "campaign ID Not Found !",
                data: []
            })
        }
        this.db['live_calls'].findAll({where: {active: 'Y'}})
            .then(liveCalls => {
                this.db['campaigns'].findOne({where: {campaign_id: campaign_id}})
                    .then(campaign => {
                        if (Object.keys(campaign) && Object.keys(campaign).length !== 0) {
                            let filteredData = liveCalls.filter(call => parseInt(call.events[0].campaignId) === parseInt(campaign.campaign_id));
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
                        return _this.sendResponseError(res, ['Cannot fetch Campaigns from DB', err], 1, 403);
                    })
            })
            .catch(err => {
                return _this.sendResponseError(res, ['Cannot fetch data from DB', err], 1, 403);
            })
    }
}

module.exports = livecalls;
