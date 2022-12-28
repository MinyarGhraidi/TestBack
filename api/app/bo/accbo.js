const {baseModelbo} = require("./basebo");
let db = require("../models");
const appHelper = require("../helpers/app");
const app_config = appHelper.appConfig;
const moment = require("moment-timezone");
const PromiseBB = require("bluebird");
const appSocket = new (require("../providers/AppSocket"))();
const amqp = require("amqplib/callback_api");
const path = require("path");
const rabbitmq_url = appHelper.rabbitmq_url;
const appDir = path.dirname(require.main.filename);

class AccBo extends baseModelbo {
    constructor() {
        super("acc", "id");
        this.baseModal = "acc";
        this.primaryKey = "id"
    }

    _getCdrsFunction(params){
        return new Promise((resolve,reject)=>{
            const filter = params.filter || null;
            const limit = parseInt(params.limit) > 0 ? params.limit : 1000;
            const page = params.page || 1;
            const offset = (limit * (page - 1));
            let {date, directions, startTime, endTime, sipCode, reasonCode,ip, from, to, account_code} = filter;
            let sqlCount = `select FILTER
                            from acc_cdrs
                            WHERE SUBSTRING("custom_vars", 0 , POSITION(':' in "custom_vars") ) = :account_code
                 EXTRA_WHERE`
            let sqlData = sqlCount;
            let filter_count = ' count(*) ';
            let extra_where_count = '';
            if (startTime && startTime !== '') {
                extra_where_count += ' AND start_time >= :start_time';
            }
            if (endTime && endTime !== '') {
                extra_where_count += ' AND end_time <=  :end_time';
            }
            if (sipCode && sipCode !== '') {
                extra_where_count += ' AND sip_code = :sip_code';
            }
            if (reasonCode && reasonCode !== '') {
                extra_where_count += ' AND sip_reason = :sip_reason';
            }
            if (directions && directions.length !== 0) {
                extra_where_count += ' AND calldirection in (:directions)';
            }
            if (ip && ip !== '') {
                extra_where_count += ' AND src_ip like :src_ip';
            }
            if (from && from !== '') {
                extra_where_count += ` AND (call_events -> 0 ->> 'callerNumber')::text like :from`;
            }
            if (to && to !== '') {
                extra_where_count += ` AND (call_events -> 0 ->> 'destination')::text like :to `;
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
                    sip_code: sipCode,
                    sip_reason : reasonCode,
                    directions: directions,
                    account_code: account_code,
                    src_ip: ip ? ('%'+ip.concat('%')).toString() : null,
                    from: from ? ('%'+from.concat('%')).toString() : null,
                    to: to ? ('%'+to.concat('%')).toString() : null
                }
            }).then(countAll => {
                let pages = Math.ceil(countAll[0].count / params.limit);
                let extra_where_limit = extra_where_count+= ' LIMIT :limit'
                sqlData = sqlData.replace('EXTRA_WHERE', extra_where_limit);
                sqlData = sqlData.replace('FILTER', '*');

                db.sequelize['cdr-db'].query(sqlData, {
                    type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                    replacements: {
                        limit: limit,
                        offset: offset,
                        start_time: moment(date).format('YYYY-MM-DD').concat(' ', startTime),
                        end_time: moment(date).format('YYYY-MM-DD').concat(' ', endTime),
                        sip_code: sipCode,
                        sip_reason : reasonCode,
                        directions: directions,
                        account_code: account_code,
                        src_ip: ip ? ('%'+ip.concat('%')).toString() : null,
                        from: from ? ('%'+from.concat('%')).toString() : null,
                        to: to ? ('%'+to.concat('%')).toString() : null
                    }
                }).then(data => {
                    this.db['accounts'].findAll({
                        where: {
                            active: 'Y'
                        }

                    }).then((accounts) => {
                        this.db['campaigns'].findAll({
                            where : {
                                active : 'Y',
                            }
                        }).then((campaigns)=>{
                            let cdrs_data = []
                            PromiseBB.each(data, item => {
                                    let account_data = accounts.filter(item_acc => item_acc.account_number === item.accountcode);
                                    let campaign_data = campaigns.filter(item_acc => item_acc.campaign_id === parseInt(item.campaignId));
                                    item.account_info = account_data[0] ? account_data[0].first_name + " " + account_data[0].last_name : null;
                                    item.account = account_data[0];
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
                }).catch(err => {
                    reject(err)
                })
            })
        })
    }
    getCdrs(req, res, next) {
        let _this = this;
        const params = req.body;
        _this._getCdrsFunction(params).then((result)=>{
            res.send(result);
        }).catch(err=>{
            return _this.sendResponseError(res,['Error.CannotGetCdrs'],1,403);
        })


    };

    pushDataToSocket(req, res, next) {
        let _this = this;
        const params = req.body;
        _this.pushItemsToQueue(params.pages, params).then((items) => {
            res.send({
                success: true,
                data: items,
            });
        }).catch(err => {
            _this.sendResponseError(res, [], err);
        })

    }

    DataEmitSocket(data, action, key, total, sessionId, totalItems, currentItems) {
        appSocket.emit('export.cdr', {
            data: data,
            action: action,
            currentItems: currentItems,
            total: total,
            current_page: key,
            sessionId: sessionId,
            totalItems: totalItems
        });
    };

    getSip_codes(req, res, next) {
        let _this = this;
        let sqlSipCode = `select distinct sip_code, sip_reason
                          from acc_cdrs
                          where sip_code notnull and sip_reason notnull and sip_code != '' and sip_reason != ''`;
        db.sequelize["cdr-db"]
            .query(sqlSipCode, {
                type: db.sequelize["cdr-db"].QueryTypes.SELECT,
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

    pushItemsToQueue = (pages, params) => {
        let _this = this;
        return new Promise((resolve, reject) => {
            params.time_export = new Date().getTime();
            if (pages !== 0) {
                amqp.connect(rabbitmq_url, function (error0, connection) {
                    if (error0) {
                        throw error0;
                    }
                    connection.createChannel(function (error1, channel) {
                        if (error1) {
                            throw error1;
                        }
                        const queue = app_config.rabbitmq.queues.exportCsv + params.sessionId;
                        channel.assertQueue(queue, {
                            durable: true,
                        });
                        _this.createItemsArray(pages).then((pages_array) => {
                            let index = 0;
                            PromiseBB.each(pages_array, (item) => {
                                params.page = item;
                                let data = {
                                    params: params,
                                    currentPage: item,
                                    pages: pages,
                                    sessionId: params.sessionId,
                                };
                                channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
                                    type: "export csv",
                                });
                            }).then((all_r) => {
                                resolve(all_r);
                            });
                        });
                    });
                });
            } else {
                reject(false);
            }
        });
    };
    createItemsArray = (total) => {
        return new Promise((resolve, reject) => {
            let _this = this;
            let array = [];
            let index = 0;
            for (let i = 1; i <= total; i++) {
                array.push(i);
                if (index < total - 1) {
                    index++;
                } else {
                    resolve(array);
                }
            }
        })
    }

    downloadCdr(req, res, next) {
        let file_name = req.params.filename;
        if (file_name && file_name !== 'undefined') {
            const file = appDir + '/app/resources/cdrs/' + file_name;
            res.download(file, function (err) {
                if (err) {
                    this.sendResponseError(res, [], err);
                }
            });
        } else {
            res.send({
                success: false,
                message: 'invalid file name'
            })
        }
    }
}

module.exports = AccBo
