const {baseModelbo} = require('./basebo');
const Op = require("sequelize/lib/operators");
let db = require('../models');
const jwt = require('jsonwebtoken');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];
const usersbo = require('./usersbo');
const agentsbo = require('../bo/agentsbo');
const campaignsbo = require('../bo/campaignbo');
const trunksbo = require('../bo/truncksbo');
const messageDao = require('../bo/messageDao');
const {default: axios} = require("axios");
let _usersbo = new usersbo();
let _agentsbo = new agentsbo();
let _campaignsbo = new campaignsbo();
let _trunksbo = new trunksbo();
let _messageDao = new messageDao();
const call_center_token = require(__dirname + '/../config/config.json')[env]["call_center_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')[env]["base_url_cc_kam"];
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};
const moment = require("moment");
const appSocket = new (require("../providers/AppSocket"))();


class accounts extends baseModelbo {
    constructor() {
        super('accounts', 'account_id');
        this.baseModal = 'accounts';
        this.primaryKey = 'account_id';
    }

    // -------------------> Change Status <-------------------
    changeStatus_dids(account_id, status) {
        let indexDid_group = 0;

        return new Promise((resolve, reject) => {
            this.db['didsgroups'].findAll({
                where: {
                    account_id: account_id,
                }
            }).then((didsList) => {
                if (!!!didsList.length !== 0) {
                    return resolve(true)
                }
                didsList.forEach(data => {
                    this.db["dids"].update({
                        status: status
                    }, {where: {did_group_id: data.did_id, active: 'Y'}})
                        .then(() => {
                            if (indexDid_group < didsList.length - 1) {
                                indexDid_group++;
                            } else {
                                resolve(true);
                            }
                        }).catch(err => {
                        return reject(err);
                    });
                });
            }).catch(err => {
                reject(err);
            });

        })
    }

    changeStatusUsersAndDestroySession(account_id, status) {
        let indexUser = 0;
        return new Promise((resolve, reject) => {
            this.db['users'].findAll({
                where: {
                    account_id: account_id,
                    active: 'Y'
                }
            }).then(users => {
                if (users && users.length !== 0) {
                    let updateTo = {}
                    if (status === 'Y') {
                        updateTo = {status: status, updated_at: moment(new Date())}
                    } else {
                        updateTo = {
                            status: status,
                            updated_at: moment(new Date()),
                            current_session_token: null,
                            channel_uuid: null
                        }
                    }
                    this.db["users"].update(updateTo, {
                        where: {
                            account_id: account_id,
                            active: 'Y'
                        }
                    })
                        .then(() => {
                                users.forEach(user => {
                                    if(status === 'N'){
                                        appSocket.emit('reload.Permission', {user_id: user.user_id});
                                    }
                                    this._changeStatusTelco(status,'agents',user.sip_device.uuid).then(dataAgentTelco => {
                                        this._changeStatusTelco(status,'subscribers',dataAgentTelco.subscriber_uuid).then(() => {
                                            if (indexUser < users.length - 1) {
                                                indexUser++;
                                            } else {
                                                return resolve(true);
                                            }
                                        }).catch(err => reject(err))
                                    }).catch(err => reject(err))
                                })
                        }).catch(err => {
                        return reject(err);
                    });

                } else {
                    return resolve(true)
                }
            })
        })
    }

    changeStatusForEntities(entities, account_id, status) {
        let indexEntities = 0;
        return new Promise((resolve, reject) => {
            entities.map(dbs => {
                this.db[dbs].update({status: status, updated_at: new Date()}, {
                    where: {
                        account_id: account_id,
                        active: 'Y'
                    }
                }).then(() => {
                    if (indexEntities < entities.length - 1) {
                        indexEntities++;
                    } else {
                        resolve(true);
                    }
                }).catch(err => {
                    reject(err);
                });


            });
        })
    }

    changeStatusCampaignQueueTelco(account_id,status){
        return new Promise((resolve,reject)=> {
            let idx = 0;
            this.db['campaigns'].find({where : {account_id : account_id , active  :'Y'}}).then(campaigns => {
                if(!!!campaigns || campaigns.length === 0){
                    return resolve(true)
                }
                campaigns.forEach(camp => {
                    this._changeStatusTelco(status,'queues',camp.params.queue.uuid).then(()=>{
                        if (idx < camp.length - 1) {
                            idx++
                        } else {
                            this.db['campaigns'].update({status : status, updated_at : moment(new Date())},{where: {account_id : account_id , active  :'Y'}}).then(()=> {
                                resolve(true)
                            }).catch(err => reject(err))
                        }
                    }).catch(err => reject(err))
                })
            }).catch(err => reject(err))
        })
    }
    changeStatusTrunkGatewayTelco(account_id,status){
        return new Promise((resolve,reject)=> {
            let idx = 0;
            this.db['truncks'].find({where : {account_id : account_id , active  :'Y'}}).then(truncks => {
                if(!!!truncks || truncks.length === 0){
                    return resolve(true)
                }
                truncks.forEach(trunck => {
                    this._changeStatusTelco(status,'gateways',trunck.gateways.callCenter.uuid).then(()=>{
                        if (idx < truncks.length - 1) {
                            idx++
                        } else {
                            this.db['truncks'].update({status : status, updated_at : moment(new Date())},{where: {account_id : account_id , active  :'Y'}}).then(()=> {
                                resolve(true)
                            }).catch(err => reject(err))
                        }
                    }).catch(err => reject(err))
                })
            }).catch(err => reject(err))
        })
    }
    changeStatus(account_id, status) {

        return new Promise((resolve, reject) => {
            const entities = [
                'didsgroups', 'roles', 'templates_list_call_files', 'dialplan_items', 'accounts'
            ]
            this.changeStatusCampaignQueueTelco(account_id,status).then(()=> {
                this.changeStatusTrunkGatewayTelco(account_id,status).then(()=> {
                    this.changeStatusForEntities(entities, account_id, status).then(() => {
                        this.changeStatus_dids(account_id, status).then(() => {
                            this.changeStatusUsersAndDestroySession(account_id, status).then(() => {
                                resolve(true);
                            }).catch(err => {
                                return reject(err)
                            })
                        }).catch(err => {
                            return reject(err);
                        });
                    }).catch(err => {
                        return reject(err);
                    });
                }).catch(err => {
                    return reject(err)
                })
            }).catch(err => {
                return reject(err)
            })




        })
    }

    changeStatusByIdAcc(req, res, next) {
        let {account_id, status} = req.body;
        if ((!!!account_id || !!!status)) {
            return this.sendResponseError(res, ['Error.RequestDataInvalid'], 0, 403);
        }
        if (status !== 'N' && status !== 'Y') {
            return this.sendResponseError(res, ['Error.StatusMustBe_Y_Or_N'], 0, 403);
        }
        this.db['accounts'].findOne({
            where: {
                account_id: account_id,
                active: 'Y'
            },
        }).then(account => {
            this.db['users'].findOne({
                where: {
                    user_id: account.dataValues.user_id
                }
            }).then((user) => {
                let {uuid} = user.dataValues.sip_device;
                axios
                    .get(`${base_url_cc_kam}api/v1/agents/${uuid}`, call_center_authorization).then((resp_agent) => {
                    let data_update = resp_agent.data.result;
                    data_update.enabled = status === 'Y';
                    data_update.updated_at = new Date();
                    axios
                        .put(`${base_url_cc_kam}api/v1/agents/${uuid}`, data_update, call_center_authorization).then((resp) => {
                        this.changeStatus(account_id, status).then(data => {
                            res.send({
                                status: 200,
                                message: "success",
                                success: true
                            })
                        }).catch((error) => {
                            return this.sendResponseError(res, ['Error.AnErrorHasOccurredChangeStatus', error], 1, 403);
                        });
                    }).catch((err) => {
                        return this.sendResponseError(res, ['Error.CannotUpdateTelcoAgent'], 0, 403);
                    })
                }).catch((err) => {
                    return this.sendResponseError(res, ['Error.CannotFindAgentTelco'], 0, 403);
                })
            }).catch((err) => {
                return this.sendResponseError(res, ['Error.CannotFindUser'], 0, 403);
            })
        }).catch((err) => {
            return this.sendResponseError(res, ['Error.CannotFindAccount'], 0, 403);
        })

    }


    // -------------------> Auth <-------------------------------
    getAccountByToken(req, res, next) {
        jwt.verify(req.headers.authorization.replace('Bearer ', ''), config.secret, (err, decodedToken) => {
            if (err) {
                res.send(err);
            } else {
                this.db['accounts'].findOne({
                    where: {
                        account_id: decodedToken.user_id
                    }
                }).then(user => {
                    res.send(user.dataValues);

                });
            }
        });
    }


    // ------------------> Add / Edit Account <---------------------
    AddEditAccount(req, res, next) {
        let _this = this
        let isChecked = req.body.isChecked
        let Default_dialer_options = req.body.Default_dialer_options;
        let camp_name = req.body.Campaign_name;
        let bulkNum = req.body.bulkNum;
        let agent_options = req.body.agent_options;
        let Default_queue_options = req.body.Default_queue_options;
        let role_crm = req.body.role_crm
        if (req.body.isChecked) {
            delete req.body.values.nbr_agents_account;
            delete req.body.values.Campaign_name
        }
        const isNotSuperAdmin = role_crm !== 'superadmin';
        let newAccount = req.body.values;

        let data_account = {
            account_code: newAccount.account_code,
            first_name: newAccount.first_name,
            last_name: newAccount.last_name,
            company: newAccount.company,
            adresse: newAccount.adresse,
            country: newAccount.country,
            city: newAccount.city,
            zip_code: newAccount.zip_code,
            tel: newAccount.tel,
            mobile: newAccount.mobile,
            email: newAccount.email,
            nbr_account: null,
            white_label: null,
            log: null,
            white_label_app_name: null,
            role_crm_id: newAccount.role_crm_id,
            lang: newAccount.lang,
            domain_id: isNotSuperAdmin ? newAccount.domain.value : null,
            web_domain: isNotSuperAdmin ? newAccount.web_domain : null,
            nb_agents: isNotSuperAdmin ? newAccount.nb_agents : null,
        }
        if (!!!newAccount
            || !!!newAccount.user
            || !!!newAccount.role_crm_id) {
            return _this.sendResponseError(res, 'Error.InvalidData');
        }
        let sip_device = isNotSuperAdmin ? JSON.parse(JSON.stringify(newAccount.user.sip_device)) : null;
        let domain = isNotSuperAdmin ? JSON.parse(JSON.stringify(newAccount.domain)) : {};

        let {password, options, status} = sip_device ? sip_device : {};
        let username = sip_device ? sip_device.username.username || sip_device.username : {};
        if (newAccount.account_id) {
            this.db['accounts'].findOne({
                where: {
                    account_id: newAccount.account_id,
                    active: 'Y'
                },
                include: [db.domains]
            }).then(account => {
                if (!!!account) {
                    return this.sendResponseError(res, ['Error.UserNotFound'], 1, 403);
                }
                this.db['accounts'].findOne({
                    where: {
                        web_domain: newAccount.web_domain,
                        active: 'Y',
                        status: 'Y',
                        account_id: {[Op.not]: newAccount.account_id}
                    }
                }).then((acc) => {
                    if (acc) {
                        return res.send({
                            success: false,
                            message: "web-domain-already-affected"
                        })
                    } else {
                        this.couldAffectDomain(domain).then((resultAffection) => {
                            if (resultAffection || account.dataValues.domain_id === domain.value) {
                                this.db['users'].findOne({
                                    where: {
                                        user_id: account.dataValues.user_id
                                    }
                                }).then((user) => {
                                    let userData = user.dataValues;
                                    let {username} = isNotSuperAdmin ? userData.sip_device : {};
                                    this.EditSubscriberAgent(username, newAccount, userData, isNotSuperAdmin).then(result_sub => {
                                        let update_account = newAccount;
                                        let resultAgent = isNotSuperAdmin ? result_sub.data.data.agent : {};
                                        update_account.updated_at = new Date();
                                        update_account.role_crm_id = newAccount.role_crm_id;
                                        update_account.domain_id = isNotSuperAdmin ? domain.value : null
                                        this.db['accounts'].update(update_account, {
                                            where: {
                                                account_id: newAccount.account_id
                                            },
                                            returning: true,
                                            plain: true
                                        }).then(() => {
                                            let update_user = newAccount.user;
                                            if (isNotSuperAdmin) {
                                                update_user.sip_device.uuid = isNotSuperAdmin ? resultAgent.uuid : '';
                                                update_user.sip_device.updated_at = isNotSuperAdmin ? resultAgent.updated_at : null;
                                            }
                                            update_user.account_id = newAccount.account_id;
                                            update_user.username = username
                                            _usersbo.saveUserFunction(update_user)
                                                .then(user => {
                                                    res.send({
                                                        status: 200,
                                                        message: 'success',
                                                        success: true,
                                                        data: user
                                                    })
                                                }).catch(() => {
                                                return _this.sendResponseError(res, ['Error.CannotUpdateUser'], 1, 403);
                                            })
                                        }).catch(() => {
                                            return _this.sendResponseError(res, ['Error.CannotUpdateAccount'], 1, 403);
                                        })
                                    }).catch(err => {
                                        return _this.sendResponseError(res, ['Error.CannotEditSubscriberAgent'], 1, 403);
                                    })
                                }).catch(() => {
                                    return _this.sendResponseError(res, ['Error.CannotFindUser'], 1, 403);
                                })
                            } else {
                                return _this.sendResponseError(res, ['Error.CannotAffectDomain'], 1, 403);
                            }
                        }).catch(() => {
                            return _this.sendResponseError(res, ['Error.CannotAffectDomain'], 1, 403);
                        })
                    }
                }).catch(() => {
                    return _this.sendResponseError(res, ['Error.CannotGetWebDomain'], 1, 403);
                })
            }).catch(() => {
                return _this.sendResponseError(res, ['Error.CannotFindAccount'], 1, 403);
            })
        } else {
            this.db['accounts'].findOne({
                where: {
                    web_domain: newAccount.web_domain,
                    active: 'Y',
                    status: 'Y'
                }
            }).then((account_fetch) => {
                if (account_fetch) {
                    return res.send({
                        success: false,
                        message: "web-domain-already-affected"
                    })
                } else {
                    this.couldAffectDomain(domain).then((resultAffection) => {
                        if (resultAffection) {
                            let data_subscriber = {
                                username: username,
                                domain_uuid: domain.uuid,
                                password,
                                domain: domain.label
                            }
                            this.AddSubscriberAgent(data_subscriber, newAccount, isNotSuperAdmin, options, status).then(result_sub => {
                                if (result_sub.success) {
                                    let modalObj = this.db['accounts'].build(data_account);
                                    modalObj.save().then(new_account => {
                                        if (new_account) {
                                            data_account.user = newAccount.user;
                                            data_account.user.account_id = new_account.dataValues.account_id;
                                            if (isNotSuperAdmin) {
                                                data_account.user.sip_device.username = username;
                                                data_account.user.sip_device.uuid = result_sub.data.uuid;
                                                data_account.user.sip_device.created_at = result_sub.data.created_at;
                                                data_account.user.sip_device.updated_at = result_sub.data.updated_at;
                                            }

                                            _usersbo.saveUserFunction(data_account.user).then(new_user => {
                                                this.db['accounts'].update({
                                                    user_id: new_user.user_id
                                                }, {
                                                    where: {
                                                        account_id: new_account.dataValues.account_id
                                                    },
                                                    returning: true,
                                                    plain: true
                                                }).then(update_account => {
                                                    if (isChecked) {
                                                        this.createCamp_Agent(Default_queue_options, Default_dialer_options, bulkNum, agent_options, camp_name, new_account, domain).then(result_camp_agent => {
                                                            if (result_camp_agent.success) {
                                                                res.send({
                                                                    status: 200,
                                                                    message: 'success',
                                                                    success: true,
                                                                    data: new_user
                                                                })
                                                            } else {
                                                                res.send({
                                                                    status: 200,
                                                                    message: 'fail-catch',
                                                                    success: false,
                                                                    messageError : result_camp_agent.message
                                                                })
                                                            }
                                                        })
                                                    } else {
                                                        res.send({
                                                            status: 200,
                                                            message: 'success',
                                                            success: true,
                                                            data: new_user
                                                        })
                                                    }

                                                }).catch(err => {
                                                    return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                                                })
                                            }).catch(err => {
                                                return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                                            })
                                        } else {
                                            return _this.sendResponseError(res, ['Error.AnErrorHasOccurredSaveAccount'], 1, 403);
                                        }
                                    }).catch(err => {
                                        this.deleteSubScriberOrAgentByUUID(result_sub.uuid_sub, result_sub.uuid_agent).then(() => {
                                            return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 3, 403);
                                        }).catch(err => {
                                            return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 3, 403);
                                        })
                                    })
                                } else {
                                    return _this.sendResponseError(res, ['Error.AddToTelco', result_sub.message], 1, 403);
                                }

                            })
                        } else {
                            res.send({
                                success: false,
                                message: "domain-already-affected"
                            })
                        }
                    }).catch((err) => {
                        res.send({
                            success: false,
                            messageError : err.response.data,
                            message: "fail-catch"
                        })
                    })
                }
            }).catch(() => {
                return _this.sendResponseError(res, ['Error.CannotGetWebDomain'], 1, 403);
            })


        }

    }


    //--------------------> Delete Account <--------------------------
    deleteEntitiesDbs(entities, account_id) {
        let indexEntities = 0;
        return new Promise((resolve, reject) => {
            entities.map(dbs => {
                this.db[dbs].update({active: 'N'}, {
                    where: {
                        account_id: account_id,
                        active: 'Y'
                    }
                }).then(() => {
                    if (indexEntities < entities.length - 1) {
                        indexEntities++;
                    } else {
                        resolve(true);
                    }
                }).catch(err => {
                    reject(err);
                });


            });
        })
    }

    deleteDids(account_id) {
        let indexDid_group = 0;

        return new Promise((resolve, reject) => {
            this.db['didsgroups'].findAll({
                where: {
                    account_id: account_id,
                }
            }).then((didsList) => {
                if (!!!didsList.length !== 0) {
                    return resolve(true)
                }
                didsList.forEach(data => {
                    this.db["dids"].update({
                        active: 'N'
                    }, {where: {did_group_id: data.did_id, active: 'Y'}})
                        .then(() => {
                            if (indexDid_group < didsList.length - 1) {
                                indexDid_group++;
                            } else {
                                resolve(true);
                            }
                        }).catch(err => {
                        return reject(err);
                    });
                });
            }).catch(err => {
                reject(err);
            });

        })
    }

    deleteCampaign(campaigns) {
        let index = 0;
        return new Promise((resolve, reject) => {
            if (campaigns && campaigns.length !== 0) {
                campaigns.forEach(campaign => {
                    let uuid = campaign.params.queue.uuid;
                    let campaign_id = campaign.campaign_id;
                    _campaignsbo.deleteCampaignFunc(uuid, campaign_id)
                        .then(() => {
                            if (index < campaigns.length - 1) {
                                index++;
                            } else {
                                resolve(true);
                            }
                        })
                        .catch(err => {
                            reject(err);
                        })
                })
            } else {
                resolve(true);
            }
        })
    }

    deleteTrunks(trunks) {
        let index = 0;
        return new Promise((resolve, reject) => {
            if (trunks && trunks.length !== 0) {
                trunks.forEach(trunk => {
                    let uuid_callCenter = trunk.gateways.callCenter.uuid;
                    let uuid_dialer = trunk.gateways.dialer.uuid;
                    let trunk_id = trunk.trunck_id;
                    _trunksbo.deleteTrunkFunc(uuid_dialer, uuid_callCenter, trunk_id)
                        .then(() => {
                            if (index < trunks.length - 1) {
                                index++;
                            } else {
                                resolve(true);
                            }
                        })
                        .catch(err => {
                            reject(err);
                        })
                })
            } else {
                resolve(true);
            }
        })
    }

    deleteAllRelativeTrunks(account_id) {
        return new Promise((resolve, reject) => {
            this.db['truncks'].findAll({
                where: {
                    account_id: account_id,
                    active: 'Y'
                }
            })
                .then((trunks) => {
                    this.deleteTrunks(trunks)
                        .then(resp => {
                            resolve(true);
                        })
                        .catch(err => {
                            reject(err);
                        })
                })
                .catch(err => {
                    reject(err);
                })
        })
    }

    deleteAllRelativeCampaigns(account_id) {
        return new Promise((resolve, reject) => {
            this.db['campaigns'].findAll({
                where: {
                    account_id: account_id,
                    active: 'Y'
                }
            })
                .then((campaigns) => {
                    this.deleteCampaign(campaigns)
                        .then(resp => {
                            resolve(true);
                        })
                        .catch(err => {
                            reject(err);
                        })
                })
                .catch(err => {
                    reject(err);
                })
        })
    }

    deleteAllAccountRelative(account_id) {
        return new Promise((resolve, reject) => {
            const entities = [
                'didsgroups', 'roles', 'templates_list_call_files', 'dialplan_items',
            ]
            this.deleteEntitiesDbs(entities, account_id).then(() => {
                this.deleteDids(account_id).then(() => {
                    resolve(true);
                }).catch((err) => {
                    reject(err);
                })
            }).catch((err) => {
                reject(err);
            })
        })

    }

    getAllUserIdsByAccountId(account_id) {
        return new Promise((resolve, reject) => {
            this.db['users'].findAll({
                include: [{
                    model: db.roles_crms,
                }], where: {account_id: account_id, active: 'Y'}
            }).then((result) => {

                let usersIds = [];
                result.map((user) => {
                    usersIds.push({user_id: user.dataValues.user_id, role_crm_value: user.dataValues.roles_crm.value});
                })
                resolve(usersIds);
            }).catch((err) => {
                reject(err);
            })
        })
    }

    deleteMultiUsers(users) {
        let index = 0;
        return new Promise((resolve, reject) => {
            if (users && users.length !== 0) {
                users.forEach(user => {
                    _agentsbo.deleteAgentWithSub(user.user_id, user.role_crm_value !== 'superadmin')
                        .then(() => {
                            if (index < users.length - 1) {
                                index++;
                            } else {
                                resolve(true);
                            }
                        })
                        .catch(err => {
                            reject(err);
                        })
                })
            } else {
                resolve(true);
            }
        })
    }

    deleteAccount(req, res, next) {
        let _this = this;
        let account_id = req.body.account_id;

        this.getAllUserIdsByAccountId(account_id).then((usersIds) => {
            this.deleteAllRelativeTrunks(account_id).then(() => {
                this.deleteAllRelativeCampaigns(account_id).then(() => {
                    this.deleteAllAccountRelative(account_id).then(() => {
                        _messageDao.deleteMessageCascade(usersIds).then(() => {
                            this.deleteMultiUsers(usersIds).then(() => {
                                this.db['accounts']
                                    .update({active: 'N', domain_id: null}, {where: {account_id: account_id}})
                                    .then(() => {
                                        res.send({
                                            status: 200,
                                            success: true
                                        })
                                    })
                                    .catch(err => {
                                        return _this.sendResponseError(res, ['Error.CannotDeleteAccountFromDB', err], 1, 403);
                                    })
                            }).catch((err) => {
                                return _this.sendResponseError(res, ['Error.CannotDeleteUsers', err], 1, 403);
                            })
                        }).catch(err => {
                            return _this.sendResponseError(res, ['Error.CannotDeleteMessages', err], 1, 403);
                        })
                    }).catch((err) => {
                        return _this.sendResponseError(res, ['Error.CannotDeleteEntities', err], 1, 403);
                    })
                }).catch((err) => {
                    return _this.sendResponseError(res, ['Error.CannotDeleteCampaigns', err], 1, 403);
                })
            }).catch((err) => {
                return _this.sendResponseError(res, ['Error.CannotDeleteTrunks', err], 1, 403);
            })
        }).catch((err) => {
            return _this.sendResponseError(res, ['Error.CannotGetUsersByAccount_id', err], 1, 403);
        });
    }


    //----------------------------> Affect Domain <-------------------
    getUnaffectedDomains() {
        return new Promise((resolve, reject) => {
            this.db.domains.findAll({
                where: {active: 'Y', status : 'Y'}
            }).then((domains) => {
                if (!!!domains) {
                    resolve({
                        success: true,
                        domains: []
                    });
                }
                this.db['accounts'].findAll({
                    where: {active: 'Y', status : 'Y', domain_id: {[Op.not]: null}}
                }).then((users) => {
                    if (!!!users) {
                        resolve({
                            success: true,
                            domains: domains
                        });
                    } else {
                        let domains_affected = [];
                        users.map((user) => {
                            domains_affected.push(user.dataValues.domain_id);
                        });
                        const domains_affectedSet = new Set(domains_affected);


                        const domains_not_affected = domains.filter(function deleteAffected(obj) {
                            return !domains_affectedSet.has(obj.domain_id)
                        });
                        resolve({
                            success: true,
                            domains: domains_not_affected
                        })
                    }
                }).catch((err) => {
                    reject(err)
                })

            }).catch((err) => {
                reject(err);
            })
        })
    }

    getAllUnaffectedDomains(req, res, next) {
        this.getUnaffectedDomains().then((result) => {
            if (result.success) {
                res.send({
                    status: 200,
                    data: result.domains
                });
            } else {
                return this.sendResponseError(res, 'Error.CannotGetDomains');
            }
        }).catch((err) => {
            return this.sendResponseError(res, 'Error.CannotGetDomains');
        })
    }

    couldAffectDomain(domain_id) {
        return new Promise((resolve, reject) => {
            if (Object.keys(domain_id).length !== 0) {
                this.getUnaffectedDomains().then((result) => {
                    if (result.success) {
                        if (result.domains && result.domains.length) {
                            let domains = result.domains;
                            const checkIdDomain = obj => obj.domain_id === domain_id.value;
                            if (domains.some(checkIdDomain)) {
                                resolve(true);
                            } else {
                                resolve(false);
                            }
                        } else {
                            resolve(false);
                        }
                    } else {
                        resolve(false);
                    }
                }).catch((err) => {
                    reject(err);
                })
            } else {
                resolve(true)
            }

        })
    }

    AffectAccountToDomain(req, res, next) {
        let {domain_id, account_id} = req.body;
        if (!!!domain_id || !!!account_id) {
            return this.sendResponseError(res, 'Error.InvalidData');
        }
        this.db['accounts'].findOne({
            where: {
                account_id: account_id,
                active: 'Y'
            }
        }).then(user => {
            if (!!!user) {
                return this.sendResponseError(res, ['Error.UserNotFound'], 1, 403);
            }
            if (user.dataValues.domain_id === domain_id) {
                res.send({
                    status: 200,
                    message: 'account updated !'
                });
            } else {
                this.couldAffectDomain(domain_id).then((result) => {
                    if (result) {
                        let dataToUpdate = {
                            domain_id: domain_id,
                            updated_at: new Date()
                        }
                        this.db['accounts'].update(dataToUpdate, {
                            where: {
                                account_id: account_id,
                                active: 'Y'
                            }
                        }).then((result) => {
                            res.send({
                                status: 200,
                                message: 'account updated !'
                            });
                        }).catch((err) => {
                            return this.sendResponseError(res, ['Cannot update Account', err], 1, 403);
                        })
                    } else {
                        return this.sendResponseError(res, ['Cannot affect domain to account'], 1, 403);
                    }
                })
            }

        }).catch((err) => {
            return this.sendResponseError(res, ['Error.UserNotFound'], 1, 403);
        })

    }

    saveCampaign(values) {
        return new Promise((resolve, reject) => {
            let {queue} = values.params;
            let params = values.params;
            _campaignsbo.generateUniqueUsernameFunction()
                .then(queueName => {
                    queue.name = queueName;
                    queue.domain_uuid = values.domain.uuid;
                    axios
                        .post(`${base_url_cc_kam}api/v1/queues`, queue, call_center_authorization)
                        .then((result) => {
                            let {uuid} = result.data.result;
                            queue.uuid = uuid;
                            params.queue = queue;
                            delete values.params;
                            values.params = params;
                            let modalObj = this.db['campaigns'].build(values);
                            modalObj.save()
                                .then((campaign) => {
                                    _campaignsbo.addDefaultStatus(campaign.campaign_id)
                                        .then(response => {
                                            resolve({
                                                status: 200,
                                                message: "success",
                                                data: campaign,
                                                success: true
                                            })
                                        })
                                        .catch(err => {
                                            reject(err)
                                        })
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

    addAgentBulk(values) {
        return new Promise((resolve, reject) => {
            let idx = 0;
            _agentsbo.bulkUserAgents(values.bulkNum, values.values.username, values.values, true).then((users) => {
                if (!users.success) {
                    resolve({
                        success: false,
                        status: 403,
                        message: users.message
                    })
                }
                let addAgent = new Promise((resolve, reject) => {
                    users.data.forEach((user) => {
                        user.domain["params"] = {}
                        user.domain.params.uuid = user.domain.uuid
                        _agentsbo.saveOneUserAgent(user, true)
                            .then(() => {
                                if (idx < users.length - 1) {
                                    idx++
                                } else {
                                    resolve({
                                        success: true,
                                        message: 'success'
                                    })
                                }
                            })
                            .catch(err => {
                                reject(err)
                            })
                    })
                })
                Promise.all([addAgent]).then(() => {
                    resolve({
                        success: true,
                        status: 200
                    })
                }).catch((err) => {
                    resolve({
                        success: false,
                        status: 403,
                        message: err
                    })
                })
            }).catch((err) => {
                reject(err)
            })
        })
    }

    generatenumber(length) {
        let result = '';
        let characters = '0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() *
                charactersLength));
        }
        return result;
    }

    createCamp_Agent(Default_queue_options, Default_dialer_options, bulkNum, agent_options, camp_name, new_account, domain) {
        return new Promise((resolve, reject) => {
            let dataCamp = {
                campaign_name: camp_name,
                campaign_description: camp_name,
                campaign_type: 'PREDICTIVE',
                account_id: new_account.dataValues.account_id,
                list_mix: Default_dialer_options.list_mix,
                list_order: Default_dialer_options.list_order,
                hopper: Default_dialer_options.hooper,
                dial_level: Default_dialer_options.dial_level,
                dialtimeout: Default_dialer_options.dialtimeout,
                params: {},
                domain: domain,
                updated_at: moment(new Date()),
                created_at: moment(new Date())
            }
            dataCamp.params.queue = Default_queue_options;
            dataCamp.params.queue.accountcode = new_account.dataValues.account_code;
            dataCamp.params.queue.greetings = [];
            dataCamp.params.queue.hold_music = [];
            dataCamp.params.queue.extension = this.generatenumber(12)
            this.saveCampaign(dataCamp).then(result_camp => {
                if (result_camp.success) {
                    this.db['roles_crms'].findOne({
                        where: {
                            value: 'agent',
                            active: 'Y'
                        }
                    }).then(role_agent => {
                        if (role_agent) {
                            let user = {
                                first_name: null,
                                last_name: "",
                                username: null,
                                campaign_id: null,
                                sip_device: {
                                    options: agent_options,
                                    status: 'logged-out',
                                    enabled: true,
                                    password: null,
                                    domain: domain.label,
                                    subscriber_id: 1,
                                    accountcode: new_account.dataValues.account_code,
                                    created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                                    updated_at: moment().format("YYYY-MM-DD HH:mm:ss")
                                },
                                domain: domain,
                                password_hash: null,
                                account_id: new_account.dataValues.account_id,
                                role_crm_id: role_agent.id,
                                params: {sales: [], status: 'logged-out', pass_web: null, did_gp: []},
                            };
                            let dataAgent = {
                                values: user,
                                accountcode: new_account.dataValues.account_code,
                                bulkNum: bulkNum,
                                account_id: new_account.dataValues.account_id
                            }
                            this.addAgentBulk(dataAgent).then(resultAgent => {
                                if (resultAgent.success) {
                                    resolve({
                                        status: 200,
                                        message: 'success',
                                        success: true,
                                        data: resultAgent
                                    })
                                } else {
                                    resolve({
                                        message: 'error to create agent',
                                        success: false,

                                    })
                                }

                            })
                        } else {
                            resolve({
                                status: 200,
                                message: 'error to get agent role',
                                success: false,
                            })
                        }
                    }).catch(err => {
                        reject(err)
                    })

                } else {
                    resolve({
                        status: 200,
                        message: 'error to create camp',
                        success: false,
                    })
                }
            })
        })
    }

    AddSubscriberAgent(data_subscriber, newAccount, isNotSuperAdmin, options, status) {
        return new Promise((resolve, reject) => {
            if (isNotSuperAdmin) {
                axios
                    .post(`${base_url_cc_kam}api/v1/subscribers`,
                        data_subscriber,
                        call_center_authorization)
                    .then((resp) => {
                        let result = resp.data.result;
                        let data_agent = {
                            name: newAccount.first_name + " " + newAccount.last_name,
                            domain_uuid: result.domain_uuid,
                            subscriber_uuid: result.uuid,
                            options,
                            status
                        };
                        axios
                            .post(`${base_url_cc_kam}api/v1/agents`, data_agent, call_center_authorization)
                            .then((resp) => {
                                let resultAgent = resp.data.result;
                                resolve({
                                    success: true,
                                    data: resultAgent,
                                    uuid_sub: result.uuid,
                                    uuid_agent: resultAgent.uuid
                                })
                            }).catch(err => {
                            this.deleteSubScriberOrAgentByUUID(result.uuid, null).then(() => {
                                resolve({
                                    success: false,
                                    message: err.response.data
                                })
                            }).catch(() => {
                                resolve({
                                    success: false,
                                    message: err.response.data
                                })
                            })
                        })
                    }).catch((err) => {
                    resolve({
                        success: false,
                        message: err.response.data
                    })
                })
            } else {
                resolve({
                    success: true
                })
            }


        })
    }

    EditSubscriberAgent(username, newAccount, userData, isNotSuperAdmin) {
        return new Promise((resolve, reject) => {
            if (isNotSuperAdmin) {
                axios
                    .get(`${base_url_cc_kam}api/v1/subscribers/username/${username}`,
                        call_center_authorization)
                    .then((resp) => {
                        let {uuid, username} = resp.data.result;
                        let update_subscriber = {
                            domain: newAccount.domain.label,
                            password: newAccount.sip_device.password,
                            updated_at: new Date(),
                            username: username,
                        }
                        axios
                            .put(`${base_url_cc_kam}api/v1/subscribers/${uuid}`,
                                update_subscriber,
                                call_center_authorization)
                            .then((resp) => {
                                let dataSub = resp.data.subscriber
                                let update_Agent = {
                                    name: newAccount.first_name + " " + newAccount.last_name,
                                    domain_uuid: dataSub.domain_uuid,
                                    subscriber_uuid: dataSub.uuid,
                                    options: newAccount.sip_device.options,
                                    updated_at: new Date(),
                                    enabled : true
                                }
                                let uuid_Agent = userData.sip_device.uuid
                                axios
                                    .put(`${base_url_cc_kam}api/v1/agents/${uuid_Agent}`, update_Agent, call_center_authorization).then((resp) => {
                                    resolve({
                                        success: true,
                                        data: resp
                                    })
                                }).catch((err) => {
                                    reject(err)

                                })
                            }).catch((err) => {
                            reject(err)
                        })
                    }).catch((err) => {
                    reject(err)
                })
            } else {
                resolve({
                    success: true
                })
            }


        })
    }


}

module.exports = accounts;
