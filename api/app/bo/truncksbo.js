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
const base_url_dailer = require(__dirname + '/../config/config.json')["base_url_dailer"];
const dialer_authorization = {
    headers: {Authorization: dialer_token}
}
;const { Op } = require("sequelize");


class truncks extends baseModelbo {
    constructor() {
        super('truncks', 'trunck_id');
        this.baseModal = "truncks";
        this.primaryKey = 'trunck_id';
    }

    saveTrunk(req, res, next) {
        let _this = this;
        let trunk_kam = req.body.values;
        let data_db = req.body.db_values;
        this.db['truncks'].findOne({
            where:{
                active: 'Y',
                status: 'Y',
                proxy: data_db.proxy
            }
        }).then(trunck=>{
            if(trunck){
                return _this.sendResponseError(res, ['proxy already exists '], 0, 201)
            }else{
                axios
                    .post(`${base_url_cc_kam}api/v1/gateways`, trunk_kam, call_center_authorization)
                    .then((kamailio_obj) => {
                        let kamailio_uuid = kamailio_obj.data.result.uuid || null;
                        axios
                            .post(`${base_url_dailer}api/v1/dialer/gateways`, trunk_kam, dialer_authorization)
                            .then(dialer_obj => {
                                let dialer_uuid = dialer_obj.data.result.uuid || null;
                                data_db.gateways = {
                                    callCenter:  kamailio_obj.data.result,
                                    dialer: dialer_obj.data.result
                                };
                                let modalObj = this.db['truncks'].build(data_db);
                                modalObj.save()
                                    .then(trunk => {
                                            res.send({
                                                status: 200,
                                                message: "success",
                                                success: true,
                                                data: trunk
                                            })
                                    })
                                    .catch(err => {
                                        return _this.sendResponseError(res, ['cannot save trunk in DB', err], 1, 403);
                                    })
                            })
                            .catch(err => {
                                return _this.sendResponseError(res, ['error dialer', err], 1, 403);
                            })
                    })
                    .catch((err) => {
                        return _this.sendResponseError(res, ['Error kamailio', err], 1, 403);
                    });
            }
        }).catch((err) => {
            return _this.sendResponseError(res, ['Error Find trunk', err], 1, 403);
        });

    }

    updateTrunk(req, res, next) {
        let _this = this;
        let trunk_kam = req.body.values;
        let data_db = req.body.db_values;
        let uuid = req.body.uuid;
        let dialer_uuid = req.body.dialer_uuid;
        this.db['truncks'].findOne({
            where:{
                active: 'Y',
                status: 'Y',
                proxy: data_db.proxy
            }
        }).then(trunck=>{
            if(trunck){
                return _this.sendResponseError(res, ['proxy already exists '], 0, 201)
            }else{
                axios
                    .put(`${base_url_cc_kam}api/v1/gateways/${uuid}`, trunk_kam, call_center_authorization)
                    .then((resp) => {
                        axios
                            .put(`${base_url_dailer}api/v1/dialer/gateways/${dialer_uuid}`, trunk_kam, dialer_authorization)
                            .then(dialer_obj => {
                                this.db['truncks'].update(data_db, {where: {trunck_id: trunk_kam.trunck_id}})
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
                                return _this.sendResponseError(res, ['Error update trunk', err], 1, 403);
                            })
                            .catch(err => {
                                return _this.sendResponseError(res, ['Error dialer', err], 1, 403);
                            })
                    })
                    .catch((err) => {
                        return _this.sendResponseError(res, ['Error kamilio', err], 1, 403);
                    });
            }

        }).catch((err) => {
            return _this.sendResponseError(res, ['Error Find trunk', err], 1, 403);
        });

    }

    deleteTrunkFunc(dialer_uuid, callCenter_uuid, trunk_id) {

        return new Promise((resolve, reject) => {
            axios
                .delete(`${base_url_cc_kam}api/v1/gateways/${callCenter_uuid}`, call_center_authorization)
                .then(resp => {
                    axios
                        .delete(`${base_url_dailer}api/v1/dialer/gateways/${dialer_uuid}`, dialer_authorization)
                        .then(resp => {
                            this.db['truncks'].update({active: 'N'}, {where: {trunck_id: trunk_id}})
                                .then(result => {
                                    resolve(true);
                                })
                                .catch((err) => {
                                    reject(err);
                                });
                        })
                        .catch((err) => {
                            reject(err);
                        });
                })
                .catch((err) => {

                    reject(err);
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
                return _this.sendResponseError(res, ['Error, cannot delete trunk', err], 1, 403);
            });
    }

}

module.exports = truncks;
