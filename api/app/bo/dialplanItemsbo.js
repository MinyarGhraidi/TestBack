const {baseModelbo} = require('./basebo');
const db = require("../models");

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

        if(agent.config && agent.config.cli === 'CLI FIX'){
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
                    cli: agent.config.value
                }
            }).then(result=>{
                if(result && result.length !== 0 ){
                    res.send({
                        success: true,
                        proxy: result[0].proxy,
                        cli: agent.config.value
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
                    cli: agent.config.value
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
                                did_group:agent.config.did_group_ids,
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
    }

}

module.exports = dialplanItemsbo;
