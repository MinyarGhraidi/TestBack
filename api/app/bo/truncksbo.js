const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
let db = require('../models');
const {default: axios} = require("axios");
const call_center_token = require(__dirname + '/../config/config.json')["call_center_token"];
const dialer_token = require(__dirname + '/../config/config.json')["dialer_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')["base_url_cc_kam"];
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};
const base_url_truncks = require(__dirname + '/../config/config.json')["base_url_truncks"];
const dialer_authorization = {
    headers: {Authorization: dialer_token}
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
            .then((kamailio_obj) => {
                let kamailio_uuid = kamailio_obj.data.result.uuid || null;
                axios
                    .post(`${base_url_truncks}api/v1/dialer/gateways`, trunk_kam, dialer_authorization)
                    .then(dialer_obj => {
                        let dialer_uuid = dialer_obj.data.result.uuid || null;
                        trunk_kam.gateways = {
                            kamailio: {uuid: kamailio_uuid},
                            dialer: {uuid: dialer_uuid}
                        };
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
        let uuid = req.body.uuid;
        let dialer_uuid = req.body.dialer_uuid;
        axios
            .put(`${base_url_cc_kam}api/v1/gateways/${uuid}`, trunk_kam, call_center_authorization)
            .then((resp) => {
                axios
                    .put(`${base_url_truncks}api/v1/dialer/gateways/${dialer_uuid}`, trunk_kam, dialer_authorization)
                    .then(dialer_obj => {
                        this.db['truncks'].update(trunk_kam, {where: {trunck_id: trunk_kam.trunck_id}})
                            .then(trunk => {
                                res.send({
                                    status: 200,
                                    message: "success",
                                    success: true,
                                    data: trunk
                                })
                            })
                    })
                    .catch(err => {
                        return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                    })
                    .catch(err => {
                        return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
                    })
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            });
    }

    deleteTrunkFunc(dialer_uuid, uuid, trunk_id) {
        return new Promise((resolve, reject) => {
            axios
                .delete(`${base_url_cc_kam}api/v1/gateways/${uuid}`, call_center_authorization)
                .then(resp => {
                    axios
                        .delete(`${base_url_truncks}api/v1/dialer/gateways/${dialer_uuid}`, dialer_authorization)
                        .then(resp => {
                            this.db['trunks'].update({active: 'N'}, {where: {trunk_id: trunk_id}})
                                .then(result => {
                                    resolve(true)
                                })
                                .catch((err) => {
                                    reject(err)
                                });
                        })
                        .catch((err) => {
                            reject(err)
                        });
                })
                .catch((err) => {
                    reject(err)
                });
        })
    }

    deleteTrunk(req, res, next) {
        let _this = this;
        let {uuid, trunk_id, dialer_uuid} = req.body;
        this.deleteTrunkFunc(dialer_uuid, uuid, trunk_id)
            .then(result => {
                res.send({
                    succes: 200,
                    message: "Trunk has been deleted with success"
                })
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            });
    }

}

module.exports = truncks;