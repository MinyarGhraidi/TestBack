const db = require("../models");
const moment = require('moment-timezone');
const PromiseBB = require("bluebird");

class FunctionsManager {

    getCdrMq(params) {
        return new Promise((resolve, reject) => {
            let _this = this;
            const filter = params.filter || null;
            const limit = parseInt(params.limit) > 0 ? params.limit : 1000;
            const page = params.page || 1;
            const offset = (limit * (page - 1));
            let currentDate = moment(new Date()).format('YYYY-MM-DD');
            let {start_time, end_time, sip_code, directions, accounts_code, ip, from, to, sip_reason} = params.filter;
            if (filter.date !== moment(new Date()).format('YYYYMMDD')) {
                let sql = `select *
                           from cdrs_:date
                           WHERE SUBSTRING("custom_vars", 0 , POSITION(':' in "custom_vars") ) = :accounts_code
                               EXTRA_WHERE
                           ORDER BY start_time ASC
                               LIMIT :limit
                           OFFSET :offset
                `
                let extra_where = '';
                if (filter && filter.start_time && filter.start_time !== '') {
                    extra_where += ' AND start_time >= :start_time ';
                }
                if (filter && filter.end_time && filter.end_time !== '') {
                    extra_where += ' AND end_time <=  :end_time ';
                }
                if (filter && filter.sip_code && filter.sip_code !== '' && filter.sip_code.length !== 0) {
                    extra_where += ' AND sip_code in (:sip_code) ';
                }
                if (filter && filter.sip_reason && filter.sip_reason !== '' && filter.sip_reason.length !== 0) {
                    extra_where += ' AND sip_reason in (:sip_reason) ';
                }
                if (filter && filter.directions && filter.directions !== '' && filter.directions.length !== 0) {
                    extra_where += ' AND direction in (:directions) ';
                }
                if (filter && filter.ip && filter.ip !== '') {
                    extra_where += ' AND src_ip like :src_ip ';
                }
                if (filter && filter.from && filter.from !== '') {
                    extra_where += ' AND src_user like :from ';
                }
                if (filter && filter.to && filter.to !== '') {
                    extra_where += ' AND dst_user like :to ';
                }
                sql = sql.replace('EXTRA_WHERE', extra_where);
                sql = sql.replace('EXTRA_WHERE_PARAMS', extra_where);
                db.sequelize['cdr-db'].query(sql, {
                    type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                    replacements: {
                        date: parseInt(filter.date),
                        limit: limit,
                        offset: offset,
                        start_time: filter.start_time,
                        end_time: filter.end_time,
                        sip_code: filter.sip_code,
                        sip_reason: filter.sip_reason,
                        directions: filter.directions,
                        accounts_code: filter.accounts_code,
                        src_ip: filter.ip ? (filter.ip.concat('%')).toString() : null,
                        from: from ? (from.concat('%')).toString() : null,
                        to: to ? (to.concat('%')).toString() : null
                    }
                }).then(data => {
                    db['accounts'].findAll({
                        where: {
                            active: 'Y'
                        }
                    }).then((accounts) => {
                        let cdrs_data = []
                        PromiseBB.each(data, item => {
                            let account_data = accounts.filter(item_acc => item_acc.account_number === item.accountcode);
                            item.account_info = account_data[0] ? account_data[0].first_name + " " + account_data[0].last_name : null;
                            item.account = account_data[0];
                            cdrs_data.push(item);
                        }).then(cdrs_data => {
                            resolve({
                                success: true,
                                status: 200,
                                data: cdrs_data,
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
            } else {
                let sqlData = `select *
                               from acc_cdrs
                               WHERE init_time::text like :currentData 
                EXTRA_WHERE
                               ORDER BY start_time ASC
                                   LIMIT :limit
                               OFFSET :offset`

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
                if (filter && filter.accounts_code && filter.accounts_code !== '' && filter.accounts_code.length !== 0) {
                    extra_where_currentDate += ' AND accountcode in (:accounts_code)';
                }
                if (filter && filter.ip && filter.ip !== '') {
                    extra_where_currentDate += ' AND src_ip like :src_ip';
                }
                if (filter && filter.from && filter.from !== '') {
                    extra_where_currentDate += ' AND src_user like :from';
                }
                if (filter && filter.to && filter.to !== '') {
                    extra_where_currentDate += ' AND dst_user like :to';
                }
                sqlData = sqlData.replace('EXTRA_WHERE', extra_where_currentDate);
                sqlData = sqlData.replace('EXTRA_WHERE_PARAMS', extra_where_currentDate);
                db.sequelize['cdr-db'].query(sqlData, {
                    type: db.sequelize['cdr-db'].QueryTypes.SELECT,
                    replacements: {
                        currentData: (currentDate.concat('%')).toString(),
                        limit: limit,
                        offset: offset,
                        start_time: start_time,
                        sip_reason: sip_reason,
                        end_time: end_time,
                        sip_code: sip_code,
                        directions: directions,
                        accounts_code: accounts_code,
                        src_ip: filter.ip ? (filter.ip.concat('%')).toString() : null,
                        from: from ? (from.concat('%')).toString() : null,
                        to: to ? (to.concat('%')).toString() : null
                    }
                }).then(dataCurrentDate => {
                    db['accounts'].findAll({
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
                            resolve({
                                success: true,
                                status: 200,
                                data: cdrs_data,
                            })
                        }).catch(err => {
                            reject(err)
                        })
                    }).catch(err => {
                        reject(err)
                    })
                })
            }
        })
    };

}

module.exports = FunctionsManager
