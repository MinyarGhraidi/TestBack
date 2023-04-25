const {baseModelbo} = require('./basebo');
const db = require("../models");
const {default: axios} = require("axios");
const env = process.env.NODE_ENV || 'development';
const call_center_token = require(__dirname + '/../config/config.json')[env]["call_center_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')[env]["base_url_cc_kam"];
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};
const Op = require("sequelize/lib/operators");
const appSocket = new (require('../providers/AppSocket'))();
const dialer_token = require(__dirname + '/../config/config.json')[env]["dialer_token"];
const dialer_authorization = {
    headers: {Authorization: dialer_token}
}
const base_url_dailer = require(__dirname + '/../config/config.json')[env]["base_url_dailer"];

class domains extends baseModelbo {
    constructor() {
        super('domains', 'domain_id');
        this.baseModal = 'domains';
        this.primaryKey = 'domain_id'
    }

    saveDomain(req, res, next) {
        const formData = req.body;

        if (!formData.domain_name || !formData.description) {
            return this.sendResponseError(res, ['Error.EmptyFormData'], 0, 403);
        }

        axios
            .post(`${base_url_cc_kam}api/v1/domains`, formData, call_center_authorization).then((resp) => {
            let params = resp.data.result;
            const domain = db.domains.build();
            domain.domain_name = formData.domain_name;
            domain.description = formData.description;
            domain.params = params;
            domain.esl_server_id = formData.server_id
            domain.save().then(domainSaved => {
                res.send({
                    success: true,
                    data: domainSaved,
                    message: 'Domain created with success!'
                });
            }).catch((error) => {
                this.deleteDomainByUUID(params.uuid).then(()=>{
                    return this.sendResponseError(res, ['Error.AnErrorHasOccurredSaveDomain',error], 1, 403);
                }).catch(()=> {
                    return this.sendResponseError(res, ['Error.AnErrorHasOccurredSaveDomain',error], 1, 403);
                })

            });
        }).catch((err) => {
            res.send({
                success: false,
                message: 'Failed Adding Domain'
            })
        })

    }

    updateDomain(req, res, next) {
        let data = req.body
        let domain_id = data.domain_id;
        delete data.domain_id;
        let idx = 0;
        if (!!!domain_id) {
            return this.sendResponseError(res, ['Error.Empty'], 1, 403);
        }
        this.db.domains.findOne({where: {domain_id: domain_id, active: 'Y'}})
            .then(result => {
                if (!!!result) {
                    return this.sendResponseError(res, ['Error.DomainIdNotFound'], 1, 403);
                }
                if (!!!result.dataValues.params) {
                    return this.sendResponseError(res, ['Error.TelcoNotFound'], 1, 403);
                }
                let {uuid} = result.dataValues.params;
                if (!!!uuid) {
                    return this.sendResponseError(res, ['Error.uuidNotFound'], 1, 403);
                }
                axios
                    .get(`${base_url_cc_kam}api/v1/domains/${uuid}`, call_center_authorization).then((resp) => {
                    let dataToUpdate = data;
                    dataToUpdate.updated_at = new Date();
                    if ("enabled" in data) {
                        dataToUpdate.status = data.enabled;
                    }
                    axios
                        .put(`${base_url_cc_kam}api/v1/domains/${uuid}`, dataToUpdate, call_center_authorization).then((resp) => {
                        dataToUpdate.params = resp.data.result;
                        this.db.domains.update(dataToUpdate, {
                            where: {
                                domain_id: domain_id,
                                active: 'Y'
                            }
                        }).then(() => {
                            this.db['accounts'].findOne({
                                where : {domain_id : domain_id, active : 'Y'}
                            }).then((acc)=> {
                                if(!!!acc){
                                     return res.send({
                                        success: true
                                    });
                                }
                                this.updateTrunkServer_uuid(acc.account_id, data.server_uuid, uuid).then(trunck=>{
                                    if(trunck.success){
                                        this.db['users'].findAll({ where : {
                                                account_id : acc.account_id,
                                                active : 'Y'
                                            }}).then((users)=>{
                                            if(users && users.length !== 0){
                                                users.forEach(user =>{
                                                    this.db.users.update({updated_at : new Date(), sip_device : {...user.sip_device, domain : data.domain_name}}, {where : {
                                                            user_id : user.user_id,
                                                            active : 'Y'
                                                        }}).then(()=>{
                                                        if(user.params.status !== 'logged-out'){
                                                            appSocket.emit('destroy_session', {user_id: user.user_id, logged_out: true})
                                                        }
                                                        if (idx < users.length - 1) {
                                                            idx++;
                                                        } else {
                                                            return res.send({
                                                                success: true
                                                            })
                                                        }
                                                    })
                                                })
                                            }else{
                                                return res.send({
                                                    success: true
                                                })
                                            }
                                        }).catch(err => {
                                            return this.sendResponseError(res, ['Error', err], 1, 403);
                                        })
                                    }else{
                                        return this.sendResponseError(res, ['Error update trunck'], 1, 403);
                                    }

                                }).catch(err => {
                                    return this.sendResponseError(res, ['Error', err], 1, 403);
                                })

                            }).catch((err)=> {
                                return this.sendResponseError(res, ['Error', err], 1, 403);
                            })
                        }).catch(err => {
                            return this.sendResponseError(res, ['Error', err], 1, 403);
                        })
                    }).catch((err) => {
                        res.send({
                            success: false,
                            message: err.response.data.errors
                        })
                    })

                }).catch((err) => {
                    return this.sendResponseError(res, ['Error.uuidNotFoundCannotUpdateDomain'], 1, 403);
                })
            }).catch(err => {
                res.status(500).json(err)
            }
        )
    }

    deleteDomain(req, res, next) {
        const {domain_id} = req.params;
        if (!!!domain_id) {
            return this.sendResponseError(res, ['Error.Empty'], 1, 403);
        }
        this.db.domains.findOne({where: {domain_id: domain_id, active: 'Y'}})
            .then(result => {
                if (!!!result) {
                    return this.sendResponseError(res, ['Error.DomainIdNotFound'], 1, 403);
                }
                if (!!!result.dataValues.params) {
                    return this.sendResponseError(res, ['Error.TelcoNotFound'], 1, 403);
                }
                let {uuid} = result.dataValues.params;
                if (!!!uuid) {
                    return this.sendResponseError(res, ['Error.uuidNotFound'], 1, 403);
                }
                axios
                    .delete(`${base_url_cc_kam}api/v1/domains/${uuid}`, call_center_authorization).then((resp) => {
                    let toUpdate = {
                        updatedAt: new Date(),
                        active: 'N'
                    }
                    this.db.domains.update(toUpdate, {
                        where: {
                            domain_id: domain_id,
                            active: 'Y'
                        }
                    }).then(result => {
                        res.send({
                            success: true,
                            message: "Domain Deleted !"
                        })
                    }).catch(err => {
                        return this.sendResponseError(res, ['Error', err], 1, 403);
                    })
                }).catch((err) => {
                    return this.sendResponseError(res, ['Error.CannotDeleteTelco'], 1, 403);
                })
            }).catch((err) => {
            return this.sendResponseError(res, ['Error.DomainNotFound'], 1, 403);
        })
    }

    updateTrunkServer_uuid (account_id, server_uuid, domain_uuid){
        return new Promise((resolve, reject)=>{
            this.db['truncks'].findAll({
                where:{
                    account_id: account_id,
                    status: 'Y',
                    active: 'Y'
                }
            }).then(trunck=>{
                if(trunck && trunck.length){
                    let index = 0
                    trunck.forEach(item=>{
                        let uuid= item.dataValues.gateways.callCenter.uuid;
                        let dialer_uuid = item.dataValues.gateways.dialer.uuid
                        let trunk_kam = {
                            name: item.dataValues.name,
                            codec_prefs: item.dataValues.codec_prefs,
                            channels: item.dataValues.channels,
                            proxy: item.dataValues.proxy,
                            type: item.dataValues.type,
                            register: item.dataValues.register,
                            accountcode: item.dataValues.gateways.dialer.accountcode,
                            trunck_id: item.dataValues.trunck_id,
                            updated_at: item.dataValues.updated_at,
                            domain_uuid: domain_uuid,
                            server_uuid: server_uuid,
                            username: null,
                            password: null
                        }
                        let data_db =item.dataValues;
                        data_db.gateways.callCenter.server_uuid = server_uuid
                        axios
                            .put(`${base_url_cc_kam}api/v1/gateways/${uuid}`, trunk_kam, call_center_authorization)
                            .then((resp) => {
                                axios
                                    .put(`${base_url_dailer}api/v1/gateways/${dialer_uuid}`, trunk_kam, dialer_authorization)
                                    .then(dialer_obj => {
                                        this.db['truncks'].update(data_db, {where: {trunck_id: trunk_kam.trunck_id}})
                                            .then(trunk => {
                                                if(index< trunck.length -1){
                                                    index++
                                                }else{
                                                    resolve({
                                                        success: true
                                                    })
                                                }
                                            })
                                    })
                                    .catch(err=>{
                                        reject(err)
                                    })
                                    .catch(err=>{
                                        reject(err)
                                    })
                            })
                            .catch(err=>{
                                reject(err)
                            })
                    })

                }else{
                    resolve({
                        success: true
                    })
                }
            }).catch(err=>{
                reject(err)
            })
        })
    }
}

module.exports = domains;
