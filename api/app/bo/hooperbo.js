const {baseModelbo} = require("./basebo");
const db = require("../models");
const moment = require("moment-timezone");
const PromiseBB = require("bluebird");

class Hooperbo extends baseModelbo{
    constructor() {
        super('hoopers', 'id');
        this.baseModal = "hoopers";
        this.primaryKey = 'id';
    }
    _getListCallfile_ids(campaign_ids, listcallfile_ids, account_id){
        return new Promise((resolve,reject) => {
            if((!!!campaign_ids || (campaign_ids && campaign_ids.length === 0)) && (!!!listcallfile_ids || (listcallfile_ids && listcallfile_ids.length === 0))){
                this.db['campaigns'].findAll({where : {account_id : account_id, active : 'Y', status : 'Y'}}).then( campaigns => {
                    if (!!!campaigns) {
                        return resolve(null)
                    }
                    const CAMP_ids = campaigns.map(camp => camp.campaign_id)
                    this.db['listcallfiles'].findAll({where: {campaign_id: campaigns.map(camp => camp.campaign_id)}}).then( listcallfiles => {
                        if (!!!listcallfiles) {
                            return resolve(null)
                        }
                        let LCF_ids = listcallfiles.map(lcf => lcf.listcallfile_id)
                            return resolve(LCF_ids)
                    }).catch(err => {
                        return reject(err)
                    })
                }).catch(err => {
                    return reject(err)
                })
            }
            if(listcallfile_ids && listcallfile_ids.length !== 0){
                return resolve(listcallfile_ids)
            }else if(campaign_ids && campaign_ids.length !== 0){
                this.db['listcallfiles'].findAll({where : {campaign_id : campaign_ids}}).then(listcallfiles => {
                    if(!!!listcallfiles){
                        return resolve(null)
                    }
                    let LCF_ids = listcallfiles.map(lcf => lcf.listcallfile_id)
                    return resolve(LCF_ids)
                }).catch(err => {
                    return reject(err)
                })
            }

        })
    }
    findHooper (req, res, next){
        let params = req.body
        const filter = params.filter || null;
        const limit = parseInt(params.limit) > 0 ? params.limit : 1000;
        const page = params.page || 1;
        const sortBy = params.sortBy || 'id';
        let sortDir = params.sortDir || 'DESC';
        const offset = (limit * (page - 1));
        let {campaign_ids,
            account_id,
            listcallfile_ids} = filter;
        if(!!!account_id){
            return this.sendResponseError(res, ['AccountID_required'], 0, 403)
        }
        this._getListCallfile_ids(campaign_ids,listcallfile_ids,account_id).then(LCF_ids => {
            if(!!!LCF_ids || (LCF_ids && LCF_ids.length === 0)){
                return res.send({
                    status : 200,
                    success : false,
                    message : 'no-data-available'
                })
            }
            let SORTDIR = 'order by '+sortBy+' '+sortDir
            let sqlCount = `select count(*)
                            from hoopers
                            WHERE to_treat = 'N' AND listcallfile_id in (:listcallfile_id)`
            let sqlData = `select * from hoopers WHERE to_treat = 'N' AND listcallfile_id in (:listcallfile_id) SORTDIR LIMIT :limit OFFSET :offset`
            sqlData = sqlData.replace('SORTDIR',SORTDIR)
            db.sequelize['crm-app'].query(sqlCount, {
                type: db.sequelize['crm-app'].QueryTypes.SELECT,
                replacements: {
                    listcallfile_id : LCF_ids
                }
            }).then(countAll => {
                let pages = Math.ceil(parseInt(countAll[0].count) / params.limit);
                db.sequelize['crm-app'].query(sqlData, {
                    type: db.sequelize['crm-app'].QueryTypes.SELECT,
                    replacements: {
                        limit: limit,
                        offset: offset,
                        listcallfile_id : LCF_ids,
                        sortBy : sortBy,
                        sortDir : sortDir
                    }
                }).then(data => {
                    let resData = {
                        success: true,
                        status: 200,
                        data: data,
                        pages: pages,
                        countAll: countAll[0].count
                    }
                    return res.send(resData)
                }).catch(err => {
                    return this.sendResponseError(res, ['cannotGetHoopers ',err], 1, 403)
                })
            }).catch(err => {
                return this.sendResponseError(res, ['cannotCountHoopers ',err], 2, 403)
            })
        })


    }
}

module.exports=Hooperbo
