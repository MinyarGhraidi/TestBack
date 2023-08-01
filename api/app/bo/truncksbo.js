const {baseModelbo} = require('./basebo');
const {default: axios} = require("axios");
const moment = require("moment/moment");
const env = process.env.NODE_ENV || 'development';
const call_center_token = require(__dirname + '/../config/config.json')[env]["call_center_token"];
const dialer_token = require(__dirname + '/../config/config.json')[env]["dialer_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')[env]["base_url_cc_kam"];
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};
const base_url_dailer = require(__dirname + '/../config/config.json')[env]["base_url_dailer"];
const dialer_authorization = {
    headers: {Authorization: dialer_token}
}

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

        let whereCondition = {};

        if (data_db.password && data_db.username) {
            whereCondition = {
                active: 'Y',
                status: 'Y',
                name: data_db.name
            }
        }

        if (!!!data_db.password) {
            whereCondition = {
                active: 'Y',
                status: 'Y',
                $or : [
                    {
                        proxy : data_db.proxy,
                    },
                    {
                        name : data_db.name
                    }
                ]
            }
        }

        this.db['truncks'].findOne({
            where: whereCondition
        }).then(trunck => {
            if (trunck) {
                if(!!!data_db.password){
                    return _this.sendResponseError(res, [' name/proxy already exists '], 0, 201)
                }else{
                    return _this.sendResponseError(res, ['name already exists '], 0, 201)
                }
            } else {
                axios
                    .post(`${base_url_cc_kam}api/v1/gateways`, trunk_kam, call_center_authorization)
                    .then((kamailio_obj) => {
                        let kamailio_uuid = kamailio_obj.data.result.uuid || null;
                        axios
                            .post(`${base_url_dailer}api/v1/dialer/gateways`, trunk_kam, dialer_authorization)
                            .then(dialer_obj => {
                                let dialer_uuid = dialer_obj.data.result.uuid || null;
                                data_db.gateways = {
                                    callCenter: kamailio_obj.data.result,
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
            where: {
                active: 'Y',
                status: 'Y',
                proxy: data_db.proxy
            }
        }).then(trunck => {
            if (trunck) {
                return _this.sendResponseError(res, ['proxy already exists '], 0, 201)
            } else {
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
                this._disactivateDialPlanByTrunckID(trunk_id,'N',true).then(() => {
                    res.send({
                        succes: 200,
                        message: "Trunk has been deleted with success"
                    })
                })
            })
            .catch((err) => {
                return _this.sendResponseError(res, ['Error, cannot delete trunk', err], 1, 403);
            });
    }
    _getAndUpdateStatusDialerTelco(type,status,uuid){
        return new Promise((resolve,reject) => {
            switch(type){
                case 'callCenter' :
                    axios
                        .get(`${base_url_cc_kam}api/v1/gateways/${uuid}`, call_center_authorization)
                        .then((gateway_cc_data) => {
                            let data_gateway = gateway_cc_data.data.result;
                            data_gateway.enabled = status
                            axios
                                .put(`${base_url_cc_kam}api/v1/gateways/${uuid}`,data_gateway, call_center_authorization)
                                .then((res_cc) => {
                                    return resolve(res_cc)
                                })
                                .catch((err) => {
                                    return reject(err)
                                });
                        })
                        .catch((err) => {
                            return reject(err)
                        });
                    break;
                case 'dialer' :
                    axios
                        .get(`${base_url_dailer}api/v1/dialer/gateways/${uuid}`, dialer_authorization)
                        .then((gateway_dialer_data) => {
                            let data_gateway = gateway_dialer_data.data.result;
                            data_gateway.enabled = status
                            axios
                                .put(`${base_url_dailer}api/v1/dialer/gateways/${uuid}`,data_gateway, dialer_authorization)
                                .then((res_dialer) => {
                                    return resolve(res_dialer)
                                })
                                .catch((err) => {
                                    return reject(err)
                                });
                        })
                        .catch((err) => {
                            return reject(err)
                        });
            }

        })
    }

    _disactivateDialPlanByTrunckID = (trunck_id, status, to_delete = false) => {
        return new Promise((resolve,reject) => {
            if(status === 'Y'){
                return resolve(true)
            }else{
                this.db['dialplan_items'].findAll({where : {trunck_id : trunck_id, active : 'Y'}}).then(dialplans => {
                    if(!!!dialplans){
                        return resolve(true)
                    }else{
                        const dialplan_item_ids = dialplans.map(c => c.dialplan_item_id);
                        let toUpdate = {
                            updated_at : moment(new Date()),
                            status : status
                        }
                        if(to_delete){
                            toUpdate['trunck_id'] = null
                        }
                        this.db['dialplan_items'].update(toUpdate, { where : {dialplan_item_id : dialplan_item_ids}}).then(() => {
                            return resolve(true)
                        }).catch(err => {return reject(err)})
                    }
                }).catch(err => {return reject(err)})
            }
        })
    }
    changeStatusTrunk(req,res,next){
        let {trunck_id, status} = req.body
        if(!!!trunck_id){
            return this.sendResponseError(res, ['Error.AnErrorHasOccurredReqBody'], 0, 403);
        }
        this.db['truncks'].findOne({where : {trunck_id : trunck_id, active : 'Y'}}).then(trunck_data => {
            if(!!!trunck_data){
                return this.sendResponseError(res, ['Error.TrunckNotFound'], 1, 403);
            }
            let gateway_dialer = trunck_data.gateways.dialer.uuid
            let gateway_cc = trunck_data.gateways.callCenter.uuid
            this._getAndUpdateStatusDialerTelco('callCenter',status === 'Y',gateway_cc).then((data_cc) => {
                this._getAndUpdateStatusDialerTelco('dialer',status === 'Y',gateway_dialer).then((data_dialer) => {
                    let result_gateways = {
                        dialer :  data_dialer.data.result,
                        callCenter : data_cc.data.result
                    }
                    let toUpdate = {
                        status: status,
                        updated_at: moment(new Date()),
                        gateways : result_gateways
                    }
                    this.db['truncks'].update(toUpdate,{where : {trunck_id : trunck_id}}).then(() => {
                        this._disactivateDialPlanByTrunckID(trunck_id,status).then(() => {
                            return res.send({success : true, status : 200})
                        })
                    })
                }).catch(err => {
                    return this.sendResponseError(res, ['cannotUpdateDialerGateway', err], 2, 403)
                })
            }).catch(err => {
                return this.sendResponseError(res, ['cannotUpdateCallCenterGateway', err], 3, 403)
            })
        }).catch(err => {
            return this.sendResponseError(res, ['cannotGetTrunck', err], 4, 403)
        })
    }
}

module.exports = truncks;
