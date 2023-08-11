const {baseModelbo} = require("./basebo");
const db = require("../models");
const moment = require("moment-timezone");

class Reminderbo extends baseModelbo{
    constructor() {
        super('reminders', 'reminder_id');
        this.baseModal = "reminders";
        this.primaryKey = 'reminder_id';
    }

    findAllReminders(req,res,next){
        let params = req.body;
        const filter = params.filter || null;
        const limit = parseInt(params.limit) > 0 ? params.limit : 1000;
        const page = params.page || 1;
        const sortBy = params.sortBy;
        let sortDir = params.sortDir || 'DESC';
        const offset = (limit * (page - 1));
        let {startTime, endTime, account_id, agentIds,dateFrom,dateTo} = filter

        let sqlCount = `select count(*) FROM reminders as "Rem" LEFT OUTER JOIN "users" AS "user" ON "Rem"."agent_id" = "user"."user_id" LEFT OUTER JOIN "callfiles" AS "callfile" ON "Rem"."call_file_id" = "callfile"."callfile_id" 
                          WHERE "user".active = 'Y' and "Rem".active = 'Y' and "callfile".active = 'Y' and "Rem".time is not NULL and "Rem".date is not NULL and "Rem".time != '' and "Rem".date != '' WHEREQUERYCOUNT`

        let sqlQuery = `select "Rem".note , "Rem".agent_id, "Rem".reminder_id,"Rem".call_file_id,
                        CONCAT("Rem".date, ' ',"Rem".time) as date_time,
                        CONCAT("user".first_name, ' ',"user".last_name) as agent,
                        CONCAT("callfile".first_name,' ',"callfile".last_name,' (',"callfile".phone_number,' )') as callfile,
                        AGE(CAST(CONCAT("Rem".date, ' ',"Rem".time) as timestamptz),NOW() + interval '1 hour') as diff_dateTime
                          FROM reminders as "Rem" LEFT OUTER JOIN "users" AS "user" ON "Rem"."agent_id" = "user"."user_id" LEFT OUTER JOIN "callfiles" AS "callfile" ON "Rem"."call_file_id" = "callfile"."callfile_id" 
                          WHERE "user".active = 'Y' and "Rem".active = 'Y' and "callfile".active = 'Y' and "Rem".time is not NULL and "Rem".date is not NULL and "Rem".time != '' and "Rem".date != '' WHEREQUERY`;

        let whereQuery = '';
        let whereQueryCount = '';
        if(account_id){
            whereQuery += ' AND "user".account_id = :account_id';
            whereQueryCount += ' AND "user".account_id = :account_id';
        }
        if(agentIds && agentIds.length !== 0){
            whereQuery += ' AND "Rem".agent_id in (:agentIds)';
            whereQueryCount += ' AND "Rem".agent_id in (:agentIds)';
        }
        if (startTime && dateFrom && startTime !== '' && dateFrom !== '') {
            whereQuery += ' AND CAST(CONCAT("Rem".date, \' \',"Rem".time) as timestamptz) >= :start_time';
            whereQueryCount += ' AND CAST(CONCAT("Rem".date, \' \',"Rem".time) as timestamptz) >= :start_time';
        }
        if (endTime && dateTo && endTime !== '' && dateTo !== '') {
            whereQuery += ' AND CAST(CONCAT("Rem".date, \' \',"Rem".time) as timestamptz) <= :end_time';
            whereQueryCount += ' AND CAST(CONCAT("Rem".date, \' \',"Rem".time) as timestamptz) <= :end_time';
        }

        if(sortBy){
            whereQuery += ' order by :SORT_BY '+sortDir
        }else{
            whereQuery += ' order by CAST(CONCAT("Rem".date, \' \',"Rem".time) as timestamptz) '+sortDir
        }
        whereQuery += ' LIMIT :limit OFFSET :offset'
        sqlCount = sqlCount.replace('WHEREQUERYCOUNT', whereQueryCount);
        sqlQuery = sqlQuery.replace('WHEREQUERY', whereQuery);

        db.sequelize["crm-app"]
            .query(sqlCount, {
                type: db.sequelize["crm-app"].QueryTypes.SELECT,
                replacements: {
                    start_time: moment(dateFrom).format('YYYY-MM-DD').concat(' ', startTime),
                    end_time: moment(dateTo).format('YYYY-MM-DD').concat(' ', endTime),
                    agentIds: agentIds,
                    account_id: account_id,
                    SORT_BY: sortBy
                }
            }).then(resDataCount => {
            let pages = Math.ceil(resDataCount[0].count / limit);
            db.sequelize["crm-app"]
                .query(sqlQuery, {
                    type: db.sequelize["crm-app"].QueryTypes.SELECT,
                    replacements: {
                        limit: limit,
                        offset: offset,
                        start_time: moment(dateFrom).format('YYYY-MM-DD').concat(' ', startTime),
                        end_time: moment(dateTo).format('YYYY-MM-DD').concat(' ', endTime),
                        agentIds: agentIds,
                        account_id: account_id,
                        SORT_BY: sortBy,
                        SORT_DIR: sortDir
                    }
                }).then(resData => {
                res.send({
                    success: true,
                    status: 200,
                    data: resData,
                    pages: pages,
                    countAll: resDataCount[0].count
                })
            }).catch(err => {
                return this.sendResponseError(res, ['Error.CannotCountReminders'], err)
            })
        }).catch(err => {
            console.log('err', err)
            return this.sendResponseError(res, ['Error.CannotGetReminders'], err)
        })
    }
}

module.exports = Reminderbo
