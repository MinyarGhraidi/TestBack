const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
 
class pausestatus extends baseModelbo {
    constructor() {
        super('pausestatuses', 'pausestatus_id');
        this.baseModal = "pausestatuses";
        this.primaryKey = 'pausestatus_id';
    }

    alterFindById(entityData) {
        return new Promise((resolve, reject) => {
            resolve(entityData);
        });
    }

    setRequest(req) {
        this.request = req;
    }

    setResponse(res) {
        this.response = res;
    }

    findByCampaignId(req, res, next) {
        this.setRequest(req);
        this.setResponse(res);
        const entity_id = req.body.campaign_id;
                this.db[this.baseModal].findAll({
                    where: {
                        campaign_id: entity_id
                    }
                }).then(resFind => {
                    return this.alterFindById(resFind).then(data => {
                        res.json({
                            message: 'success',
                            data: data,
                            status: 1,
                        });
                    });
                })
            .catch(err =>
            res.status(500).json(err)
        )
    }

    findByCampIdsAndSystem(req, res, next){
        let {campIds} = req.body;
        let sqlFind = `
 SELECT PS.* , camp.campaign_name
FROM pausestatuses AS PS left join campaigns camp ON PS.campaign_id = camp.campaign_id
WHERE  ( EXTRAWHERE PS."isSystem" = 'Y') AND PS.active = 'Y' AND PS.status = 'Y'`
        let extraWhere = '';
        if(campIds && campIds.length !== 0){
            extraWhere += 'PS.campaign_id IN (:campIds) OR';
        }
        sqlFind = sqlFind.replace('EXTRAWHERE', extraWhere);
        db.sequelize['crm-app'].query(sqlFind, {
            type: db.sequelize['crm-app'].QueryTypes.SELECT,
            replacements: {
                campIds: campIds
            }
        }).then(data_stats => {
            res.send({
                success: true,
                data: data_stats,
                status: 200
            })
        }).catch(err => {
            return this.sendResponseError(res,['Error.cannotGetStatus',err],1,403)
        })
    }

}

module.exports = pausestatus;