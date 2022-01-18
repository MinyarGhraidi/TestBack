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
}

module.exports = pausestatus;