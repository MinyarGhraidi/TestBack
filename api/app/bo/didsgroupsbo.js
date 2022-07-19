const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');

class didsgroups extends baseModelbo {
    constructor() {
        super('didsgroups', 'did_id');
        this.baseModal = "didsgroups";
        this.primaryKey = 'did_id';
    }

    affectDidsGpToCamp(req, res, next) {
        let _this = this;
        let {camp_id , didsGp_ids} = req.body;
        this.db['didsgroups'].update({campaign_id: null}, {where: {campaign_id: camp_id}}).then(data => {
            this.db['didsgroups'].update({campaign_id: camp_id}, {where: {did_id: {in : didsGp_ids}}}).then(data => {
                res.send({
                    success: true,
                    status: 200,
                    data: [],
                    message: 'Did group affected with success'
                })
            }).catch(err => {
                _this.sendResponseError(res, ['Error.AffectDidGroupsCampaign', err, 403]);
            })
        }).catch(err => {
            _this.sendResponseError(res, ['Error.ResetDidGroupsCampaign', err, 403]);
        })

    }
}

module.exports = didsgroups;