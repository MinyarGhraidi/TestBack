const {baseModelbo} = require("./basebo");
const db = require("../models");
const moment = require("moment");

class Callhistorybo extends baseModelbo {
    constructor() {
        super('calls_historys', 'id');
        this.baseModal = "calls_historys";
        this.primaryKey = 'id';
    }

    updateCall(req, res, next) {
        const user_id = req.body.user_id;
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
                                 note = :note ,
                                 updated_at = :updated_at
                                 where id = (select id from calls_historys
                                             where call_file_id =:call_file_id
                                             order by started_at DESC
                                             limit 1)`
                db.sequelize['crm-app'].query(sql_call,{
                    type: db.sequelize['crm-app'].QueryTypes.SELECT,
                    replacements: {
                        call_file_id: req.body.call_file_id,
                        revision_id:req.body.revision_id,
                        note: req.body.note,
                        dmc: dmc,
                        dmt: dmt,
                        updated_at: new Date()
                    }
                }).then(call_history=>{
                    res.send({
                        success: true
                    })
                }).catch(err => {
                    return this.sendResponseError(res, ['Error.cannotVerifyToken', err], 1, 403);
                })

            }else{
                res.send({
                    success: false
                })
            }
        }).catch(err => {
            return this.sendResponseError(res, ['Error.cannotVerifyToken', err], 1, 403);
        })
    }


}

module.exports = Callhistorybo
