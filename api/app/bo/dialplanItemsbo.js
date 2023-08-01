const {baseModelbo} = require('./basebo');
const db = require("../models");
const moment = require("moment");

class dialplanItemsbo extends baseModelbo {
    constructor() {
        super('dialplan_items', 'dialplan_item_id');
        this.baseModal = 'dialplan_items';
        this.primaryKey = 'dialplan_item_id';
    }

    getDialPlan (req, res, next){
        let phone = req.body.phone;
        let agent = req.body.agent;
        let account_id = req.body.account_id
        this.db['users'].findOne({
            where:{
                user_id: agent.user_id,
                status: 'Y',
                active: 'Y'
            }
        }).then(resultAgent=>{
            if(resultAgent && resultAgent.config){
                if( resultAgent.config.cli === 'CLI FIX'){
                    let sql = `select * 
                       from truncks tr
                       where tr.trunck_id = (select dialplan.trunck_id from dialplan_items dialplan
                                             where dialplan.active = 'Y' and dialplan.status = 'Y'
                                             and  :phone like concat (dialplan.prefix ,'%')  and :cli like concat(dialplan.pai , '%') and dialplan.account_id = :account_id)
                       and tr.account_id = :account_id and tr.active = 'Y' and tr.status = 'Y' `

                    db.sequelize['crm-app'].query(sql, {
                        type: db.sequelize['crm-app'].QueryTypes.SELECT,
                        replacements: {
                            phone:phone,
                            account_id : account_id,
                            cli: resultAgent.config.value
                        }
                    }).then(result=>{
                        if(result && result.length !== 0 ){
                            res.send({
                                success: true,
                                proxy: result[0].proxy,
                                cli: resultAgent.config.value
                            })
                        }else{
                            res.send({
                                success : false
                            })
                        }
                    }).catch(err => {
                        this.sendResponseError(res, ['Error.GetTrunck'], err)
                    })
                }else{
                    let sql = `select * from dialplan_items dialplan
                                             left join truncks tr On dialplan.trunck_id = tr.trunck_id
                                             where dialplan.active = 'Y' and dialplan.status = 'Y'
                                             and  :phone like concat (dialplan.prefix ,'%')  and dialplan.account_id = :account_id `

                    db.sequelize['crm-app'].query(sql, {
                        type: db.sequelize['crm-app'].QueryTypes.SELECT,
                        replacements: {
                            phone:phone,
                            account_id : account_id,
                            cli: resultAgent.config.value
                        }
                    }).then(dialplan=>{
                        if (dialplan && dialplan.length !== 0){
                            let index = 0
                            dialplan.forEach(item=>{
                                let sqlCli = `select did.number from dids did
                           where did.did_group_id in (:did_group) and did.active = 'Y' and did.status = 'Y' and did.number like :pai
                           ORDER BY RANDOM ( )
                            `

                                db.sequelize['crm-app'].query(sqlCli, {
                                    type: db.sequelize['crm-app'].QueryTypes.SELECT,
                                    replacements: {
                                        did_group:resultAgent.config.did_group_ids,
                                        pai: item.pai+'%'
                                    }
                                }).then(result=>{
                                    if( result && result.length !== 0){
                                        res.send({
                                            success: true,
                                            proxy: item.proxy,
                                            cli: result[0]
                                        })
                                    }else{
                                        if(index < dialplan.length -1){
                                            index++;
                                        }else{
                                            res.send({
                                                success : false
                                            })
                                        }
                                    }
                                }).catch(err=>{
                                    this.sendResponseError(res, ['Error.GetDiD'], err)
                                })
                            })
                        }else{
                            res.send({
                                success : false
                            })
                        }
                    }).catch(err=>{
                        this.sendResponseError(res, ['Error.GetDialplan'], err)
                    })
                }
            }else{
                this.sendResponseError(res, ['Error.NoConfigAgent'])
            }

        })


    }


    _changeStatus(dialplan_id, status){
        return new Promise((resolve,reject) => {
            if(status === 'N'){
                this.db['dialplan_items'].update({updated_at : moment(new Date()), status : status},{where : {dialplan_item_id : dialplan_id}}).then(() => {
                    return resolve({
                        success : true
                    })
                }).catch(err => {
                    return reject(err)
                })
            }else{
                this.db['dialplan_items'].findOne({where : {dialplan_item_id : dialplan_id, active : 'Y'}}).then(dialPlan => {
                    let trunck_id = dialPlan.trunck_id
                    if(!!!trunck_id){
                        return resolve({
                            success : false,
                            message : 'dialplan-without-trunck'
                        })
                    }else{
                        this.db['truncks'].findOne({where : {trunck_id : trunck_id, active : 'Y'}}).then(Trunck => {
                            if(!!!Trunck || Trunck.status === 'N'){
                                return resolve({
                                    success : false,
                                    message : 'trunck-not-active'
                                })
                            }else{
                                this.db['dialplan_items'].update({updated_at : moment(new Date()), status : status}, {where : {dialplan_item_id : dialplan_id}}).then(() => {
                                    return resolve({
                                        success : true
                                    })
                                }).catch(err => {
                                    return reject(err)
                                })
                            }
                        }).catch(err => {
                            return reject(err)
                        })
                    }
                }).catch(err => {
                    return reject(err)
                })
            }
        })
    }
    changeStatusDialPlan (req,res,next){
        let {dialplan_id, status} = req.body;
        if(!!!dialplan_id){
            return this.sendResponseError(res, ['Error.DialplanNotFound'], 0, 403);
        }
        this._changeStatus(dialplan_id, status).then(result => {
            return res.send({
                success : result.success,
                message : result.success ? 'updated ! ' : result.message,
                status : result.success ? 200 : 403
            })
        }).catch(err => {
            return this.sendResponseError(res, ['Error.cannotChangeStatusDialPlan',err], 1, 403);
        })

    }

}

module.exports = dialplanItemsbo;
