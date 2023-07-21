const {baseModelbo} = require("./basebo");
let db = require("../models");
const moment = require("moment-timezone");
const PromiseBB = require("bluebird");


class AccBo extends baseModelbo {
    constructor() {
        super("acc", "id");
        this.baseModal = "acc";
        this.primaryKey = "id"
    }

    _getCdrsFunction(params, sansLimit = false) {
        return new Promise((resolve, reject) => {
            const AgentUUID = params.agentUUID || null
            const filter = params.filter || null;
            const limit = parseInt(params.limit) > 0 ? params.limit : 1000;
            const page = params.page || 1;
            const offset = (limit * (page - 1));
            let {date, directions, startTime, endTime, reasonCode, ip, from, to, account_code} = filter;
            let sqlCount = `select FILTER
                            from acc_cdrs
                            WHERE SUBSTRING("custom_vars", 0 , POSITION(':' in "custom_vars") ) = :account_code
                 EXTRA_WHERE`
            let sqlData = sqlCount;
            let filter_count = ' count(*) ';
            let extra_where_count = '';
            if (startTime && startTime !== '') {
                extra_where_count += ' AND start_time BETWEEN :start_time and :end_time ';
            }
            if (endTime && endTime !== '') {
                extra_where_count += ' AND end_time BETWEEN :start_time and :end_time';
            }
            if (reasonCode && reasonCode !== '') {
                extra_where_count += ' AND (sip_reason_crm = :sip_reason or sip_reason = :sip_reason)';
            }
            if (directions && directions.length !== 0) {
                extra_where_count += ' AND calldirection in (:directions)';
            }
            if (ip && ip !== '') {
                extra_where_count += ' AND src_ip like :src_ip';
            }
            if (from && from !== '') {
                extra_where_count += ` AND src_user like :from`;
            }
            if (to && to !== '') {
                extra_where_count += ` AND dst_user like :to `;
            }
            if (AgentUUID && AgentUUID !== '') {
                extra_where_count += ` AND agent = :agent `;
            }
            sqlCount = sqlCount.replace('EXTRA_WHERE', extra_where_count);
            sqlCount = sqlCount.replace('FILTER', filter_count);
            db.sequelize['cdr-db'].query(sqlCount, {
                type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                replacements: {
                    limit: limit,
                    offset: offset,
                    start_time: moment(date).format('YYYY-MM-DD').concat(' ', startTime),
                    end_time: moment(date).format('YYYY-MM-DD').concat(' ', endTime),
                    sip_reason: reasonCode,
                    directions: directions,
                    account_code: account_code,
                    src_ip: ip ? ('%' + ip.concat('%')).toString() : null,
                    from: from ? ('%' + from.concat('%')).toString() : null,
                    to: to ? ('%' + to.concat('%')).toString() : null,
                    agent: AgentUUID
                }
            }).then(countAll => {
                let pages = Math.ceil(countAll[0].count / params.limit);
                let extra_where_limit;
                if(sansLimit){
                    extra_where_limit = extra_where_count += ' ORDER BY start_time DESC'
                }else{
                    extra_where_limit = extra_where_count += ' ORDER BY start_time DESC LIMIT :limit OFFSET :offset'
                }
                sqlData = sqlData.replace('EXTRA_WHERE', extra_where_limit);
                sqlData = sqlData.replace('FILTER', '*');
                db.sequelize['cdr-db'].query(sqlData, {
                    type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                    replacements: {
                        limit: limit,
                        offset: offset,
                        start_time: moment(date).format('YYYY-MM-DD').concat(' ', startTime),
                        end_time: moment(date).format('YYYY-MM-DD').concat(' ', endTime),
                        sip_reason: reasonCode,
                        directions: directions,
                        account_code: account_code,
                        src_ip: ip ? ('%' + ip.concat('%')).toString() : null,
                        from: from ? ('%' + from.concat('%')).toString() : null,
                        to: to ? ('%' + to.concat('%')).toString() : null,
                        agent: AgentUUID

                    }
                }).then(data => {
                    this.db['roles_crms'].findOne({
                        where: {value: 'agent', active: 'Y'}
                    }).then(role => {
                        this.db['users'].findAll({where: {active: 'Y', role_crm_id: role.id}}).then(users => {
                            this.db['accounts'].findAll({
                                where: {
                                    active: 'Y'
                                }

                            }).then((accounts) => {
                                this.db['campaigns'].findAll({
                                    where: {
                                        active: 'Y',
                                    }
                                }).then((campaigns) => {
                                    let cdrs_data = []
                                    PromiseBB.each(data, item => {
                                        let index = item.custom_vars.indexOf(":");
                                        let AccountCode = item.custom_vars.slice(0,index);
                                        let account_data = accounts.filter(item_acc => item_acc.account_code === String(AccountCode));
                                        let campaign_data = campaigns.filter(item_acc => item_acc.campaign_id === parseInt(item.campaignId));
                                        let user_data = users.filter(item_acc => {
                                            return (item_acc.sip_device.uuid === item.agent)
                                        });
                                        item.account_info = account_data[0] ? account_data[0].first_name + " " + account_data[0].last_name : null;
                                        item.account = account_data[0];
                                        item.agent_info = user_data[0] ? user_data[0].first_name + " " + user_data[0].last_name : null;
                                        item.agent_all = user_data[0];
                                        item.campaign = campaign_data[0];
                                        item.campaign_name = campaign_data[0] ? campaign_data[0].campaign_name : null;
                                        cdrs_data.push(item);
                                    }).then(() => {
                                        let resData = {
                                            success: true,
                                            status: 200,
                                            data: cdrs_data,
                                            pages: pages,
                                            countAll: countAll[0].count
                                        }
                                        resolve(resData)
                                    }).catch(err => {
                                        reject(err)
                                    })
                                }).catch(err => {
                                    reject(err)
                                })
                            }).catch(err => {
                                reject(err)
                            })
                        }).catch(err => reject(err))
                    }).catch(err => reject(err))
                }).catch(err => {
                    reject(err)
                })
            })
        })
    }

    getCdrs(req, res, next) {
        let _this = this;
        const params = req.body;
        _this._getCdrsFunction(params).then((result) => {
            res.send(result);
        }).catch(err => {
            return _this.sendResponseError(res, ['Error.CannotGetCdrs'], 1, 403);
        })


    };

    getSip_codes(req, res, next) {
        let _this = this;
        let date = req.body.date;
        let startTime = moment(date).format('YYYY-MM-DD').concat(' ', req.body.startTime);
        let endTime = moment(date).format('YYYY-MM-DD').concat(' ', req.body.endTime);
        let sqlSipCode = `
                        select distinct  sip_reason_crm
                          from acc_cdrs
                          where sip_reason_crm notnull and sip_reason_crm != '' and start_time BETWEEN  :start_time and :end_time
                          UNION DISTINCT 
                        select distinct  sip_reason as sip_reason_crm
                          from acc_cdrs
                          where sip_reason notnull and sip_reason != '' and start_time BETWEEN  :start_time and :end_time ;`;
        db.sequelize["cdr-db"]
            .query(sqlSipCode, {
                type: db.sequelize["cdr-db"].QueryTypes.SELECT,
                replacements: {
                    start_time: startTime,
                    end_time: endTime,
                }
            })
            .then((sip_codes) => {
                res.send({
                    success: true,
                    status: 200,
                    data: sip_codes,
                });
            })
            .catch((err) => {
                _this.sendResponseError(res, [], err);
            });
    }

    exportCSV(req, res, next) {
        let params = req.body;
        if (params.total < 1) {
            return res.send({
                success: false,
                status: 403,
                message: "You have to select cdrs"
            })
        }
        if (params.total > 10000) {
            return res.send({
                success: false,
                status: 403,
                message: "Total CDRS must be less than 10K"
            })
        }
        this._getCdrsFunction(params,true).then(cdrs => {
            if (cdrs.success) {
                let schema = [
                    {
                        column: 'start time',
                        type: 'Date',
                        currentColumn: 'start_time',
                    },
                    {
                        column: 'end time',
                        type: 'Date',
                        currentColumn: 'end_time',
                    },
                    {
                        column: 'duration',
                        type: 'String',
                        currentColumn: 'durationsec',

                    },
                    {
                        column: 'direction',
                        type: 'String',
                        currentColumn: 'calldirection',
                    },
                    {
                        column: 'account',
                        type: 'String',
                        currentColumn: 'account',

                    },
                    {
                        column: 'src user',
                        type: 'String',
                        currentColumn: 'src_user',
                    }, {
                        column: 'dst user',
                        type: 'String',
                        currentColumn: 'dst_user',

                    }, {
                        column: 'sip code',
                        type: 'String',
                        currentColumn: 'sip_code',

                    }, {
                        column: 'sip reason',
                        type: 'String',
                        currentColumn: 'sip_reason',

                    },
                    {
                        column: 'context',
                        type: 'String',
                        currentColumn: 'context',

                    },

                    {
                        column: 'call ID',
                        type: 'String',
                        currentColumn: 'callid',

                    },
                    {
                        column: 'Call Status',
                        type: 'String',
                        currentColumn: 'callstatus',

                    },
                    {
                        column: 'SIP From URI CallCenter',
                        type: 'String',
                        currentColumn: 'sipfromuri_callcenter',

                    },
                    {
                        column: 'Agent',
                        type: 'String',
                        currentColumn: 'agent_info',

                    },
                    {
                        column: 'Campaign ID',
                        type: 'String',
                        currentColumn: 'campaign_name',

                    }

                ]
                const Sc = ['Start Time', 'End Time', 'Duration (Sec)', 'Direction', 'Account', 'src user', 'dst user', 'sip code', 'sip reason', 'context', 'call ID', 'Call Status', 'SIP From URI CallCenter', 'Agent', 'Campaign Name']
                let DataCDRS = cdrs.data;
                let ResultArray = [Sc];
                let indexMapping = 0;
                DataCDRS.forEach(data_item => {
                    this.ReformatOneFileCSV(data_item, schema).then(dataFormat => {
                        if (indexMapping < DataCDRS.length - 1) {
                            indexMapping++;
                            ResultArray.push(dataFormat)
                        } else {
                            ResultArray.push(dataFormat);
                            res.send({
                                data: ResultArray,
                                success: true
                            })
                        }
                    }).catch(err => {
                        this.sendResponseError(res, ["Error.CannotGetCDRS"], 1, 403)
                    })
                })
            } else {
                res.send({
                    success: false
                })
            }

        }).catch(err => {
            this.sendResponseError(res, ["Error.CannotGetCDRS"], 1, 403)
        });
    }

    ReformatOneFileCSV(item, schema) {
        return new Promise((resolve, reject) => {
            let dataSchema = [];
            let idx = 0;
            schema.forEach(data => {
                if (data.currentColumn === 'account') {
                    dataSchema.push(item.account ? (item.account.company || '') + "(" + (item.account.first_name || '') + " " + (item.account.last_name || '') + ")" : (item.accountcode || ''))
                } else {
                    dataSchema.push(item[data.currentColumn]);

                }

                if (idx < schema.length - 1) {
                    idx++;
                } else {
                    if (dataSchema.length !== 0) {
                        dataSchema[0] = "\r\n" + dataSchema[0]
                    }
                    resolve(dataSchema)
                }
            })
        })
    }

}

module.exports = AccBo
