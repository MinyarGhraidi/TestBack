const {baseModelbo} = require("./basebo");
let db = require("../models");
const appHelper = require("../helpers/app");
const app_config = appHelper.appConfig;
const moment = require("moment-timezone");
const PromiseBB = require("bluebird");
const appSocket = new (require("../providers/AppSocket"))();

class AccBo extends baseModelbo{
    constructor() {
        super("acc", "id");
        this.baseModal = "acc";
        this.primaryKey = "id"
    }

    getCdrs(req, res, next) {
        let _this = this;
        const params = req.body;
        const filter = params.filter || null;
        const limit = parseInt(params.limit) > 0 ? params.limit : 1000;
        const page = params.page || 1;
        const offset = (limit * (page - 1));
        let current_Date = moment(new Date()).tz(app_config.TZ).format('YYYYMMDD');

        let currentDate = moment(new Date()).tz(app_config.TZ).format('YYYY-MM-DD');
        let {start_time, end_time, sip_code, directions, accounts_code, ip, from, to, sip_reason} = params.filter;
        console.log('start_time', start_time)
        if (filter.date !== current_Date) {
            let sqlCount = `select count(*)
                            from cdrs_:date
                            WHERE SUBSTRING("custom_vars", 0 , POSITION(':' in "custom_vars") ) = :accounts_code
                                EXTRA_WHERE`
            let extra_where_count = '';
            if (filter.start_time && filter.start_time !== '') {
                extra_where_count += ' AND start_time >= :start_time';
            }
            if (filter.end_time && filter.end_time !== '') {
                extra_where_count += ' AND end_time <=  :end_time';
            }
            if (filter.sip_code && filter.sip_code !== '' && filter.sip_code.length !== 0) {
                extra_where_count += ' AND sip_code in (:sip_code)';
            }
            if (filter && filter.sip_reason && filter.sip_reason !== '' && filter.sip_reason.length !== 0) {
                extra_where_count += ' AND sip_reason in (:sip_reason)';
            }
            if (filter.directions && filter.directions !== '' && filter.directions.length !== 0) {
                extra_where_count += ' AND direction in (:directions)';
            }
            if (filter.ip && filter.ip !== '') {
                extra_where_count += ' AND src_ip in like :src_ip';
            }
            if (filter && filter.from && filter.from !== '') {
                extra_where_count += ` AND TRIM(LEADING '+' FROM src_user_hmr) like :from`;
            }
            if (filter && filter.to && filter.to !== '') {
                extra_where_count += ` AND TRIM(LEADING '+' FROM dst_user_hmr)   like :to `;
            }
            if (filter && filter.gateway_numbers && filter.gateway_numbers !== '' && filter.gateway_numbers.length !== 0) {
                extra_where_count += " and sip_gateway in (:gateway_numbers) ";
            }
            sqlCount = sqlCount.replace('EXTRA_WHERE', extra_where_count);
            db.sequelize['cdr-db'].query(sqlCount, {
                type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                replacements: {
                    date: parseInt(filter.date),
                    start_time: filter.start_time,
                    end_time: filter.end_time,
                    // sip_code: filter.sip_code,
                    // sip_reason: filter.sip_reason,
                    // directions: filter.directions,
                    accounts_code: filter.accounts_code,
                    // accounts_code: filter.accounts_code,
                    // src_ip: filter.ip ? (filter.ip.concat('%')).toString() : null,
                    // from: from ? (from.concat('%')).toString() : null,
                    // to: to ? (to.concat('%')).toString() : null,
                    // gateway_numbers: filter.gateway_numbers
                }
            }).then(countAll => {
                let pages = Math.ceil(countAll[0].count / params.limit);
                let sql = `select *
                           from cdrs_:date
                           WHERE id >= ( select id from cdrs_:date WHERE SUBSTRING("custom_vars", 0 , POSITION(':' in "custom_vars") ) = :accounts_code
                               EXTRA_WHERE
                               LIMIT 1
                               OFFSET :offset
                               )
                               EXTRA_WHERE-PARAMS
                               LIMIT :limit`
                let extra_where = '';
                if (filter && filter.start_time && filter.start_time !== '') {
                    extra_where += ' AND start_time >= :start_time';
                }
                if (filter && filter.end_time && filter.end_time !== '') {
                    extra_where += ' AND end_time <=  :end_time';
                }
                if (filter && filter.sip_code && filter.sip_code !== '' && filter.sip_code.length !== 0) {
                    extra_where += ' AND sip_code in (:sip_code)';
                }
                if (filter && filter.sip_reason && filter.sip_reason !== '' && filter.sip_reason.length !== 0) {
                    extra_where += ' AND sip_reason in (:sip_reason)';
                }
                if (filter && filter.directions && filter.directions !== '' && filter.directions.length !== 0) {
                    extra_where += ' AND direction in (:directions)';
                }
                if (filter && filter.ip && filter.ip !== '') {
                    extra_where += ' AND src_ip like :src_ip';
                }
                if (filter && filter.from && filter.from !== '') {
                    extra_where += ` AND TRIM(LEADING '+' FROM src_user_hmr) like :from`;
                }
                if (filter && filter.to && filter.to !== '') {
                    extra_where += ` AND TRIM(LEADING '+' FROM dst_user_hmr)   like :to `;
                }
                if (filter && filter.gateway_numbers && filter.gateway_numbers !== '' && filter.gateway_numbers.length !== 0) {
                    extra_where += " and sip_gateway in (:gateway_numbers) ";
                }
                sql = sql.replace('EXTRA_WHERE', extra_where);
                sql = sql.replace('EXTRA_WHERE-PARAMS', extra_where);
                db.sequelize['cdr-db'].query(sql, {
                    type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                    replacements: {
                        date: parseInt(filter.date),
                        limit: limit,
                        offset: offset,
                        start_time: filter.start_time,
                        end_time: filter.end_time,
                        // sip_code: filter.sip_code,
                        // sip_reason: filter.sip_reason,
                        // directions: filter.directions,
                        accounts_code: filter.accounts_code,
                        // accounts_code: filter.accounts_code,
                        // src_ip: filter.ip ? (filter.ip.concat('%')).toString() : null,
                        // from: from ? (from.concat('%')).toString() : null,
                        // to: to ? (to.concat('%')).toString() : null,
                        // gateway_numbers: filter.gateway_numbers
                    }
                }).then(data => {
                    this.db['accounts'].findAll({
                        where: {
                            active: 'Y'
                        }

                    }).then((accounts) => {

                        let cdrs_data = []
                        PromiseBB.each(data, item => {
                            console.log('item', item)

                            let account_data = accounts.filter(item_acc => item_acc.account_number === item.accountcode);
                            item.account_info = account_data[0] ? account_data[0].first_name + " " + account_data[0].last_name : null;
                            item.account = account_data[0];
                            cdrs_data.push(item);
                        }).then(cdr_data => {
                            console.log('cdr_data', cdr_data)
                            res.send({
                                success: true,
                                status: 200,
                                data: cdrs_data,
                                pages: pages,
                                countAll: countAll[0].count
                            })
                            // this.db['gateways'].findAll({
                            //     where: {
                            //         active: 'Y'
                            //     }
                            //
                            // }).then((gateways) => {
                            //     let cdr_data_details = []
                            //     PromiseBB.each(cdr_data, item_cdr => {
                            //         let ga_data = gateways.filter(item_ga => parseInt(item_ga.gateway_number) === parseInt(item_cdr.sip_gateway));
                            //         item_cdr.sip_gateway = ga_data && ga_data.length !== 0 ? ga_data[0].name : null;
                            //         cdr_data_details.push(item_cdr);
                            //     }).then(cdrs_data_details => {
                            //         res.send({
                            //             success: true,
                            //             status: 200,
                            //             data: cdrs_data_details,
                            //             pages: pages,
                            //             countAll: countAll[0].count
                            //         })
                            //     }).catch(err => {
                            //         _this.sendResponseError(res, [], err)
                            //     })
                            // }).catch(err => {
                            //     _this.sendResponseError(res, [], err)
                            // })
                        }).catch(err => {
                            console.log('err',err)
                            _this.sendResponseError(res, [], err)
                        })
                    }).catch(err => {
                        _this.sendResponseError(res, [], err)
                    })
                }).catch(err => {
                    _this.sendResponseError(res, [], err)
                })
            }).catch(err => {
                _this.sendResponseError(res, [], err)
            })
        } else {
            let sqlCount = `select count(*)
                            from acc_cdrs
                            WHERE SUBSTRING("custom_vars", 0 , POSITION(':' in "custom_vars") ) = :accounts_code
                 EXTRA_WHERE`
            let extra_where_countCurrenDate = '';
            if (filter.start_time && filter.start_time !== '') {
                extra_where_countCurrenDate += ' AND start_time >= :start_time';
            }
            if (filter.end_time && filter.end_time !== '') {
                extra_where_countCurrenDate += ' AND end_time <=  :end_time';
            }
            if (filter.sip_code && filter.sip_code !== '' && filter.sip_code.length !== 0) {
                extra_where_countCurrenDate += ' AND sip_code in (:sip_code)';
            }
            if (filter && filter.sip_reason && filter.sip_reason !== '' && filter.sip_reason.length !== 0) {
                extra_where_countCurrenDate += ' AND sip_reason in (:sip_reason)';
            }
            if (filter.directions && filter.directions !== '' && filter.directions.length !== 0) {
                extra_where_countCurrenDate += ' AND direction in (:directions)';
            }
            if (filter.ip && filter.ip !== '') {
                extra_where_countCurrenDate += ' AND src_ip like :src_ip';
            }
            if (filter && filter.from && filter.from !== '') {
                extra_where_countCurrenDate += ` AND TRIM(LEADING '+' FROM src_user_hmr) like :from`;
            }
            if (filter && filter.to && filter.to !== '') {
                extra_where_countCurrenDate += ` AND TRIM(LEADING '+' FROM dst_user_hmr)   like :to `;
            }
            if (filter && filter.gateway_numbers && filter.gateway_numbers !== '' && filter.gateway_numbers.length !== 0) {
                extra_where_countCurrenDate += " and sip_gateway in (:gateway_numbers) ";
            }
            sqlCount = sqlCount.replace('EXTRA_WHERE', extra_where_countCurrenDate);
            db.sequelize['cdr-db'].query(sqlCount, {
                type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                replacements: {
                    currentData: (currentDate.concat('%')).toString(),
                    limit: limit,
                    offset: offset,
                    start_time: filter.start_time,
                    end_time: filter.end_time,
                    // sip_code: sip_code,
                    // directions: directions,
                    accounts_code: filter.accounts_code,
                    // accounts_code: accounts_code,
                    // src_ip: filter.ip ? (filter.ip.concat('%')).toString() : null,
                    // from: from ? (from.concat('%')).toString() : null,
                    // to: to ? (to.concat('%')).toString() : null,
                    // gateway_numbers: filter.gateway_numbers
                }
            }).then(countAll => {
                let pages = Math.ceil(countAll[0].count / params.limit);
                let sqlData = `select *
                               from acc_cdrs
                               WHERE SUBSTRING("custom_vars", 0 , POSITION(':' in "custom_vars") ) = :accounts_code 
                  AND id >= ( select id  from acc_cdrs where 1=1 
                   EXTRA_WHERE
                    LIMIT 1
                   OFFSET :offset
                   )
                EXTRA_WHERE_PARAMS
                                   LIMIT :limit`
                let extra_where_currentDate = '';
                if (filter && filter.start_time && filter.start_time !== '') {
                    extra_where_currentDate += ' AND start_time >= :start_time';
                }
                if (filter && filter.end_time && filter.end_time !== '') {
                    extra_where_currentDate += ' AND end_time <=   :end_time';
                }
                if (filter && filter.sip_code && filter.sip_code !== '' && filter.sip_code.length !== 0) {
                    extra_where_currentDate += ' AND sip_code in (:sip_code)';
                }
                if (filter && filter.sip_reason && filter.sip_reason !== '' && filter.sip_reason.length !== 0) {
                    extra_where_currentDate += ' AND sip_reason in (:sip_reason)';
                }
                if (filter && filter.directions && filter.directions !== '' && filter.directions.length !== 0) {
                    extra_where_currentDate += ' AND direction in (:directions)';
                }
                if (filter && filter.ip && filter.ip !== '') {
                    extra_where_currentDate += ' AND src_ip like :src_ip';
                }
                if (filter && filter.from && filter.from !== '') {
                    extra_where_currentDate += ` AND TRIM(LEADING '+' FROM src_user_hmr) like :from`;
                }
                if (filter && filter.to && filter.to !== '') {
                    extra_where_currentDate += ` AND TRIM(LEADING '+' FROM dst_user_hmr)   like :to `;
                }
                if (filter && filter.gateway_numbers && filter.gateway_numbers !== '' && filter.gateway_numbers.length !== 0) {
                    extra_where_currentDate += " and sip_gateway in (:gateway_numbers) ";
                }
                sqlData = sqlData.replace('EXTRA_WHERE', extra_where_currentDate);
                sqlData = sqlData.replace('EXTRA_WHERE_PARAMS', extra_where_currentDate);
                db.sequelize['cdr-db'].query(sqlData, {
                    type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                    replacements: {
                        currentData: (currentDate.concat('%')).toString(),
                        limit: limit,
                        offset: offset,
                        start_time: filter.start_time,
                        end_time: filter.end_time,
                        // sip_code: sip_code,
                        // directions: directions,
                        accounts_code: filter.accounts_code,
                        // accounts_code: accounts_code,
                        // src_ip: filter.ip ? (filter.ip.concat('%')).toString() : null,
                        // from: from ? (from.concat('%')).toString() : null,
                        // to: to ? (to.concat('%')).toString() : null,
                        // gateway_numbers: filter.gateway_numbers
                    }
                }).then(dataCurrentDate => {
                    this.db['accounts'].findAll({
                        where: {
                            active: 'Y'
                        }

                    }).then((accounts) => {
                        let cdrs_data = []
                        PromiseBB.each(dataCurrentDate, item => {
                            let account_data = accounts.filter(item_acc => item_acc.account_number === item.accountcode);
                            item.account_info = account_data[0] ? account_data[0].first_name + " " + account_data[0].last_name : null;
                            item.account = account_data[0];
                            cdrs_data.push(item);
                        }).then(cdrs_data => {
                            res.send({
                                success: true,
                                status: 200,
                                data: cdrs_data,
                                pages: pages,
                                countAll: countAll[0].count
                            })
                            // this.db['gateways'].findAll({
                            //     where: {
                            //         active: 'Y'
                            //     }
                            //
                            // }).then((gateways) => {
                            //     let cdr_data_details = []
                            //     PromiseBB.each(cdrs_data, item_cdr => {
                            //         let ga_data = gateways.filter(item_ga => parseInt(item_ga.gateway_number) === parseInt(item_cdr.sip_gateway));
                            //         item_cdr.sip_gateway = ga_data && ga_data.length !== 0 ? ga_data[0].name : null;
                            //         cdr_data_details.push(item_cdr);
                            //     }).then(cdrs_data_details => {
                            //         res.send({
                            //             success: true,
                            //             status: 200,
                            //             data: cdrs_data_details,
                            //             pages: pages,
                            //             countAll: countAll[0].count
                            //         })
                            //     }).catch(err => {
                            //         _this.sendResponseError(res, [], err)
                            //     })
                            // }).catch(err => {
                            //     _this.sendResponseError(res, [], err)
                            // })
                        }).catch(err => {
                            _this.sendResponseError(res, [], err)
                        })
                    }).catch(err => {
                        _this.sendResponseError(res, [], err)
                    })
                }).catch(err => {
                    _this.sendResponseError(res, [], err)
                })
            })
        }

    };

    pushDataToSocket(req, res, next) {
        let _this = this;
        const params = req.body;
        _this.pushItemsToQueue(params.pages, params).then((items) => {
            res.send({
                success: true,
                data: items,
            });
        }).catch(err=>{
            console.log('err', err)
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
}

module.exports = AccBo
