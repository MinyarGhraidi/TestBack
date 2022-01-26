const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
const {default: axios} = require("axios");
const call_center_token = require(__dirname + '/../config/config.json')["call_center_token"];

const base_url_cc_kam = require(__dirname + '/../config/config.json')["base_url_cc_kam"];
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};

class truncks extends baseModelbo {
    constructor() {
        super('truncks', 'trunck_id');
        this.baseModal = "truncks";
        this.primaryKey = 'trunck_id';
    }

    saveTrunk(req, res, next) {
        let _this = this;
        let trunk_kam = req.body;
        axios
            .post(`${base_url_cc_kam}api/v1/gateways`, trunk_kam, call_center_authorization)
            .then((resp) => {
                let uuid = resp.data.result.uuid || null;
                trunk_kam.gateways = {uuid: uuid};
                let modalObj = this.db['truncks'].build(trunk_kam);
                modalObj.save()
                    .then(trunk => {
                        res.send({
                            status: 200,
                            message: "success",
                            success: true,
                            data: trunk_kam
                        })
                    })
                    .catch(err => {
                        return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                    })
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            });
    }

    updateTrunk(req, res, next) {
        let _this = this;
        let trunk_kam = req.body.values;
        let uuid = req.body.uuid
        axios
            .put(`${base_url_cc_kam}api/v1/gateways/${uuid}`, trunk_kam, call_center_authorization)
            .then((resp) => {
                this.db['truncks'].update(trunk_kam, {where: {trunck_id: trunk_kam.trunck_id}})
                    .then(trunk => {
                        res.send({
                            status: 200,
                            message: "success",
                            success: true,
                            data: trunk
                        })
                    })
                    .catch(err => {
                        return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                    })
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            });
    }

}

module.exports = truncks;