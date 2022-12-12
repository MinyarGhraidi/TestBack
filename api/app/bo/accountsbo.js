const {baseModelbo} = require('./basebo');
let sequelize = require('sequelize');
const Op = sequelize.Op;
let db = require('../models');
const {appSecret} = require("../helpers/app");
const jwt = require('jsonwebtoken');
const config = require('../config/config.json');
const usersbo = require('./usersbo');
const agentsbo = require('../bo/agentsbo');
const campaignsbo = require('../bo/campaignbo');
const trunksbo = require('../bo/truncksbo');
const {default: axios} = require("axios");
let _usersbo = new usersbo();
let _agentsbo = new agentsbo();
let _campaignsbo = new campaignsbo();
let _trunksbo = new trunksbo();
const call_center_token = require(__dirname + '/../config/config.json')["call_center_token"];
const base_url_cc_kam = require(__dirname + '/../config/config.json')["base_url_cc_kam"];
const call_center_authorization = {
    headers: {Authorization: call_center_token}
};

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

    changeStatusUsers(account_id, status) {
        let indexUser = 0;

        return new Promise((resolve, reject) => {
            this.db['roles_crms'].findAll({
                where: {
                    value: {in: ['agent', 'user', 'sales']},
                }
            }).then((role) => {
                if (!!!role.length !== 0) {
                    return resolve(true);
                }
                role.forEach(data => {
                    this.db["users"].update({status: status, updated_at: new Date()}, {
                        where: {
                            role_crm_id: data.id,
                            account_id: account_id,
                            active: 'Y'
                        }
                    })
                        .then(() => {
                            if (indexUser < role.length - 1) {
                                indexUser++;
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

    changeStatus(account_id, status) {

        return new Promise((resolve, reject) => {
            const entities = [
                'didsgroups', 'truncks', 'roles', 'templates_list_call_files', 'dialplan_items', 'accounts'
            ]
            this.changeStatusForEntities(entities, account_id, status).then(() => {
                this.changeStatusUsers(account_id, status).then(() => {
                        this.changeStatus_dids(account_id, status).then(() => {
                            resolve(true);
                        }).catch(err => {
                            return reject(err);
                        })
                }).catch(err => {
                    return reject(err);
                });
            }).catch(err => {
                return reject(err);
            });


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

    signIn(req, res, next) {
        if ((!req.body.username || !req.body.password)) {

            return this.sendResponseError(res, ['Error.RequestDataInvalid'], 0, 403);
        } else {
            const {username, password} = req.body;
            if (username && password) {
                this.db['accounts'].findOne({
                    where: {
                        first_name: username,
                        active: 'Y'
                    }

                }).then((user) => {

                    if (!user) {
                        this.sendResponseError(res, ['Error.UserNotFound'], 0, 403);
                    } else {

                        if (user.last_name === password) {

                            const token = jwt.sign({
                                    user_id: user.account_id,
                                    username: user.first_name

                                },
                                appSecret, {
                                    expiresIn: '8600m'
                                });

                            res.send({
                                message: 'Success',
                                user: user.toJSON(),
                                success: true,
                                token: token,
                                result: 1,
                            });

                        } else {
                            this.sendResponseError(res, ['Error.InvalidPassword'], 2, 403);
                        }
                    }
                }).catch((error) => {
                    return this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', error], 1, 403);
                });
            }
        }
    }


    // ------------------> Add / Edit Account <---------------------
    AddEditAccount(req, res, next) {
        let _this = this;
        let newAccount = req.body;
        let {first_name, last_name} = newAccount;
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
            role_crm_id: newAccount.role_crm_id[0],
            lang: newAccount.lang,
            code: newAccount.code,
            domain_id: newAccount.domain.value,
            web_domain: newAccount.web_domain,
        }
        if (!!!newAccount
            || !!!newAccount.user
            || !!!newAccount.role_crm_id) {
            return _this.sendResponseError(res, 'Error.InvalidData');
        }
        let sip_device = JSON.parse(JSON.stringify(newAccount.user.sip_device));
        let domain = JSON.parse(JSON.stringify(newAccount.domain));
        let { password, options, status} = sip_device;
        let username = sip_device.username.username;
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
                this.couldAffectDomain(domain.value).then((resultAffection) => {
                    if (resultAffection || account.dataValues.domain_id === domain.value) {
                        this.db['users'].findOne({
                            where: {
                                user_id: account.dataValues.user_id
                            }
                        }).then((user) => {
                            let userData = user.dataValues;
                            let {username} = userData.sip_device
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
                                                updated_at: new Date()
                                            }
                                            let uuid_Agent = userData.sip_device.uuid
                                            axios
                                                .put(`${base_url_cc_kam}api/v1/agents/${uuid_Agent}`, update_Agent, call_center_authorization).then((resp) => {
                                                let update_account = newAccount;
                                                let resultAgent = resp.data.agent;
                                                update_account.updated_at = new Date();
                                                update_account.role_crm_id = newAccount.role_crm_id[0];
                                                update_account.domain_id = newAccount.domain.value;
                                                this.db['accounts'].update(update_account, {
                                                    where: {
                                                        account_id: newAccount.account_id
                                                    },
                                                    returning: true,
                                                    plain: true
                                                }).then((account) => {
                                                    let update_user = newAccount.user;
                                                    update_user.sip_device.uuid = resultAgent.uuid;
                                                    update_user.sip_device.updated_at = resultAgent.updated_at;
                                                    update_user.account_id = newAccount.account_id;
                                                    update_user.username = username
                                                    _usersbo.saveUserFunction(update_user, [], false, resultAgent.uuid)
                                                        .then(user => {
                                                            res.send({
                                                                status: 200,
                                                                message: 'success',
                                                                success: true,
                                                                data: user
                                                            })
                                                        }).catch((err) => {
                                                        return _this.sendResponseError(res, ['Error.CannotUpdateUser'], 1, 403);
                                                    })
                                                }).catch((err) => {
                                                    return _this.sendResponseError(res, ['Error.CannotUpdateAccount'], 1, 403);
                                                })
                                            }).catch((err) => {
                                                return _this.sendResponseError(res, ['Error.CannotUpdateAgent'], 1, 403);
                                            })
                                        }).catch((err) => {
                                        return _this.sendResponseError(res, ['Error.CannotUpdateSubscriber'], 1, 403);
                                    })
                                }).catch((err) => {
                                return _this.sendResponseError(res, ['Error.CannotFindSubscriber'], 1, 403);
                            })
                        }).catch((err) => {
                            return _this.sendResponseError(res, ['Error.CannotFindUser'], 1, 403);
                        })
                    } else {
                        return _this.sendResponseError(res, ['Error.CannotAffectDomain'], 1, 403);
                    }
                }).catch((err) => {
                    return _this.sendResponseError(res, ['Error.CannotAffectDomain'], 1, 403);
                })
            }).catch((err) => {
                return _this.sendResponseError(res, ['Error.CannotFindAccount'], 1, 403);
            })
        } else {
            this.couldAffectDomain(domain.value).then((resultAffection) => {
                if (resultAffection) {
                    let data_subscriber = {
                        username : username,
                        domain_uuid: domain.uuid,
                        password,
                        domain: domain.label
                    }
                    axios
                        .post(`${base_url_cc_kam}api/v1/subscribers`,
                            data_subscriber,
                            call_center_authorization)
                        .then((resp) => {
                            let result = resp.data.result;
                            let data_agent = {
                                name: first_name + " " + last_name,
                                domain_uuid: result.domain_uuid,
                                subscriber_uuid: result.uuid,
                                options,
                                status
                            };
                            axios
                                .post(`${base_url_cc_kam}api/v1/agents`, data_agent, call_center_authorization)
                                .then((resp) => {
                                    let resultAgent = resp.data.result;
                                    let modalObj = this.db['accounts'].build(data_account);
                                    modalObj.save().then(new_account => {
                                        if (new_account) {
                                            data_account.user = newAccount.user;
                                            data_account.user.sip_device.uuid = resultAgent.uuid;
                                            data_account.user.sip_device.created_at = resultAgent.created_at;
                                            data_account.user.sip_device.updated_at = resultAgent.updated_at;
                                            data_account.user.account_id = new_account.dataValues.account_id;
                                            data_account.user.sip_device.username = username;

                                            _usersbo.saveUserFunction(data_account.user, [], false, resultAgent.uuid).then(new_user => {
                                                this.db['accounts'].update({
                                                    user_id: new_user.user_id
                                                }, {
                                                    where: {
                                                        account_id: new_account.dataValues.account_id
                                                    },
                                                    returning: true,
                                                    plain: true
                                                }).then(update_account => {
                                                    res.send({
                                                        status: 200,
                                                        message: 'success',
                                                        success: true,
                                                        data: new_user
                                                    })
                                                })
                                                    .catch(err => {
                                                        return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                                                    })
                                            })
                                                .catch(err => {
                                                    return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                                                })
                                        } else {
                                            return _this.sendResponseError(res, ['Error.AnErrorHasOccurredSaveAccount'], 1, 403);
                                        }

                                    }).catch(err => {
                                        return _this.sendResponseError(res, ['Error.AnErrorHasOccurredUser', err], 1, 403);
                                    })
                                }).catch(err => {
                                res.send({
                                    success: false,
                                    message: err.response.data
                                })
                            })
                        }).catch((err) => {
                        res.send({
                            success: false,
                            message: err.response.data
                        })
                    })
                } else {
                    res.send({
                        success: false,
                        message: "domain already affected to another account"
                    })
                }
            }).catch((err) => {
                res.send({
                    success: false,
                    message: err.response.data
                })
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
                    let trunk_id = trunk.campaign_id;
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
            this.db['users'].findAll({where: {account_id: account_id, active: 'Y'}}).then((result) => {
                let usersIds = [];
                result.map((user) => {
                    usersIds.push(user.dataValues.user_id);
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
                users.forEach(user_id => {
                    _agentsbo.deleteAgentWithSub(user_id)
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
            this.deleteMultiUsers(usersIds).then(() => {
                this.deleteAllRelativeTrunks(account_id).then(() => {
                    this.deleteAllRelativeCampaigns(account_id).then(() => {
                        this.deleteAllAccountRelative(account_id).then(() => {
                            this.db['accounts']
                                .update({active: 'N', domain_id: null}, {where: {account_id: account_id}})
                                .then(() => {
                                    res.send({
                                        status: 200,
                                        message: 'account deleted with success'
                                    })
                                })
                                .catch(err => {
                                    return _this.sendResponseError(res, ['Error.CannotDeleteAccountFromDB', err], 1, 403);
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
                return _this.sendResponseError(res, ['Error.CannotDeleteUsers', err], 1, 403);
            })
        }).catch((err) => {
            return _this.sendResponseError(res, ['Error.CannotGetUsersByAccount_id', err], 1, 403);
        });
    }


    //----------------------------> Affect Domain <-------------------
    getUnaffectedDomains() {
        return new Promise((resolve, reject) => {
            this.db.domains.findAll({
                where: {active: 'Y'}
            }).then((domains) => {
                if (!!!domains) {
                    resolve({
                        success: true,
                        domains: []
                    });
                }
                this.db['accounts'].findAll({
                    where: {active: 'Y', domain_id: {[Op.not]: null}}
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
            this.getUnaffectedDomains().then((result) => {
                if (result.success) {
                    if (result.domains && result.domains.length) {
                        let domains = result.domains;
                        const checkIdDomain = obj => obj.domain_id === domain_id;
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


}

module.exports = accounts;
