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

    _updateCall(body){
        return new Promise((resolve,reject)=>{
            const user_id = body.agent_id;
            const sql_agent =`select * from agent_log_events
                 where user_id = :user_id and active = 'Y' and action_name = 'in_call'
                     order by created_at DESC
                     limit 1`
            db.sequelize['crm-app'].query(sql_agent,{
                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                replacements: {
                    user_id: user_id
                }
            }).then(agent_event=>{
                if(agent_event && agent_event.length !== 0){
                    let dmt = moment(new Date()).tz('Europe/Paris').diff(moment(agent_event[0].start_at, "YYYY-MM-DD HH:mm:ss"), 'seconds') || 0
                    let dmc = moment((agent_event[0].finish_at || new Date()), "YYYY-MM-DD HH:mm:ss").diff(moment(agent_event[0].start_at, "YYYY-MM-DD HH:mm:ss"), 'seconds') || 0
                    let SETCondition = ""
                    let sql_call =`update calls_historys
                                 set revision_id = :revision_id ,
                                 dmt = :dmt ,
                                 dmc = :dmc ,
                                 note = :note SET_CONDITION
                                 where id = (select id from calls_historys
                                             where call_file_id =:call_file_id
                                             order by started_at DESC
                                             limit 1)`
                    if(body.call_status){
                        SETCondition += ', call_status = :call_status'
                    }
                    sql_call = sql_call.replace('SET_CONDITION', SETCondition)
                    db.sequelize['crm-app'].query(sql_call,{
                        type: db.sequelize['crm-app'].QueryTypes.SELECT,
                        replacements: {
                            call_file_id: body.call_file_id,
                            revision_id: body.revision_id || null,
                            note: body.note,
                            dmt: dmt,
                            dmc : dmc,
                            call_status: body.call_status
                        }
                    }).then(()=>{
                        this.db['hoopers'].destroy({
                            where: {
                                callfile_id: body.call_file_id,
                            }
                        }).then(() => {
                            resolve(true)
                        }).catch(err => {
                            reject(err)
                        })

                    }).catch(err => {
                        reject(err)
                    })

                }else{
                    resolve(false)
                }
            }).catch(err => {
                reject(err)
            })
        })
    }
    updateCall(req, res, next) {
        this._updateCall(req.body).then(data => {
            res.send(data)
        }).catch(err => {
            return this.sendResponseError(res, ['Error.cannotVerifyToken', err], 2, 403);
        })
    }
    playMedia(req, res, next) {
        let file_name = req.params.record_name
        let filePath = appDir + '/app/recordings/' + file_name + '.mp3'
        res.sendFile(filePath);
    }

}

module.exports = Callhistorybo
