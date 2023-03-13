const {baseModelbo} = require("./basebo");
const db = require("../models");
const moment = require("moment");
const path = require('path');
const Op = require("sequelize/lib/operators");
const appDir = path.dirname(require.main.filename);
class Callhistorybo extends baseModelbo {
    constructor() {
        super('calls_historys', 'id');
        this.baseModal = "calls_historys";
        this.primaryKey = 'id';
    }

    updateCall(req, res, next) {
        const user_id = req.body.agent_id;
        const sql_agent =`select * from agent_log_events
                 where user_id = :user_id and active = 'Y' and (action_name = 'in_call' 
                    or action_name = 'in_qualification')
                     order by created_at DESC
                     limit 2`
        db.sequelize['crm-app'].query(sql_agent,{
            type: db.sequelize['crm-app'].QueryTypes.SELECT,
            replacements: {
                user_id: user_id
            }
        }).then(agent_event=>{
            if(agent_event && agent_event.length !== 0){
                let dmt = 0;
                let dmc = 0;
                if(agent_event[0].action_name === 'in_qualification'){
                    dmt = moment(agent_event[0].finish_at, "YYYY-MM-DD HH:mm:ss").diff(moment(agent_event[1].start_at, "YYYY-MM-DD HH:mm:ss"), 'seconds');
                    dmc=moment(agent_event[1].finish_at, "YYYY-MM-DD HH:mm:ss").diff(moment(agent_event[1].start_at, "YYYY-MM-DD HH:mm:ss"), 'seconds');
                }else{
                    dmt = moment(agent_event[0].finish_at, "YYYY-MM-DD HH:mm:ss").diff(moment(agent_event[0].start_at, "YYYY-MM-DD HH:mm:ss"), 'seconds');
                    dmc=moment(agent_event[0].finish_at, "YYYY-MM-DD HH:mm:ss").diff(moment(agent_event[0].start_at, "YYYY-MM-DD HH:mm:ss"), 'seconds');
                }
                const sql_call =`update calls_historys
                                 set revision_id = :revision_id ,
                                 dmt = :dmt ,
                                 dmc = :dmc ,
                                 note = :note 
                                 where id = (select id from calls_historys
                                             where call_file_id =:call_file_id
                                             order by started_at DESC
                                             limit 1)`
                db.sequelize['crm-app'].query(sql_call,{
                    type: db.sequelize['crm-app'].QueryTypes.SELECT,
                    replacements: {
                        call_file_id: req.body.call_file_id,
                        revision_id: req.body.revision_id,
                        note: req.body.note,
                        dmc: dmc,
                        dmt: dmt}
                }).then(call_history=>{
                    res.send({
                        success: true
                    })
                }).catch(err => {
                    return this.sendResponseError(res, ['Error.cannotUpdateCallHistory', err], 1, 403);
                })

            }else{
                res.send({
                    success: false
                })
            }
        }).catch(err => {
            return this.sendResponseError(res, ['Error.cannotVerifyToken', err], 2, 403);
        })
    }

    updateCallHistory(data){
        return new Promise((resolve,reject)=>{
            const {call_file_id,revision_id,note,dmt,dmc} = data
            const sql_call =`update calls_historys
                                 set revision_id = :revision_id ,
                                 dmt = :dmt ,
                                 dmc = :dmc ,
                                 note = :note 
                                 where id = (select id from calls_historys
                                             where call_file_id =:call_file_id
                                             order by started_at DESC
                                             limit 1)`
            db.sequelize['crm-app'].query(sql_call,{
                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                replacements: {
                    call_file_id: call_file_id,
                    revision_id: revision_id,
                    note: note,
                    dmc: dmc,
                    dmt: dmt}
            }).then(()=>{
                resolve(true)
            }).catch(err => {
                reject(err)
            })
        })
    }
    updateCallFile(req,res,next){
        const {call_file_id, agent_id,revision_id, note} = req.body;
        let dmt = 0;
        let dmc = 0;
        this.db['agent_log_events'].findAll({
            where: {
                user_id: agent_id,
                active: 'Y',
                action_name: 'in_call'
            },
            order: [['agent_log_event_id', 'DESC']],
            limit : 1
        }).then((result)=>{
            if(result.length !== 0){
                let dataInCall = result[0];
                this.db['agent_log_events'].findAll({
                    where: {
                        user_id: agent_id,
                        active: 'Y',
                        action_name: 'in_qualification',
                        agent_log_event_id : {
                            [Op.gt] : dataInCall.agent_log_event_id
                        }
                    },
                    order: [['agent_log_event_id', 'DESC']],
                    limit : 1
                }).then((resultInQ)=>{
                   if(resultInQ.length !== 0){
                       let dataInQualification = resultInQ[0];
                       dmt = moment(dataInQualification.finish_at, "YYYY-MM-DD HH:mm:ss").diff(moment(dataInCall.start_at, "YYYY-MM-DD HH:mm:ss"), 'seconds');
                       dmc = moment(dataInCall.finish_at, "YYYY-MM-DD HH:mm:ss").diff(moment(dataInCall.start_at, "YYYY-MM-DD HH:mm:ss"), 'seconds');
                       this.updateCallHistory({call_file_id,revision_id,note,dmt,dmc}).then(()=>{
                           res.send({
                               success: true
                           })
                       }).catch(err =>{
                           return this.sendResponseError(res, ['Error.cannotUpdateCallHistory', err], 1, 403);
                       })
                   }else{
                       this.updateCallHistory({call_file_id,revision_id,note,dmt,dmc}).then(()=>{
                           res.send({
                               success: true
                           })
                       }).catch(err =>{
                           return this.sendResponseError(res, ['Error.cannotUpdateCallHistory', err], 2, 403);
                       })
                   }
                }).catch(err =>{
                    return this.sendResponseError(res, ['Error.cannotGetInQualification', err], 2, 403);
                })
            }else{
                this.updateCallHistory({call_file_id,revision_id,note,dmt,dmc}).then(()=>{
                    res.send({
                        success: true
                    })
                }).catch(err =>{
                    return this.sendResponseError(res, ['Error.cannotUpdateCallHistory', err], 3, 403);
                })
            }
        }).catch(err =>{
            return this.sendResponseError(res, ['Error.cannotGetInQualification', err], 2, 403);
        })
    }
    playMedia(req, res, next) {
        let file_name = req.params.record_name
        let filePath = appDir + '/app/recordings/' + file_name + '.mp3'
        res.sendFile(filePath);
    }

}

module.exports = Callhistorybo
